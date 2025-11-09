// app/api/auth/session/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()

  // 1) 현재 로그인한 유저 (auth.users)
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    // 로그인 안 되어 있으면 null 내려주기
    return NextResponse.json({ user: null, profile: null })
  }

  // 2) 프로필 (public.users)
  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('id, email, name, cefr_level, credit_balance, subscription_status')
    .eq('id', user.id)
    .single()

  if (profileError) {
    console.error('profileError', profileError)
  }

  return NextResponse.json({
    user,
    profile: profile ?? null,
  })
}
