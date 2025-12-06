// app/api/materials/upload/route.ts

import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { processUserMaterial } from '@/lib/processUserMaterial';
import {
  buildLessonForMaterial,
  LessonChunkConfig,
} from '@/lib/lesson/buildLessonForMaterial';

type CEFRLevel = 'B2' | 'C1' | 'C2';
const DEFAULT_LEVEL: CEFRLevel = 'C1';

// ---- 업로드 정책 상수 ----
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_EXTENSION = '.txt';

// 파일 확장자 체크
function hasAllowedExtension(fileName: string) {
  return fileName.toLowerCase().endsWith(ALLOWED_EXTENSION);
}

// 파일 유효성 검증 (문제 있으면 Error 던짐)
function validateFileOrThrow(file: File | null) {
  if (!file) {
    throw new Error('파일이 존재하지 않습니다.');
  }

  if (!hasAllowedExtension(file.name)) {
    throw new Error('현재 TXT 파일만 지원합니다. PDF와 EPUB은 추후 지원 예정입니다.');
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error('파일 크기는 10MB를 초과할 수 없습니다');
  }
}

export async function POST(request: NextRequest) {
  console.log('=== [UPLOAD ROUTE] USING SIGNED URL VERSION + LESSON BUILD ===');
  try {
    const supabase = await createClient();

    // 1) 인증 확인
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 });
    }

    // 2) formData 파싱
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const titleRaw = formData.get('title') as string | null;
    const authorRaw = formData.get('author') as string | null;
    const folderIdRaw = formData.get('folderId') as string | null;

    // 🔹 여기 추가: level / chunks
    const levelRaw = formData.get('level') as string | null;
    const chunksRaw = formData.get('chunks') as string | null;

    const targetLevel: CEFRLevel =
      levelRaw === 'B2' || levelRaw === 'C1' || levelRaw === 'C2'
        ? levelRaw
        : DEFAULT_LEVEL;

    let chunkConfigs: LessonChunkConfig[];
    if (chunksRaw) {
      try {
        const parsed = JSON.parse(chunksRaw);
        if (!Array.isArray(parsed)) {
          throw new Error('chunks는 배열이어야 합니다.');
        }
        chunkConfigs = parsed as LessonChunkConfig[];
      } catch (e) {
        console.error('[upload] chunks parse error:', e);
        return NextResponse.json(
          { error: 'chunks 파싱 중 오류가 발생했습니다.' },
          { status: 400 },
        );
      }
    } else {
      // 디폴트 구성이 없다면 최소한 reading만이라도
      chunkConfigs = [{ type: 'reading', order: 1 }];
    }

    // 3) 파일 유효성 검증
    try {
      validateFileOrThrow(file);
    } catch (e: any) {
      return NextResponse.json({ error: e.message }, { status: 400 });
    }

    const safeFile = file as File;

    const title =
      titleRaw?.trim() && titleRaw.trim().length > 0
        ? titleRaw.trim()
        : safeFile.name.replace(/\.[^/.]+$/, '');

    const author =
      authorRaw?.trim() && authorRaw.trim().length > 0 ? authorRaw.trim() : 'user';

    const folderId =
      folderIdRaw && !Number.isNaN(parseInt(folderIdRaw, 10))
        ? parseInt(folderIdRaw, 10)
        : null;

    // 4) 파일 텍스트 읽기
    const textContent = await safeFile.text();

    // 5) 1차 LLM 파이프라인 (SentenceRecord[])
    const { sentences, jsonBytes } = await processUserMaterial({
      textContent,
    });

    // 6) Supabase Storage에 1차 JSON 업로드
    const bucket = 'materials';
    const baseName = safeFile.name.replace(/\.[^/.]+$/, '');
    const jsonPath = `${user.id}/json/${Date.now()}-${baseName}.json`;

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(jsonPath, jsonBytes, {
        contentType: 'application/json',
        upsert: false,
      });

    if (uploadError) {
      console.error('[material] json upload error:', uploadError);
      return NextResponse.json(
        { error: '가공된 JSON 파일 업로드 중 오류가 발생했습니다' },
        { status: 500 },
      );
    }

    const { data: signedData, error: signedError } = await supabase.storage
      .from(bucket)
      .createSignedUrl(jsonPath, 60 * 60 * 24 * 3650);

    if (signedError || !signedData?.signedUrl) {
      console.error('[material] createSignedUrl error:', signedError);
      return NextResponse.json(
        { error: 'JSON 파일 접근 URL 생성 중 오류가 발생했습니다' },
        { status: 500 },
      );
    }

    const jsonUrl = signedData.signedUrl;

    // 7) 메타데이터 계산
    const wordCount = textContent
      .split(/\s+/)
      .filter((w) => w.trim().length > 0).length;

    const paragraphCount =
      sentences.reduce(
        (max, s) => (s.paragraph > max ? s.paragraph : max),
        0,
      ) + 1;

    const sentenceCount = sentences.length;

    // 8) materials 테이블에 1차 레코드 생성 (원본 json 기준)
    const { data: material, error: materialError } = await supabase
      .from('materials')
      .insert({
        user_id: user.id,
        folder_id: folderId,
        title,
        author,
        file_type: 'json',
        file_url: jsonUrl,
        file_size: jsonBytes.byteLength,
        status: 'uploaded', // 아직 최종 lesson은 아님
        metadata: {
          jsonPath,
          wordCount,
          paragraphCount,
          sentenceCount,
          processedAt: new Date().toISOString(),
        },
      })
      .select()
      .single();

    if (materialError || !material) {
      console.error('[material] material insert error:', materialError);
      return NextResponse.json(
        { error: '교재 레코드 생성 중 오류가 발생했습니다' },
        { status: 500 },
      );
    }

    // 9) 바로 Lesson 빌드 실행 (공용 함수 사용)
    const { lesson, updatedMaterial } = await buildLessonForMaterial({
      supabase,
      userId: user.id,
      material,
      level: targetLevel,
      chunks: chunkConfigs,
      overrideTitle: title, // 모달에서 받은 제목 있으면 여기에 넣어도 됨
    });

    // 10) 최종 응답: lesson + 업데이트된 material (file_url은 materialized_..)
    return NextResponse.json(
      {
        material: updatedMaterial,
        lesson,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: '업로드 중 오류가 발생했습니다' },
      { status: 500 },
    );
  }
}