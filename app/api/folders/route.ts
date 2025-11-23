// app/api/folders/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const name = (body?.name as string | undefined)?.trim();
    const parentId = body?.parentId as number | null | undefined;
    const description = (body?.description as string | undefined)?.trim() ?? null;

    if (!name) {
      return NextResponse.json(
        { error: "폴더 이름이 필요합니다." },
        { status: 400 }
      );
    }

    const { data: folder, error } = await supabase
      .from("folders")
      .insert({
        user_id: user.id,
        name,
        description,
        parent_id: parentId ?? null,
      })
      .select("*")
      .single();

    if (error) {
      console.error("Create folder error:", error);
      return NextResponse.json(
        { error: "폴더 생성에 실패했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json({ folder }, { status: 201 });
  } catch (error: any) {
    console.error("Create folder error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
