// lib/utils.ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// 크레딧 계산 함수
export const CREDIT_COSTS = {
  MICRO_FEEDBACK: 10, // Micro 피드백 (해석, 문법, 어휘, 질문)
  MACRO_FEEDBACK: 50, // Macro 작문 평가
  WORKSHEET_GENERATION: 30, // 학습지 생성
  CHUNK_PROCESSING: 5, // 청크 처리
} as const;

export function calculateCreditCost(type: keyof typeof CREDIT_COSTS): number {
  return CREDIT_COSTS[type];
}

// 날짜 포맷 함수
export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Spaced Repetition 알고리즘
export function calculateNextReview(params: {
  easeFactor: number;
  intervalDays: number;
  quality: number; // 0-5 (0: 완전히 틀림, 5: 완벽)
}): { newEaseFactor: number; newIntervalDays: number; nextReviewAt: Date } {
  const { easeFactor, intervalDays, quality } = params;

  // SuperMemo SM-2 알고리즘
  let newEaseFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (newEaseFactor < 1.3) newEaseFactor = 1.3;

  let newIntervalDays: number;
  if (quality < 3) {
    // 틀린 경우 처음부터
    newIntervalDays = 1;
  } else {
    if (intervalDays === 1) {
      newIntervalDays = 6;
    } else {
      newIntervalDays = Math.round(intervalDays * newEaseFactor);
    }
  }

  const nextReviewAt = new Date();
  nextReviewAt.setDate(nextReviewAt.getDate() + newIntervalDays);

  return { newEaseFactor, newIntervalDays, nextReviewAt };
}

// JSON 파싱 헬퍼 (마크다운 코드 블록 제거 + 헐렁한 JSON 보정)
export function parseJSONFromLLM<T = any>(text: string): T {
  if (!text) {
    throw new Error('LLM 응답이 비어 있습니다.');
  }

  let cleaned = text.trim();

  // ```json ... ``` 또는 ``` ... ``` 제거
  if (cleaned.startsWith('```')) {
    cleaned = cleaned
      .replace(/^```(?:json)?\s*\n?/i, '')
      .replace(/\n?```\s*$/i, '');
  }

  cleaned = cleaned.trim();

  // 혹시 설명 텍스트 + JSON이 섞여 있으면, 첫 { 또는 [부터 잘라서 시도
  const braceIndex = cleaned.indexOf('{');
  const bracketIndex = cleaned.indexOf('[');
  const firstJsonIndex = [braceIndex, bracketIndex]
    .filter((i) => i !== -1)
    .sort((a, b) => a - b)[0];

  let jsonCandidate =
    firstJsonIndex !== undefined ? cleaned.slice(firstJsonIndex) : cleaned;

  // 혹시 뒤에 이런저런 텍스트가 더 붙어 있으면 마지막 } 또는 ]까지만 자르기
  const lastBrace = jsonCandidate.lastIndexOf('}');
  const lastBracket = jsonCandidate.lastIndexOf(']');
  const lastIndex = Math.max(lastBrace, lastBracket);
  if (lastIndex !== -1) {
    jsonCandidate = jsonCandidate.slice(0, lastIndex + 1);
  }

  // 1차 시도: 그대로 파싱
  try {
    return JSON.parse(jsonCandidate) as T;
  } catch (error) {
    console.warn('1차 JSON 파싱 실패, 보정 시도:', error);
  }

  // 2차 시도: 문자열 내부의 생 줄바꿈(\n, \r)을 \n 이스케이프로 치환
  const fixed = escapeNewlinesInsideStrings(jsonCandidate);

  try {
    return JSON.parse(fixed) as T;
  } catch (error) {
    console.error('JSON 파싱 오류:', error);
    console.error('원본 텍스트:', text);
    console.error('파싱 시도 텍스트:', jsonCandidate);
    console.error('보정 후 텍스트:', fixed);
    throw new Error('LLM 응답을 JSON으로 파싱할 수 없습니다.');
  }
}

// 따옴표 안에 있는 실제 줄바꿈을 \n 으로 치환
function escapeNewlinesInsideStrings(input: string): string {
  let result = '';
  let inString = false;
  let escaped = false;

  for (let i = 0; i < input.length; i++) {
    const ch = input[i];

    if (!inString) {
      if (ch === '"') {
        inString = true;
      }
      result += ch;
      continue;
    }

    // 문자열 안에 있는 경우
    if (escaped) {
      // 바로 앞이 역슬래시였던 문자
      result += ch;
      escaped = false;
      continue;
    }

    if (ch === '\\') {
      escaped = true;
      result += ch;
      continue;
    }

    if (ch === '"') {
      inString = false;
      result += ch;
      continue;
    }

    if (ch === '\n' || ch === '\r') {
      result += '\\n';
      continue;
    }

    result += ch;
  }

  return result;
}



// 파일 크기 포맷
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// 가격 포맷 (원화)
export function formatPrice(amount: number): string {
  return `₩${amount.toLocaleString('ko-KR')}`;
}
