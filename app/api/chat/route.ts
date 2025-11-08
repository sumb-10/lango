// app/api/chat/route.ts

import { createClient } from '@/lib/supabase/server'
import { createChatCompletion } from '@/lib/openai'
import { SYSTEM_PROMPTS, createExplanationPrompt } from '@/lib/prompts'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { selectedText, question, context } = await request.json()

    if (!question) {
      return NextResponse.json({ error: 'Question is required' }, { status: 400 })
    }

    // Generate response using LLM
    const response = await createChatCompletion(
      [
        { role: 'system', content: SYSTEM_PROMPTS.QUESTION },
        { role: 'user', content: createExplanationPrompt(selectedText || '', question, context) },
      ],
      { temperature: 0.7 }
    )

    return NextResponse.json({ response })
  } catch (error) {
    console.error('Chat error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
