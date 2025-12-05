// app/api/chunkbuild/writingChunk/route.ts

import { NextRequest, NextResponse } from 'next/server';
import type { SentenceRecord } from '@/lib/processUserMaterial';
import type { WritingChunk, WritingPrompt } from '@/types/lesson';
import { randomUUID } from 'crypto';
import { invokeLLM } from '@/lib/openai';
import { parseJSONFromLLM } from '@/lib/utils';

type CEFRLevel = 'B2' | 'C1' | 'C2';

type RequestBody = {
  sentences: SentenceRecord[];
  level?: CEFRLevel;
  numPrompts?: number; // 기본 2개 정도
};

const DEFAULT_LEVEL: CEFRLevel = 'C1';
const DEFAULT_NUM_PROMPTS = 2;

const WRITING_SYSTEM_PROMPT = `
You are an expert English writing instructor for upper-intermediate to advanced learners (CEFR B2–C2).

You are given:
- An English passage (several sentences combined into one text).
- A target CEFR level (B2, C1, or C2).
- A desired number of writing prompts (1–3).

Your task:
1. Read the passage carefully and identify its key themes, tensions, or questions.
2. Design 1–3 LONG writing tasks ("긴 작문 문제") that require the learner to:
   - Think critically about the passage.
   - Connect the ideas to real-world examples or personal reflection.
   - Write at least one full paragraph with several sentences.

Each writing task should follow this spirit (examples):

Example 1:
Title: "📝 Advanced Writing Task 1 — Technology Dependence and Human Judgment"
Prompt:
  The text suggests that as tools become more complex, human decision-making becomes harder to understand and control.
  Discuss a real-world example (from medicine, finance, aviation, law, or any other field) where human judgment was complicated or undermined by a technological system.
  In your response, explain:
  - What the technology was supposed to improve
  - How human understanding or misunderstanding of the system affected the outcome
  - What this reveals about the limits of human adaptability
  Write at least one full paragraph (6–10 sentences). You may write more if needed.

Example 2:
Title: "📝 Advanced Writing Task 2 — The Pace of Innovation vs. Human Adaptation"
Prompt:
  The passage claims that “the true challenge of technological transformation may not be the pace of innovation, but the slow adaptability of the human mind.”
  Do you agree or disagree?
  Write an argumentative response in which you:
  - Take a clear position
  - Analyze how technological progress outpaces human cognitive or ethical frameworks
  - Propose what individuals or societies should do to narrow this gap
  Write 1–2 paragraphs (10–14 sentences total).

Output format (JSON array):
[
  {
    "title": "📝 ...",
    "prompt": "Full English instructions (multi-line is allowed)",
    "guidance_ko": "한국어로 짧은 안내 (선택, 없으면 빈 문자열)",
    "min_paragraphs": 1,
    "min_sentences": 8
  },
  ...
]

Rules:
- Use only English in the "prompt" field.
- "guidance_ko" can be a short Korean explanation (1–3 sentences) or an empty string.
- "min_paragraphs" and "min_sentences" must be positive integers.
- RETURN ONLY a JSON array. Do not add any markdown, comments, or extra text.
`;

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as RequestBody;
    const { sentences, level, numPrompts } = body;

    if (!Array.isArray(sentences) || sentences.length === 0) {
      return NextResponse.json(
        { error: 'sentences 배열이 비어 있습니다.' },
        { status: 400 },
      );
    }

    const targetLevel: CEFRLevel = level ?? DEFAULT_LEVEL;
    const targetNumPrompts =
      numPrompts && numPrompts > 0 ? Math.min(numPrompts, 3) : DEFAULT_NUM_PROMPTS;

    // 영어 텍스트만 추출 (paragraph → sentence_id 순서대로)
    const sorted = [...sentences].sort((a, b) => {
      if (a.paragraph !== b.paragraph) {
        return a.paragraph - b.paragraph;
      }
      return a.sentence_id - b.sentence_id;
    });

    const englishText = sorted.map((s) => s.text).join(' ');

    const userPayload = {
      level: targetLevel,
      numPrompts: targetNumPrompts,
      text: englishText,
    };

    const raw = await invokeLLM({
      messages: [
        { role: 'system', content: WRITING_SYSTEM_PROMPT },
        { role: 'user', content: JSON.stringify(userPayload) },
      ],
    });

    const parsed = parseJSONFromLLM(raw) as any[];

    if (!Array.isArray(parsed)) {
      throw new Error('LLM 응답이 JSON 배열 형식이 아닙니다.');
    }

    const prompts: WritingPrompt[] = parsed
      .slice(0, targetNumPrompts)
      .map((item: any): WritingPrompt | null => {
        if (!item || typeof item.title !== 'string' || typeof item.prompt !== 'string') {
          return null;
        }

        const minParagraphs =
          typeof item.min_paragraphs === 'number' && item.min_paragraphs > 0
            ? item.min_paragraphs
            : 1;

        const minSentences =
          typeof item.min_sentences === 'number' && item.min_sentences > 0
            ? item.min_sentences
            : 6;

        return {
          id: randomUUID(),
          title: item.title.trim(),
          prompt: item.prompt.trim(),
          guidance_ko:
            typeof item.guidance_ko === 'string' ? item.guidance_ko.trim() : '',
          min_paragraphs: minParagraphs,
          min_sentences: minSentences,
        };
      })
      .filter((p): p is WritingPrompt => p !== null);

    if (prompts.length === 0) {
      throw new Error('유효한 WritingPrompt를 생성하지 못했습니다.');
    }

    const chunk: WritingChunk = {
      id: randomUUID(),
      type: 'writing',
      title: '#긴 작문 문제',
      order: 5, // reading(1), structure(2), vocab(3), background(4) 다음이라고 가정
      data: {
        prompts,
      },
    };

    return NextResponse.json({ chunk }, { status: 200 });
  } catch (err) {
    console.error('[writingChunk] error:', err);
    return NextResponse.json(
      { error: 'WritingChunk 생성 중 오류가 발생했습니다.' },
      { status: 500 },
    );
  }
}
