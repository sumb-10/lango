// app/api/materials/upload/route.ts

import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { processUserMaterial } from '@/lib/processUserMaterial';

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
  console.log('=== [UPLOAD ROUTE] USING SIGNED URL VERSION ===');
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

    // 3) 파일 유효성 검증
    try {
      validateFileOrThrow(file);
    } catch (e: any) {
      return NextResponse.json({ error: e.message }, { status: 400 });
    }

    // 여기까지 왔으면 file은 존재하고 유효한 TXT 파일
    const safeFile = file as File;

    // title / author 없으면 기본값 세팅
    const title =
      titleRaw?.trim() && titleRaw.trim().length > 0
        ? titleRaw.trim()
        : safeFile.name.replace(/\.[^/.]+$/, ''); // 확장자 제거한 파일명

    const author =
      authorRaw?.trim() && authorRaw.trim().length > 0 ? authorRaw.trim() : 'user';

    const folderId =
      folderIdRaw && !Number.isNaN(parseInt(folderIdRaw, 10))
        ? parseInt(folderIdRaw, 10)
        : null;

    // 4) 파일 텍스트 읽기
    const textContent = await safeFile.text();

    // 5) LLM 파이프라인 실행
    //    - 문단/문장 파싱
    //    - translate / structure / key_point 채우기
    //    - 최종 JSON 바이트 생성
    const { sentences, jsonBytes } = await processUserMaterial({
      textContent,
    });

    // 6) Supabase Storage에 JSON 업로드
    const bucket = 'materials'; // JSON용으로 계속 재사용
    const baseName = safeFile.name.replace(/\.[^/.]+$/, '');
    const jsonPath = `${user.id}/json/${Date.now()}-${baseName}.json`;

    const { data: uploadData, error: uploadError } = await supabase.storage
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

    // 🔹 여기부터 getPublicUrl → createSignedUrl 로 변경
    const { data: signedData, error: signedError } = await supabase
      .storage
      .from(bucket)
      .createSignedUrl(jsonPath, 60 * 60 * 24 * 3650); // 1년(365일) 유효

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

    // 8) materials 테이블에 레코드 생성
    const { data: material, error: materialError } = await supabase
      .from('materials')
      .insert({
        user_id: user.id,
        folder_id: folderId,
        title,
        author,
        file_type: 'json',          // 🔹 이제는 json 기준
        file_url: jsonUrl,          // 가공된 JSON 파일 URL
        file_size: jsonBytes.byteLength,
        status: 'ready',            // 이미 처리 끝
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

    // 9) 클라이언트에 material 반환 (기존 프론트 구조와 호환)
    return NextResponse.json({ material }, { status: 201 });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: '업로드 중 오류가 발생했습니다' }, { status: 500 });
  }
}
