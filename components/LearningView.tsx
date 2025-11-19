// components/LearningView.tsx

'use client';

import { useState } from 'react';
import LessonDocViewer from './LessonDocViewer';
import UserUploadDocViewer from './UserUploadDocViewer';
import SidePanel from './SidePanel';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { MessageCircle } from 'lucide-react';
import type { LessonJsonV1 } from '@/types/store_material';
import type { SentenceRecord } from '@/lib/processUserMaterial';


interface Props {
  material: any;
  worksheet: any;
  lessonJson?: LessonJsonV1 | null;
}

export default function LearningView({ material, worksheet, lessonJson }: Props) {
  const [selectedText, setSelectedText] = useState('');
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);

    // 🔹 새로 추가: 업로드 JSON 문장 메타
  const [selectedSentenceMeta, setSelectedSentenceMeta] =
    useState<SentenceRecord | null>(null);

  const isLesson =
    material?.source === 'store' && material?.file_type === 'lesson-json-v1';

  const handleSentenceSelect = (text: string) => {
    setSelectedText(text);
  };

    // 🔹 새로 추가: SentenceRecord 전체 저장
  const handleSentenceMetaSelect = (s: SentenceRecord) => {
    setSelectedSentenceMeta(s);
  };

  const handleOpenMobileSheet = () => {
    setMobileSheetOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1 px-4 md:px-8 py-6 md:py-8">
        <div className="max-w-[1440px] mx-auto h-full">
          {/* Desktop & Tablet: Two Column Layout */}
          <div className="hidden md:grid md:grid-cols-[1fr_400px] lg:grid-cols-[1fr_480px] gap-6 h-[calc(100vh-180px)]">
            {/* 좌측: 레슨 / 업로드 교재 뷰어 */}
            {isLesson ? (
              <LessonDocViewer
                title={material.title}
                author={material.author}
                cefrLevel={worksheet?.cefr_level ?? lessonJson?.cefrLevel}
                lesson={lessonJson ?? null} // LessonDocViewer에서 LessonJsonV1 | null 받도록 타입 수정 권장
                onSentenceSelect={handleSentenceSelect}
              />
            ) : (
              <UserUploadDocViewer
                title={material.title}
                author={material.author}
                cefrLevel={worksheet?.cefr_level ?? null}
                userJsonUrl={material.file_url}
                onSentenceSelect={handleSentenceSelect}
                onSentenceMetaSelect={handleSentenceMetaSelect}
              />
            )}

            {/* 우측: 사이드 패널 */}
            <SidePanel
              materialId={material.id}
              worksheetId={worksheet?.id}
              chunkId={undefined} // chunk 모델 폐기, 더 이상 사용 안 함
              selectedText={selectedText}
              selectedSentenceMeta={selectedSentenceMeta}
            />
          </div>

          {/* Mobile: Document + Floating Button + Bottom Sheet */}
          <div className="md:hidden">
            <div className="h-[calc(100vh-220px)] overflow-hidden">
              {isLesson ? (
                <LessonDocViewer
                  title={material.title}
                  author={material.author}
                  cefrLevel={worksheet?.cefr_level ?? lessonJson?.cefrLevel}
                  lesson={lessonJson ?? null}
                  onSentenceSelect={handleSentenceSelect}
                  onMobileSheetOpen={handleOpenMobileSheet}
                />
              ) : (
                <UserUploadDocViewer
                  title={material.title}
                  author={material.author}
                  cefrLevel={worksheet?.cefr_level ?? null}
                  userJsonUrl={material.file_url}
                  onSentenceSelect={handleSentenceSelect}
                  onMobileSheetOpen={handleOpenMobileSheet}
                  onSentenceMetaSelect={handleSentenceMetaSelect}
                />
              )}
            </div>

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
                    chunkId={undefined}
                    selectedText={selectedText}
                    selectedSentenceMeta={selectedSentenceMeta}
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
