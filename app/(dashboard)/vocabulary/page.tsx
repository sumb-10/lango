'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Plus, Search } from 'lucide-react';
import { toast } from 'sonner';
import { Header } from "@/components/Header";

export default function VocabularyPage() {
  const [vocabulary, setVocabulary] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchVocabulary();
  }, []);

  const fetchVocabulary = async () => {
    try {
      const res = await fetch('/api/vocabulary');
      if (!res.ok) throw new Error('Failed to fetch vocabulary');
      const data = await res.json();
      setVocabulary(data.vocabulary || []);
    } catch (error) {
      console.error(error);
      toast.error('단어장을 불러오는 중 오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  };

  const filteredVocabulary = vocabulary.filter((item) =>
    item.word.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* ✅ 상단 풀폭 헤더 */}
      <Header variant="learning" />
      <main className="flex-1 px-4 md:px-8 py-6 md:py-8">
        <div className="max-w-[1440px] mx-auto h-full">
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold mb-2">단어장</h1>
                <p className="text-muted-foreground">
                  저장된 단어: {vocabulary.length}개
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="단어 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredVocabulary.map((item) => (
                <Card key={item.id}>
                  <CardHeader>
                    <CardTitle>{item.word}</CardTitle>
                    <CardDescription>
                      복습 횟수: {item.review_count}회
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm mb-2">{item.definition}</p>
                    {item.example_sentence && (
                      <p className="text-sm text-muted-foreground italic">
                        "{item.example_sentence}"
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredVocabulary.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  {searchTerm ? '검색 결과가 없습니다' : '저장된 단어가 없습니다'}
                </p>
              </div>
            )}
          </div>
       </div>
      </main>
    </div>
  );
}
