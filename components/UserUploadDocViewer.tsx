// components/UserUploadDocViewer.tsx

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
import type { SentenceRecord } from '@/lib/processUserMaterial';


interface SelectionToolbarPosition {
  top: number;
  left: number;
  width: number;
}

interface UserUploadDocViewerProps {
  title: string;
  author?: string | null;
  cefrLevel?: string | null;
  /** Supabase Storage 등에 있는 JSON 파일의 public URL */
  userJsonUrl: string;

  /** 진행률이 필요하면 사용, 아니면 생략 가능 */
  progress?: number;

  onSentenceSelect: (sentence: string) => void;
  onSentenceMetaSelect?: (sentence: SentenceRecord) => void;
  onMobileSheetOpen?: () => void;
}

export default function UserUploadDocViewer({
  title,
  author,
  cefrLevel,
  userJsonUrl,
  progress = 0,
  onSentenceSelect,
  onSentenceMetaSelect,
  onMobileSheetOpen,
}: UserUploadDocViewerProps) {
  const [fontSize, setFontSize] = useState(16);

  const [selectedSentence, setSelectedSentence] = useState<string | null>(null);
  const [hoveredSentence, setHoveredSentence] = useState<string | null>(null);

  const [selectionText, setSelectionText] = useState('');
  const [toolbarPosition, setToolbarPosition] =
    useState<SelectionToolbarPosition | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // user-upload JSON 데이터
  const [sentences, setSentences] = useState<SentenceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ─────────────────────────────
  // JSON fetch
  // ─────────────────────────────
useEffect(() => {
  let cancelled = false;

  const loadJson = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(userJsonUrl);

      if (!res.ok) {
        const message = `Failed to fetch JSON: ${res.status} ${res.statusText}`;
        if (!cancelled) {
          console.error('[UserUploadDocViewer] fetch error:', {
            url: userJsonUrl,
            status: res.status,
            statusText: res.statusText,
          });
          setError(message);
          setSentences([]);
        }
        return; // 🔹 여기서 함수 종료 (throw 안 함)
      }

      const data = (await res.json()) as SentenceRecord[];

      if (!cancelled) {
        setSentences(data);
      }
    } catch (err: any) {
      if (!cancelled) {
        console.error('[UserUploadDocViewer] json load error:', err);
        setError(err?.message ?? 'Unknown error');
      }
    } finally {
      if (!cancelled) {
        setLoading(false);
      }
    }
  };

  loadJson();

  return () => {
    cancelled = true;
  };
}, [userJsonUrl]);


  // 문단 단위로 그룹핑
  const paragraphs: [number, SentenceRecord[]][] = (() => {
    const byParagraph = new Map<number, SentenceRecord[]>();

    for (const s of sentences) {
      if (!byParagraph.has(s.paragraph)) {
        byParagraph.set(s.paragraph, []);
      }
      byParagraph.get(s.paragraph)!.push(s);
    }

    return Array.from(byParagraph.entries()).sort((a, b) => a[0] - b[0]);
  })();

  const handleSentenceClick = (s: SentenceRecord) => {
    setSelectedSentence(s.text);
    onSentenceSelect(s.text);          // ← 기존 SidePanel용 string
    onSentenceMetaSelect?.(s);         // ← 새로 추가: SentenceRecord 전체 전달
  };

  const handleTextSelection = () => {
  const selection = window.getSelection();

  // selection이 없으면 초기화
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

          {loading && (
            <p className="text-sm text-muted-ink">교재를 불러오는 중입니다…</p>
          )}

          {error && (
            <p className="text-sm text-red-500">
              교재를 불러오지 못했습니다: {error}
            </p>
          )}

          {!loading && !error && paragraphs.length === 0 && (
            <p className="text-sm text-muted-ink">표시할 문장이 없습니다.</p>
          )}

          {!loading &&
            !error &&
            paragraphs.map(([paraIndex, paraSentences]) => (
              <p
                key={paraIndex}
                className="space-y-0"
                style={{
                  fontSize: `${fontSize}px`,
                  lineHeight: '1.8',
                  color: '#1A1A1A',
                  marginBottom: '1rem', // 문단 사이 간격 (원하면 tailwind 클래스로 바꿔도 됨)
                }}
              >
                {paraSentences.map((s, idx) => {
                  const isSelected = selectedSentence === s.text;
                  const isHovered = hoveredSentence === s.text;

                  return (
                    <span
                      key={s.sentence_id}
                      className="relative group inline"
                    >
                      <span
                        className={`
                          cursor-pointer transition-all duration-150 px-1 py-0.5 -mx-1 rounded
                          ${isSelected ? 'bg-primary/10 shadow-sm' : ''}
                          ${
                            isHovered && !isSelected
                              ? 'bg-background border-b-2 border-dashed border-primary'
                              : ''
                          }
                        `}
                        onClick={() => handleSentenceClick(s)} 
                        onMouseEnter={() => setHoveredSentence(s.text)}
                        onMouseLeave={() => setHoveredSentence(null)}
                      >
                        {s.text}
                      </span>

                      {/* 문장 사이에 공백 하나 넣어주기 */}
                      {idx < paraSentences.length - 1 && ' '}

                      {/*isHovered && !isSelected && (
                        <Button
                          size="sm"
                          className="absolute -right-2 -top-7 opacity-0 group-hover:opacity-100 transition-opacity bg-primary hover:bg-primary/90 text-white h-7 text-xs"
                          onClick={() => handleSentenceClick(s)} 
                        >
                          <MessageSquare className="h-3 w-3 mr-1" />
                          질문하기
                        </Button>
                      )*/}
                    </span>
                  );
                })}
              </p>
          ))}

        </div>
      </div>
    </Card>
  );
}
