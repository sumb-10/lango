// app/api/materials/build-lesson/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { createClient } from '@/lib/supabase/server';
import type { SentenceRecord } from '@/lib/processUserMaterial';
import type { LessonChunk, LessonJson } from '@/types/lesson';
import {
  buildReadingChunk,
  buildStructureChunkFromSentences,
  buildVocabChunkFromSentences,
  buildBackgroundChunkFromSentences,
  buildComprehensionChunkFromSentences,
  buildWritingChunkFromSentences,
} from '@/lib/lesson/builders';

type CEFRLevel = 'B2' | 'C1' | 'C2';

type LessonChunkConfigType =
  | 'reading'
  | 'structure'
  | 'vocab'
  | 'background'
  | 'comprehension'
  | 'writing';

type LessonChunkConfig = {
  type: LessonChunkConfigType;
  order: number;
};

type BuildLessonRequest = {
  materialId: number;
  title?: string;
  level?: CEFRLevel;
  chunks: LessonChunkConfig[];
};

const DEFAULT_LEVEL: CEFRLevel = 'C1';
const MATERIALS_BUCKET = 'materials';

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as BuildLessonRequest;
    const { materialId, title, level, chunks } = body;

    if (!materialId || !Array.isArray(chunks) || chunks.length === 0) {
      return NextResponse.json(
        { error: 'materialId와 chunks 설정이 필요합니다.' },
        { status: 400 },
      );
    }

    const supabase = await createClient();

    // 1) 인증 확인
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 },
      );
    }

    // 2) materials 레코드 조회 (소유자 검증)
    const { data: material, error: materialError } = await supabase
      .from('materials')
      .select('*')
      .eq('id', materialId)
      .eq('user_id', user.id)
      .single();

    if (materialError || !material) {
      console.error('[build-lesson] material fetch error:', materialError);
      return NextResponse.json(
        { error: '해당 material을 찾을 수 없거나 접근 권한이 없습니다.' },
        { status: 404 },
      );
    }

    if (!material.file_url) {
      return NextResponse.json(
        { error: 'material에 연결된 원본 JSON 파일 URL이 없습니다.' },
        { status: 400 },
      );
    }

    // 3) Supabase Storage에 있는 SentenceRecord[] JSON 로딩
    //    (file_url은 이미 signed URL 이라고 가정)
    let sentences: SentenceRecord[];

    try {
      const res = await fetch(material.file_url);
      if (!res.ok) {
        throw new Error(`원본 JSON fetch 실패: status ${res.status}`);
      }
      const json = await res.json();
      if (!Array.isArray(json)) {
        throw new Error('원본 JSON 최상위 구조가 배열이 아닙니다.');
      }

      sentences = json.map((item: any): SentenceRecord => ({
        paragraph: item.paragraph,
        sentence_id: item.sentence_id,
        text: item.text,
        translate: item.translate ?? '',
        structure: item.structure ?? '',
        structure_translated: item.structure_translated ?? '',
      }));
    } catch (err) {
      console.error('[build-lesson] fetch base sentences error:', err);
      return NextResponse.json(
        { error: '원본 SentenceRecord JSON을 불러오는 중 오류가 발생했습니다.' },
        { status: 500 },
      );
    }

    if (sentences.length === 0) {
      return NextResponse.json(
        { error: '원본 SentenceRecord 배열이 비어 있습니다.' },
        { status: 400 },
      );
    }

    const targetLevel: CEFRLevel = level ?? DEFAULT_LEVEL;

    // 4) chunks 설정을 order 순으로 정렬
    const sortedConfigs = [...chunks].sort((a, b) => a.order - b.order);

    // 5) 각 config.type에 따라 적절한 Chunk 빌더 호출
    const builtChunks: LessonChunk[] = [];

    for (const cfg of sortedConfigs) {
      switch (cfg.type) {
        case 'reading': {
          const chunk = buildReadingChunk(sentences, {
            order: cfg.order,
            title: '#읽어봅시다!',
          });
          builtChunks.push(chunk);
          break;
        }
        case 'structure': {
          const chunk = await buildStructureChunkFromSentences(
            sentences,
            cfg.order,
          );
          builtChunks.push(chunk);
          break;
        }
        case 'vocab': {
          const chunk = await buildVocabChunkFromSentences(
            sentences,
            targetLevel,
            cfg.order,
          );
          builtChunks.push(chunk);
          break;
        }
        case 'background': {
          const chunk = await buildBackgroundChunkFromSentences(
            sentences,
            targetLevel,
            cfg.order,
          );
          builtChunks.push(chunk);
          break;
        }
        case 'comprehension': {
          const chunk = await buildComprehensionChunkFromSentences(
            sentences,
            targetLevel,
            cfg.order,
          );
          builtChunks.push(chunk);
          break;
        }
        case 'writing': {
          const chunk = await buildWritingChunkFromSentences(
            sentences,
            targetLevel,
            cfg.order,
          );
          builtChunks.push(chunk);
          break;
        }
        default:
          // 정의되지 않은 타입은 무시(혹은 에러로 처리해도 됨)
          console.warn('[build-lesson] unknown chunk type:', cfg.type);
      }
    }

    if (builtChunks.length === 0) {
      return NextResponse.json(
        { error: '설정된 chunks로부터 생성된 LessonChunk가 없습니다.' },
        { status: 400 },
      );
    }

    // 6) LessonJson 구성
    const lessonId = randomUUID();
    const lessonTitle: string = title && title.trim().length > 0
      ? title.trim()
      : material.title ?? 'Untitled Lesson';

    const lesson: LessonJson = {
      id: lessonId,
      materialId: material.id,
      title: lessonTitle,
      level: targetLevel,
      chunks: builtChunks,
    };

    const lessonJsonString = JSON.stringify(lesson, null, 2);
    const lessonBytes = new TextEncoder().encode(lessonJsonString);

    // 7) Supabase Storage에 LessonJson 업로드
    const baseName = material.title
      ? String(material.title).replace(/\s+/g, '_')
      : `material_${material.id}`;
    const lessonPath = `${user.id}/lesson/materialized_${material.id}_${Date.now()}_${baseName}.json`;

    const { error: uploadError } = await supabase.storage
      .from(MATERIALS_BUCKET)
      .upload(lessonPath, lessonBytes, {
        contentType: 'application/json',
        upsert: false,
      });

    if (uploadError) {
      console.error('[build-lesson] lesson json upload error:', uploadError);
      return NextResponse.json(
        { error: '생성된 Lesson JSON 업로드 중 오류가 발생했습니다.' },
        { status: 500 },
      );
    }

    // 8) 새 lesson JSON에 대한 signed URL 생성
    const {
      data: signedData,
      error: signedError,
    } = await supabase.storage
      .from(MATERIALS_BUCKET)
      .createSignedUrl(lessonPath, 60 * 60 * 24 * 3650); // 10년

    if (signedError || !signedData?.signedUrl) {
      console.error('[build-lesson] createSignedUrl error:', signedError);
      return NextResponse.json(
        { error: 'Lesson JSON 접근 URL 생성 중 오류가 발생했습니다.' },
        { status: 500 },
      );
    }

    const lessonUrl = signedData.signedUrl;

    // 9) materials 레코드 업데이트
    //    - file_url 을 새 lesson json으로 교체
    //    - metadata에 lesson 관련 정보 추가
    const prevMetadata = (material.metadata ?? {}) as Record<string, any>;

    const newMetadata = {
      ...prevMetadata,
      baseJsonPath:
        prevMetadata.baseJsonPath ??
        prevMetadata.jsonPath ??
        prevMetadata.base_json_path ??
        null, // 원본 json path가 있다면 유지
      lessonJsonPath: lessonPath,
      lessonLevel: targetLevel,
      lessonBuiltAt: new Date().toISOString(),
    };

    const { data: updatedMaterial, error: updateError } = await supabase
      .from('materials')
      .update({
        file_url: lessonUrl,
        file_type: 'lesson_json',
        metadata: newMetadata,
        // 필요하면 status: 'lesson_ready' 같은 필드도 둘 수 있음
      })
      .eq('id', material.id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError || !updatedMaterial) {
      console.error('[build-lesson] material update error:', updateError);
      return NextResponse.json(
        { error: 'materials 레코드 업데이트 중 오류가 발생했습니다.' },
        { status: 500 },
      );
    }

    // 10) 최종 응답: 업데이트된 material + lesson JSON
    return NextResponse.json(
      {
        material: updatedMaterial,
        lesson,
      },
      { status: 200 },
    );
  } catch (err) {
    console.error('[build-lesson] unexpected error:', err);
    return NextResponse.json(
      { error: 'build-lesson 처리 중 알 수 없는 오류가 발생했습니다.' },
      { status: 500 },
    );
  }
}
