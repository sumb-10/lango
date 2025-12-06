// app/api/chunkbuild/vocabChunk/route.ts

import { NextRequest, NextResponse } from 'next/server';
import type { SentenceRecord } from '@/lib/processUserMaterial';
import type { VocabChunk } from '@/types/lesson';
import { buildVocabChunkFromSentences } from '@/lib/lesson/builders';

type CEFRLevel = 'B2' | 'C1' | 'C2';

type RequestBody = {
  sentences: SentenceRecord[];
  level?: CEFRLevel;
  maxItems?: number; // 지금은 builders에서 내부 기본값 사용, 확장 여지용
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

    // order는 dev용에선 3으로 고정 (reading = 1, structure = 2 다음이라고 가정)
    const chunk: VocabChunk = await buildVocabChunkFromSentences(
      sentences,
      targetLevel,
      3,
    );

    return NextResponse.json({ chunk }, { status: 200 });
  } catch (err) {
    console.error('[vocabChunk] error:', err);
    return NextResponse.json(
      { error: 'VocabChunk 생성 중 오류가 발생했습니다.' },
      { status: 500 },
    );
  }
}
