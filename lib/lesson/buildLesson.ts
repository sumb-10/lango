// lib/lesson/buildLesson.ts

import { createClient } from '@/lib/supabase/server';
import { buildReadingChunk } from './builders';
import type { SentenceRecord } from '@/lib/processUserMaterial';
import type { LessonJson } from '@/types/lesson';
import { randomUUID } from 'crypto';

export async function buildLessonFromMaterialId(
  materialId: number,
): Promise<LessonJson> {
  const supabase = await createClient();

  // 1) materials row 조회
  const { data: material, error } = await supabase
    .from('materials')
    .select('*')
    .eq('id', materialId)
    .single();

  if (error || !material) {
    throw new Error('material을 찾을 수 없습니다.');
  }

  const jsonPath: string | undefined = material.metadata?.jsonPath;
  if (!jsonPath) {
    throw new Error('material.metadata.jsonPath가 없습니다.');
  }

  // 2) Storage에서 SentenceRecord[] JSON 읽기
  const { data, error: downloadError } = await supabase.storage
    .from('materials')
    .download(jsonPath);

  if (downloadError || !data) {
    throw new Error('Sentence JSON 다운로드 중 오류가 발생했습니다.');
  }

  const text = await data.text();
  const sentences = JSON.parse(text) as SentenceRecord[];

  // 3) 각 Chunk 빌더 호출
  const readingChunk = buildReadingChunk(sentences, {
    order: 1,
    title: '#읽어봅시다!',
  });

  // TODO: 나중에 vocabChunk, backgroundChunk 등 추가
  const chunks = [readingChunk];

  // 4) LessonJson 구성
  const lesson: LessonJson = {
    id: randomUUID(),
    materialId,
    title: material.title,
    level: 'C1',
    chunks,
  };

  return lesson;
}
