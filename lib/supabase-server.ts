// lib/supabase-server.ts
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

export async function createClient() {
  // ✅ 당신 프로젝트 타입에 맞춰 await 사용
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        // 요청 쿠키 읽기
        get: (name) => cookieStore.get(name)?.value,

        // 응답에 쿠키 쓰기/갱신
        // (Next 버전에 따라 set 시그니처가 조금 다를 수 있어 두 가지 모두 호환되는 형태로 작성)
        set: (name, value, options) => {
          // 형태 A: set(name, value, options)
          try {
            // @ts-ignore - 일부 버전에선 이 시그니처가 유효
            cookieStore.set(name, value, options)
          } catch {
            // 형태 B: set({ name, value, ...options })
            cookieStore.set({ name, value, ...options })
          }
        },

        // 쿠키 삭제
        remove: (name, options) => {
          // delete(name) 시그니처가 없는 버전 대비: 만료시켜 제거
          cookieStore.set({ name, value: '', ...options, maxAge: 0 })
        },
      },
    }
  )
}