// components/LearningView.tsx

'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, MessageCircle } from 'lucide-react';
import DocumentViewer from './DocumentViewer';
import SidePanel from './SidePanel';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import type { LessonJsonV1 } from '@/types/store_material';


interface Props {
  material: any;
  worksheet: any;
  chunks: any[];
  lessonJson?: LessonJsonV1 | null;
}

export default function LearningView({ material, worksheet, chunks, lessonJson }: Props) {
  const [currentChunkIndex, setCurrentChunkIndex] = useState(0);
  const [selectedText, setSelectedText] = useState('');
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);

  const isStoreLesson =
    material?.source === 'store' && material?.file_type === 'lesson-json-v1';

  const currentChunk = !isStoreLesson
    ? chunks[currentChunkIndex]
    : null;

  const content = !isStoreLesson
    ? currentChunk?.content ?? ''
    : ''; // lesson 모드에선 content는 안 씀

  const progress =
    !isStoreLesson && chunks.length > 0
      ? Math.round(((currentChunkIndex + 1) / chunks.length) * 100)
      : 0;

  const handlePrevChunk = () => {
    if (isStoreLesson) return;
    setCurrentChunkIndex((prev) => Math.max(0, prev - 1));
  };

  const handleNextChunk = () => {
    if (isStoreLesson) return;
    setCurrentChunkIndex((prev) =>
      Math.min(chunks.length - 1, prev + 1),
    );
  };

  const handleSentenceSelect = (text: string) => {
    setSelectedText(text);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1 px-4 md:px-8 py-6 md:py-8">
        <div className="max-w-[1440px] mx-auto h-full">

          {/* Desktop & Tablet: Two Column Layout */}
          <div className="hidden md:grid md:grid-cols-[1fr_400px] lg:grid-cols-[1fr_480px] gap-6 h-[calc(100vh-180px)]">
            {/* 좌측: 새 디자인 DocumentViewer */}
            <DocumentViewer
              mode={isStoreLesson ? 'lesson' : 'chunk'}      
              lesson={isStoreLesson ? lessonJson : undefined} 
              content={content}
              title={material.title}
              author={material.author}
              cefrLevel={worksheet?.cefr_level ?? lessonJson?.cefrLevel}
              progress={progress}
              onSentenceSelect={handleSentenceSelect}
              currentChunkIndex={isStoreLesson ? 0 : currentChunkIndex}
              totalChunks={isStoreLesson ? 1 : chunks.length}
              onPrevChunk={handlePrevChunk}
              onNextChunk={handleNextChunk}
            />

            {/* 우측: 사이드 패널 */}
            <SidePanel
              materialId={material.id}
              worksheetId={worksheet?.id}
              chunkId={currentChunk?.id}
              selectedText={selectedText}
            />
          </div>

          {/* Mobile: Full Width Document + Floating Button + Sheet */}
          <div className="md:hidden">
            <Card className="h-[calc(100vh-220px)] overflow-hidden">
              <CardContent className="h-full overflow-auto pt-4">
                <DocumentViewer
                  mode={isStoreLesson ? 'lesson' : 'chunk'}
                  lesson={isStoreLesson ? lessonJson : undefined}
                  content={content}
                  title={material.title}
                  author={material.author}
                  cefrLevel={worksheet?.cefr_level ?? lessonJson?.cefrLevel}
                  progress={progress}
                  onSentenceSelect={handleSentenceSelect}
                  onMobileSheetOpen={() => setMobileSheetOpen(true)}
                  currentChunkIndex={isStoreLesson ? 0 : currentChunkIndex}
                  totalChunks={isStoreLesson ? 1 : chunks.length}
                  onPrevChunk={handlePrevChunk}
                  onNextChunk={handleNextChunk}
                />
              </CardContent>
            </Card>

            <Sheet open={mobileSheetOpen} onOpenChange={setMobileSheetOpen}>
              <SheetTrigger asChild>
                <button
                  className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90 text-white z-40 flex items-center justify-center transition-colors"
                  aria-label="질문하기 패널 열기"
                >
                  <MessageCircle className="h-6 w-6" />
                </button>
              </SheetTrigger>

              <SheetContent
                side="bottom"
                className="h-[80vh] p-0 bg-background"
              >
                <div className="sr-only">
                  <SheetTitle>질문하기 패널</SheetTitle>
                  <SheetDescription>
                    선택한 문장에 대해 질문하고 피드백을 받을 수 있습니다.
                  </SheetDescription>
                </div>

                <div className="h-full p-4">
                  <SidePanel
                    materialId={material.id}
                    worksheetId={worksheet?.id}
                    chunkId={currentChunk?.id}
                    selectedText={selectedText}
                  />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </main>
    </div>
  );
}
