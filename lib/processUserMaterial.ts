// lib/processUserMaterial.ts

import { invokeLLM } from '@/lib/openai';
import { parseJSONFromLLM } from '@/lib/utils';

// 문장 단위 레코드 타입
export type SentenceRecord = {
  paragraph: number;
  sentence_id: number;
  text: string;
  translate: string;
  structure: string;
  key_point: string;
};

// 호출 인자 타입
export type ProcessUserMaterialArgs = {
  textContent: string;
};

// 문단/문장 파싱
export function parseTextToSentences(textContent: string): SentenceRecord[] {
  const normalized = textContent.replace(/\r\n/g, '\n').trim();

  // 빈 줄 기준으로 문단 나누기
  const paragraphs = normalized.split(/\n\s*\n+/);

  const sentences: SentenceRecord[] = [];
  let globalSentenceId = 0;

  paragraphs.forEach((paraRaw, pIndex) => {
    const para = paraRaw.trim();
    if (!para) return;

    // 문장 단위로 나누기 (., !, ?, 일본어/중국어 문장 부호 기준)
    const rough = para.split(/(?<=[.!?。！？])\s+/);

    rough.forEach((s) => {
      const sentence = s.trim();
      if (!sentence) return;

      sentences.push({
        paragraph: pIndex,
        sentence_id: globalSentenceId++,
        text: sentence,
        translate: '',
        structure: '',
        key_point: '',
      });
    });
  });

  return sentences;
}

// LLM에 줄 시스템 프롬프트 (문장 주석용)
const SENTENCE_ANNOTATION_SYSTEM_PROMPT = `
당신은 문장 분석 및 문법 설명을 도와주는 조교입니다.

입력으로 문장 배열을 받습니다. 각 항목은 다음 필드를 가집니다:
- paragraph: 문단 인덱스 (숫자)
- sentence_id: 문장 전역 ID (숫자, 0부터 시작)
- text: 원문 문장 (언어는 영어/프랑스어/일본어/기타일 수 있음)

당신의 작업:
각 문장에 대해 다음 필드를 채워서 동일한 배열 구조로 반환하세요.

- translate: 문장을 자연스러운 한국어로 번역한 문장 (한 문장)
- structure: 문장 구조를 "S(...)+ V(...)+ O(...)" 형태로 요약한 문법 구조 설명 (영문/약어 혼합 가능)
- key_point: 이 문장에서 학습할 만한 핵심 문법/표현 포인트를 한국어로 정리한 짧은 설명

중요:
- paragraph, sentence_id, text 값은 그대로 유지하세요.
- 반드시 JSON 배열만 출력하세요. 추가 설명, 불릿, 코드블록, 자연어 코멘트 등을 붙이지 마세요.
- 출력 배열의 각 요소는 { "paragraph", "sentence_id", "text", "translate", "structure", "key_point" } 형식이어야 합니다.
`;

// 배치 크기 (한 번에 몇 문장씩 LLM에 보낼지)
const SENTENCE_BATCH_SIZE = 8;

// LLM을 이용해 translate / structure / key_point 채우기
export async function enrichSentencesWithLLM(
  sentences: SentenceRecord[],
): Promise<SentenceRecord[]> {
  const result: SentenceRecord[] = [];

  for (let i = 0; i < sentences.length; i += SENTENCE_BATCH_SIZE) {
    const batch = sentences.slice(i, i + SENTENCE_BATCH_SIZE);

    try {
      const userContent = JSON.stringify(
        batch.map(({ paragraph, sentence_id, text }) => ({
          paragraph,
          sentence_id,
          text,
        })),
      );

      const raw = await invokeLLM({
        messages: [
          { role: 'system', content: SENTENCE_ANNOTATION_SYSTEM_PROMPT },
          { role: 'user', content: userContent },
        ],
      });

      // LLM이 돌려준 JSON 파싱
      const parsed = parseJSONFromLLM(raw) as any[];

      // sentence_id 기준으로 매칭
      const byId = new Map<number, any>();
      for (const item of parsed) {
        if (typeof item?.sentence_id === 'number') {
          byId.set(item.sentence_id, item);
        }
      }

      for (const s of batch) {
        const enriched = byId.get(s.sentence_id);
        if (!enriched) {
          // 파싱 실패/누락 시 원본 유지
          result.push(s);
          continue;
        }

        result.push({
          paragraph: s.paragraph,
          sentence_id: s.sentence_id,
          text: s.text,
          translate: enriched.translate ?? '',
          structure: enriched.structure ?? '',
          key_point: enriched.key_point ?? enriched.key_points ?? '',
        });
      }
    } catch (err) {
      console.error('[material] LLM batch error, using fallback', err);
      // 에러가 나면 해당 배치는 그냥 원본(빈 필드)으로 넣어둔다
      result.push(...batch);
    }
  }

  return result;
}

// ✅ 메인 유틸: 텍스트 → 문장 분석 → JSON 생성
export async function processUserMaterial(args: ProcessUserMaterialArgs) {
  const { textContent } = args;

  // 1) 텍스트 → 문단/문장 파싱
  const parsedSentences = parseTextToSentences(textContent);

  if (parsedSentences.length === 0) {
    const emptyJson = '[]';
    const emptyBytes = new TextEncoder().encode(emptyJson);
    return {
      sentences: [] as SentenceRecord[],
      jsonString: emptyJson,
      jsonBytes: emptyBytes,
    };
  }

  // 2) LLM으로 translate / structure / key_point 채우기
  const enrichedSentences = await enrichSentencesWithLLM(parsedSentences);

  // 3) JSON 문자열/바이너리 생성
  const jsonString = JSON.stringify(enrichedSentences, null, 2);
  const encoder = new TextEncoder();
  const jsonBytes = encoder.encode(jsonString);

  return {
    sentences: enrichedSentences,
    jsonString,
    jsonBytes,
  };
}
