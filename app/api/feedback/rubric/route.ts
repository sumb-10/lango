// app/api/feedback/rubric/route.ts

import { createClient } from '@/lib/supabase/server'
import { createChatCompletion } from '@/lib/openai'
import { SYSTEM_PROMPTS, createRubricPrompt } from '@/lib/prompts'
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

    const { text, level, feedbackId } = await request.json()

    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 })
    }

    // Generate rubric evaluation using LLM
    const evaluationText = await createChatCompletion(
      [
        { role: 'system', content: SYSTEM_PROMPTS.rubricEvaluator },
        { role: 'user', content: createRubricPrompt(text, level) },
      ],
      { temperature: 0.1 } // Low temperature for consistency
    )

    // Parse JSON response
    let evaluation
    try {
      evaluation = JSON.parse(evaluationText || '{}')
    } catch {
      // If parsing fails, create a structured response
      evaluation = {
        accuracy: { score: 0, comment: evaluationText },
        coherence: { score: 0, comment: '' },
        range: { score: 0, comment: '' },
        appropriateness: { score: 0, comment: '' },
      }
    }

    // Calculate total score
    const totalScore =
      (evaluation.accuracy?.score || 0) +
      (evaluation.coherence?.score || 0) +
      (evaluation.range?.score || 0) +
      (evaluation.appropriateness?.score || 0)

    // Store evaluation in database
    const { data: rubricRecord, error: dbError } = await supabase
      .from('rubric_evaluations')
      .insert({
        user_id: user.id,
        feedback_id: feedbackId || null,
        dimensions: evaluation,
        total_score: totalScore,
        comments: evaluationText,
      })
      .select()
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      return NextResponse.json({ error: 'Failed to store evaluation' }, { status: 500 })
    }

    return NextResponse.json({
      evaluation,
      totalScore,
      evaluationId: rubricRecord.id,
    })
  } catch (error) {
    console.error('Rubric evaluation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
