// app/api/materials/build-lesson/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { LessonJson } from '@/types/lesson';
import {
  buildLessonForMaterial,
  LessonChunkConfig,
} from '@/lib/lesson/buildLessonForMaterial';

type CEFRLevel = 'B2' | 'C1' | 'C2';

type BuildLessonRequest = {
  materialId: number;
  title?: string;
  level?: CEFRLevel;
  chunks: LessonChunkConfig[];
};

const DEFAULT_LEVEL: CEFRLevel = 'C1';

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as BuildLessonRequest;
    const { materialId, title, level, chunks } = body;

    if (!materialId || !Array.isArray(chunks) || chunks.length === 0) {
      return NextResponse.json(
        { error: 'materialId와 chunks 설정이 필요합니다.' },
        { status: 400 },
      );
    }

    const supabase = await createClient();

    // 1) 인증 확인
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 },
      );
    }

    // 2) materials 레코드 조회
    const { data: material, error: materialError } = await supabase
      .from('materials')
      .select('*')
      .eq('id', materialId)
      .eq('user_id', user.id)
      .single();

    if (materialError || !material) {
      console.error('[build-lesson] material fetch error:', materialError);
      return NextResponse.json(
        { error: '해당 material을 찾을 수 없거나 접근 권한이 없습니다.' },
        { status: 404 },
      );
    }

    // 3) 공용 빌더 함수 호출
    const { lesson, updatedMaterial } = await buildLessonForMaterial({
      supabase,
      userId: user.id,
      material,
      level: level ?? DEFAULT_LEVEL,
      chunks,
      overrideTitle: title,
    });

    return NextResponse.json(
      {
        material: updatedMaterial,
        lesson,
      },
      { status: 200 },
    );
  } catch (err) {
    console.error('[build-lesson] unexpected error:', err);
    return NextResponse.json(
      { error: 'build-lesson 처리 중 알 수 없는 오류가 발생했습니다.' },
      { status: 500 },
    );
  }
}
