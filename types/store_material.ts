// types/lesson.ts (예시 위치)
export interface LessonJsonV1 {
  version: number;
  id: string;
  title: string;
  cefrLevel?: string;
  estimatedMinutes?: number;
  sections: LessonSection[];
}

export interface LessonSection {
  id: string;
  label: string;
  type: 'vocabulary' | 'grammar' | 'conversation' | 'reading' | 'exercise';
  blocks: LessonBlock[];
}

export type LessonBlock =
  | {
      type: 'vocab_item';
      word: string;
      translation: string;
      note?: string;
      example?: string;
    }
  | {
      type: 'markdown';
      content: string;
    }
  | {
      type: 'question';
      questionId: string;
      layout: 'inline' | 'block';
      prompt: string;
      inputType: 'textarea';
      modelAnswer?: string;
      explanation?: string;
      feedback?: {
        mode: 'openai';
        instruction: string;
      };
    };
