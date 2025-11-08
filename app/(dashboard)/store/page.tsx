// app/(dashboard)/store/page.tsx
import { Header } from "@/components/Header";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import StorePageClient from "@/components/StoreViewer";

export default async function StorePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  // 필요한 필드만 select + is_published 필터
  const { data: storeMaterials, error } = await supabase
    .from("store_materials")
    .select(
      "id, title, author, file_type, file_url, file_size, cefr_level, price, metadata"
    )
    .eq("is_published", true) // is_published 컬럼을 썼다면
    .order("created_at", { ascending: false });

  if (error) {
    console.error("store_materials fetch error:", error);
  }

  return (
    <div className="min-h-screen flex bg-bg">
      <div className="flex-1 flex flex-col">
        <Header variant="dashboard" />
        <main className="flex-1 px-4 md:px-8 py-6 overflow-auto">
          <div className="container">
            <StorePageClient materials={storeMaterials ?? []} />
          </div>
        </main>
      </div>
    </div>
  );
}
