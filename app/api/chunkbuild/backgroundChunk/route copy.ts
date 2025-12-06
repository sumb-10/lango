// app/api/chunkbuild/backgroundChunk/route.ts

import { NextRequest, NextResponse } from 'next/server';
import type { SentenceRecord } from '@/lib/processUserMaterial';
import type { BackgroundChunk } from '@/types/lesson';
import { randomUUID } from 'crypto';
import { invokeLLM } from '@/lib/openai';
import { parseJSONFromLLM } from '@/lib/utils';

type CEFRLevel = 'B2' | 'C1' | 'C2';

type RequestBody = {
  sentences: SentenceRecord[];
  level?: CEFRLevel;
  maxParagraphs?: number;
};

const DEFAULT_LEVEL: CEFRLevel = 'C1';
const DEFAULT_MAX_PARAGRAPHS = 4;

const BACKGROUND_SYSTEM_PROMPT = `
당신은 영어 읽기 교재를 위한 "배경지식 설명" 섹션을 작성하는 조교입니다.

입력:
- 하나의 긴 영어 텍스트(여러 문장의 조합)
- 학습 난이도 레벨 정보(CEFR: B2, C1, C2)
- 최대 단락 수(maxParagraphs)

당신의 작업:
1) 영어 텍스트가 다루는 핵심 주제, 맥락, 사회·철학·기술적 배경을 한국어로 설명하세요.
2) 학습자 수준(B2/C1/C2)에 맞게, 지나치게 전문 용어만 나열하지 말고 "설명형 한국어"로 써 주세요.
3) 설명은 여러 개의 단락(paragraphs)으로 나누어 주세요.
4) 글을 이해하는 데 중요한 핵심 개념/키워드 목록을 key_terms 배열에 넣어 주세요.
   - key_terms는 한국어 또는 영어 단어/구로 짧게 작성합니다.
   - 예: ["기술적 불확실성", "예측 알고리즘", "의사결정", "인간-기계 상호작용"]

출력 형식(JSON 객체):
{
  "paragraphs": [
    "단락1 내용 (한국어 전체 문장들)",
    "단락2 내용 ...",
    ...
  ],
  "key_terms": [
    "키워드1",
    "키워드2",
    ...
  ]
}

규칙:
- paragraphs는 최소 1개 이상이어야 합니다.
- paragraphs의 개수는 최대 maxParagraphs를 넘지 않도록 합니다.
- 반드시 JSON 객체만 출력하세요. 마크다운, 자연어 설명, 코드블록을 포함하지 마세요.
`;

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as RequestBody;
    const { sentences, level, maxParagraphs } = body;

    if (!Array.isArray(sentences) || sentences.length === 0) {
      return NextResponse.json(
        { error: 'sentences 배열이 비어 있습니다.' },
        { status: 400 },
      );
    }

    const targetLevel: CEFRLevel = level ?? DEFAULT_LEVEL;
    const targetMaxParagraphs =
      maxParagraphs && maxParagraphs > 0
        ? maxParagraphs
        : DEFAULT_MAX_PARAGRAPHS;

    // ✅ 영어 텍스트만 추출 (paragraph, sentence_id 기준 정렬 후 text만 join)
    const sorted = [...sentences].sort((a, b) => {
      if (a.paragraph !== b.paragraph) {
        return a.paragraph - b.paragraph;
      }
      return a.sentence_id - b.sentence_id;
    });

    const englishText = sorted.map((s) => s.text).join(' ');

    const userPayload = {
      level: targetLevel,
      maxParagraphs: targetMaxParagraphs,
      text: englishText, // ✅ english only
    };

    const raw = await invokeLLM({
      messages: [
        { role: 'system', content: BACKGROUND_SYSTEM_PROMPT },
        { role: 'user', content: JSON.stringify(userPayload) },
      ],
    });

    const parsed = parseJSONFromLLM(raw) as any;

    if (!parsed || !Array.isArray(parsed.paragraphs)) {
      throw new Error('LLM 응답에 paragraphs 배열이 없습니다.');
    }

    const paragraphs: string[] = parsed.paragraphs
      .map((p: any) => String(p).trim())
      .filter((p: string) => p.length > 0);

    const keyTerms: string[] | undefined = Array.isArray(parsed.key_terms)
      ? parsed.key_terms
          .map((t: any) => String(t).trim())
          .filter((t: string) => t.length > 0)
      : undefined;

    if (paragraphs.length === 0) {
      throw new Error('유효한 배경 설명 단락을 생성하지 못했습니다.');
    }

    const chunk: BackgroundChunk = {
      id: randomUUID(),
      type: 'background',
      title: '#배경지식 이해',
      order: 4, // reading(1), structure(2), vocab(3) 다음이라고 가정
      data: {
        paragraphs,
        ...(keyTerms && keyTerms.length > 0 ? { key_terms: keyTerms } : {}),
      },
    };

    return NextResponse.json({ chunk }, { status: 200 });
  } catch (err) {
    console.error('[backgroundChunk] error:', err);
    return NextResponse.json(
      { error: 'BackgroundChunk 생성 중 오류가 발생했습니다.' },
      { status: 500 },
    );
  }
}
