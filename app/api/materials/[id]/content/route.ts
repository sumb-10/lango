// app/api/materials/[id]/content/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs' // node:path 미사용이지만 서버 런타임 고정(선호 시 제거 가능)

type MaterialRow = {
  id: string
  user_id: string
  title: string | null
  file_type: 'txt' | 'pdf' | 'epub'
  file_path: string              // 버킷 상대 경로: "{uid}/foo.txt"
  status: 'uploaded' | 'processing' | 'ingested' | 'failed'
}

const BUCKET = 'materials'

// ── POSIX 경로 유틸 (node:path 미사용)
function dirnamePosix(p: string): string {
  const idx = p.lastIndexOf('/')
  if (idx <= 0) return ''
  return p.slice(0, idx)
}
function basenamePosix(p: string): string {
  const idx = p.lastIndexOf('/')
  return idx >= 0 ? p.slice(idx + 1) : p
}
function stemWithoutExt(p: string): string {
  const base = basenamePosix(p)
  const dot = base.lastIndexOf('.')
  return dot > 0 ? base.slice(0, dot) : base
}

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }   // ⬅️ params는 Promise!
) {
  const supabase = await createClient()

  // 1) params 언랩
  const { id } = await ctx.params

  // 2) 인증
  const { data: { user }, error: userErr } = await supabase.auth.getUser()
  if (userErr || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 3) material 메타
  const { data: material, error: mErr } = await supabase
    .from('materials')
    .select('id,user_id,title,file_type,file_path,status')
    .eq('id', id)
    .single<MaterialRow>()

  if (mErr || !material) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  if (material.user_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // 4) 대상 오브젝트 경로 결정
  let objectPath = material.file_path
  let format: 'markdown' | 'text' = 'text'

  if (material.file_type === 'txt') {
    // txt는 원본을 그대로 읽음
    format = 'text'
  } else {
    // pdf/epub → ingest 완료 후 추출물 탐색
    if (material.status !== 'ingested') {
      return NextResponse.json({ error: 'Material not ready' }, { status: 409 })
    }

    const dir = dirnamePosix(material.file_path)     // "{uid}"
    const stem = stemWithoutExt(material.file_path)  // "{uid}/1762061711647-eng_text"
    const stemOnly = basenamePosix(stem)             // "1762061711647-eng_text"

    // 우선순위: stem.md → stem.txt → extracted.md → extracted.txt
    const candidates = [
      `${stemOnly}.md`,
      `${stemOnly}.txt`,
      'extracted.md',
      'extracted.txt',
    ] as const

    // 디렉터리 리스트
    const listPrefix = dir || ''   // root일 경우 빈 문자열
    const { data: list, error: listErr } = await supabase.storage.from(BUCKET).list(listPrefix)
    if (listErr) {
      return NextResponse.json({ error: 'Storage list failed' }, { status: 500 })
    }

    const names = new Set((list ?? []).map(f => f.name))
    const picked = candidates.find(c => names.has(c)) || null
    if (!picked) {
      return NextResponse.json({ error: 'Extracted content not found' }, { status: 404 })
    }

    objectPath = dir ? `${dir}/${picked}` : picked
    format = picked.endsWith('.md') ? 'markdown' : 'text'
  }

  // 5) Signed URL 생성 후 서버에서 fetch
  const { data: signed, error: signErr } = await supabase
    .storage.from(BUCKET)
    .createSignedUrl(objectPath, 60)
  if (signErr || !signed?.signedUrl) {
    return NextResponse.json({ error: 'Signing failed' }, { status: 500 })
  }

  const fileRes = await fetch(signed.signedUrl)
  if (!fileRes.ok) {
    return NextResponse.json({ error: 'Fetch content failed' }, { status: 502 })
  }
  const content = await fileRes.text()

  return NextResponse.json({
    material: { id: material.id, title: material.title },
    format,
    content,
  })
}
