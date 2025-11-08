// app/api/feedback/topic/route.ts

import { createClient } from '@/lib/supabase/server';
import { invokeLLM } from '@/lib/openai';
import { SYSTEM_PROMPTS, createEssayTopicGenerationPrompt } from '@/lib/prompts';
import { parseJSONFromLLM } from '@/lib/utils';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 프론트에서 { count, userInput }을 보낸다고 가정 (count만 보내도 동작)
    const body = await request.json();
    const count: number = body.count ?? 3;
    const userInput: string | undefined = body.userInput;

    // 🔹 user 메시지 만들기
    const userPrompt = userInput
      ? createEssayTopicGenerationPrompt(userInput)
      : `언어 학습자를 위한 흥미로운 작문 주제 ${count}개를 생성해주세요.`;

    // 🔹 invokeLLM은 문자열을 반환한다고 가정
    const llmOutput = await invokeLLM({
      messages: [
        // 시스템 프롬프트는 SYSTEM_PROMPTS 사용
        { role: 'system', content: SYSTEM_PROMPTS.ESSAY_TOPIC_GENERATION },
        { role: 'user', content: userPrompt },
      ],
    });

    // 🔹 여기서 더 이상 response.choices[0] 이런 거 없음
    const topics = parseJSONFromLLM(llmOutput);

    // 크레딧 차감 (주제 생성: 10 크레딧)
    await supabase.rpc('deduct_credit', {
      p_user_id: user.id,
      p_amount: 10,
      p_description: '작문 주제 생성',
    });

    return NextResponse.json({ topics });
  } catch (error: any) {
    console.error('Topic generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
