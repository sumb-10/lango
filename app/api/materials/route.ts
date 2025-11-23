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

    // currentFolder의 주인 id (루트일 때는 내 id)
    let currentFolder: any = null;
    let currentOwnerId = user.id;
    let isOwner = true;   // 기본값: 루트는 내 워크스페이스라 내가 주인이라고 가정

    // 1) 현재 폴더 정보 (루트면 null)
    if (folderId !== null) {
      const { data, error } = await supabase
        .from('folders')
        .select('*')
        .eq('id', folderId)      // ❗️ user_id 필터 제거
        .single();

      if (error || !data) {
        console.error('Get current folder error:', error);
        return NextResponse.json(
          { error: 'Folder not found' },
          { status: 404 }
        );
      }

      currentFolder = data;
      currentOwnerId = data.user_id;
      isOwner = data.user_id === user.id;
      const isPublic = !!data.is_public;

      // 내가 주인이 아니고, public 도 아니면 접근 불가
      if (!isOwner && !isPublic) {
        return NextResponse.json(
          { error: 'Forbidden: this folder is not public' },
          { status: 403 }
        );
      }
    }

    // 2) 현재 폴더의 하위 폴더들
    const folderQuery = supabase
      .from('folders')
      .select('*')
      .order('name', { ascending: true });

    if (folderId === null) {
      // 루트:
      // - 내가 소유한 루트 폴더
      // - + is_public = true 인 루트 폴더 (admin 포함)
      folderQuery
        .is('parent_id', null)
        .or(`user_id.eq.${user.id},is_public.eq.true`);
    } else {
      // 어떤 폴더 안: 그 폴더 주인의 하위 폴더들
      folderQuery
        .eq('user_id', currentOwnerId)
        .eq('parent_id', folderId);

      // 남의 public 폴더를 보고 있는 경우 → 자식도 public 인 것만
      if (!isOwner) {
        folderQuery.eq('is_public', true);
      }
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
      .order('created_at', { ascending: false });

    if (folderId === null) {
      // 루트: 내 워크스페이스 → 내 파일만 + folder_id=null
      materialsQuery
        .eq('user_id', user.id)
        .is('folder_id', null);
    } else {
      // 폴더 안: 그 폴더 주인의 파일들
      materialsQuery
        .eq('folder_id', folderId)
        .eq('user_id', currentOwnerId);
      // is_public 여부는 폴더에서 이미 체크했음.
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
      materials,     // 현재 폴더 안의 파일들
    });
  } catch (error: any) {
    console.error('Get materials error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
