'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { HelpCircle, MessageCircle, Send } from 'lucide-react';
import { toast } from 'sonner';
import type { SentenceRecord } from '@/lib/processUserMaterial';

interface Props {
  materialId: number;
  worksheetId?: number;
  chunkId?: number;
  selectedText: string;
  selectedSentenceMeta?: SentenceRecord | null;
  isMobile?: boolean;
}

type MicroFeedbackType =
  | 'interpretation'
  | 'grammar'
  | 'vocabulary'
  | 'question';

// ✅ 빠른 설명 프리셋 라벨
const presetQuestions = ['문장 해석', '문법 포인트', '어휘 설명'] as const;

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function SidePanel({
  materialId,
  worksheetId,
  chunkId,
  selectedText,
  selectedSentenceMeta,
  isMobile,
}: Props) {
  const [activeTab, setActiveTab] = useState<'question' | 'chat'>('question');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [loading, setLoading] = useState(false);

  // ✅ 빠른 설명 전용 상태
  const [quickAnswer, setQuickAnswer] = useState<string | null>(null);
  const [quickLabel, setQuickLabel] = useState<string | null>(null);

  // ✅ selectedText에서 태그 제거한 실제 문장
  const [normalizedSelectedText, setNormalizedSelectedText] = useState<string>('');

  const scrollRef = useRef<HTMLDivElement>(null);

  // 공통: 마이크로 피드백 API 호출 함수
  const callMicroFeedback = useCallback(
    async (
      type: MicroFeedbackType,
      input: string,
      context?: string,
    ): Promise<string> => {
      setLoading(true);
      try {
        const res = await fetch('/api/feedback/micro', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            feedbackType: type,
            inputText: input,
            context: context ?? normalizedSelectedText ?? '',
            worksheetId: worksheetId ?? null,
          }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => null);
          console.error('Micro feedback API error:', err);
          throw new Error('Failed to get feedback');
        }

        const data = await res.json();
        return data.feedback?.output_text ?? '피드백 내용을 불러올 수 없습니다.';
      } catch (error) {
        console.error(error);
        toast.error('피드백을 가져오는 중 오류가 발생했습니다');
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [worksheetId, normalizedSelectedText],
  );

  // ✅ 프리셋 버튼 클릭 핸들러 (빠른 설명 탭 전용)
  const handlePresetClick = async (preset: (typeof presetQuestions)[number]) => {
    if (!normalizedSelectedText) {
      toast.error('왼쪽에서 먼저 문장을 선택해주세요.');
      return;
    }

    let type: MicroFeedbackType = 'interpretation';
    if (preset === '문장 해석') type = 'interpretation';
    else if (preset === '문법 포인트') type = 'grammar';
    else type = 'vocabulary';

    setQuickLabel(preset);
    setQuickAnswer(null);

    try {
      const answer = await callMicroFeedback(type, normalizedSelectedText);
      setQuickAnswer(answer);
    } catch {
      // 에러 토스트는 callMicroFeedback에서 처리
    }
  };

  // 자유 채팅 질문 핸들러
  const handleChatSend = async () => {
    if (!chatInput.trim()) return;

    const content = chatInput.trim();

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date(),
    };

    setChatMessages((prev) => [...prev, userMessage]);
    setChatInput('');

    try {
      const answer = await callMicroFeedback(
        'question',
        content,
        normalizedSelectedText || undefined,
      );

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: answer,
        timestamp: new Date(),
      };
      setChatMessages((prev) => [...prev, aiMessage]);
    } catch {
      // 에러 토스트는 callMicroFeedback에서 처리
    }
  };

  // 채팅 자동 스크롤
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatMessages, loading]);

  const isSentenceSelected = !!normalizedSelectedText;

  useEffect(() => {
    console.log('[SidePanel] selectedSentenceMeta', selectedSentenceMeta);
  }, [selectedSentenceMeta]);

  // selectedText가 바뀔 때 태그 파싱 + 자동 호출
  useEffect(() => {
    if (!selectedText) {
      setNormalizedSelectedText('');
      setQuickLabel(null);
      setQuickAnswer(null);
      return;
    }

    let text = selectedText;
    let autoType: MicroFeedbackType | null = null;
    let autoLabel: string | null = null;

    if (selectedText.startsWith('[단어 뜻]')) {
      text = selectedText.replace(/^\[단어 뜻\]\s*/, '');
      autoType = 'vocabulary';
      autoLabel = '어휘 설명';
    } else if (selectedText.startsWith('[빠른 설명]')) {
      text = selectedText.replace(/^\[빠른 설명\]\s*/, '');
      autoType = 'interpretation';
      autoLabel = '문장 해석';
    } else if (selectedText.startsWith('[문제 풀이 피드백 요청]')) {
      const content = selectedText.replace(/^\[문제 풀이 피드백 요청\]\s*/, '');

      setNormalizedSelectedText('');
      setQuickLabel(null);
      setQuickAnswer(null);
      setActiveTab('chat');

      (async () => {
        const userMessage: ChatMessage = {
          id: Date.now().toString(),
          role: 'user',
          content,
          timestamp: new Date(),
        };

        setChatMessages((prev) => [...prev, userMessage]);
        setChatInput('');

        try {
          const answer = await callMicroFeedback('question', content, undefined);

          const aiMessage: ChatMessage = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: answer,
            timestamp: new Date(),
          };
          setChatMessages((prev) => [...prev, aiMessage]);
        } catch {
          // 에러 토스트는 callMicroFeedback 안에서 처리
        }
      })();

      return;
    }

    setNormalizedSelectedText(text);

    if (autoType && text) {
      setActiveTab('question');
      setQuickLabel(autoLabel);
      setQuickAnswer(null);

      (async () => {
        try {
          const answer = await callMicroFeedback(autoType as MicroFeedbackType, text);
          setQuickAnswer(answer);
        } catch {
          // 에러 토스트는 callMicroFeedback 안에서 처리
        }
      })();
    }else if (selectedText.startsWith('[작문 피드백 요청]')) {
    const content = selectedText.replace(/^\[작문 피드백 요청\]\s*/, '');

    // 선택 문장 영역은 굳이 안 보여줘도 되면 비워두기
    setNormalizedSelectedText('');
    setQuickLabel(null);
    setQuickAnswer(null);

    // 탭을 채팅으로 전환
    setActiveTab('chat');

    // 채팅 자동 전송
    (async () => {
      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'user',
        content,
        timestamp: new Date(),
      };

      setChatMessages((prev) => [...prev, userMessage]);
      setChatInput('');

      try {
        const answer = await callMicroFeedback(
          'question',
          content,   // 제목 + 지시문 + 내 답변 전체를 질문으로 보냄
          undefined
        );

        const aiMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: answer,
          timestamp: new Date(),
        };
        setChatMessages((prev) => [...prev, aiMessage]);
      } catch {
        // 에러 토스트는 callMicroFeedback 안에서 처리됨
      }
    })();

    // 여기서 끝내고 아래 autoType 로직은 안 타게
    return;
  } else {
      setQuickLabel(null);
      setQuickAnswer(null);
    }
    
  }, [selectedText, callMicroFeedback]);

  return (
    <Card
      className={`
        h-full bg-surface shadow-[0_2px_12px_rgba(0,0,0,0.06)]
        flex flex-col
        ${isMobile ? 'rounded-t-2xl' : 'rounded-xl'}
      `}
    >
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as 'question' | 'chat')}
        className="flex-1 flex flex-col"
      >
        {/* 탭 헤더 */}
        <TabsList className="w-full justify-start rounded-none border-b border-lango bg-transparent p-0 h-auto">
          <TabsTrigger
            value="question"
            className="
              rounded-none border-b-2 border-transparent
              data-[state=active]:border-primary
              data-[state=active]:bg-transparent
              px-4 py-3
              text-sm
              focus-visible:ring-0 focus-visible:ring-offset-0
            "
          >
            <HelpCircle className="h-4 w-4 mr-2" />
            빠른 설명
          </TabsTrigger>

          <TabsTrigger
            value="chat"
            className="
              rounded-none border-b-2 border-transparent
              data-[state=active]:border-primary
              data-[state=active]:bg-transparent
              px-4 py-3
              text-sm
              focus-visible:ring-0 focus-visible:ring-offset-0
            "
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            채팅으로 질문하기
          </TabsTrigger>
        </TabsList>

        {/* 탭 내용 래퍼 */}
        <div className="flex-1">
          {/* 질문/설명 탭 */}
          <TabsContent
            value="question"
            className="m-0 h-full"
          >
            <div className="h-full overflow-auto p-4 md:p-6 space-y-4">
              {isSentenceSelected ? (
                <>
                  {/* 선택된 문장 */}
                  <div>
                    <label
                      className="text-muted-ink mb-2 block text-[12px] font-semibold"
                    >
                      선택된 문장
                    </label>
                    <div className="bg-primary/10 border border-primary/30 p-3 rounded-lg max-h-32 overflow-auto">
                      <p
                        className="text-ink text-[14px]"
                        style={{ lineHeight: '1.6' }}
                      >
                        {normalizedSelectedText}
                      </p>
                    </div>
                  </div>

                  {/* 문장 메타 정보 */}
                  {selectedSentenceMeta && (
                    <div className="mt-4 space-y-3">
                      <div>
                        <p className="text-muted-ink mb-1 text-[12px] font-semibold">
                          해석
                        </p>
                        <div className="bg-background border border-lango rounded-lg p-3">
                          <p
                            className="whitespace-pre-wrap text-ink text-[14px]"
                            style={{ lineHeight: '1.6' }}
                          >
                            {selectedSentenceMeta.translate}
                          </p>
                        </div>
                      </div>

                      <div>
                        <p className="text-muted-ink mb-1 text-[12px] font-semibold">
                          문장 구조
                        </p>
                        <div className="bg-background border border-lango rounded-lg p-3">
                          <p
                            className="whitespace-pre-wrap text-ink text-[14px]"
                            style={{ lineHeight: '1.6' }}
                          >
                            {selectedSentenceMeta.structure}
                          </p>
                        </div>
                      </div>

                      <div>
                        <p className="text-muted-ink mb-1 text-[12px] font-semibold">
                          핵심 포인트
                        </p>
                        <div className="bg-background border border-lango rounded-lg p-3">
                          <p
                            className="whitespace-pre-wrap text-ink text-[14px]"
                            style={{ lineHeight: '1.6' }}
                          >
                            {selectedSentenceMeta.structure_translated}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 빠른 질문 프리셋 */}
                  <div>
                    <label className="text-muted-ink mb-2 block text-[12px] font-semibold">
                      빠른 질문
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {presetQuestions.map((preset) => (
                        <Button
                          key={preset}
                          variant="outline"
                          size="sm"
                          onClick={() => handlePresetClick(preset)}
                          disabled={loading}
                          className="border-primary text-primary hover:bg-primary/10"
                        >
                          {preset}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* 프리셋 답변 영역 */}
                  {(quickAnswer || loading) && (
                    <div className="mt-4">
                      {quickLabel && !loading && (
                        <p className="text-muted-ink mb-2 text-[12px] font-semibold">
                          {quickLabel} 결과
                        </p>
                      )}

                      {loading ? (
                        <div className="space-y-3">
                          <Skeleton className="h-4 w-full bg-lango" />
                          <Skeleton className="h-4 w-5/6 bg-lango" />
                          <Skeleton className="h-4 w-4/6 bg-lango" />
                        </div>
                      ) : (
                        quickAnswer && (
                          <div className="bg-background border border-lango rounded-lg p-3">
                            <p
                              className="whitespace-pre-wrap text-[14px]"
                              style={{ lineHeight: '1.6' }}
                            >
                              {quickAnswer}
                            </p>
                          </div>
                        )
                      )}
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <HelpCircle className="h-12 w-12 text-accent mb-3" />
                  <p
                    className="text-muted-ink text-[14px]"
                    style={{ lineHeight: '1.6' }}
                  >
                    왼쪽에서 문장을 선택하거나
                    <br />
                    아래 채팅 탭에서 자유롭게 질문해 보세요.
                  </p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* 채팅 탭 */}
          <TabsContent
            value="chat"
            className="m-0 h-full"
          >
            <div className="flex flex-col h-full">
              {/* 상단: Q&A 영역 */}
              <div
                ref={scrollRef}
                className="flex-1 overflow-auto p-4 space-y-4"
              >
                {chatMessages.length === 0 && !loading && (
                  <div className="flex flex-col items-center justify-center p-6 text-center">
                    <MessageCircle className="h-12 w-12 text-accent mb-3" />
                    <p
                      className="text-muted-ink text-[14px]"
                      style={{ lineHeight: '1.6' }}
                    >
                      학습 내용에 대해 자유롭게
                      <br />
                      질문해 보세요.
                    </p>
                  </div>
                )}

                {chatMessages.map((message) => {
                  const time = message.timestamp.toLocaleTimeString('ko-KR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  if (message.role === 'user') {
                    return (
                      <div key={message.id} className="flex justify-end">
                        <div className="max-w-full rounded-lg bg-primary text-white px-4 py-3">
                          <p
                            className="whitespace-pre-wrap text-[14px]"
                            style={{ lineHeight: '1.6' }}
                          >
                            {message.content}
                          </p>
                          <span className="text-xs mt-1 block text-white/70">
                            {time}
                          </span>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div key={message.id} className="w-full">
                      <div className="rounded-xl bg-background border border-lango px-4 py-4">
                        <p
                          className="whitespace-pre-wrap text-ink text-[14px]"
                          style={{ lineHeight: '1.7' }}
                        >
                          {message.content}
                        </p>
                        <span className="text-xs mt-3 block text-muted-ink">
                          {time}
                        </span>
                      </div>
                    </div>
                  );
                })}

                {loading && (
                  <div className="w-full">
                    <div className="rounded-xl bg-background border border-dashed border-lango/60 px-4 py-3">
                      <p
                        className="text-muted-ink text-[13px]"
                        style={{ lineHeight: '1.6' }}
                      >
                        답변을 생각중이에요!
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* 하단: 입력 영역 */}
              <div className="border-t border-lango p-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="질문을 입력하세요..."
                    className="flex-1 bg-surface border-lango focus:border-primary focus:ring-primary"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleChatSend();
                      }
                    }}
                  />
                  <Button
                    onClick={handleChatSend}
                    disabled={!chatInput.trim() || loading}
                    className="bg-primary hover:bg-primary/90 text-white px-3"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </Card>
  );
}
