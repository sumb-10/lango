// app/api/chunkbuild/comprehensionChunk/route.ts

import { NextRequest, NextResponse } from 'next/server';
import type { SentenceRecord } from '@/lib/processUserMaterial';
import type { ComprehensionChunk } from '@/types/lesson';
import { buildComprehensionChunkFromSentences } from '@/lib/lesson/builders';

type CEFRLevel = 'B2' | 'C1' | 'C2';

type RequestBody = {
  sentences: SentenceRecord[];
  level?: CEFRLevel;
  numQuestions?: number; // 지금은 빌더에서 기본값 사용, 확장 여지용
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

    // dev용: order는 reading(1) 다음이라고 가정해서 2로 고정
    const chunk: ComprehensionChunk =
      await buildComprehensionChunkFromSentences(
        sentences,
        targetLevel,
        2,
      );

    return NextResponse.json({ chunk }, { status: 200 });
  } catch (err) {
    console.error('[comprehensionChunk] error:', err);
    return NextResponse.json(
      { error: 'ComprehensionChunk 생성 중 오류가 발생했습니다.' },
      { status: 500 },
    );
  }
}
