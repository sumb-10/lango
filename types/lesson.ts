// @/types/lesson.ts

// 문장 단위 레코드 타입
export type SentenceRecord = {
  paragraph: number;
  sentence_id: number;
  text: string;
  translate: string;
  structure: string;
  key_point: string;
};

// ReadingChunk에서 쓸 단락 단위 구조
export interface ReadingParagraph {
  paragraph: number;
  sentenceIds: number[]; // 포함된 문장 ID들
  text: string;          // 원문 문장 join
  translate: string;     // 번역 문장 join
}

export interface BaseChunk {
  id: string;
  type: 'reading';
  title: string;   // "#읽어봅시다!" 등
  order: number;   // 교재 내 순서
}

// 지금은 ReadingChunk만 정의
export interface ReadingChunk extends BaseChunk {
  type: 'reading';
  data: {
    paragraphs: ReadingParagraph[];
  };
}

export type LessonChunk = ReadingChunk; // 나중에 | VocabChunk | ... 추가

export interface LessonJson {
  id: string;
  materialId: number;
  title: string;
  level: 'B2' | 'C1' | 'C2';
  chunks: LessonChunk[];
}

