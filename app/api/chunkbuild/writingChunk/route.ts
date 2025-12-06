// app/api/chunkbuild/writingChunk/route.ts

import { NextRequest, NextResponse } from 'next/server';
import type { SentenceRecord } from '@/lib/processUserMaterial';
import type { WritingChunk } from '@/types/lesson';
import { buildWritingChunkFromSentences } from '@/lib/lesson/builders';

type CEFRLevel = 'B2' | 'C1' | 'C2';

type RequestBody = {
  sentences: SentenceRecord[];
  level?: CEFRLevel;
  numPrompts?: number; // 지금은 빌더에서 기본값 사용
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

    // dev용: reading(1), structure(2), vocab(3), background(4) 다음이라고 보고 5 고정
    const chunk: WritingChunk = await buildWritingChunkFromSentences(
      sentences,
      targetLevel,
      5,
    );

    return NextResponse.json({ chunk }, { status: 200 });
  } catch (err) {
    console.error('[writingChunk] error:', err);
    return NextResponse.json(
      { error: 'WritingChunk 생성 중 오류가 발생했습니다.' },
      { status: 500 },
    );
  }
}
