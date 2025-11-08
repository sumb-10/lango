// app/api/feedback/micro/route.ts
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { invokeLLM } from '@/lib/openai';
import { SYSTEM_PROMPTS, createInterpretationPrompt, createGrammarPrompt, createVocabularyPrompt, createQuestionPrompt } from '@/lib/prompts';
import { calculateCreditCost } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // 인증 확인
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 });
    }

    // 요청 데이터 파싱
    const body = await request.json();
    const { feedbackType, inputText, context, worksheetId } = body;

    if (!feedbackType || !inputText) {
      return NextResponse.json({ error: '피드백 타입과 입력 텍스트는 필수입니다' }, { status: 400 });
    }

    // 크레딧 확인
    const { data: userData } = await supabase
      .from('users')
      .select('credit_balance')
      .eq('id', user.id)
      .single();

    const creditCost = calculateCreditCost('MICRO_FEEDBACK');

    if (!userData || userData.credit_balance < creditCost) {
      return NextResponse.json({ error: '크레딧이 부족합니다' }, { status: 402 });
    }

    // 프롬프트 생성
    let systemPrompt: string;
    let userPrompt: string;

    switch (feedbackType) {
      case 'interpretation':
        systemPrompt = SYSTEM_PROMPTS.INTERPRETATION;
        userPrompt = createInterpretationPrompt(inputText);
        break;
      case 'grammar':
        systemPrompt = SYSTEM_PROMPTS.GRAMMAR;
        userPrompt = createGrammarPrompt(inputText);
        break;
      case 'vocabulary':
        systemPrompt = SYSTEM_PROMPTS.VOCABULARY;
        userPrompt = createVocabularyPrompt(inputText, context || '');
        break;
      case 'question':
        systemPrompt = SYSTEM_PROMPTS.QUESTION;
        userPrompt = createQuestionPrompt(inputText, context || '');
        break;
      default:
        return NextResponse.json({ error: '지원하지 않는 피드백 타입입니다' }, { status: 400 });
    }

    // LLM 호출
    const outputText = await invokeLLM({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    });

    // 피드백 저장
    const { data: feedback, error: feedbackError } = await supabase
      .from('feedback')
      .insert({
        user_id: user.id,
        worksheet_id: worksheetId || null,
        feedback_type: feedbackType,
        input_text: inputText,
        output_text: outputText,
        metadata: { context },
      })
      .select()
      .single();

    if (feedbackError) {
      console.error('Feedback creation error:', feedbackError);
      return NextResponse.json({ error: '피드백 저장 중 오류가 발생했습니다' }, { status: 500 });
    }

    // 크레딧 차감
    await supabase
      .from('users')
      .update({ credit_balance: userData.credit_balance - creditCost })
      .eq('id', user.id);

    await supabase.from('credit_transactions').insert({
      user_id: user.id,
      amount: -creditCost,
      transaction_type: 'usage',
      description: `${feedbackType} 피드백`,
    });

    return NextResponse.json({ feedback }, { status: 201 });
  } catch (error) {
    console.error('Micro feedback error:', error);
    return NextResponse.json({ error: '피드백 생성 중 오류가 발생했습니다' }, { status: 500 });
  }
}
