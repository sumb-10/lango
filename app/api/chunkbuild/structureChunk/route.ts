// app/api/chunkbuild/structureChunk/route.ts

import { NextRequest, NextResponse } from 'next/server';
import type { SentenceRecord } from '@/lib/processUserMaterial';
import type { StructureChunk, StructureItem } from '@/types/lesson';
import { randomUUID } from 'crypto';

type RequestBody = {
  sentences: SentenceRecord[];
};

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

    // paragraph, sentence_id 기준으로 정렬
    const sorted = [...sentences].sort((a, b) => {
      if (a.paragraph !== b.paragraph) {
        return a.paragraph - b.paragraph;
      }
      return a.sentence_id - b.sentence_id;
    });

    // SentenceRecord -> StructureItem 변환
    const items: StructureItem[] = sorted.map((s) => ({
      paragraph: s.paragraph,
      sentence_id: s.sentence_id,
      text: s.text,
      structure: s.structure ?? '',
      key_point: s.key_point ?? '',
    }));

    const chunk: StructureChunk = {
      id: randomUUID(),
      type: 'structure',
      title: '#구문 뽀개기 / 스스로 요약',
      order: 2, // Reading 다음에 온다고 가정
      data: {
        items,
      },
    };

    return NextResponse.json({ chunk }, { status: 200 });
  } catch (err) {
    console.error('[structureChunk] error:', err);
    return NextResponse.json(
      { error: 'StructureChunk 생성 중 오류가 발생했습니다.' },
      { status: 500 },
    );
  }
}
