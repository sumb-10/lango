// app/api/chunkbuild/backgroundChunk/route.ts

import { NextRequest, NextResponse } from 'next/server';
import type { SentenceRecord } from '@/lib/processUserMaterial';
import type { BackgroundChunk } from '@/types/lesson';
import { buildBackgroundChunkFromSentences } from '@/lib/lesson/builders';

type CEFRLevel = 'B2' | 'C1' | 'C2';

type RequestBody = {
  sentences: SentenceRecord[];
  level?: CEFRLevel;
  maxParagraphs?: number; // 지금은 builders에서 내부 기본값 사용
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

    // order는 dev용에선 4로 고정 (reading=1, structure=2, vocab=3 다음)
    const chunk: BackgroundChunk = await buildBackgroundChunkFromSentences(
      sentences,
      targetLevel,
      4,
    );

    return NextResponse.json({ chunk }, { status: 200 });
  } catch (err) {
    console.error('[backgroundChunk] error:', err);
    return NextResponse.json(
      { error: 'BackgroundChunk 생성 중 오류가 발생했습니다.' },
      { status: 500 },
    );
  }
}
