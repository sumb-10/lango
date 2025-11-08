// app/api/feedback/macro/route.ts
import { createClient } from '@/lib/supabase/server';
import { invokeLLM } from '@/lib/openai';
import { SYSTEM_PROMPTS, createEssayEvaluationPrompt } from '@/lib/prompts';
import { parseJSONFromLLM, calculateCreditCost } from '@/lib/utils';
import { NextRequest, NextResponse } from 'next/server';

type EvaluationCategory = '문법' | '어휘' | '일관성' | '과제 달성';

interface EvaluationItem {
  category: EvaluationCategory;
  score: number;      // 0-10
  feedback: string;
}

interface EssayEvaluationResult {
  evaluation: EvaluationItem[];
  overall_feedback: string;     // 시스템 프롬프트에서 overall_feedback 키 사용
  suggestions?: string[];
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { topic, essay } = await request.json();

    if (!topic || !essay) {
      return NextResponse.json(
        { error: 'topic과 essay는 필수입니다.' },
        { status: 400 },
      );
    }

    // 🔹 invokeLLM은 문자열을 반환한다고 가정
    const llmOutput = await invokeLLM({
      messages: [
        // 1) 시스템 프롬프트: 평가 규칙/형식
        { role: 'system', content: SYSTEM_PROMPTS.ESSAY_EVALUATION },
        // 2) 유저 프롬프트: 실제 주제 + 작문 내용
        { role: 'user', content: createEssayEvaluationPrompt(topic, essay) },
      ],
    });

    // 🔹 LLM 응답(string)을 JSON으로 파싱
    const parsed = parseJSONFromLLM<EssayEvaluationResult>(llmOutput);

    // 최소한의 검증
    if (!parsed || !Array.isArray(parsed.evaluation)) {
      console.error('Invalid evaluation format from LLM:', parsed);
      return NextResponse.json(
        { error: 'LLM 평가 결과 형식이 올바르지 않습니다.' },
        { status: 500 },
      );
    }

    // 크레딧 차감 (Macro 평가: 50 크레딧)
    await supabase.rpc('deduct_credit', {
      p_user_id: user.id,
      p_amount: calculateCreditCost('MACRO_FEEDBACK'),
      p_description: 'Macro 작문 평가',
    });

    // 🔹 프론트에서 그대로 사용할 수 있도록 그대로 반환
    return NextResponse.json(parsed);
  } catch (error: any) {
    console.error('Macro evaluation error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 },
    );
  }
}
