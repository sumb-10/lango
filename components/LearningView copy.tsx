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
        </div>
      </main>
    </div>
  );
}
