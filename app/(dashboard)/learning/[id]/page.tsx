// app/(dashboard)/learning/[id]/page.tsx

import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import LearningView from "@/components/LearningView";
import { Header } from "@/components/Header";
import type { LessonJsonV1 } from "@/.types/store_material";

interface PageParams {
  id: string;
}

interface Props {
  params: Promise<PageParams>; // 네 스타일 유지
}

export default async function LearningPage({ params }: Props) {
  // ✅ Next.js 15 스타일: params가 Promise라고 가정
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // 그냥 null 리턴보단 redirect가 좀 더 명확
    redirect("/");
  }

  // 1) 교재 조회
  const {
    data: material,
    error: materialError,
  } = await supabase
    .from("materials")
    .select("*")
    .eq("id", Number(id)) // id가 SERIAL이면 number로
    .eq("user_id", user.id)
    .single();

  if (!material) {
    notFound();
  }

  // 2) 학습지 조회
  const {
    data: worksheet,
    error: worksheetError,
  } = await supabase
    .from("worksheets")
    .select("*")
    .eq("material_id", material.id)
    .eq("user_id", user.id)
    .single();

  // 3) 청크 조회 (스토어 lesson-json이면 chunks가 없을 수도 있음)
  const {
    data: chunks = [],
    error: chunksError,
  } = await supabase
    .from("chunks")
    .select("*")
    .eq("material_id", material.id)
    .order("chunk_index", { ascending: true })

  // 4) lesson-json-v1 인 경우: Storage에서 JSON 다운 + 파싱
  let lessonJson: LessonJsonV1 | null = null;

  if (material.source === "store" && material.file_type === "lesson-json-v1") {

    // ✅ 버킷 이름 확인
    const { data: file, error: downloadError } = await supabase.storage
      .from("store_materials") // store_materials 버킷에서 다운
      .download(material.file_url);


    if (file && !downloadError) {
      const text = await file.text();

      try {
        lessonJson = JSON.parse(text) as LessonJsonV1;
      } catch (e) {
        console.error("[LearningPage] JSON parse error:", e);
      }
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header variant="learning" />

      <main className="flex-1 px-4 md:px-8 py-6 md:py-8">
        <div className="max-w-[1440px] mx-auto h-full">
          <LearningView
            material={material}
            worksheet={worksheet}
            chunks={chunks || []}
            lessonJson={lessonJson} // 👈 여기서 클라이언트로 넘김
          />
        </div>
      </main>
    </div>
  );
}
