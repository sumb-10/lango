"use client";

import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  MouseEvent,
} from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { MessageSquare, BookOpen } from "lucide-react";

import type {
  LessonJson,
  LessonChunk,
  ReadingChunk,
  StructureChunk,
  VocabChunk,
  BackgroundChunk,
  WritingChunk,
  ComprehensionChunk,
  ReadingParagraph,
  StructureItem,
  VocabItem,
  WritingPrompt,
  Question,
} from "@/types/lesson";

/* ----------------------
 * Section Components
 * ---------------------- */

// ----- Reading (#읽어봅시다) -----

interface ReadingSectionProps {
  chunk: ReadingChunk;
  fontSize: number;
  onSentenceClick: (text: string) => void;
}

const ReadingSection: React.FC<ReadingSectionProps> = ({
  chunk,
  fontSize,
  onSentenceClick,
}) => {
  const [openTranslations, setOpenTranslations] = useState<
    Record<number, boolean>
  >({});

  const toggleTranslate = (paragraphIndex: number) => {
    setOpenTranslations((prev) => ({
      ...prev,
      [paragraphIndex]: !prev[paragraphIndex],
    }));
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-ink">{chunk.title}</h3>
      </div>

      <div className="space-y-4">
        {chunk.data.paragraphs.map((p: ReadingParagraph) => {
          const isOpen = openTranslations[p.paragraph] ?? false;

          return (
            <div
              key={p.paragraph}
              className="space-y-1 pb-3 border-b border-dashed border-lango/20 last:border-b-0"
            >
              <p
                className="text-ink leading-relaxed whitespace-pre-line cursor-text"
                style={{ fontSize }}
                onClick={() => onSentenceClick(p.text)}
              >
                {p.text}
              </p>

              <button
                type="button"
                className="mt-1 text-[14px] text-primary/80 hover:text-primary underline-offset-2 hover:underline"
                onClick={() => toggleTranslate(p.paragraph)}
              >
                {isOpen ? "해석 숨기기" : "해석 보기"}
              </button>

              {isOpen && (
                <p
                  className="mt-1 text-xs text-muted-ink leading-relaxed whitespace-pre-line"
                  style={{ fontSize: Math.max(11, fontSize - 2) }}
                >
                  {p.translate}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};

// ----- Structure (#구문 뽀개기) -----

interface StructureSectionProps {
  chunk: StructureChunk;
  fontSize: number;
  onSentenceClick: (text: string) => void;
}

const StructureSection: React.FC<StructureSectionProps> = ({
  chunk,
  fontSize,
  onSentenceClick,
}) => {
  const grouped = chunk.data.items.reduce<Record<number, StructureItem[]>>(
    (acc, item) => {
      if (!acc[item.paragraph]) {
        acc[item.paragraph] = [];
      }
      acc[item.paragraph].push(item);
      return acc;
    },
    {},
  );

  const paragraphKeys = Object.keys(grouped)
    .map((n) => Number(n))
    .sort((a, b) => a - b);

  return (
    <section className="space-y-4">
      <h3 className="text-sm text-[25px] font-semibold text-ink">
        {chunk.title}
      </h3>

      <div className="space-y-4">
        {paragraphKeys.map((pIdx: number) => (
          <div key={pIdx} className="space-y-2">
            <p className="text-[11px] font-medium text-muted-ink">
              문단 {pIdx + 1}
            </p>

            <div className="space-y-2">
              {grouped[pIdx].map((item: StructureItem) => (
                <div
                  key={item.sentence_id}
                  className="rounded-md bg-background/60 px-3 py-2 space-y-1.5 border border-lango/30 border-l-2 border-l-primary/50"
                >
                  <p
                    className="text-ink whitespace-pre-line cursor-pointer leading-relaxed"
                    style={{ fontSize }}
                    onClick={() => onSentenceClick(item.text)}
                  >
                    {item.text}
                  </p>

                  <p
                    className="text-[11px] text-ink whitespace-pre-line cursor-pointer leading-relaxed"
                    style={{ fontSize: Math.max(11, fontSize - 3) }}
                    onClick={() => onSentenceClick(item.structure)}
                  >
                    {item.structure}
                  </p>

                  <p
                    className="text-[11px] text-muted-ink whitespace-pre-line leading-relaxed"
                    style={{ fontSize: Math.max(11, fontSize - 3) }}
                  >
                    {item.structure_translated}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

// ----- Vocab (#핵심단어) -----

interface VocabSectionProps {
  chunk: VocabChunk;
  fontSize: number;
  onSentenceClick: (text: string) => void;
}

const VocabSection: React.FC<VocabSectionProps> = ({
  chunk,
  fontSize,
  onSentenceClick,
}) => {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-sm text-[25px] font-semibold text-ink">
          {chunk.title}
        </h1>
        <span className="text-[11px] text-muted-ink">
          Level: {chunk.data.level}
        </span>
      </div>

      <div className="overflow-x-auto rounded-md border border-lango/40 bg-background">
        <table className="min-w-full table-fixed text-[13px]">
          <thead>
            <tr className="border-b border-lango/30 bg-surface-light">
              <th className="px-4 py-2 text-left font-semibold text-ink w-[22%]">
                Word
              </th>
              <th className="px-4 py-2 text-left font-semibold text-ink w-[20%]">
                Meaning (KO)
              </th>
              <th className="px-4 py-2 text-left font-semibold text-ink">
                Example
              </th>
            </tr>
          </thead>
          <tbody>
            {chunk.data.items.map((item: VocabItem) => (
              <tr
                key={item.word}
                className="border-b border-lango/10 last:border-b-0 hover:bg-surface-light/60"
              >
                <td className="px-4 py-2 align-top">
                  <div className="flex flex-col">
                    <span
                      className="font-semibold text-ink"
                      style={{ fontSize }}
                    >
                      {item.word}
                    </span>
                    <span className="mt-0.5 text-[10px] uppercase text-muted-ink">
                      {item.pos}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-2 align-top">
                  <span className="text-xs text-[18px] text-ink">
                    {item.meaning_ko}
                  </span>
                </td>
                <td className="px-4 py-2 align-top">
                  {item.example_en ? (
                    <button
                      type="button"
                      className="text-xs text-ink text-left text-[13px] underline-offset-2 hover:underline"
                      onClick={() => onSentenceClick(item.example_en)}
                    >
                      {item.example_en}
                    </button>
                  ) : (
                    <span className="text-xs text-muted-ink">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};

// ----- Background (#배경지식) -----

interface BackgroundSectionProps {
  chunk: BackgroundChunk;
  fontSize: number;
}

const BackgroundSection: React.FC<BackgroundSectionProps> = ({
  chunk,
  fontSize,
}) => {
  return (
    <section className="space-y-3">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm text-[25px] font-semibold text-ink">
          {chunk.title}
        </h3>

        {chunk.data.key_terms && chunk.data.key_terms.length > 0 && (
          <div className="flex flex-wrap gap-1 justify-end max-w-xs">
            {chunk.data.key_terms.map((term: string) => (
              <span
                key={term}
                className="inline-flex items-center rounded-full border border-lango/30 bg-background px-2 py-0.5 text-[11px] text-ink"
              >
                {term}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-3">
        {chunk.data.paragraphs.map((p: string, idx: number) => (
          <p
            key={idx}
            className="text-ink whitespace-pre-line leading-relaxed"
            style={{ fontSize: Math.max(14, fontSize - 1) }}
          >
            {p}
          </p>
        ))}
      </div>
    </section>
  );
};

// ----- Writing (긴 작문) -----

interface WritingPromptBlockProps {
  index: number;
  prompt: WritingPrompt;
  fontSize: number;
  onSentenceClick: (text: string) => void;
}

const WritingPromptBlock: React.FC<WritingPromptBlockProps> = ({
  index,
  prompt,
  fontSize,
  onSentenceClick,
}) => {
  const [answer, setAnswer] = useState<string>("");
  const [showGuide, setShowGuide] = useState<boolean>(false);

  const minInfo = `최소 단락 수: ${prompt.min_paragraphs}, 최소 문장 수: ${prompt.min_sentences}`;

  return (
    <div className="rounded-md border border-lango/40 bg-background px-3 py-3 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[11px] font-medium text-primary">
            {index + 1}
          </span>
          <h4
            className="text-xs font-semibold text-ink"
            style={{ fontSize }}
          >
            {prompt.title}
          </h4>
        </div>
      </div>

      <p
        className="text-xs text-ink whitespace-pre-line leading-relaxed"
        style={{ fontSize: Math.max(12, fontSize - 1) }}
      >
        {prompt.prompt}
      </p>

      <p className="text-[11px] text-muted-ink">{minInfo}</p>

      {prompt.guidance_ko && (
        <div className="mt-1">
          <button
            type="button"
            className="text-[11px] text-primary underline-offset-2 hover:underline"
            onClick={() => setShowGuide((v) => !v)}
          >
            {showGuide ? "한국어 가이드 숨기기" : "한국어 가이드 보기"}
          </button>
          {showGuide && (
            <p className="mt-1 text-[11px] text-muted-ink whitespace-pre-line leading-relaxed">
              {prompt.guidance_ko}
            </p>
          )}
        </div>
      )}

      <textarea
        className="w-full mt-1 text-xs border border-lango rounded-md px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-primary"
        rows={6}
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        placeholder="여기에 작문을 작성해 보세요."
      />

      <div className="flex items-center justify-end gap-2 mt-1">
        <Button
          size="sm"
          className="h-7 px-2 text-[11px]"
          onClick={() =>
            onSentenceClick(
              `[작문 피드백 요청]\n제목: ${prompt.title}\n지시문: ${prompt.prompt}\n내 답변:\n${answer}`,
            )
          }
        >
          빠른 피드백
        </Button>
      </div>
    </div>
  );
};

interface WritingSectionProps {
  chunk: WritingChunk;
  fontSize: number;
  onSentenceClick: (text: string) => void;
}

const WritingSection: React.FC<WritingSectionProps> = ({
  chunk,
  fontSize,
  onSentenceClick,
}) => {
  return (
    <section className="space-y-3">
      <h3 className="text-sm font-semibold text-ink">{chunk.title}</h3>
      <div className="space-y-4">
        {chunk.data.prompts.map((p: WritingPrompt, idx: number) => (
          <WritingPromptBlock
            key={p.id}
            index={idx}
            prompt={p}
            fontSize={fontSize}
            onSentenceClick={onSentenceClick}
          />
        ))}
      </div>
    </section>
  );
};

// ----- Comprehension (읽기 확인 문제) -----

interface QuestionBlockProps {
  index: number;
  question: Question;
  fontSize: number;
  onSentenceClick: (text: string) => void;
}

const QuestionBlock: React.FC<QuestionBlockProps> = ({
  index,
  question,
  fontSize,
  onSentenceClick,
}) => {
  const [answer, setAnswer] = useState<string>("");
  const [showModelAnswer, setShowModelAnswer] = useState<boolean>(false);

  const stem = question.stem ?? "";
  const modelAnswer = question.answer;

  const typeLabelMap: Record<Question["type"], string> = {
    fill_blank: "빈칸 채우기",
    short_answer: "단답형",
    rewrite: "문장 바꾸기",
  };

  return (
    <div className="rounded-md border border-lango/40 bg-background px-3 py-3 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[11px] font-medium text-primary">
            {index + 1}
          </span>
          <span className="inline-flex items-center rounded-full bg-surface-light px-2 py-0.5 text-[11px] text-muted-ink">
            {typeLabelMap[question.type]}
          </span>
        </div>
      </div>

      <p
        className="text-xs text-ink whitespace-pre-line leading-relaxed"
        style={{ fontSize }}
      >
        {stem}
      </p>

      <textarea
        className="w-full mt-1 text-xs border border-lango rounded-md px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-primary"
        rows={3}
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
      />

      <div className="flex items-center justify-between gap-2 mt-1">
        <div className="flex gap-2">
          {modelAnswer && (
            <Button
              size="sm"
              variant="outline"
              className="h-7 px-2 text-[11px]"
              onClick={() => setShowModelAnswer((v) => !v)}
            >
              {showModelAnswer ? "정답 숨기기" : "정답 보기"}
            </Button>
          )}
          <Button
            size="sm"
            className="h-7 px-2 text-[11px]"
            onClick={() =>
              onSentenceClick(
                `[문제 풀이 피드백 요청]\n문항 번호: ${
                  index + 1
                }\n문항 유형: ${question.type}\n질문: ${stem}\n내 답변: ${answer}`,
              )
            }
          >
            빠른 피드백
          </Button>
        </div>
      </div>

      {showModelAnswer && modelAnswer && (
        <div className="mt-2 rounded bg-surface-light px-2 py-1.5">
          <p className="text-[11px] font-semibold text-primary mb-1">
            모범 답안
          </p>
          <p className="text-xs text-ink whitespace-pre-line leading-relaxed">
            {modelAnswer}
          </p>
          {question.explanation && (
            <p className="mt-1 text-[11px] text-muted-ink whitespace-pre-line leading-relaxed">
              {question.explanation}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

interface ComprehensionSectionProps {
  chunk: ComprehensionChunk;
  fontSize: number;
  onSentenceClick: (text: string) => void;
}

const ComprehensionSection: React.FC<ComprehensionSectionProps> = ({
  chunk,
  fontSize,
  onSentenceClick,
}) => {
  return (
    <section className="space-y-3">
      <h3 className="text-sm font-semibold text-ink">{chunk.title}</h3>
      <div className="space-y-3">
        {chunk.data.questions.map((q: Question, idx: number) => (
          <QuestionBlock
            key={q.id}
            index={idx}
            question={q}
            fontSize={fontSize}
            onSentenceClick={onSentenceClick}
          />
        ))}
      </div>
    </section>
  );
};

/* ----------------------
 * Pagination Model
 * ---------------------- */

interface PageRange {
  start: number;
  end: number;
}

interface LessonPage {
  id: string;
  chunkId: string;
  type: LessonChunk["type"];
  chunkTitle: string;
  pageIndexInChunk: number;
  totalPagesInChunk: number;
  range: PageRange;
}

// 아이템 수 기준으로 페이지 나누기
const paginateLesson = (lesson: LessonJson): LessonPage[] => {
  const pages: LessonPage[] = [];

  const sortedChunks = [...lesson.chunks].sort(
    (a, b) => a.order - b.order,
  );

  for (const chunk of sortedChunks) {
    let totalItems = 0;
    let pageSize = 1;

    switch (chunk.type) {
      case "reading":
        totalItems = chunk.data.paragraphs.length;
        pageSize = 3;
        break;
      case "structure":
        totalItems = chunk.data.items.length;
        pageSize = 3;
        break;
      case "vocab":
        totalItems = chunk.data.items.length;
        pageSize = 10;
        break;
      case "background":
        totalItems = chunk.data.paragraphs.length;
        pageSize = 4;
        break;
      case "writing":
        totalItems = chunk.data.prompts.length;
        pageSize = 2;
        break;
      case "comprehension":
        totalItems = chunk.data.questions.length;
        pageSize = 3;
        break;
      default:
        totalItems = 0;
        break;
    }

    if (totalItems === 0) continue;

    const totalPagesForChunk = Math.ceil(totalItems / pageSize);

    for (let pageIndex = 0; pageIndex < totalPagesForChunk; pageIndex += 1) {
      const start = pageIndex * pageSize;
      const end = Math.min(start + pageSize, totalItems);

      pages.push({
        id: `${chunk.id}-p${pageIndex + 1}`,
        chunkId: chunk.id,
        type: chunk.type,
        chunkTitle: chunk.title,
        pageIndexInChunk: pageIndex,
        totalPagesInChunk: totalPagesForChunk,
        range: { start, end },
      });
    }
  }

  return pages;
};

// 특정 페이지 범위에 맞게 chunk 슬라이스
const sliceChunkForPage = (
  chunk: LessonChunk,
  range: PageRange,
): LessonChunk => {
  const { start, end } = range;

  switch (chunk.type) {
    case "reading": {
      const original = chunk as ReadingChunk;
      const sliced: ReadingChunk = {
        ...original,
        data: {
          paragraphs: original.data.paragraphs.slice(start, end),
        },
      };
      return sliced;
    }
    case "structure": {
      const original = chunk as StructureChunk;
      const sliced: StructureChunk = {
        ...original,
        data: {
          items: original.data.items.slice(start, end),
        },
      };
      return sliced;
    }
    case "vocab": {
      const original = chunk as VocabChunk;
      const sliced: VocabChunk = {
        ...original,
        data: {
          ...original.data,
          items: original.data.items.slice(start, end),
        },
      };
      return sliced;
    }
    case "background": {
      const original = chunk as BackgroundChunk;
      const sliced: BackgroundChunk = {
        ...original,
        data: {
          ...original.data,
          paragraphs: original.data.paragraphs.slice(start, end),
        },
      };
      return sliced;
    }
    case "writing": {
      const original = chunk as WritingChunk;
      const sliced: WritingChunk = {
        ...original,
        data: {
          prompts: original.data.prompts.slice(start, end),
        },
      };
      return sliced;
    }
    case "comprehension": {
      const original = chunk as ComprehensionChunk;
      const sliced: ComprehensionChunk = {
        ...original,
        data: {
          questions: original.data.questions.slice(start, end),
        },
      };
      return sliced;
    }
    default:
      return chunk;
  }
};

/* ----------------------
 * 한 페이지에 해당하는 Chunk 렌더링
 * ---------------------- */

interface LessonPageBodyProps {
  chunk: LessonChunk;
  fontSize: number;
  onSentenceClick: (text: string) => void;
}

const LessonPageBody: React.FC<LessonPageBodyProps> = ({
  chunk,
  fontSize,
  onSentenceClick,
}) => {
  switch (chunk.type) {
    case "reading":
      return (
        <ReadingSection
          chunk={chunk as ReadingChunk}
          fontSize={fontSize}
          onSentenceClick={onSentenceClick}
        />
      );
    case "structure":
      return (
        <StructureSection
          chunk={chunk as StructureChunk}
          fontSize={fontSize}
          onSentenceClick={onSentenceClick}
        />
      );
    case "vocab":
      return (
        <VocabSection
          chunk={chunk as VocabChunk}
          fontSize={fontSize}
          onSentenceClick={onSentenceClick}
        />
      );
    case "background":
      return (
        <BackgroundSection
          chunk={chunk as BackgroundChunk}
          fontSize={fontSize}
        />
      );
    case "writing":
      return (
        <WritingSection
          chunk={chunk as WritingChunk}
          fontSize={fontSize}
          onSentenceClick={onSentenceClick}
        />
      );
    case "comprehension":
      return (
        <ComprehensionSection
          chunk={chunk as ComprehensionChunk}
          fontSize={fontSize}
          onSentenceClick={onSentenceClick}
        />
      );
    default:
      return null;
  }
};

/* ----------------------
 * 최상위 LessonDocViewer
 * ---------------------- */

interface SelectionToolbarPosition {
  top: number;
  left: number;
  width: number;
}

interface LessonDocViewerProps {
  title: string;
  author?: string | null;
  cefrLevel?: string | null;
  lesson: LessonJson | null;
  progress?: number;
  onSentenceSelect: (sentence: string) => void;
  onWritingFeedbackRequest?: (promptText: string) => Promise<string>;
}

const LessonDocViewer: React.FC<LessonDocViewerProps> = ({
  title,
  author,
  cefrLevel,
  lesson,
  progress = 0,
  onSentenceSelect,
  onWritingFeedbackRequest,
}) => {
  const [fontSize] = useState<number>(16);
  const [selectionText, setSelectionText] = useState<string>("");
  const [toolbarPosition, setToolbarPosition] =
    useState<SelectionToolbarPosition | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);

  const pages = useMemo(() => {
    if (!lesson) return [];
    return paginateLesson(lesson);
  }, [lesson]);

  const [currentPageIndex, setCurrentPageIndex] = useState<number>(0);

  // lesson이 바뀌면 페이지 인덱스 리셋
  useEffect(() => {
    setCurrentPageIndex(0);
  }, [lesson?.id]);

  const chunkMap = useMemo(() => {
    const map = new Map<string, LessonChunk>();
    if (lesson) {
      for (const chunk of lesson.chunks) {
        map.set(chunk.id, chunk);
      }
    }
    return map;
  }, [lesson]);

  if (!lesson) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-sm text-muted-ink">
          레슨 데이터를 불러오지 못했습니다.
        </p>
      </div>
    );
  }

  if (pages.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-sm text-muted-ink">
          표시할 페이지가 없습니다. (chunks 비어 있음)
        </p>
      </div>
    );
  }

  const currentPage = pages[Math.min(currentPageIndex, pages.length - 1)];
  const originalChunk = chunkMap.get(currentPage.chunkId);

  if (!originalChunk) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-sm text-muted-ink">
          이 페이지에 해당하는 청크를 찾을 수 없습니다.
        </p>
      </div>
    );
  }

  const pageChunk = sliceChunkForPage(originalChunk, currentPage.range);

  const handleSentenceClick = (sentence: string) => {
    onSentenceSelect(sentence);
  };

  const handleTextSelection = (e: MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    const selection = window.getSelection();
    if (!selection) {
      setSelectionText("");
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
      setSelectionText("");
      setToolbarPosition(null);
    }
  };

  const resetSelection = () => {
    window.getSelection()?.removeAllRanges();
    setSelectionText("");
    setToolbarPosition(null);
  };

  const handleAskQuestion = () => {
    if (selectionText) {
      onSentenceSelect(selectionText);
    }
    resetSelection();
  };

  const handleWordMeaning = () => {
    if (selectionText) {
      onSentenceSelect(`[단어 뜻] ${selectionText}`);
    }
    resetSelection();
  };

  useEffect(() => {
    const handleClickOutside = () => {
      if (!window.getSelection()?.toString()) {
        setSelectionText("");
        setToolbarPosition(null);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const goPrevPage = () => {
    setCurrentPageIndex((idx) => Math.max(0, idx - 1));
  };

  const goNextPage = () => {
    setCurrentPageIndex((idx) => Math.min(pages.length - 1, idx + 1));
  };

  const currentPageNumber = currentPageIndex + 1;
  const totalPageCount = pages.length;

  return (
    <Card
      className="h-full flex flex-col bg-surface shadow-[0_2px_12px_rgba(0,0,0,0.06)]"
      style={{ borderRadius: "12px" }}
    >
      {/* 상단 헤더 */}
      <header className="flex items-start justify-between gap-4 px-6 py-4 border-b border-lango/30 bg-surface">
        <div className="flex-1 min-w-0">
          <h2 className="text-ink mb-2 text-[22px] font-semibold truncate">
            {title}
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            {cefrLevel && (
              <Badge className="bg-primary text-white hover:bg-primary/90">
                {cefrLevel}
              </Badge>
            )}
            {author && (
              <span className="text-muted-ink text-[12px]">{author}</span>
            )}
          </div>
        </div>

        {typeof progress === "number" && progress > 0 && (
          <div className="flex flex-col items-end gap-1">
            <span className="text-xs text-muted-foreground">{progress}%</span>
            <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </header>

      {/* 청크/페이지 정보 + 네비게이션 */}
      <div className="flex items-center justify-between gap-2 px-6 py-2 border-b border-lango/20 bg-surface-light">
        <div className="flex flex-col">
          <span className="text-[12px] font-semibold text-ink">
            {currentPage.chunkTitle}
          </span>
          <span className="text-[11px] text-muted-ink">
            섹션 페이지 {currentPage.pageIndexInChunk + 1} /{" "}
            {currentPage.totalPagesInChunk} · 전체 페이지 {currentPageNumber} /{" "}
            {totalPageCount}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="h-8 px-3 text-[12px]"
            onClick={goPrevPage}
            disabled={currentPageIndex === 0}
          >
            이전
          </Button>
          <Button
            size="sm"
            className="h-8 px-3 text-[12px]"
            onClick={goNextPage}
            disabled={currentPageIndex >= pages.length - 1}
          >
            다음
          </Button>
        </div>
      </div>

      {/* 본문 영역 (페이지 단위) */}
      <div
        ref={contentRef}
        className="relative flex-1 overflow-y-auto px-6 py-6"
        style={{
          // 🔥 페이지 높이 고정
          height: "calc(100vh - 300px)", 
          minHeight: "calc(100vh - 300px)",
          maxHeight: "calc(100vh - 3000px)",
        }}
        onMouseUp={handleTextSelection}
      >
        <div className="max-w-[760px] mx-auto space-y-6">
          {/* 선택 텍스트 툴바 */}
          {toolbarPosition && selectionText && (
            <div
              className="absolute z-50 flex gap-2 bg-white shadow-lg border border-lango rounded-lg p-2"
              style={{
                top: `${toolbarPosition.top}px`,
                left: `${toolbarPosition.left + toolbarPosition.width / 2}px`,
                transform: "translateX(-50%)",
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

          <LessonPageBody
            chunk={pageChunk}
            fontSize={fontSize}
            onSentenceClick={handleSentenceClick}
          />
        </div>
      </div>
    </Card>
  );
};

export default LessonDocViewer;
