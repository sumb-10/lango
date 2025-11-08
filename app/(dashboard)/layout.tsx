// app/(dashboard)/layout.tsx

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    // ✅ 여기서는 전체 배경/높이만 관리
    <div className="min-h-screen bg-background">
      {children}
    </div>
  );
}
