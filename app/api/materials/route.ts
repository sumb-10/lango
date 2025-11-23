// app/api/materials/route.ts

import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ?folderId= 쿼리 파라미터 읽기 (없으면 루트)
    const searchParams = request.nextUrl.searchParams;
    const folderIdParam = searchParams.get('folderId');
    const folderId =
      folderIdParam !== null && folderIdParam !== ''
        ? Number(folderIdParam)
        : null;

    if (folderIdParam && Number.isNaN(folderId)) {
      return NextResponse.json(
        { error: 'Invalid folderId' },
        { status: 400 }
      );
    }

    // 1) 현재 폴더 정보 (루트면 null)
    let currentFolder = null;
    if (folderId !== null) {
      const { data, error } = await supabase
        .from('folders')
        .select('*')
        .eq('user_id', user.id)
        .eq('id', folderId)
        .single();

      if (error) {
        console.error('Get current folder error:', error);
        return NextResponse.json(
          { error: 'Failed to load current folder' },
          { status: 500 }
        );
      }
      currentFolder = data;
    }

    // 2) 현재 폴더의 하위 폴더들
    const folderQuery = supabase
      .from('folders')
      .select('*')
      .eq('user_id', user.id)
      .order('name', { ascending: true });

    if (folderId === null) {
      folderQuery.is('parent_id', null); // 루트 폴더들
    } else {
      folderQuery.eq('parent_id', folderId);
    }

    const { data: folders, error: foldersError } = await folderQuery;

    if (foldersError) {
      console.error('Get folders error:', foldersError);
      return NextResponse.json(
        { error: 'Failed to load folders' },
        { status: 500 }
      );
    }

    // 3) 현재 폴더에 속한 파일(materials)
    const materialsQuery = supabase
      .from('materials')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (folderId === null) {
      materialsQuery.is('folder_id', null); // 루트에 바로 있는 파일들
    } else {
      materialsQuery.eq('folder_id', folderId);
    }

    const { data: materials, error: materialsError } = await materialsQuery;

    if (materialsError) {
      console.error('Get materials error:', materialsError);
      return NextResponse.json(
        { error: 'Failed to load materials' },
        { status: 500 }
      );
    }

    // ✅ 응답 형태: 기존 materials 유지 + 폴더 정보 추가
    return NextResponse.json({
      currentFolder, // null | folders row
      folders,       // 하위 폴더 목록
      materials,     // 현재 폴더 안의 파일들 (기존 대시보드가 쓰는 필드)
    });
  } catch (error: any) {
    console.error('Get materials error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
