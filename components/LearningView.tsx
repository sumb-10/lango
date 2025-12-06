// components/LearningView.tsx
"use client";

import { useState } from "react";
import LessonDocViewer from "./LessonDocViewer";
import UserUploadDocViewer from "./UserUploadDocViewer";
import SidePanel from "./SidePanel";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { MessageCircle } from "lucide-react";
import type { LessonJson } from "@/types/lesson";
import type { SentenceRecord } from "@/lib/processUserMaterial";

interface LearningViewProps {
  material: any; // TODO: 나중에 타입 분리
  lessonJson: LessonJson | null;
}

export default function LearningView({ material, lessonJson }: LearningViewProps) {
  const [selectedText, setSelectedText] = useState("");
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);

  const [selectedSentenceMeta, setSelectedSentenceMeta] =
    useState<SentenceRecord | null>(null);

  const isLesson = material?.file_type === "lesson_json";

  const handleSentenceSelect = (text: string) => {
    setSelectedText(text);
  };

  const handleSentenceMetaSelect = (s: SentenceRecord) => {
    setSelectedSentenceMeta(s);
  };

  const handleOpenMobileSheet = () => {
    setMobileSheetOpen(true);
  };

  const cefrLevel =
    (material?.cefr_level as string | null) ??
    (lessonJson?.level as string | null) ??
    null;

  return (
    // 🔹 부모에서 이미 bg + flex-1을 주고 있으니 여기선 "레이아웃"만 담당
    <div className="h-full w-full">
      {/* Desktop & Tablet: Two Column Layout */}
      <div className="hidden md:grid h-full md:grid-cols-[minmax(0,2fr)_minmax(360px,1fr)] gap-4 px-4 py-4">
        {/* 좌측: 레슨 / 업로드 교재 뷰어 */}
        {isLesson ? (
          <LessonDocViewer
            title={material.title}
            author={material.author}
            cefrLevel={cefrLevel}
            lesson={lessonJson}
            onSentenceSelect={handleSentenceSelect}
          />
        ) : (
          <UserUploadDocViewer
            title={material.title}
            author={material.author}
            cefrLevel={cefrLevel}
            userJsonUrl={material.file_url}
            onSentenceSelect={handleSentenceSelect}
            onSentenceMetaSelect={handleSentenceMetaSelect}
          />
        )}

        {/* 우측: 사이드 패널 (마이크로 피드백 / 퀵 설명 등) */}
        <SidePanel
          materialId={material.id}
          worksheetId={undefined}
          chunkId={undefined}
          selectedText={selectedText}
          selectedSentenceMeta={selectedSentenceMeta}
        />
      </div>

      {/* Mobile: Document + Floating Button + Bottom Sheet */}
      <div className="md:hidden h-full">
        <div className="h-full overflow-hidden">
          {isLesson ? (
            <LessonDocViewer
              title={material.title}
              author={material.author}
              cefrLevel={cefrLevel}
              lesson={lessonJson}
              onSentenceSelect={handleSentenceSelect}
            />
          ) : (
            <UserUploadDocViewer
              title={material.title}
              author={material.author}
              cefrLevel={cefrLevel}
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

          <SheetContent side="bottom" className="h-[80vh] p-0 bg-background">
            <div className="sr-only">
              <SheetTitle>질문하기 패널</SheetTitle>
              <SheetDescription>
                선택한 문장에 대해 질문하고 피드백을 받을 수 있습니다.
              </SheetDescription>
            </div>

            <div className="h-full p-4">
              <SidePanel
                materialId={material.id}
                worksheetId={undefined}
                chunkId={undefined}
                selectedText={selectedText}
                selectedSentenceMeta={selectedSentenceMeta}
              />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
