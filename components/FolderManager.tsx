'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Folder, FolderPlus, FileText, Trash2, Edit } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface FolderManagerProps {
  folders: any[];
  materials: any[];
  userId: string;
}

export default function FolderManager({ folders: initialFolders, materials, userId }: FolderManagerProps) {
  const [folders, setFolders] = useState(initialFolders);
  const [newFolderName, setNewFolderName] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      toast.error('폴더 이름을 입력하세요');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('folders')
        .insert({
          user_id: userId,
          name: newFolderName,
        })
        .select()
        .single();

      if (error) throw error;

      setFolders([...folders, data]);
      setNewFolderName('');
      setIsCreateDialogOpen(false);
      toast.success('폴더가 생성되었습니다');
      router.refresh();
    } catch (error) {
      console.error('Folder creation error:', error);
      toast.error('폴더 생성 중 오류가 발생했습니다');
    }
  };

  const handleDeleteFolder = async (folderId: number) => {
    if (!confirm('폴더를 삭제하시겠습니까? 폴더 내 교재는 삭제되지 않습니다.')) {
      return;
    }

    try {
      const { error } = await supabase.from('folders').delete().eq('id', folderId);

      if (error) throw error;

      setFolders(folders.filter((f) => f.id !== folderId));
      toast.success('폴더가 삭제되었습니다');
      router.refresh();
    } catch (error) {
      console.error('Folder deletion error:', error);
      toast.error('폴더 삭제 중 오류가 발생했습니다');
    }
  };

  const handleMoveMaterial = async (materialId: number, folderId: number | null) => {
    try {
      const { error } = await supabase
        .from('materials')
        .update({ folder_id: folderId })
        .eq('id', materialId);

      if (error) throw error;

      toast.success('교재가 이동되었습니다');
      router.refresh();
    } catch (error) {
      console.error('Material move error:', error);
      toast.error('교재 이동 중 오류가 발생했습니다');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">폴더</h2>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <FolderPlus className="mr-2 h-4 w-4" />
              새 폴더
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>새 폴더 만들기</DialogTitle>
              <DialogDescription>폴더 이름을 입력하세요</DialogDescription>
            </DialogHeader>
            <Input
              placeholder="폴더 이름"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                취소
              </Button>
              <Button onClick={handleCreateFolder}>생성</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {folders.map((folder) => {
          const folderMaterials = materials.filter((m) => m.folder_id === folder.id);

          return (
            <Card key={folder.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <Folder className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">{folder.name}</CardTitle>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteFolder(folder.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
                <CardDescription>{folderMaterials.length}개 교재</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {folderMaterials.slice(0, 3).map((material) => (
                    <div
                      key={material.id}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-accent"
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span className="text-sm truncate">{material.title}</span>
                      </div>
                      {material.status === 'ready' && (
                        <Link href={`/learning/${material.id}`}>
                          <Button size="sm" variant="ghost">
                            학습
                          </Button>
                        </Link>
                      )}
                    </div>
                  ))}
                  {folderMaterials.length > 3 && (
                    <p className="text-sm text-muted-foreground text-center">
                      +{folderMaterials.length - 3}개 더보기
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
