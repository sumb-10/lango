// app/api/materials/upload/route.ts

import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { invokeLLM } from '@/lib/openai';
import { SYSTEM_PROMPTS } from '@/lib/prompts';
import { parseJSONFromLLM, calculateCreditCost } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // 인증 확인
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 });
    }

    // 요청 데이터 파싱
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const title = formData.get('title') as string;
    const author = formData.get('author') as string | null;
    const folderId = formData.get('folderId') as string | null;

    if (!file || !title) {
      return NextResponse.json({ error: '파일과 제목은 필수입니다' }, { status: 400 });
    }

    // 파일 타입 검증 (MVP는 TXT만)
    if (!file.name.endsWith('.txt')) {
      return NextResponse.json(
        { error: '현재 TXT 파일만 지원합니다. PDF와 EPUB은 추후 지원 예정입니다.' },
        { status: 400 }
      );
    }

    // 파일 크기 검증 (10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: '파일 크기는 10MB를 초과할 수 없습니다' },
        { status: 400 }
      );
    }

    // 파일 읽기
    const textContent = await file.text();

    // Supabase Storage에 업로드
    const fileName = `${user.id}/${Date.now()}-${file.name}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('materials')
      .upload(fileName, file);

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return NextResponse.json({ error: '파일 업로드 중 오류가 발생했습니다' }, { status: 500 });
    }

    // 파일 URL 가져오기
    const {
      data: { publicUrl },
    } = supabase.storage.from('materials').getPublicUrl(fileName);

    // 교재 레코드 생성
    const { data: material, error: materialError } = await supabase
      .from('materials')
      .insert({
        user_id: user.id,
        folder_id: folderId ? parseInt(folderId) : null,
        title,
        author,
        file_type: 'txt',
        file_url: publicUrl,
        file_size: file.size,
        status: 'processing',
        metadata: {},
      })
      .select()
      .single();

    if (materialError) {
      console.error('Material creation error:', materialError);
      return NextResponse.json({ error: '교재 생성 중 오류가 발생했습니다' }, { status: 500 });
    }

    // 백그라운드에서 처리 (청킹 + 학습지 생성)
    processMaterialInBackground(material.id, textContent, user.id);

    return NextResponse.json({ material }, { status: 201 });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: '업로드 중 오류가 발생했습니다' }, { status: 500 });
  }
}

// 백그라운드 처리 함수
async function processMaterialInBackground(
  materialId: number,
  textContent: string,
  userId: string
) {
  try {
    console.log('[material] background start', { materialId, userId });

    const supabase = await createClient();

    // 1. 텍스트를 청크로 분할 (약 500자씩)
    const chunkSize = 5000;
    const chunks: any[] = [];
    let startPosition = 0;

    while (startPosition < textContent.length) {
      const endPosition = Math.min(startPosition + chunkSize, textContent.length);
      const content = textContent.substring(startPosition, endPosition);

      chunks.push({
        material_id: materialId,
        content,
        chunk_index: chunks.length,
        start_position: startPosition,
        end_position: endPosition,
        metadata: {},
      });

      startPosition = endPosition;
    }

    console.log('[material] inserting chunks', { materialId, chunkCount: chunks.length });

    const { error: chunksError } = await supabase.from('chunks').insert(chunks);
    if (chunksError) {
      console.error('[material] chunks insert error', chunksError);
      throw chunksError;
    }

    // 2. LLM으로 학습지 생성
    const worksheetPrompt = `다음 텍스트를 분석하여 학습지를 생성하세요:\n\n${textContent.substring(0, 5000)}...`;

    console.log('[material] calling LLM for worksheet', { materialId });

    const worksheetContent = await invokeLLM({
      messages: [
        { role: 'system', content: SYSTEM_PROMPTS.WORKSHEET_GENERATION },
        { role: 'user', content: worksheetPrompt },
      ],
    });

    console.log('[material] raw LLM output (worksheet)', worksheetContent);

    const parsedWorksheet = parseJSONFromLLM(worksheetContent);

    console.log('[material] parsed worksheet', parsedWorksheet);

    // 학습지 저장
    const { error: worksheetError } = await supabase.from('worksheets').insert({
      material_id: materialId,
      user_id: userId,
      title: parsedWorksheet.title || '자동 생성 학습지',
      description: parsedWorksheet.description || '',
      content: parsedWorksheet,
    });

    if (worksheetError) {
      console.error('[material] worksheet insert error', worksheetError);
      throw worksheetError;
    }

    // 3. 크레딧 차감
    const creditCost =
      calculateCreditCost('WORKSHEET_GENERATION') +
      chunks.length * calculateCreditCost('CHUNK_PROCESSING');

    const { error: creditError } = await supabase.rpc('deduct_credit', {
      p_user_id: userId,
      p_amount: creditCost,
      p_description: '교재 업로드 및 학습지 생성',
    });

    if (creditError) {
      console.error('[material] deduct_credit error', creditError);
      // 여기서 throw 하면 전체 파이프라인이 failed로 가니까,
      // "크레딧 차감 실패는 비치명적"으로 보고 그냥 로그만 남기고 넘어가는 것도 방법.
      // throw creditError;  ← 이건 웬만하면 빼는 걸 추천
    }

    // 4. 상태를 ready로 변경
    const wordCount = textContent.split(/\s+/).filter((word) => word.length > 0).length;

    const { error: updateError } = await supabase
      .from('materials')
      .update({
        status: 'ready',
        metadata: {
          processedAt: new Date().toISOString(),
          wordCount,
          chunkCount: chunks.length,
        },
      })
      .eq('id', materialId);

    if (updateError) {
      console.error('[material] materials update error', updateError);
      throw updateError;
    }

    console.log('[material] background completed', { materialId });
  } catch (error) {
    console.error('Material processing error:', error);

    const supabase = await createClient();
    await supabase
      .from('materials')
      .update({ status: 'failed' })
      .eq('id', materialId);
  }
}
