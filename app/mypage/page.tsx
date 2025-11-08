// app/mypage/page.tsx

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { 
  BookOpen, 
  Calendar, 
  Target, 
  Trophy, 
  Clock, 
  TrendingUp,
  User,
  LogOut
} from 'lucide-react'
import { Header } from "@/components/Header";

export default function MyPage() {
  const [stats, setStats] = useState({
    materialsCount: 0,
    sessionsCount: 0,
    feedbackCount: 0
  })

  useEffect(() => {
    // TODO: Fetch user stats from API
    // For now, using mock data
    setStats({
      materialsCount: 0,
      sessionsCount: 0,
      feedbackCount: 0
    })
  }, [])

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.href = '/'
  }

  const learningStats = [
    { label: "학습 시간", value: "48시간", icon: Clock, color: "#76B88A" },
    { label: "완료한 문서", value: stats.materialsCount + "개", icon: BookOpen, color: "#C8B79A" },
    { label: "연속 학습일", value: "12일", icon: Calendar, color: "#76B88A" },
    { label: "달성률", value: "68%", icon: Target, color: "#C8B79A" }
  ]

  const recentActivity = [
    { title: "The Little Prince - Chapter 5", date: "2025-10-31", progress: 85 },
    { title: "English Grammar - Unit 3", date: "2025-10-30", progress: 60 },
    { title: "Vocabulary List - Set 7", date: "2025-10-29", progress: 100 },
  ]

  const achievements = [
    { name: "첫 학습 완료", description: "첫 문서 학습을 완료했습니다", unlocked: true },
    { name: "꾸준한 학습자", description: "7일 연속 학습을 달성했습니다", unlocked: true },
    { name: "집중력 마스터", description: "한 세션에 2시간 학습", unlocked: true },
    { name: "완벽주의자", description: "10개 문서를 100% 완료", unlocked: false }
  ]

  return (
    <div className="min-h-screen flex bg-[#FAF7F2]">
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <Header variant="dashboard" />

        {/* Main Content */}
        <main className="flex-1 px-4 md:px-8 py-8 overflow-auto">
          <div className="max-w-[1200px] mx-auto">
            {/* Profile Section */}
            <div className="p-8 mb-8 bg-surface border border-[#E6E0D6] rounded-lg">
              <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                <div className="h-24 w-24 border-4 border-[#76B88A] rounded-full bg-[#76B88A] text-white flex items-center justify-center text-2xl font-bold">
                  김
                </div>
                
                <div className="flex-1 text-center md:text-left">
                  <h1 className="text-[#1A1A1A] mb-2" style={{ fontSize: '28px', fontWeight: 600 }}>
                    김민지
                  </h1>
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-4">
                    <span className="px-3 py-1 text-sm bg-[#76B88A]/10 text-[#76B88A] border border-[#76B88A]/20 rounded-md">
                      B1 레벨
                    </span>
                    <span className="px-3 py-1 text-sm bg-[#C8B79A]/10 text-[#C8B79A] border border-[#C8B79A]/20 rounded-md">
                      12주 플랜
                    </span>
                  </div>
                  <p className="text-[#5E5E5E] max-w-[600px]" style={{ fontSize: '15px' }}>
                    영어 학습을 통해 세계와 소통하는 것이 목표입니다. 꾸준히 학습하며 성장하는 중입니다.
                  </p>
                </div>

                <button className="px-4 py-2 border border-[#C8B79A] text-[#C8B79A] hover:bg-[#C8B79A]/10 rounded-lg transition-colors">
                  프로필 수정
                </button>
              </div>
            </div>

            {/* Learning Stats */}
            <div className="mb-8">
              <h2 className="text-[#1A1A1A] mb-4" style={{ fontSize: '20px', fontWeight: 600 }}>
                학습 통계
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {learningStats.map((stat, index) => {
                  const Icon = stat.icon
                  return (
                    <div key={index} className="p-6 bg-surface border border-[#E6E0D6] hover:border-[#76B88A]/60 transition-all rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <Icon className="h-5 w-5" style={{ color: stat.color }} />
                      </div>
                      <div className="text-[#1A1A1A] mb-1" style={{ fontSize: '24px', fontWeight: 600 }}>
                        {stat.value}
                      </div>
                      <div className="text-[#5E5E5E]" style={{ fontSize: '14px' }}>
                        {stat.label}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Current Plan Progress */}
            <div className="p-6 mb-8 bg-surface border border-[#E6E0D6] rounded-lg">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[#1A1A1A]" style={{ fontSize: '18px', fontWeight: 600 }}>
                  12주 플랜 진행률
                </h2>
                <div className="flex items-center gap-2 text-[#76B88A]">
                  <TrendingUp className="h-4 w-4" />
                  <span style={{ fontSize: '14px', fontWeight: 600 }}>8주차 / 12주</span>
                </div>
              </div>
              <div className="w-full bg-[#E6E0D6]/50 rounded-full h-3 mb-3">
                <div 
                  className="bg-[#76B88A] h-3 rounded-full transition-all"
                  style={{ width: '68%' }}
                />
              </div>
              <p className="text-[#5E5E5E]" style={{ fontSize: '14px' }}>
                목표 달성까지 4주 남았습니다. 지금까지 잘 하고 계세요!
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Recent Activity */}
              <div>
                <h2 className="text-[#1A1A1A] mb-4" style={{ fontSize: '20px', fontWeight: 600 }}>
                  최근 활동
                </h2>
                <div className="p-6 bg-surface border border-[#E6E0D6] rounded-lg">
                  <div className="space-y-4">
                    {recentActivity.map((activity, index) => (
                      <div key={index}>
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <p className="text-[#1A1A1A] mb-1" style={{ fontSize: '15px', fontWeight: 500 }}>
                              {activity.title}
                            </p>
                            <p className="text-[#5E5E5E]" style={{ fontSize: '13px' }}>
                              {activity.date}
                            </p>
                          </div>
                          <span 
                            className={`px-2 py-1 text-xs rounded border ${
                              activity.progress === 100 
                                ? 'bg-[#76B88A]/10 text-[#76B88A] border-[#76B88A]/20'
                                : 'bg-[#C8B79A]/10 text-[#C8B79A] border-[#C8B79A]/20'
                            }`}
                          >
                            {activity.progress}%
                          </span>
                        </div>
                        <div className="w-full bg-[#E6E0D6]/50 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all ${
                              activity.progress === 100 ? 'bg-[#76B88A]' : 'bg-[#C8B79A]'
                            }`}
                            style={{ width: `${activity.progress}%` }}
                          />
                        </div>
                        {index < recentActivity.length - 1 && (
                          <div className="mt-4 border-t border-[#E6E0D6]" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Achievements */}
              <div>
                <h2 className="text-[#1A1A1A] mb-4" style={{ fontSize: '20px', fontWeight: 600 }}>
                  업적
                </h2>
                <div className="p-6 bg-surface border border-[#E6E0D6] rounded-lg">
                  <div className="space-y-4">
                    {achievements.map((achievement, index) => (
                      <div key={index}>
                        <div className="flex items-start gap-3">
                          <div className={`mt-1 p-2 rounded-lg ${
                            achievement.unlocked 
                              ? 'bg-[#76B88A]/10' 
                              : 'bg-[#E6E0D6]/30'
                          }`}>
                            <Trophy className={`h-5 w-5 ${
                              achievement.unlocked 
                                ? 'text-[#76B88A]' 
                                : 'text-[#5E5E5E]/40'
                            }`} />
                          </div>
                          <div className="flex-1">
                            <p className={`mb-1 ${
                              achievement.unlocked 
                                ? 'text-[#1A1A1A]' 
                                : 'text-[#5E5E5E]/60'
                            }`} style={{ fontSize: '15px', fontWeight: 500 }}>
                              {achievement.name}
                            </p>
                            <p className={`${
                              achievement.unlocked 
                                ? 'text-[#5E5E5E]' 
                                : 'text-[#5E5E5E]/60'
                            }`} style={{ fontSize: '13px' }}>
                              {achievement.description}
                            </p>
                          </div>
                        </div>
                        {index < achievements.length - 1 && (
                          <div className="mt-4 border-t border-[#E6E0D6]" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Account Settings */}
            <div className="mt-8 p-6 bg-surface border border-[#E6E0D6] rounded-lg">
              <h3 className="text-[#1A1A1A] mb-4" style={{ fontSize: '18px', fontWeight: 600 }}>
                계정 설정
              </h3>
              <button
                onClick={handleLogout}
                className="px-6 py-3 bg-[#D97B7B] text-white rounded-lg hover:bg-[#D97B7B]/90 transition-colors font-semibold flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                로그아웃
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}