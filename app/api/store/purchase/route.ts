// app/api/store/purchase/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }

  const body = await req.json().catch(() => null) as { storeMaterialId?: number };

  if (!body?.storeMaterialId) {
    return NextResponse.json(
      { error: "storeMaterialId 가 필요합니다." },
      { status: 400 }
    );
  }

  const storeMaterialId = body.storeMaterialId;

  // 1) 스토어 교재 정보 가져오기
  const { data: storeMaterial, error: storeError } = await supabase
    .from("store_materials")
    .select("*")
    .eq("id", storeMaterialId)
    .single();

  if (storeError || !storeMaterial) {
    return NextResponse.json(
      { error: "스토어 교재를 찾을 수 없습니다." },
      { status: 404 }
    );
  }

  // 발행되지 않은 교재는 구매 불가
  if (!storeMaterial.is_published) {
    return NextResponse.json(
      { error: "현재 구매할 수 없는 교재입니다." },
      { status: 403 }
    );
  }

  // 2) 이미 구매했는지 체크 (같은 store_material_id 가진 material 있는지)
  const { data: existing, error: existingError } = await supabase
    .from("materials")
    .select("id")
    .eq("user_id", user.id)
    .eq("store_material_id", storeMaterial.id)
    .maybeSingle();

  if (existingError) {
    // RLS 문제나 예기치 못한 에러
    return NextResponse.json(
      { error: "기존 구매 내역 확인 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }

  if (existing) {
    return NextResponse.json(
      { error: "이미 구매한 교재입니다." },
      { status: 400 }
    );
  }

  // 3) 크레딧 차감 (가격만큼)
  //    - 현재 deduct_credit은 transaction_type = 'usage'로 기록됨
  //      나중에 'purchase'용 별도 RPC를 만들어도 좋음.
  if (storeMaterial.price > 0) {
    const { error: creditError } = await supabase.rpc("deduct_credit", {
      p_user_id: user.id,
      p_amount: storeMaterial.price,
      p_description: `스토어 교재 구매: ${storeMaterial.title}`,
    });

    if (creditError) {
      return NextResponse.json(
        { error: "크레딧 차감에 실패했습니다." },
        { status: 400 }
      );
    }
  }

  // 4) materials 테이블에 "내 교재"로 복사
  const { data: material, error: insertError } = await supabase
    .from("materials")
    .insert({
      user_id: user.id,
      folder_id: null, // 기본 폴더가 있다면 거기 id를 넣어도 됨
      title: storeMaterial.title,
      author: storeMaterial.author,
      file_type: storeMaterial.file_type,
      file_url: storeMaterial.file_url,
      file_size: storeMaterial.file_size,
      cefr_level: storeMaterial.cefr_level,
      status: "ready", // 스토어 교재는 바로 학습 가능 상태로
      metadata: storeMaterial.metadata ?? {},
      source: "store",                    // material_source enum ('user', 'store')
      store_material_id: storeMaterial.id // FK
    })
    .select()
    .single();

  if (insertError || !material) {
    // 이 시점에서는 크레딧이 이미 차감된 상태라
    // 추후에는 roll-back용 RPC(크레딧 복구)를 만드는 것도 고려할 수 있음.
    return NextResponse.json(
      { error: "교재를 내 목록에 추가하는 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }

  // 5) store_purchases에 구매 이력 기록 (실패해도 material 자체는 유지)
  const { error: purchaseError } = await supabase
    .from("store_purchases")
    .insert({
      user_id: user.id,
      store_material_id: storeMaterial.id,
      material_id: material.id,
      price_paid: storeMaterial.price,
      status: "completed",
      metadata: {},
    });

  if (purchaseError) {
    // 로깅용으로만 쓰고, 유저 UX에는 영향 주지 않음
    console.error("store_purchases insert error", purchaseError);
  }

  return NextResponse.json({ material }, { status: 201 });
}
