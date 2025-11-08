import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { FolderPlus, Upload, Folder, FileText } from 'lucide-react';
import FolderManager from '@/components/FolderManager';

export default async function MaterialsPage() {
  const supabase = await createClient();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // 폴더 목록 조회
  const { data: folders } = await supabase
    .from('folders')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  // 교재 목록 조회 (폴더별)
  const { data: materials } = await supabase
    .from('materials')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  // 폴더 없는 교재
  const materialsWithoutFolder = materials?.filter((m) => !m.folder_id) || [];

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2">내 교재</h1>
          <p className="text-muted-foreground">교재를 업로드하고 폴더로 관리하세요</p>
        </div>
        <div className="flex gap-2">
          <Link href="/materials/upload">
            <Button>
              <Upload className="mr-2 h-4 w-4" />
              교재 업로드
            </Button>
          </Link>
        </div>
      </div>

      <FolderManager
        folders={folders || []}
        materials={materials || []}
        userId={user.id}
      />

      {/* 폴더 없는 교재 */}
      {materialsWithoutFolder.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              폴더 없는 교재
            </CardTitle>
            <CardDescription>폴더로 이동하여 정리하세요</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {materialsWithoutFolder.map((material) => (
                <Card key={material.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg">{material.title}</CardTitle>
                    <CardDescription>{material.author || '작자 미상'}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground capitalize">
                      {material.status}
                    </span>
                    {material.status === 'ready' && (
                      <Link href={`/learning/${material.id}`}>
                        <Button size="sm">학습하기</Button>
                      </Link>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
