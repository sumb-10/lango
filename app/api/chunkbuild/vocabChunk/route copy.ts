// app/api/chunkbuild/vocabChunk/route.ts

import { NextRequest, NextResponse } from 'next/server';
import type { SentenceRecord } from '@/lib/processUserMaterial';
import type { VocabChunk, VocabItem } from '@/types/lesson';
import { randomUUID } from 'crypto';
import { invokeLLM } from '@/lib/openai';
import { parseJSONFromLLM } from '@/lib/utils';

type CEFRLevel = 'B2' | 'C1' | 'C2';

type RequestBody = {
  sentences: SentenceRecord[];
  level?: CEFRLevel;
  maxItems?: number;
};

const DEFAULT_LEVEL: CEFRLevel = 'C1';
const DEFAULT_MAX_ITEMS = 15;

const VOCAB_SYSTEM_PROMPT = `
당신은 영어 학습자를 위한 어휘 선정 도우미입니다.

입력으로 하나의 텍스트를 문장 단위로 나눈 JSON 배열을 받습니다.
각 항목은 다음 필드를 가집니다:
- paragraph: 문단 인덱스 (숫자)
- sentence_id: 문장 전역 ID (숫자)
- text: 원문 문장 (영어)
- translate, structure, key_point: 추가 정보 (무시해도 됨)

당신의 작업:
1) 주어진 모든 문장을 살펴보고, 지정된 CEFR 레벨(B2/C1/C2)에 적절한 "학습 가치가 높은 핵심 단어"를 고르세요.
2) 총 단어 수는 지정된 최대 개수(maxItems)를 넘지 않도록 합니다.
3) 각 단어에 대해 다음 정보를 JSON 형태로 제공합니다.

각 어휘 항목의 필드는 다음과 같습니다:
- word: 단어 원형 (소문자, 공백 없이)
- pos: 품사 (예: "noun", "verb", "adjective", "adverb", "phrase" 등)
- meaning_ko: 자연스러운 한국어 의미 (짧게)
- example_en: 해당 단어를 사용하는 간단한 예문 (가능하면 제공된 문장을 가볍게 변형)

중요:
- CEFR 레벨 정보(level)를 고려해서 너무 쉽거나 너무 어려운 단어는 피하세요.
- 문장 JSON 구조는 변경하지 말고, 당신이 고른 단어 목록만 JSON 배열로 반환하세요.
- 반드시 JSON 배열만 출력하세요. 추가 설명, 마크다운, 코드블록을 붙이지 마세요.
`;

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as RequestBody;
    const { sentences, level, maxItems } = body;

    if (!Array.isArray(sentences) || sentences.length === 0) {
      return NextResponse.json(
        { error: 'sentences 배열이 비어 있습니다.' },
        { status: 400 },
      );
    }

    const targetLevel: CEFRLevel = level ?? DEFAULT_LEVEL;
    const targetMaxItems = maxItems && maxItems > 0 ? maxItems : DEFAULT_MAX_ITEMS;

    // 1) LLM에 보낼 user content 구성
    const userPayload = {
      level: targetLevel,
      maxItems: targetMaxItems,
      sentences: sentences.map((s) => ({
        paragraph: s.paragraph,
        sentence_id: s.sentence_id,
        text: s.text,
      })),
    };

    const raw = await invokeLLM({
      messages: [
        { role: 'system', content: VOCAB_SYSTEM_PROMPT },
        { role: 'user', content: JSON.stringify(userPayload) },
      ],
    });

    // 2) LLM 결과 JSON 파싱
    const parsed = parseJSONFromLLM(raw) as any[];

    if (!Array.isArray(parsed)) {
      throw new Error('LLM 응답이 JSON 배열 형식이 아닙니다.');
    }

    // 3) VocabItem 필터링/정제
    const items: VocabItem[] = parsed
      .map((item: any): VocabItem | null => {
        if (!item || typeof item.word !== 'string') return null;

        return {
          word: item.word.trim(),
          pos: item.pos ?? '',
          meaning_ko: item.meaning_ko ?? '',
          example_en: item.example_en ?? '',
        };
      })
      .filter((v): v is VocabItem => !!v && !!v.word);

    // 혹시 LLM이 너무 많이 냈으면 maxItems까지 자르기
    const slicedItems = items.slice(0, targetMaxItems);

    const chunk: VocabChunk = {
      id: randomUUID(),
      type: 'vocab',
      title: '#핵심단어',
      order: 3, // reading(1), structure(2) 다음이라고 가정
      data: {
        items: slicedItems,
        level: targetLevel,
      },
    };

    return NextResponse.json({ chunk }, { status: 200 });
  } catch (err) {
    console.error('[vocabChunk] error:', err);
    return NextResponse.json(
      { error: 'VocabChunk 생성 중 오류가 발생했습니다.' },
      { status: 500 },
    );
  }
}
