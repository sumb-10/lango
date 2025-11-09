import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, MessageSquare, TrendingUp, Award } from 'lucide-react';
import { Header } from "@/components/Header";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <Header variant="dashboard" />

      <main className="container mx-auto px-4 py-16">
        <section className="text-center mb-16">
          <h2 className="text-5xl font-bold mb-6">LLM 기반 언어 학습 플랫폼</h2>
          <p className="text-xl text-muted-ink mb-8">
            당신의 교재를 업로드하고, AI 튜터와 함께 읽기와 쓰기를 학습하세요. 실시간 피드백으로 빠르게 실력을 향상시킬 수 있습니다.
          </p>
          <Link href="/dashboard">
            <Button size="lg" className="text-lg px-8 py-6">
              학습 시작하기(login 안된채로 누르지 마세요! 로그인 안한 상태면 404뜹니다)
            </Button>
          </Link>
        </section>

        <section className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <Card>
            <CardHeader>
              <div className="w-12 h-12 bg-highlight rounded-lg flex items-center justify-center mb-4">
                <BookOpen className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>교재 업로드</CardTitle>
              <CardDescription>
                자신의 교재를 업로드하고, 자동으로 학습지를 생성합니다.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <div className="w-12 h-12 bg-highlight rounded-lg flex items-center justify-center mb-4">
                <MessageSquare className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>실시간 피드백</CardTitle>
              <CardDescription>
                문장 해석, 문법, 어휘에 대해 즉각적인 AI 피드백을 받으세요.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <div className="w-12 h-12 bg-highlight rounded-lg flex items-center justify-center mb-4">
                <TrendingUp className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>작문 평가</CardTitle>
              <CardDescription>
                긴글 작문을 제출하고 종합적인 평가와 개선 제안을 확인하세요.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <div className="w-12 h-12 bg-highlight rounded-lg flex items-center justify-center mb-4">
                <Award className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>CEFR 레벨</CardTitle>
              <CardDescription>
                국제 표준 CEFR 기준으로 실력을 진단하고 추적하세요.
              </CardDescription>
            </CardHeader>
          </Card>
        </section>
      </main>

      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-muted-ink">
          © 2025 Lango - 언어 학습 플랫폼. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
