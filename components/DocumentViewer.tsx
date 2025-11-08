// components/DocumentViewer.tsx

'use client';

import { useState, useRef, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import {
  ChevronLeft, // 안 쓰면 나중에 지워도 됨
  ChevronRight, // 안 쓰면 나중에 지워도 됨
  ZoomIn,
  ZoomOut,
  AlignLeft,
  MessageSquare,
  BookOpen,
} from 'lucide-react';

interface DocumentViewerProps {
  content: string;
  title: string;
  author?: string | null;
  cefrLevel?: string | null;
  progress: number;
  onSentenceSelect: (sentence: string) => void;
  onMobileSheetOpen?: () => void;

  currentChunkIndex: number;
  totalChunks: number;
  onPrevChunk: () => void;
  onNextChunk: () => void;
}

interface SelectionToolbarPosition {
  top: number;
  left: number;
  width: number;
}

export default function DocumentViewer({
  content,
  title,
  author,
  cefrLevel,
  progress,
  onSentenceSelect,
  onMobileSheetOpen,
  currentChunkIndex,
  totalChunks,
  onPrevChunk,
  onNextChunk,
}: DocumentViewerProps) {
  const [selectedSentence, setSelectedSentence] = useState<string | null>(null);
  const [hoveredSentence, setHoveredSentence] = useState<string | null>(null);
  const [fontSize, setFontSize] = useState(16);
  const [selectionText, setSelectionText] = useState<string>('');
  const [toolbarPosition, setToolbarPosition] =
    useState<SelectionToolbarPosition | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // 텍스트를 문장 단위로 분할
  const sentences = content
    .split(/(?<=[.!?])\s+/)
    .filter((s) => s.trim().length > 0);

  const handleSentenceClick = (sentence: string) => {
    setSelectedSentence(sentence);
    onSentenceSelect(sentence);
    // 모바일에서 문장 클릭만으로도 패널 열고 싶으면 여기서도 열 수 있음
    // onMobileSheetOpen?.();
  };

  const handleTextSelection = () => {
    const selection = window.getSelection();
    const selectedText = selection?.toString().trim();

    if (selectedText && selectedText.length > 0 && contentRef.current) {
      const range = selection?.getRangeAt(0);
      if (range) {
        const rect = range.getBoundingClientRect();
        const containerRect = contentRef.current.getBoundingClientRect();

        setSelectionText(selectedText);
        setToolbarPosition({
          top: rect.top - containerRect.top - 50,
          left: rect.left - containerRect.left,
          width: rect.width,
        });
      }
    } else {
      setSelectionText('');
      setToolbarPosition(null);
    }
  };

  const resetSelection = () => {
    window.getSelection()?.removeAllRanges();
    setSelectionText('');
    setToolbarPosition(null);
  };

const handleAskQuestion = () => {
  if (selectionText) {
    onSentenceSelect(`${selectionText}`);
    setSelectedSentence(selectionText);
    onMobileSheetOpen?.();
  }
  resetSelection();
};

const handleWordMeaning = () => {
  if (selectionText) {
    onSentenceSelect(`[단어 뜻] ${selectionText}`);
    setSelectedSentence(selectionText);
    onMobileSheetOpen?.();
  }
  resetSelection();
};

  useEffect(() => {
    const handleClickOutside = () => {
      if (!window.getSelection()?.toString()) {
        setSelectionText('');
        setToolbarPosition(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <Card
      className="h-full flex flex-col bg-surface shadow-[0_2px_12px_rgba(0,0,0,0.06)]"
      style={{ borderRadius: '12px' }}
    >
      {/* Card Header */}
      <div className="flex flex-col gap-3 p-4 md:p-6 border-b border-lango">
        <div className="flex items-start justify-between gap-4">
          {/* 왼쪽: 제목 / 저자 / 레벨 */}
          <div className="flex-1 min-w-0">
            <h2
              className="text-ink mb-2"
              style={{ fontSize: '22px', fontWeight: 600 }}
            >
              {title}
            </h2>
            <div className="flex flex-wrap items-center gap-2">
              {cefrLevel && (
                <Badge className="bg-primary text-white hover:bg-primary/90">
                  {cefrLevel}
                </Badge>
              )}
              {author && (
                <span
                  className="text-muted-ink"
                  style={{ fontSize: '12px' }}
                >
                  {author}
                </span>
              )}
            </div>
          </div>

          {/* 오른쪽: 청크 네비 + 진행률 */}
          {totalChunks > 0 && (
            <div className="flex flex-col items-end gap-2">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={onPrevChunk}
                  disabled={currentChunkIndex === 0}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground">
                  {currentChunkIndex + 1} / {totalChunks}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={onNextChunk}
                  disabled={currentChunkIndex === totalChunks - 1}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <div className="w-32 h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>


      {/* Toolbar */}
      <div className="flex items-center gap-2 p-3 md:p-4 border-b border-lango bg-background">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setFontSize(Math.max(12, fontSize - 2))}
            className="h-8 w-8 p-0"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span
            className="text-muted-ink px-2"
            style={{ fontSize: '12px' }}
          >
            {fontSize}px
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setFontSize(Math.min(24, fontSize + 2))}
            className="h-8 w-8 p-0"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>

        <div className="h-6 w-px bg-lango mx-1" />

        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <AlignLeft className="h-4 w-4" />
        </Button>
      </div>

      {/* Document Content */}
      <div
        ref={contentRef}
        className="flex-1 overflow-auto p-6 md:p-8 bg-surface-light relative"
        onMouseUp={handleTextSelection}
      >
        <div className="max-w-[720px] mx-auto space-y-6">
          {/* Selection Toolbar */}
          {toolbarPosition && selectionText && (
            <div
              className="absolute z-50 flex gap-2 bg-white shadow-lg border border-lango rounded-lg p-2"
              style={{
                top: `${toolbarPosition.top}px`,
                left: `${
                  toolbarPosition.left + toolbarPosition.width / 2
                }px`,
                transform: 'translateX(-50%)',
              }}
            >
              <Button
                size="sm"
                onClick={handleAskQuestion}
                className="bg-primary hover:bg-primary/90 text-white h-8 text-xs"
              >
                <MessageSquare className="h-3 w-3 mr-1" />
                빠른 설명
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleWordMeaning}
                className="border-primary text-primary hover:bg-primary/10 h-8 text-xs"
              >
                <BookOpen className="h-3 w-3 mr-1" />
                단어 뜻 보기
              </Button>
            </div>
          )}

          {sentences.map((sentence, idx) => {
            const isSelected = selectedSentence === sentence;
            const isHovered = hoveredSentence === sentence;

            return (
              <div key={idx} className="relative group">
                <span
                  className={`
                    inline cursor-pointer transition-all duration-150 px-1 py-0.5 -mx-1 rounded
                    ${isSelected ? 'bg-primary/10 shadow-sm' : ''}
                    ${
                      isHovered && !isSelected
                        ? 'bg-background border-b-2 border-dashed border-primary'
                        : ''
                    }
                  `}
                  style={{
                    fontSize: `${fontSize}px`,
                    lineHeight: '1.75',
                    color: '#1A1A1A',
                  }}
                  onClick={() => handleSentenceClick(sentence)}
                  onMouseEnter={() => setHoveredSentence(sentence)}
                  onMouseLeave={() => setHoveredSentence(null)}
                >
                  {sentence}
                </span>

                {isHovered && !isSelected && (
                  <Button
                    size="sm"
                    className="absolute -right-2 top-0 opacity-0 group-hover:opacity-100 transition-opacity bg-primary hover:bg-primary/90 text-white h-7 text-xs"
                    onClick={() => handleSentenceClick(sentence)}
                  >
                    <MessageSquare className="h-3 w-3 mr-1" />
                    질문하기
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}
