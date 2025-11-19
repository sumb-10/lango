// components/LessonDocViewer.tsx

'use client';

import { useEffect, useRef, useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import {
  ZoomIn,
  ZoomOut,
  AlignLeft,
  MessageSquare,
  BookOpen,
} from 'lucide-react';
import type { LessonJsonV1, LessonBlock } from '@/types/store_material';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

function MarkdownBlock({ content, fontSize }: { content: string; fontSize: number }) {
  const base = fontSize;

  return (
    <div className="space-y-5 prose prose-sm max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h2: ({ node, ...props }) => (
            <h2
              className="font-semibold text-ink mt-2"
              style={{ fontSize: base + 4 }}
              {...props}
            />
          ),
          h3: ({ node, ...props }) => (
            <h3
              className="font-semibold text-ink mt-1.5"
              style={{ fontSize: base + 2 }}
              {...props}
            />
          ),
          p: ({ node, ...props }) => (
            <p className="text-ink" style={{ fontSize: base }} {...props} />
          ),
          li: ({ node, ...props }) => (
            <li className="text-ink" style={{ fontSize: base }} {...props} />
          ),
          strong: ({ node, ...props }) => (
            <strong className="font-semibold" style={{ fontSize: base }} {...props} />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

interface LessonBodyProps {
  lesson: LessonJsonV1;
  fontSize: number;
  onSentenceClick: (text: string) => void;
}

function LessonBody({ lesson, fontSize, onSentenceClick }: LessonBodyProps) {
  return (
    <div className="space-y-8">
      {lesson.sections.map((section) => (
        <div key={section.id} className="space-y-3">
          <h3 className="text-sm font-semibold text-ink">{section.label}</h3>

          <div className="space-y-5">
            {section.blocks.map((block, idx) => {
              // 1) 마크다운 블록
              if (block.type === 'markdown') {
                return (
                  <MarkdownBlock
                    key={`md-${idx}`}
                    content={block.content}
                    fontSize={fontSize}
                  />
                );
              }

              // 2) 어휘 블록
              if (block.type === 'vocab_item') {
                return (
                  <div
                    key={block.word}
                    className="flex flex-col rounded-md border border-lango bg-background px-3 py-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className="font-semibold text-ink"
                        style={{ fontSize }}
                      >
                        {block.word}
                      </span>
                      <span className="text-xs text-muted-ink">
                        {block.translation}
                      </span>
                    </div>
                    {block.note && (
                      <p className="text-xs text-muted-ink mt-1">
                        {block.note}
                      </p>
                    )}
                    {block.example && (
                      <button
                        type="button"
                        className="mt-1 text-xs text-primary text-left underline-offset-2 hover:underline"
                        onClick={() => onSentenceClick(block.example!)}
                      >
                        예문: {block.example}
                      </button>
                    )}
                  </div>
                );
              }

              // 3) 연습문제 블록
              if (block.type === 'question') {
                return (
                  <QuestionBlock
                    key={block.questionId}
                    question={block}
                    fontSize={fontSize}
                    onSentenceClick={onSentenceClick}
                  />
                );
              }

              // 그 외 타입은 일단 렌더하지 않음
              return null;
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

interface QuestionBlockProps {
  question: Extract<LessonBlock, { type: 'question' }>;
  fontSize: number;
  onSentenceClick: (text: string) => void;
}

function QuestionBlock({ question, fontSize, onSentenceClick }: QuestionBlockProps) {
  const [answer, setAnswer] = useState('');
  const [showModelAnswer, setShowModelAnswer] = useState(false);

  return (
    <div className="rounded-md border border-lango bg-background px-3 py-3 space-y-2">
      <p className="text-xs text-ink whitespace-pre-line" style={{ fontSize }}>
        {question.prompt}
      </p>
      <textarea
        className="w-full mt-1 text-xs border border-lango rounded-md px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-primary"
        rows={3}
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
      />
      <div className="flex items-center justify-between gap-2 mt-1">
        <div className="flex gap-2">
          {question.modelAnswer && (
            <Button
              size="sm"
              variant="outline"
              className="h-7 px-2 text-[11px]"
              onClick={() => setShowModelAnswer((v) => !v)}
            >
              {showModelAnswer ? '정답 숨기기' : '정답 보기'}
            </Button>
          )}
          <Button
            size="sm"
            className="h-7 px-2 text-[11px]"
            onClick={() =>
              onSentenceClick(
                `[문제 풀이 피드백 요청]\n질문: ${question.prompt}\n내 답변: ${answer}`,
              )
            }
          >
            빠른 피드백
          </Button>
        </div>
      </div>
      {showModelAnswer && question.modelAnswer && (
        <div className="mt-2 rounded bg-surface-light px-2 py-1.5">
          <p className="text-[11px] font-semibold text-primary mb-1">
            모범 답안
          </p>
          <p className="text-xs text-ink whitespace-pre-line">
            {question.modelAnswer}
          </p>
          {question.explanation && (
            <p className="mt-1 text-[11px] text-muted-ink whitespace-pre-line">
              {question.explanation}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

interface SelectionToolbarPosition {
  top: number;
  left: number;
  width: number;
}

interface LessonDocViewerProps {
  title: string;
  author?: string | null;
  cefrLevel?: string | null;
  lesson: LessonJsonV1 | null;   // 🔹 여기 수정!
  /** 필요하면 진행률, 아니면 0 또는 undefined */
  progress?: number;

  onSentenceSelect: (sentence: string) => void;
  onMobileSheetOpen?: () => void;
}

export default function LessonDocViewer({
  title,
  author,
  cefrLevel,
  lesson,
  progress = 0,
  onSentenceSelect,
  onMobileSheetOpen,
}: LessonDocViewerProps) {
  const [fontSize, setFontSize] = useState(16);
  const [selectedSentence, setSelectedSentence] = useState<string | null>(null);
  const [selectionText, setSelectionText] = useState('');
  const [toolbarPosition, setToolbarPosition] =
    useState<SelectionToolbarPosition | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

    // 🔹 lesson이 아직 안 넘어온 경우(SSR/CSR 타이밍 문제 등) 대비
  if (!lesson) {
    return (
      <Card className="h-full flex items-center justify-center">
        <p className="text-sm text-muted-ink">
          레슨 데이터를 불러오지 못했습니다.
        </p>
      </Card>
    );
  }

  const handleSentenceClick = (sentence: string) => {
    setSelectedSentence(sentence);
    onSentenceSelect(sentence);
    // onMobileSheetOpen?.(); // 원하면 여기서도 패널 열 수 있음
  };

  const handleTextSelection = () => {
    const selection = window.getSelection();

    if (!selection) {
      setSelectionText('');
      setToolbarPosition(null);
      return;
    }

    const selected = selection.toString().trim();

    if (
      selected &&
      selected.length > 0 &&
      contentRef.current &&
      selection.rangeCount > 0
    ) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      const containerRect = contentRef.current.getBoundingClientRect();

      setSelectionText(selected);
      setToolbarPosition({
        top: rect.top - containerRect.top - 50,
        left: rect.left - containerRect.left,
        width: rect.width,
      });
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
      onSentenceSelect(selectionText);
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
      {/* Header */}
      <div className="flex flex-col gap-3 p-4 md:p-6 border-b border-lango">
        <div className="flex items-start justify-between gap-4">
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
                <span className="text-muted-ink" style={{ fontSize: '12px' }}>
                  {author}
                </span>
              )}
            </div>
          </div>

          {typeof progress === 'number' && progress > 0 && (
            <div className="flex flex-col items-end gap-1">
              <span className="text-xs text-muted-foreground">
                {progress}%
              </span>
              <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
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
          <span className="text-muted-ink px-2" style={{ fontSize: '12px' }}>
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

      {/* Content */}
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
                left: `${toolbarPosition.left + toolbarPosition.width / 2}px`,
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

          <LessonBody
            lesson={lesson}
            fontSize={fontSize}
            onSentenceClick={handleSentenceClick}
          />
        </div>
      </div>
    </Card>
  );
}
