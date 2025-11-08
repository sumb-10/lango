// lib/openai.ts

import OpenAI from 'openai';

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export async function invokeLLM(params: {
  messages: LLMMessage[];
  temperature?: number;
  maxTokens?: number;
  model?: string;
}): Promise<string> {
  const {
    messages,
    temperature = 0.7,
    maxTokens = 2000,
    model = 'gpt-4o-mini',
  } = params;

  try {
    const response = await openai.chat.completions.create({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
    });

    return response.choices[0]?.message?.content || '';
  } catch (error) {
    console.error('OpenAI API Error:', error);
    throw new Error('LLM 호출 중 오류가 발생했습니다.');
  }
}

export async function invokeLLMStreaming(params: {
  messages: LLMMessage[];
  temperature?: number;
  maxTokens?: number;
  model?: string;
}): Promise<ReadableStream> {
  const {
    messages,
    temperature = 0.7,
    maxTokens = 2000,
    model = 'gpt-4o-mini',
  } = params;

  try {
    const stream = await openai.chat.completions.create({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
      stream: true,
    });

    return new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          const content = chunk.choices[0]?.delta?.content || '';
          if (content) {
            controller.enqueue(new TextEncoder().encode(content));
          }
        }
        controller.close();
      },
    });
  } catch (error) {
    console.error('OpenAI Streaming API Error:', error);
    throw new Error('LLM 스트리밍 호출 중 오류가 발생했습니다.');
  }
}

/**
 * ✅ 옛날 코드 호환용 래퍼
 * app/api/chat/route.ts 등에서 쓰는 형태와 맞춰줌
 */
export async function createChatCompletion(
  messages: LLMMessage[],
  options?: {
    temperature?: number;
    maxTokens?: number;
    model?: string;
  }
): Promise<string> {
  return invokeLLM({
    messages,
    temperature: options?.temperature,
    maxTokens: options?.maxTokens,
    model: options?.model,
  });
}

// 단일 텍스트 입력을 임베딩 벡터로 바꾸는 헬퍼
export async function createEmbedding(
  input: string,
  options?: {
    model?: string;
  }
): Promise<number[]> {
  const model = options?.model ?? 'text-embedding-3-small';

  try {
    const response = await openai.embeddings.create({
      model,
      input,
    });

    // 첫 번째 결과의 embedding 벡터만 사용
    const embedding = response.data[0]?.embedding;
    if (!embedding) {
      throw new Error('Empty embedding from OpenAI');
    }

    return embedding;
  } catch (error) {
    console.error('OpenAI Embedding API Error:', error);
    throw new Error('임베딩 생성 중 오류가 발생했습니다.');
  }
}
