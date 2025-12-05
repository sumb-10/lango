// app/api/eval/shortAnswer/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { invokeLLM } from '@/lib/openai';
import { parseJSONFromLLM } from '@/lib/utils';

type CEFRLevel = 'B2' | 'C1' | 'C2';

type RequestBody = {
  questionStem: string;
  referenceAnswer: string;
  userAnswer: string;
  level?: CEFRLevel;
};

const SHORT_EVAL_SYSTEM_PROMPT = `
당신은 영어 쓰기 평가를 돕는 교사입니다.

입력:
- questionStem: 문제 지문 (영어)
- referenceAnswer: 모범답안 (영어)
- userAnswer: 학생이 쓴 답안 (영어)
- level: B2/C1/C2

당신의 작업:
1) 학생 답안을 referenceAnswer와 비교하여, 주어진 수준(B2/C1/C2)을 고려해 평가하세요.
2) 점수는 0에서 5 사이의 정수로 주세요.
   - 5: 매우 우수 (내용, 조직, 언어 모두 뛰어남)
   - 4: 대체로 좋음 (약간의 부족함만 있음)
   - 3: 보통 (핵심은 있지만 불명확하거나 부족한 부분 존재)
   - 2: 미흡 (핵심 내용이 많이 빠지거나 언어가 너무 약함)
   - 1: 매우 미흡 (거의 답이 되지 않음)
   - 0: 무응답 또는 전혀 관련 없는 내용
3) 한국어로 피드백을 작성합니다:
   - comment_ko: 전체적인 총평 (2–4문장)
   - strengths_ko: 잘한 점 위주로 2–3문장
   - tips_ko: 개선해야 할 점과 구체적인 조언 2–4문장

출력 형식(JSON 객체):
{
  "score": 0-5 정수,
  "comment_ko": "...",
  "strengths_ko": "...",
  "tips_ko": "..."
}

규칙:
- 반드시 위 JSON 객체만 출력하세요.
- 마크다운, 불릿포인트, 코드블록 등을 포함하지 마세요.
`;

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as RequestBody;
    const { questionStem, referenceAnswer, userAnswer, level } = body;

    if (!questionStem || !referenceAnswer || !userAnswer) {
      return NextResponse.json(
        { error: 'questionStem, referenceAnswer, userAnswer는 모두 필요합니다.' },
        { status: 400 },
      );
    }

    const payload = {
      questionStem,
      referenceAnswer,
      userAnswer,
      level: level ?? 'C1',
    };

    const raw = await invokeLLM({
      messages: [
        { role: 'system', content: SHORT_EVAL_SYSTEM_PROMPT },
        { role: 'user', content: JSON.stringify(payload) },
      ],
    });

    const parsed = parseJSONFromLLM(raw) as any;

    if (
      typeof parsed !== 'object' ||
      typeof parsed.score !== 'number' ||
      typeof parsed.comment_ko !== 'string'
    ) {
      throw new Error('LLM 응답이 기대한 평가 JSON 형식이 아닙니다.');
    }

    const result = {
      score: Math.max(0, Math.min(5, Math.round(parsed.score))),
      comment_ko: parsed.comment_ko,
      strengths_ko: parsed.strengths_ko ?? '',
      tips_ko: parsed.tips_ko ?? '',
    };

    return NextResponse.json({ result }, { status: 200 });
  } catch (err) {
    console.error('[shortAnswerEval] error:', err);
    return NextResponse.json(
      { error: '짧은 답안 평가 중 오류가 발생했습니다.' },
      { status: 500 },
    );
  }
}
