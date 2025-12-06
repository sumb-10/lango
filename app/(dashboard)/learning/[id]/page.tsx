// app/(dashboard)/learning/[id]/page.tsx

import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import LearningView from "@/components/LearningView";
import { Header } from "@/components/Header";
import type { LessonJson } from "@/types/lesson";

interface PageParams {
  id: string;
}

interface Props {
  params: Promise<PageParams>;
}

export default async function LearningPage({ params }: Props) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  const {
    data: material,
    error: materialError,
  } = await supabase
    .from("materials")
    .select("*")
    .eq("id", Number(id))
    .eq("user_id", user.id)
    .single();

  if (materialError || !material) {
    notFound();
  }

  let lessonJson: LessonJson | null = null;

  if (material.file_type === "lesson_json" && material.file_url) {
    try {
      const res = await fetch(material.file_url);
      if (!res.ok) {
        throw new Error(`lesson_json fetch 실패: status ${res.status}`);
      }
      const json = await res.json();
      lessonJson = json as LessonJson;
    } catch (e) {
      console.error("[LearningPage] lesson_json parse error:", e);
    }
  }

  return (
    // 🔹 바깥을 그냥 전체 배경 + 수직 플렉스로만 유지
    <div className="min-h-screen flex flex-col bg-background">
      {/*<Header variant="learning" />*/}

      {/* 🔹 max-w / mx-auto 제거하고 전체 폭 사용  */}
      <main className="flex-1 flex">
        <div className="flex-1 h-full">
          <LearningView material={material} lessonJson={lessonJson} />
        </div>
      </main>
    </div>
  );
}
