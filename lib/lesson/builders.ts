// lib/lesson/builders.ts

import type { SentenceRecord } from '@/lib/processUserMaterial';
import type {
  ReadingChunk,
  ReadingParagraph,
  StructureChunk,
  StructureItem,
  VocabChunk,
  VocabItem,
  BackgroundChunk,
  ComprehensionChunk,
  Question,
  QuestionType,
  WritingChunk,
  WritingPrompt,
} from '@/types/lesson';
import { invokeLLM } from '@/lib/openai';
import { parseJSONFromLLM } from '@/lib/utils';
import { randomUUID } from 'crypto';

type CEFRLevel = 'B2' | 'C1' | 'C2';

/**
 * SentenceRecord[] → StructureChunk 변환
 * - 구문 뽀개기 / 스스로 요약용 청크
 */
export async function buildStructureChunkFromSentences(
  sentences: SentenceRecord[],
  order: number,
): Promise<StructureChunk> {
  if (!Array.isArray(sentences) || sentences.length === 0) {
    throw new Error('sentences 배열이 비어 있어서 StructureChunk를 만들 수 없습니다.');
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
    structure_translated: s.structure_translated ?? '',
  }));

  const chunk: StructureChunk = {
    id: randomUUID(),
    type: 'structure',
    title: '#구문 뽀개기 / 스스로 요약',
    order, // 외부에서 순서 주입
    data: {
      items,
    },
  };

  return chunk;
}

// 2) VocabChunk
// ====================

const VOCAB_DEFAULT_LEVEL: CEFRLevel = 'C1';
const VOCAB_DEFAULT_MAX_ITEMS = 15;

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

/**
 * SentenceRecord[] → VocabChunk
 * - level: CEFR 레벨
 * - order: lesson 내 표시 순서
 * - maxItems: 내부 기본값 15 (바꾸고 싶으면 매개변수 늘려도 됨)
 */
export async function buildVocabChunkFromSentences(
  sentences: SentenceRecord[],
  level: CEFRLevel,
  order: number,
): Promise<VocabChunk> {
  if (!Array.isArray(sentences) || sentences.length === 0) {
    throw new Error('sentences 배열이 비어 있어서 VocabChunk를 만들 수 없습니다.');
  }

  const targetLevel: CEFRLevel = level ?? VOCAB_DEFAULT_LEVEL;
  const targetMaxItems = VOCAB_DEFAULT_MAX_ITEMS;

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

  const parsed = parseJSONFromLLM(raw) as any[];

  if (!Array.isArray(parsed)) {
    throw new Error('LLM 응답이 JSON 배열 형식이 아닙니다.');
  }

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

  const slicedItems = items.slice(0, targetMaxItems);

  const chunk: VocabChunk = {
    id: randomUUID(),
    type: 'vocab',
    title: '#핵심단어',
    order,
    data: {
      items: slicedItems,
      level: targetLevel,
    },
  };

  return chunk;
}

// ====================
// 3) BackgroundChunk
// ====================

const BACKGROUND_DEFAULT_LEVEL: CEFRLevel = 'C1';
const BACKGROUND_DEFAULT_MAX_PARAGRAPHS = 4;

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

/**
 * SentenceRecord[] → BackgroundChunk
 * - english only 텍스트를 합쳐서 LLM에 보냄
 */
export async function buildBackgroundChunkFromSentences(
  sentences: SentenceRecord[],
  level: CEFRLevel,
  order: number,
): Promise<BackgroundChunk> {
  if (!Array.isArray(sentences) || sentences.length === 0) {
    throw new Error('sentences 배열이 비어 있어서 BackgroundChunk를 만들 수 없습니다.');
  }

  const targetLevel: CEFRLevel = level ?? BACKGROUND_DEFAULT_LEVEL;
  const targetMaxParagraphs = BACKGROUND_DEFAULT_MAX_PARAGRAPHS;

  // paragraph, sentence_id 기준 정렬 후 text만 join (english only)
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
    text: englishText,
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
    order,
    data: {
      paragraphs,
      ...(keyTerms && keyTerms.length > 0 ? { key_terms: keyTerms } : {}),
    },
  };

  return chunk;
}

// 4) ComprehensionChunk
// ====================

const COMPREHENSION_DEFAULT_LEVEL: CEFRLevel = 'C1';
const COMPREHENSION_DEFAULT_NUM_QUESTIONS = 4;

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

/**
 * SentenceRecord[] → ComprehensionChunk
 * - 내부에서 기본 4문항 생성 (원하면 나중에 numQuestions 파라미터 추가 가능)
 */
export async function buildComprehensionChunkFromSentences(
  sentences: SentenceRecord[],
  level: CEFRLevel,
  order: number,
): Promise<ComprehensionChunk> {
  if (!Array.isArray(sentences) || sentences.length === 0) {
    throw new Error(
      'sentences 배열이 비어 있어서 ComprehensionChunk를 만들 수 없습니다.',
    );
  }

  const targetLevel: CEFRLevel = level ?? COMPREHENSION_DEFAULT_LEVEL;
  const targetNumQuestions = COMPREHENSION_DEFAULT_NUM_QUESTIONS;

  // paragraph → sentence_id 순으로 정렬
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
      if (
        !item ||
        typeof item.stem !== 'string' ||
        typeof item.answer !== 'string'
      ) {
        return null;
      }

      const qType =
        typeof item.type === 'string' &&
        VALID_TYPES.includes(item.type as QuestionType)
          ? (item.type as QuestionType)
          : 'short_answer';

      const refIds: number[] | undefined = Array.isArray(
        item.ref_sentence_ids,
      )
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
    order,
    data: {
      questions,
    },
  };

  return chunk;
}

// ====================
// 5) WritingChunk
// ====================

const WRITING_DEFAULT_LEVEL: CEFRLevel = 'C1';
const WRITING_DEFAULT_NUM_PROMPTS = 2;

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

/**
 * SentenceRecord[] → WritingChunk
 * - 기본 2개의 긴 작문 문제 생성
 */
export async function buildWritingChunkFromSentences(
  sentences: SentenceRecord[],
  level: CEFRLevel,
  order: number,
): Promise<WritingChunk> {
  if (!Array.isArray(sentences) || sentences.length === 0) {
    throw new Error(
      'sentences 배열이 비어 있어서 WritingChunk를 만들 수 없습니다.',
    );
  }

  const targetLevel: CEFRLevel = level ?? WRITING_DEFAULT_LEVEL;
  const targetNumPrompts = WRITING_DEFAULT_NUM_PROMPTS;

  // paragraph → sentence_id 순으로 정렬 후 영어 텍스트만 결합
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
      if (
        !item ||
        typeof item.title !== 'string' ||
        typeof item.prompt !== 'string'
      ) {
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
    order,
    data: {
      prompts,
    },
  };

  return chunk;
}

/**
 * SentenceRecord[] → ReadingChunk
 * - 문단/문장 정렬 후, paragraph 단위로 text/translate를 join
 */
export function buildReadingChunk(
  sentences: SentenceRecord[],
  options: { order: number; title?: string },
): ReadingChunk {
  const { order, title } = options;

  if (!Array.isArray(sentences) || sentences.length === 0) {
    throw new Error('sentences 배열이 비어 있어서 ReadingChunk를 만들 수 없습니다.');
  }

  // paragraph 기준 그룹핑
  const byParagraph = new Map<number, SentenceRecord[]>();

  for (const s of sentences) {
    if (typeof s.paragraph !== 'number') continue;
    if (!byParagraph.has(s.paragraph)) {
      byParagraph.set(s.paragraph, []);
    }
    byParagraph.get(s.paragraph)!.push(s);
  }

  // paragraph 내 sentence_id 순으로 정렬 → join
  const paragraphs: ReadingParagraph[] = Array.from(byParagraph.entries())
    .sort(([a], [b]) => a - b)
    .map(([pIndex, list]) => {
      const sorted = [...list].sort((a, b) => a.sentence_id - b.sentence_id);

      const text = sorted.map((s) => s.text).join(' ');
      const translate = sorted.map((s) => s.translate).join(' ');

      return {
        paragraph: pIndex,
        sentenceIds: sorted.map((s) => s.sentence_id),
        text,
        translate,
      };
    });

  const chunk: ReadingChunk = {
    id: randomUUID(),
    type: 'reading',
    title: title ?? '#읽어봅시다!',
    order,
    data: {
      paragraphs,
    },
  };

  return chunk;
}