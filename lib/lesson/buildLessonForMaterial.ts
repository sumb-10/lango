// lib/lesson/buildLessonForMaterial.ts

import { randomUUID } from 'crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { SentenceRecord } from '@/lib/processUserMaterial';
import type { LessonJson, LessonChunk } from '@/types/lesson';
import {
  buildReadingChunk,
  buildStructureChunkFromSentences,
  buildVocabChunkFromSentences,
  buildBackgroundChunkFromSentences,
  buildComprehensionChunkFromSentences,
  buildWritingChunkFromSentences,
} from '@/lib/lesson/builders';

type CEFRLevel = 'B2' | 'C1' | 'C2';

export type LessonChunkConfigType =
  | 'reading'
  | 'structure'
  | 'vocab'
  | 'background'
  | 'comprehension'
  | 'writing';

export type LessonChunkConfig = {
  type: LessonChunkConfigType;
  order: number;
};

type BuildLessonParams = {
  supabase: SupabaseClient;
  userId: string;
  material: any;           // materials 테이블 row
  level: CEFRLevel;
  chunks: LessonChunkConfig[];
  overrideTitle?: string;  // 선택: 모달에서 받은 제목이 있으면 덮어쓰기
};

const MATERIALS_BUCKET = 'materials';

export async function buildLessonForMaterial({
  supabase,
  userId,
  material,
  level,
  chunks,
  overrideTitle,
}: BuildLessonParams): Promise<{ lesson: LessonJson; updatedMaterial: any }> {
  // 1) 원본 SentenceRecord[] JSON fetch
  if (!material.file_url) {
    throw new Error('material에 연결된 원본 JSON 파일 URL이 없습니다.');
  }

  const res = await fetch(material.file_url);
  if (!res.ok) {
    throw new Error(`원본 JSON fetch 실패: status ${res.status}`);
  }
  const json = await res.json();
  if (!Array.isArray(json)) {
    throw new Error('원본 JSON 최상위 구조가 배열이 아닙니다.');
  }

  const sentences: SentenceRecord[] = json.map((item: any) => ({
    paragraph: item.paragraph,
    sentence_id: item.sentence_id,
    text: item.text,
    translate: item.translate ?? '',
    structure: item.structure ?? '',
    structure_translated: item.structure_translated ?? '',
  }));

  if (sentences.length === 0) {
    throw new Error('원본 SentenceRecord 배열이 비어 있습니다.');
  }

  const targetLevel: CEFRLevel = level;

  // 2) chunks 설정 정렬 및 빌드
  const sortedConfigs = [...chunks].sort((a, b) => a.order - b.order);
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
        console.warn('[buildLessonForMaterial] unknown chunk type:', cfg.type);
    }
  }

  if (builtChunks.length === 0) {
    throw new Error('설정된 chunks로부터 생성된 LessonChunk가 없습니다.');
  }

  // 3) LessonJson 구성
  const lessonId = randomUUID();
  const baseTitle =
    overrideTitle && overrideTitle.trim().length > 0
      ? overrideTitle.trim()
      : material.title ?? 'Untitled Lesson';

  const lesson: LessonJson = {
    id: lessonId,
    materialId: material.id,
    title: baseTitle,
    level: targetLevel,
    chunks: builtChunks,
  };

  const lessonJsonString = JSON.stringify(lesson, null, 2);
  const lessonBytes = new TextEncoder().encode(lessonJsonString);

  // 4) LessonJson Storage 업로드
  const baseName = material.title
    ? String(material.title).replace(/\s+/g, '_')
    : `material_${material.id}`;

  const lessonPath = `${userId}/lesson/materialized_${material.id}_${Date.now()}_${baseName}.json`;

  const { error: uploadError } = await supabase.storage
    .from(MATERIALS_BUCKET)
    .upload(lessonPath, lessonBytes, {
      contentType: 'application/json',
      upsert: false,
    });

  if (uploadError) {
    console.error('[buildLessonForMaterial] lesson upload error', uploadError);
    throw new Error('생성된 Lesson JSON 업로드 중 오류가 발생했습니다.');
  }

  // 5) Signed URL 생성
  const { data: signedData, error: signedError } = await supabase.storage
    .from(MATERIALS_BUCKET)
    .createSignedUrl(lessonPath, 60 * 60 * 24 * 3650); // 10년

  if (signedError || !signedData?.signedUrl) {
    console.error('[buildLessonForMaterial] createSignedUrl error', signedError);
    throw new Error('Lesson JSON 접근 URL 생성 중 오류가 발생했습니다.');
  }

  const lessonUrl = signedData.signedUrl;

  // 6) materials 메타데이터 업데이트
  const prevMetadata = (material.metadata ?? {}) as Record<string, any>;
  const newMetadata = {
    ...prevMetadata,
    baseJsonPath:
      prevMetadata.baseJsonPath ??
      prevMetadata.jsonPath ??
      prevMetadata.base_json_path ??
      null,
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
      status: 'ready', // 여기서 최종 ready로 두는 것도 가능
    })
    .eq('id', material.id)
    .eq('user_id', userId)
    .select()
    .single();

  if (updateError || !updatedMaterial) {
    console.error('[buildLessonForMaterial] material update error:', updateError);
    throw new Error('materials 레코드 업데이트 중 오류가 발생했습니다.');
  }

  return { lesson, updatedMaterial };
}
