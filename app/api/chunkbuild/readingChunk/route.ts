// app/api/chunkbuild/readingChunk/route.ts

import { NextRequest, NextResponse } from 'next/server';
import type { SentenceRecord } from '@/lib/processUserMaterial';
import { buildReadingChunk } from '@/lib/lesson/builders';

type RequestBody = { sentences: SentenceRecord[] };

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as RequestBody;
    const { sentences } = body;

    if (!Array.isArray(sentences) || sentences.length === 0) {
      return NextResponse.json(
        { error: 'sentences 배열이 비어 있습니다.' },
        { status: 400 },
      );
    }

    const chunk = buildReadingChunk(sentences, {
      order: 1,
      title: '#읽어봅시다!',
    });

    return NextResponse.json({ chunk }, { status: 200 });
  } catch (err) {
    console.error('[readingChunk] error:', err);
    return NextResponse.json(
      { error: 'ReadingChunk 생성 중 오류가 발생했습니다.' },
      { status: 500 },
    );
  }
}
