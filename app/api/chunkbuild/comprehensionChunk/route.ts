// app/api/chunkbuild/comprehensionChunk/route.ts

import { NextRequest, NextResponse } from 'next/server';
import type { SentenceRecord } from '@/lib/processUserMaterial';
import type {
  ComprehensionChunk,
  Question,
  QuestionType,
} from '@/types/lesson';
import { randomUUID } from 'crypto';
import { invokeLLM } from '@/lib/openai';
import { parseJSONFromLLM } from '@/lib/utils';

type CEFRLevel = 'B2' | 'C1' | 'C2';

type RequestBody = {
  sentences: SentenceRecord[];
  level?: CEFRLevel;
  numQuestions?: number;
};

const DEFAULT_LEVEL: CEFRLevel = 'C1';
const DEFAULT_NUM_QUESTIONS = 4;

const COMPREHENSION_SYSTEM_PROMPT = `
You are an expert English reading instructor for upper-intermediate to advanced learners (CEFR B2–C2).

Input:
- A list of sentences, each with:
  - sentence_id (number)
  - text (English)
- A target level (B2, C1, or C2)
- A desired number of questions

Your task:
1. Read the passage and design SHORT-ANSWER style comprehension questions.
2. Use ONLY the following question types:
   - "short_answer" (학생이 1–3문장으로 답하는 질문)
   - "fill_blank" (본문 문장을 일부 비워 두고, 핵심 표현을 채우게 하는 문제)
   - "rewrite" (주어진 문장을 다른 표현으로 바꾸게 하는 문제)
3. For each question, provide:
   - stem: the question text in English (you may include Korean sub-instructions if helpful)
   - type: one of "short_answer", "fill_blank", or "rewrite"
   - answer: a model answer in English (what a good answer should roughly contain)
   - explanation: a short explanation in Korean for teachers (1–3 sentences)
   - ref_sentence_ids: an array of relevant sentence_id numbers

Do NOT create multiple-choice questions. No options are needed.

Output format (JSON array):
[
  {
    "type": "short_answer",
    "stem": "Question text ...",
    "answer": "Model answer ...",
    "explanation": "짧은 한국어 해설 ...",
    "ref_sentence_ids": [0, 1]
  },
  ...
]

Rules:
- Use clear, natural English for "stem" and "answer".
- Use Korean for "explanation".
- ref_sentence_ids must be valid sentence_id numbers from the input.
- RETURN ONLY a JSON array. Do not add any markdown or extra text.
`;

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as RequestBody;
    const { sentences, level, numQuestions } = body;

    if (!Array.isArray(sentences) || sentences.length === 0) {
      return NextResponse.json(
        { error: 'sentences 배열이 비어 있습니다.' },
        { status: 400 },
      );
    }

    const targetLevel: CEFRLevel = level ?? DEFAULT_LEVEL;
    const targetNumQuestions =
      numQuestions && numQuestions > 0
        ? Math.min(numQuestions, 8)
        : DEFAULT_NUM_QUESTIONS;

    // 영어 텍스트 및 sentence 정보 정리
    const sorted = [...sentences].sort((a, b) => {
      if (a.paragraph !== b.paragraph) return a.paragraph - b.paragraph;
      return a.sentence_id - b.sentence_id;
    });

    const englishText = sorted.map((s) => s.text).join(' ');

    const userPayload = {
      level: targetLevel,
      numQuestions: targetNumQuestions,
      sentences: sorted.map((s) => ({
        sentence_id: s.sentence_id,
        text: s.text,
      })),
      text: englishText,
    };

    const raw = await invokeLLM({
      messages: [
        { role: 'system', content: COMPREHENSION_SYSTEM_PROMPT },
        { role: 'user', content: JSON.stringify(userPayload) },
      ],
    });

    const parsed = parseJSONFromLLM(raw) as any[];

    if (!Array.isArray(parsed)) {
      throw new Error('LLM 응답이 JSON 배열 형식이 아닙니다.');
    }

    const VALID_TYPES: QuestionType[] = [
      'short_answer',
      'fill_blank',
      'rewrite',
    ];

    const questions: Question[] = parsed
      .slice(0, targetNumQuestions)
      .map((item: any): Question | null => {
        if (!item || typeof item.stem !== 'string' || typeof item.answer !== 'string') {
          return null;
        }
        const qType =
          typeof item.type === 'string' &&
          VALID_TYPES.includes(item.type as QuestionType)
            ? (item.type as QuestionType)
            : 'short_answer';

        const refIds: number[] | undefined = Array.isArray(item.ref_sentence_ids)
          ? item.ref_sentence_ids
              .map((x: any) => Number(x))
              .filter((n: number) => Number.isInteger(n))
          : undefined;

        return {
          id: randomUUID(),
          type: qType,
          stem: item.stem.trim(),
          answer: item.answer.trim(),
          explanation:
            typeof item.explanation === 'string'
              ? item.explanation.trim()
              : undefined,
          ref_sentence_ids:
            refIds && refIds.length > 0 ? Array.from(new Set(refIds)) : undefined,
        };
      })
      .filter((q): q is Question => q !== null);

    if (questions.length === 0) {
      throw new Error('유효한 질문을 생성하지 못했습니다.');
    }

    const chunk: ComprehensionChunk = {
      id: randomUUID(),
      type: 'comprehension',
      title: '#읽기 확인 문제',
      order: 2, // 예: reading(1) 다음에 출제
      data: {
        questions,
      },
    };

    return NextResponse.json({ chunk }, { status: 200 });
  } catch (err) {
    console.error('[comprehensionChunk] error:', err);
    return NextResponse.json(
      { error: 'ComprehensionChunk 생성 중 오류가 발생했습니다.' },
      { status: 500 },
    );
  }
}
