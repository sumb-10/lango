// app/(dashboard)/essay/page.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { Header } from "@/components/Header";

export default function EssayPage() {
  const [step, setStep] = useState<'topic' | 'write' | 'result'>('topic');
  const [topics, setTopics] = useState<string[]>([]);
  const [selectedTopic, setSelectedTopic] = useState('');
  const [customTopic, setCustomTopic] = useState('');
  const [essay, setEssay] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [topicSource, setTopicSource] = useState<'ai' | 'custom' | null>(null);

  const generateTopics = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/feedback/topic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count: 3 }),
      });

      if (!res.ok) throw new Error('Failed to generate topics');

      const data = await res.json();
      setTopics(data.topics);
    } catch (error) {
      console.error(error);
      toast.error('주제 생성 중 오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  };

  const submitEssay = async () => {
    if (!essay.trim()) {
      toast.error('작문 내용을 입력하세요');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/feedback/macro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: currentTopic,
          essay,
        }),
      });

      if (!res.ok) throw new Error('Failed to evaluate essay');

      const data = await res.json();
      setResult(data);
      setStep('result');
    } catch (error) {
      console.error(error);
      toast.error('평가 중 오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  };

  const currentTopic =
  topicSource === 'ai'
    ? selectedTopic
    : topicSource === 'custom'
    ? customTopic
    : selectedTopic || customTopic;


  let content: React.ReactNode;

  if (step === 'topic') {
    content = (
      <>
        <div>
          <h1 className="text-3xl font-bold mb-2">긴글 작문 평가</h1>
          <p className="text-muted-foreground">
            주제를 선택하고 작문을 시작하세요
          </p>
        </div>

        {/* ✅ 항상 보이는: 주제 생성 카드 */}
        <Card>
          <CardHeader>
            <CardTitle>주제 생성</CardTitle>
            <CardDescription>
              AI가 3개의 주제를 추천해드립니다
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={generateTopics} disabled={loading}>
              {loading && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              <Sparkles className="mr-2 h-4 w-4" />
              주제 생성하기
            </Button>
          </CardContent>
        </Card>

        {/* ✅ AI가 주제를 생성했을 때만 보이는: 추천 주제 리스트 */}
        {topics.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">추천 주제</h2>
            {topics.map((topic, index) => (
              <Card
                key={index}
                className={`cursor-pointer transition-all ${
                  topicSource === 'ai' && selectedTopic === topic
                    ? 'ring-2 ring-primary'
                    : ''
                }`}
                onClick={() => {
                  setSelectedTopic(topic);
                  setTopicSource('ai');    // ✅ AI 주제를 사용하겠다고 명시
                }}
              >
                <CardContent className="pt-6">
                  <p>{topic}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}


        <div className="space-y-4">
          <Card
            className={`cursor-pointer transition-all ${
              topicSource === 'custom' ? 'ring-2 ring-primary' : ''
            }`}
            onClick={() => setTopicSource('custom')} // ✅ 카드 전체 클릭 시 선택
          >
            <CardHeader>
              <CardTitle>직접 주제 입력</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="원하는 주제를 입력하세요..."
                value={customTopic}
                onChange={(e) => {
                  setCustomTopic(e.target.value);
                  setTopicSource('custom');  // ✅ 타이핑 시작하면 자동으로 custom 선택
                }}
                rows={3}
              />
            </CardContent>
          </Card>

          {/* ✅ 현재 선택된 출처 + 내용에 따라 버튼 활성화 */}
          <Button
            onClick={() => setStep('write')}
            disabled={
              !(
                (topicSource === 'ai' && !!selectedTopic) ||
                (topicSource === 'custom' && !!customTopic.trim())
              )
            }
            className="w-full"
          >
            작문 시작하기
          </Button>
        </div>

      </>
    );
  }else if (step === 'write') {
    content = (
      <>
        <div>
          <h1 className="text-3xl font-bold mb-2">작문하기</h1>
          <p className="text-muted-foreground">
            주제: {currentTopic}
          </p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <Textarea
              placeholder="여기에 작문을 입력하세요..."
              value={essay}
              onChange={(e) => setEssay(e.target.value)}
              rows={20}
              className="min-h-[400px]"
            />
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button variant="outline" onClick={() => setStep('topic')}>
            주제 다시 선택
          </Button>
          <Button
            onClick={submitEssay}
            disabled={loading}
            className="flex-1"
          >
            {loading && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            평가 받기
          </Button>
        </div>
      </>
    );
  } else {
    // step === 'result'
    content = (
      <>
        <div>
          <h1 className="text-3xl font-bold mb-2">평가 결과</h1>
          <p className="text-muted-foreground">
            주제: {currentTopic}
          </p>
        </div>

        {/* ✅ 사용자가 작성했던 원문 표시 카드 */}
        {essay && (
          <Card className="border-dashed">
            <CardHeader>
              <CardTitle className="text-lg">내가 작성한 글</CardTitle>
              <CardDescription>
                평가를 읽으면서 원문을 함께 참고해보세요.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm leading-relaxed">
                {essay}
              </p>
            </CardContent>
          </Card>
        )}

        {result && (
          <div className="space-y-4">
            {result.evaluation.map((item: any, index: number) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle>{item.category}</CardTitle>
                  <CardDescription>
                    점수: {item.score}/10
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap">
                    {item.feedback}
                  </p>
                </CardContent>
              </Card>
            ))}

            {result.overall_feedback && (
              <Card>
                <CardHeader>
                  <CardTitle>종합 평가</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap">
                    {result.overall_feedback}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        <Button
          onClick={() => {
            setStep('topic');
            setTopics([]);
            setSelectedTopic('');
            setCustomTopic('');
            setEssay('');
            setResult(null);
            setTopicSource(null);   // ✅ 선택 출처도 초기화
          }}
        >
          새 작문 시작하기
        </Button>
      </>
    );
  }


  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* ✅ 헤더는 페이지 전체 폭 */}
      <Header variant="dashboard" />

      <main className="flex-1 px-4 md:px-8 py-8">
        {/* ✅ 내용만 max-w-4xl에 가둠 */}
        <div className="max-w-4xl mx-auto space-y-8">
          {content}
        </div>
      </main>
    </div>
  );

}
