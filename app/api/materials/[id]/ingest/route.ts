// app/api/materials/[id]/ingest/route.ts

export const runtime = 'nodejs';

import { createClient } from '@/lib/supabase/server'
import { createEmbedding } from '@/lib/openai'
import { NextResponse } from 'next/server'

// ──────────────────────────────────────────────────────────
// Path utils (Edge/Node 공용, node:path 미사용)
// ──────────────────────────────────────────────────────────
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
  const base = basenamePosix(p)            // e.g., "1762061711647-eng_text.txt"
  const dot = base.lastIndexOf('.')
  return dot > 0 ? base.slice(0, dot) : base // e.g., "1762061711647-eng_text"
}

function splitIntoChunks(text: string, chunkSize = 800, overlap = 100): string[] {
  const chunks: string[] = []
  let start = 0
  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length)
    chunks.push(text.slice(start, end))
    start = Math.max(end - overlap, end)
  }
  return chunks
}

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  let materialId: string | null = null
  const supabase = await createClient()

  try {
    const { id } = await ctx.params
    materialId = id

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // 1) material
    const { data: material, error: materialError, status: materialStatus } = await supabase
      .from('materials')
      .select('*')
      .eq('id', materialId)
      .eq('user_id', user.id)
      .single()
    if (materialError) {
      console.error('[INGEST] material query error', { materialError, materialStatus, materialId, userId: user.id })
    }
    if (!material) {
      return NextResponse.json({ error: 'Material not found' }, { status: 404 })
    }

    // 2) 상태
    await supabase.from('materials').update({ status: 'processing' }).eq('id', materialId)

    // 3) 경로 정규화
    const bucket = 'materials'
    const rawPath: string = material.file_path // 예: "materials/{uid}/foo.txt" 또는 "{uid}/foo.txt"
    const normalizedPath = rawPath.startsWith(`${bucket}/`) ? rawPath.slice(bucket.length + 1) : rawPath

    const dir  = dirnamePosix(normalizedPath)           // 기대: "{uid}"
    const stem = stemWithoutExt(normalizedPath)         // 기대: "{uid}/1762061711647-eng_text" 의 '파일명 부분'만 필요
    const stemOnly = basenamePosix(stem)                // "1762061711647-eng_text"
    const extractedFileName = `${stemOnly}.md`          // "1762061711647-eng_text.md"
    const extractedPath = dir ? `${dir}/${extractedFileName}` : extractedFileName

    console.log('[INGEST] paths', { rawPath, normalizedPath, dir, stemOnly, extractedFileName, extractedPath })

    // 4) 다운로드 (정규화 경로로!)
    const { data: fileData, error: downloadError } = await supabase
      .storage.from(bucket)
      .download(normalizedPath)
    if (downloadError || !fileData) {
      console.error('[INGEST] download failed', { downloadError, bucket, normalizedPath })
      await supabase.from('materials').update({ status: 'failed' }).eq('id', materialId)
      return NextResponse.json({ error: 'Failed to download file' }, { status: 500 })
    }

    // 5) 텍스트 추출
    const text = await fileData.text()
    const bodyText = text && text.length > 0 ? text : '# (empty)\n' // 빈 파일 정책 방지

    // 6) 업로드 (버킷 상대 경로 + upsert=true → UPDATE 정책 필요)
    const { error: upErr } = await supabase
      .storage.from(bucket)
      .upload(extractedPath, new Blob([bodyText], { type: 'text/markdown' }), { upsert: true })
    if (upErr) {
      console.error('[INGEST] upload extracted failed', { upErrMessage: upErr.message, upErr, bucket, extractedPath })
      await supabase.from('materials').update({ status: 'failed' }).eq('id', materialId)
      return NextResponse.json({ error: 'Failed to upload extracted content' }, { status: 403 })
    }

    // 7) 청크 + 임베딩
    const chunks = splitIntoChunks(text)
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i]
      const embedding = await createEmbedding(chunk)
      const { error: insErr } = await supabase.from('chunks').insert({
        material_id: materialId,
        content: chunk,
        embedding: JSON.stringify(embedding),
        chunk_index: i,
      })
      if (insErr) {
        console.error('[INGEST] insert chunk failed', { i, insErr })
        await supabase.from('materials').update({ status: 'failed' }).eq('id', materialId)
        return NextResponse.json({ error: 'Failed to store chunk' }, { status: 500 })
      }
    }

    // 8) 완료
    await supabase.from('materials').update({ status: 'ingested' }).eq('id', materialId)
    return NextResponse.json({ success: true, chunksCount: chunks.length })

  } catch (error) {
    console.error('Ingest error:', error)
    if (materialId) await supabase.from('materials').update({ status: 'failed' }).eq('id', materialId)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
