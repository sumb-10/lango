// components/Header.tsx
'use client';

import { useAuth } from '@/lib/hooks/useAuth';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { HelpCircle, User, LayoutDashboard, Settings } from 'lucide-react';

interface HeaderProps {
  variant?: 'dashboard' | 'learning';
}

export function Header({ variant = 'learning' }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();
  const { user, profile, logout } = useAuth();

  const handleLogin = () => {
    // Supabase OAuth 엔드포인트로 전체 페이지 리다이렉트
    router.push('/api/auth/login');
    // 또는 window.location.href = '/api/auth/login';
  };

  const handleLogout = async () => {
    try {
      await logout();          // useAuth 안에서 세션/상태/라우팅 처리
      setIsMenuOpen(false);    // 모바일 시트 열려 있으면 닫기
    } catch (e) {
      console.error(e);
    }
  };

  const handleUserAreaClick = () => {
    // 로그인 안 된 상태에서는 바로 로그인으로
    if (!user) {
      handleLogin();
      return;
    }

    // 로그인 되어 있으면: 모바일에서는 Sheet, 데스크탑에서는 mypage
    if (window.innerWidth < 768) {
      setIsMenuOpen(true);
    } else {
      router.push('/mypage');
    }
  };

  const displayName =
    profile?.name ||
    profile?.email?.split('@')[0] ||
    user?.email?.split('@')[0] ||
    'Guest';

  const displayInitial = displayName.charAt(0);
  const displayPlan = profile?.cefr_level
    ? `${profile.cefr_level} · ${profile.subscription_status} 플랜`
    : '플랜 미설정';

  const handleNotImplementedClick = () => {
    // 나중에 여기서 폴더 생성 다이얼로그 or API 연결
    alert("아직 준비 중입니다.");
    // 우선은 폴더 관리 페이지로 보내버리는 것도 UX상 괜찮음
    // router.push("/materials");
    };

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-surface px-4 md:px-8 py-3 md:py-4">
        <div className="flex items-center justify-between max-w-[1440px] mx-auto">
          <div className="flex items-center gap-8">
            <Link href="/dashboard">
              <h1
                className="text-[#1A1A1A] cursor-pointer"
                style={{ fontSize: '22px', fontWeight: 600 }}
              >
                Lango
              </h1>
            </Link>
          </div>

          <div className="flex items-center gap-4">
            {/* 데스크탑 네비게이션 */}
            <div className="hidden md:flex items-center gap-3">
              
                <Button variant="ghost" size="sm" onClick={handleNotImplementedClick}>
                  도움말
                </Button>
              

              {/* 🔹 스토어 메뉴 추가 */}
                <Link href="/store">
                  <Button variant="ghost" size="sm">
                    스토어
                  </Button>
                </Link>

              {variant === 'dashboard' ? (
                <>
                  {user && (
                    <>
                      <Link href="/mypage">
                        <Button variant="ghost" size="sm">
                          내 페이지
                        </Button>
                      </Link>

                      {/* 🔹 로그아웃 버튼 */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleLogout}
                      >
                        로그아웃
                      </Button>
                    </>
                  )}


                  {/* 설정 아이콘은 그대로 둘지, 로그인일 때만 보일지 선택 */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-[#5E5E5E]"
                    onClick={handleNotImplementedClick}
                  >
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  </Button>
                </>
              ) : (
                <Link href="/dashboard">
                  <Button variant="ghost" size="sm">
                    대시보드
                  </Button>
                </Link>
              )}
            </div>

            {/* 우측 유저 영역 */}
            {user ? (
              <div
                className="flex items-center gap-3 ml-4 pl-4 border-l border-[#E6E0D6] cursor-pointer hover:opacity-80 transition-opacity"
                onClick={handleUserAreaClick}
              >
                <div className="hidden sm:block text-right">
                  <div
                    className="text-[#1A1A1A]"
                    style={{ fontSize: '14px', fontWeight: 600 }}
                  >
                    {displayName}
                  </div>
                  <div
                    className="text-[#5E5E5E]"
                    style={{ fontSize: '12px' }}
                  >
                    {displayPlan}
                  </div>
                </div>
                <Avatar className="h-9 w-9 border-2 border-[#76B88A]">
                  <AvatarFallback className="bg-[#76B88A] text-white">
                    {displayInitial}
                  </AvatarFallback>
                </Avatar>
              </div>
            ) : (
              // 로그인 안 된 상태: 아바타 대신 로그인 버튼
              <Button
                className="ml-4"
                variant="outline"
                size="sm"
                onClick={handleLogin}
              >
                <User className="h-4 w-4 mr-2" />
                Google로 로그인
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Menu Sheet */}
      <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
        <SheetContent
          side="right"
          className="bg-[#FAF7F2] border-l border-[#E6E0D6]"
        >
          <SheetHeader>
            <SheetTitle
              className="text-[#1A1A1A]"
              style={{ fontSize: '18px', fontWeight: 600 }}
            >
              메뉴
            </SheetTitle>
          </SheetHeader>

          <div className="mt-8 space-y-1">
            {user && (
              <Link
                href="/mypage"
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-[#76B88A]/10 transition-colors"
              >
                <User className="h-5 w-5 text-[#76B88A]" />
                <span
                  className="text-[#1A1A1A]"
                  style={{ fontSize: '15px', fontWeight: 500 }}
                >
                  내 페이지
                </span>
              </Link>
            )}

            <Link
              href="/help"
              onClick={() => setIsMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-[#76B88A]/10 transition-colors"
            >
              <HelpCircle className="h-5 w-5 text-[#76B88A]" />
              <span
                className="text-[#1A1A1A]"
                style={{ fontSize: '15px', fontWeight: 500 }}
              >
                도움말
              </span>
            </Link>

            {variant === 'learning' && (
              <Link
                href="/dashboard"
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-[#76B88A]/10 transition-colors"
              >
                <LayoutDashboard className="h-5 w-5 text-[#76B88A]" />
                <span
                  className="text-[#1A1A1A]"
                  style={{ fontSize: '15px', fontWeight: 500 }}
                >
                  대시보드
                </span>
              </Link>
            )}

            {variant === 'dashboard' && (
              <button
                onClick={() => setIsMenuOpen(false)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-[#76B88A]/10 transition-colors"
              >
                <Settings className="h-5 w-5 text-[#76B88A]" />
                <span
                  className="text-[#1A1A1A]"
                  style={{ fontSize: '15px', fontWeight: 500 }}
                >
                  설정
                </span>
              </button>
            )}
          </div>

          {/* User Info bottom card */}
          <div className="absolute bottom-8 left-6 right-6">
            <div className="p-4 bg-surface rounded-lg border border-[#E6E0D6]">
              {user ? (
                // 로그인 된 경우: 기존 유저 정보 카드
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12 border-2 border-[#76B88A]">
                    <AvatarFallback className="bg-[#76B88A] text-white">
                      {displayInitial}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div
                      className="text-[#1A1A1A]"
                      style={{ fontSize: '14px', fontWeight: 600 }}
                    >
                      {displayName}
                    </div>
                    <div
                      className="text-[#5E5E5E]"
                      style={{ fontSize: '12px' }}
                    >
                      {displayPlan}
                    </div>
                  </div>
                </div>
              ) : (
                // 로그인 안 된 경우: 로그인 CTA 카드
                <div className="space-y-3">
                  <div
                    className="text-[#1A1A1A]"
                    style={{ fontSize: '14px', fontWeight: 600 }}
                  >
                    로그인하고 나만의 학습 공간을 만들어 보세요
                  </div>
                  <div
                    className="text-[#5E5E5E]"
                    style={{ fontSize: '12px' }}
                  >
                    진행 상황을 저장하고, 나에게 맞는 단어장과 피드백을 받아볼 수 있어요.
                  </div>
                  <Button
                    className="w-full mt-2"
                    variant="outline"
                    onClick={handleLogin}
                  >
                    <User className="h-4 w-4 mr-2" />
                    Google로 로그인
                  </Button>
                </div>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
