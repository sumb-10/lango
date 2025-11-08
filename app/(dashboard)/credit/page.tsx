'use client';

import { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Coins, CreditCard } from 'lucide-react';
import { toast } from 'sonner';
import { SUBSCRIPTION_PLANS, CREDIT_PACKAGES } from '@/lib/constants';
import { Header } from "@/components/Header";

// SUBSCRIPTION_PLANS의 키 타입: 'free' | 'basic' | 'standard' | 'pro'
type SubscriptionId = keyof typeof SUBSCRIPTION_PLANS;

export default function CreditPage() {
  const [balance, setBalance] = useState(0);
  const [subscription, setSubscription] = useState<SubscriptionId>('free');
  const [loading, setLoading] = useState(true);

  // ✅ 1) 객체를 렌더링용 배열로 변환하면서 id 붙여주기
  const subscriptionPlans = Object.entries(SUBSCRIPTION_PLANS).map(
    ([id, plan]) => ({
      id: id as SubscriptionId,
      ...plan,
    }),
  );

  // ✅ 2) 현재 구독 플랜 찾기
  const currentPlan = subscriptionPlans.find(
    (p) => p.id === subscription,
  );

  useEffect(() => {
    fetchBalance();
  }, []);

  const fetchBalance = async () => {
    try {
      const res = await fetch('/api/credit/balance');
      if (!res.ok) throw new Error('Failed to fetch balance');
      const data = await res.json();

      setBalance(data.balance ?? 0);
      // 서버에서 'free' | 'basic' 같은 문자열을 준다고 가정
      setSubscription((data.subscription as SubscriptionId) ?? 'free');
    } catch (error) {
      console.error(error);
      toast.error('크레딧 정보를 불러오는 중 오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = (id: string) => {
    // Mock 결제
    toast.success('결제 기능은 준비 중입니다');
    // TODO: Stripe 연동 시 구현
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* ✅ 상단 풀폭 헤더 */}
      <Header variant="learning" />

      {/* ✅ 본문 영역 */}
      <main className="flex-1 px-4 md:px-8 py-6 md:py-8">
        <div className="max-w-[1440px] mx-auto h-full">
          <div className="space-y-8">
            <div>
              <h1 className="text-3xl font-bold mb-2">크레딧 관리</h1>
              <p className="text-muted-foreground">
                크레딧을 구매하거나 구독 플랜을 변경하세요
              </p>
            </div>

            {/* 현재 크레딧 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Coins className="h-5 w-5" />
                  현재 크레딧
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold">
                  {balance.toLocaleString()} 크레딧
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  {/* ✅ 3) currentPlan 사용 + monthlyCredits 구조에 맞춤 */}
                  구독 플랜: {currentPlan?.name || '무료'}
                </p>
              </CardContent>
            </Card>

            {/* 구독 플랜 */}
            <div>
              <h2 className="text-2xl font-bold mb-4">구독 플랜</h2>
              <div className="grid md:grid-cols-3 gap-6">
                {subscriptionPlans.map((plan) => (
                  <Card
                    key={plan.id}
                    className={plan.id === subscription ? 'ring-2 ring-primary' : ''}
                  >
                    <CardHeader>
                      <CardTitle>{plan.name}</CardTitle>
                      <CardDescription>{plan.features.join(' / ')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold mb-4">
                        {plan.price === 0
                          ? '무료'
                          : `₩${plan.price.toLocaleString()}/월`}
                      </p>
                      <ul className="space-y-2 mb-6">
                        {/* ✅ 4) monthlyCredits 사용 */}
                        <li className="text-sm">
                          월 {plan.monthlyCredits.toLocaleString()} 크레딧
                        </li>
                        {plan.features.map((feature, index) => (
                          <li key={index} className="text-sm">
                            {feature}
                          </li>
                        ))}
                      </ul>
                      <Button
                        className="w-full"
                        variant={plan.id === subscription ? 'outline' : 'default'}
                        disabled={plan.id === subscription}
                        onClick={() => handlePurchase(plan.id)}
                      >
                        {plan.id === subscription ? '현재 플랜' : '구독하기'}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* 크레딧 패키지 */}
            <div>
              <h2 className="text-2xl font-bold mb-4">크레딧 패키지</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                {CREDIT_PACKAGES.map((pkg, index) => (
                  <Card key={index}>
                    <CardHeader>
                      <CardTitle>{pkg.credits.toLocaleString()} 크레딧</CardTitle>
                      <CardDescription>
                        {pkg.bonus > 0 && `+${pkg.bonus.toLocaleString()} 보너스`}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold mb-4">
                        ₩{pkg.price.toLocaleString()}
                      </p>
                      <Button
                        className="w-full"
                        onClick={() => handlePurchase(`credits_${pkg.credits}`)}
                      >
                        <CreditCard className="mr-2 h-4 w-4" />
                        구매하기
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
