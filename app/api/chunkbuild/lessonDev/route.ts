// app/api/chunkbuild/lessonDev/route.ts

import { NextRequest, NextResponse } from 'next/server';
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
import { randomUUID } from 'crypto';

type CEFRLevel = 'B2' | 'C1' | 'C2';

type RequestBody = {
  sentences: SentenceRecord[];
  level?: CEFRLevel;
};

const DEFAULT_LEVEL: CEFRLevel = 'C1';

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as RequestBody;
    const { sentences, level } = body;

    if (!Array.isArray(sentences) || sentences.length === 0) {
      return NextResponse.json(
        { error: 'sentences 배열이 비어 있습니다.' },
        { status: 400 },
      );
    }

    const targetLevel: CEFRLevel = level ?? DEFAULT_LEVEL;

    // 🔢 고정 순서 (dev용 기본 플로우)
    // 1: reading
    // 2: comprehension
    // 3: structure
    // 4: vocab
    // 5: background
    // 6: writing

    const chunks: LessonChunk[] = [];

    // 1) Reading
    const readingChunk = buildReadingChunk(sentences, {
      order: 1,
      title: '#읽어봅시다!',
    });
    chunks.push(readingChunk);

    // 2) Comprehension
    const compChunk = await buildComprehensionChunkFromSentences(
      sentences,
      targetLevel,
      2,
    );
    chunks.push(compChunk);

    // 3) Structure
    const structureChunk = await buildStructureChunkFromSentences(
      sentences,
      3,
    );
    chunks.push(structureChunk);

    // 4) Vocab
    const vocabChunk = await buildVocabChunkFromSentences(
      sentences,
      targetLevel,
      4,
    );
    chunks.push(vocabChunk);

    // 5) Background
    const backgroundChunk = await buildBackgroundChunkFromSentences(
      sentences,
      targetLevel,
      5,
    );
    chunks.push(backgroundChunk);

    // 6) Writing
    const writingChunk = await buildWritingChunkFromSentences(
      sentences,
      targetLevel,
      6,
    );
    chunks.push(writingChunk);

    // LessonJson 조립 (dev용이라 materialId는 0으로)
    const lesson: LessonJson = {
      id: randomUUID(),
      materialId: 0,
      title: 'Dev Lesson (Integrated)',
      level: targetLevel,
      chunks,
    };

    return NextResponse.json({ lesson }, { status: 200 });
  } catch (err) {
    console.error('[lessonDev] error:', err);
    return NextResponse.json(
      { error: 'LessonDev 생성 중 오류가 발생했습니다.' },
      { status: 500 },
    );
  }
}
