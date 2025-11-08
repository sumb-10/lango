//app/(dashboard)/learning/[id]/page.tsx

import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import LearningView from '@/components/LearningView';
import { Header } from "@/components/Header";

interface PageParams {
  id: string;
}

interface Props {
  params: Promise<PageParams>; // ✅ Next.js 15: params는 Promise
}

export default async function LearningPage({ params }: Props) {
  // ✅ 여기서 한 번만 await 해서 id 추출
  const { id } = await params;

  const supabase = await createClient();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // 교재 조회
  const { data: material } = await supabase
    .from('materials')
    .select('*')
    .eq('id', id)              // ✅ params.id 대신 id 사용
    .eq('user_id', user.id)
    .single();

  if (!material) {
    notFound();
  }

  // 학습지 조회
  const { data: worksheet } = await supabase
    .from('worksheets')
    .select('*')
    .eq('material_id', id)     // ✅ 여기도 동일
    .single();

  // 청크 조회
  const { data: chunks } = await supabase
    .from('chunks')
    .select('*')
    .eq('material_id', id)     // ✅ 여기도 동일
    .order('chunk_index', { ascending: true });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* ✅ 상단 풀폭 헤더 */}
      <Header variant="learning" />

      {/* ✅ 본문 영역 */}
      <main className="flex-1 px-4 md:px-8 py-6 md:py-8">
        <div className="max-w-[1440px] mx-auto h-full">
          <LearningView
            material={material}
            worksheet={worksheet}
            chunks={chunks || []}
          />
        </div>
      </main>
    </div>
  );
}
