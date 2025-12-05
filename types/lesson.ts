// @/types/lesson.ts

// ✅ processUserMaterial.ts 에 있는 SentenceRecord 재사용
export type { SentenceRecord } from '@/lib/processUserMaterial';

// 공통 청크 베이스
export interface BaseChunk {
  id: string;
  type: 'reading' | 'structure' | 'vocab' | 'background' | 'writing' | 'comprehension';
  title: string;
  order: number;
}


/**
 * ReadingChunk에서 쓸 단락 단위 구조
 */
export interface ReadingParagraph {
  paragraph: number;
  sentenceIds: number[];
  text: string;
  translate: string;
}

/**
 * #읽어봅시다! 청크
 */
export interface ReadingChunk extends BaseChunk {
  type: 'reading';
  data: {
    paragraphs: ReadingParagraph[];
  };
}

/**
 * #구문 뽀개기 / 스스로 요약 용 아이템
 */
export interface StructureItem {
  paragraph: number;
  sentence_id: number;
  text: string;
  structure: string;
  key_point: string;
}

/**
 * #구문 뽀개기 / 스스로 요약 청크
 */
export interface StructureChunk extends BaseChunk {
  type: 'structure';
  data: {
    items: StructureItem[];
  };
}

/**
 * #핵심단어 용 아이템
 */
export interface VocabItem {
  word: string;
  pos: string;               // 품사 (noun, verb, adj 등)
  meaning_ko: string;        // 한국어 의미
  example_en: string;        // 예문 (영어)
}

/**
 * #핵심단어 청크
 */
export interface VocabChunk extends BaseChunk {
  type: 'vocab';
  data: {
    items: VocabItem[];
    level: 'B2' | 'C1' | 'C2';
  };
}


// ✅ BackgroundChunk 추가
export interface BackgroundChunk extends BaseChunk {
  type: 'background';
  data: {
    paragraphs: string[];   // 한국어 설명 단락들
    key_terms?: string[];   // 선택: 핵심 개념 키워드들
  };
}

// 🆕 긴 작문 문제용 타입
export interface WritingPrompt {
  id: string;
  title: string;          // "📝 고급 작문 문제 1 — 기술 의존성과 인간 판단"
  prompt: string;        // 영어 원문 지시문
  guidance_ko?: string;  // 한국어 안내/설명 (옵션)
  min_paragraphs: number;
  min_sentences: number; // 총 최소 문장 수 (또는 단락당 최소 문장 수)
}

export interface WritingChunk extends BaseChunk {
  type: 'writing';
  data: {
    prompts: WritingPrompt[];
  };
}

// 🆕 읽기 확인 문제용 타입
export type QuestionType = 'fill_blank' | 'short_answer' | 'rewrite';

export interface Question {
  id: string;
  type: QuestionType;
  stem: string;               // 문제 지문 (영어 or 한국어 or 혼합)
  answer: string;             // 모범답안(교사용) – 영어로 두는 걸 추천
  explanation?: string;       // 해설 (보통 한국어)
  ref_sentence_ids?: number[]; // 관련된 원문 sentence_id들
}

// 🆕 ComprehensionChunk
export interface ComprehensionChunk extends BaseChunk {
  type: 'comprehension';
  data: {
    questions: Question[];
  };
}

/**
 * 현재 지원하는 모든 청크 union 타입
 */
export type LessonChunk = ReadingChunk | StructureChunk | VocabChunk | BackgroundChunk | WritingChunk | ComprehensionChunk;

/**
 * 완성된 한 교재(Lesson) JSON
 */
export interface LessonJson {
  id: string;
  materialId: number;
  title: string;
  level: 'B2' | 'C1' | 'C2';
  chunks: LessonChunk[];
}
