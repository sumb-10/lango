# Lango - 언어 학습 플랫폼

LLM 기반 읽기/쓰기 특화 언어 학습 서비스

## 🎯 프로젝트 개요

Lango는 사용자가 직접 업로드한 교재를 바탕으로 AI 튜터와 함께 언어를 학습할 수 있는 플랫폼입니다. 실시간 피드백, 작문 평가, 단어장 관리 등 다양한 기능을 제공합니다.

### 주요 기능

- **교재 업로드 및 자동 학습지 생성**: TXT 파일을 업로드하면 자동으로 청킹 및 학습지 생성
- **Micro 피드백**: 문장 해석, 문법, 어휘, 질문 답변에 대한 즉각적인 AI 피드백
- **Macro 작문 평가**: 긴글 작문에 대한 종합적인 평가 (문법, 어휘, 일관성, 과제 달성)
- **단어장**: Spaced Repetition 알고리즘 기반 복습 시스템
- **폴더 관리**: 교재를 폴더로 정리하고 관리
- **크레딧 시스템**: 사용량 기반 크레딧 차감 및 구독 플랜

## 🛠 기술 스택

- **Frontend**: Next.js 14+ (App Router) + TailwindCSS v4
- **Backend/BFF**: Next.js Route Handlers (Edge 우선)
- **Auth/DB**: Supabase (Google OAuth + PostgreSQL + Storage)
- **LLM API**: OpenAI API (GPT-4o / GPT-4o-mini)
- **Hosting**: Vercel (웹) + Supabase (백엔드/DB)
- **Analytics**: Google Analytics 4 (GA4)
- **Linting**: next lint

## 🗂 프로젝트 구조

```
lango-nextjs/
├── app/                      # Next.js App Router
│   ├── (auth)/              # 인증 관련 페이지
│   ├── (dashboard)/         # 대시보드 레이아웃
│   │   ├── dashboard/       # 대시보드 페이지
│   │   ├── materials/       # 교재 관리
│   │   ├── essay/           # 작문 평가
│   │   ├── vocabulary/      # 단어장
│   │   └── credit/          # 크레딧 관리
│   ├── api/                 # API Route Handlers
│   │   ├── auth/            # 인증 API
│   │   ├── materials/       # 교재 API
│   │   ├── feedback/        # 피드백 API
│   │   ├── vocabulary/      # 단어장 API
│   │   └── credit/          # 크레딧 API
│   ├── layout.tsx           # 루트 레이아웃
│   ├── page.tsx             # 홈페이지
│   └── globals.css          # 글로벌 스타일
├── components/              # React 컴포넌트
│   ├── ui/                  # shadcn/ui 컴포넌트
│   ├── DashboardNav.tsx     # 대시보드 네비게이션
│   ├── FolderManager.tsx    # 폴더 관리
│   ├── DocumentViewer.tsx   # 문서 뷰어 (TODO)
│   └── SidePanel.tsx        # 사이드 패널 (TODO)
├── lib/                     # 유틸리티 및 라이브러리
│   ├── supabase/            # Supabase 클라이언트
│   │   ├── client.ts        # 클라이언트 사이드
│   │   ├── server.ts        # 서버 사이드
│   │   └── database.types.ts # 타입 정의
│   ├── openai.ts            # OpenAI 클라이언트
│   ├── prompts.ts           # LLM 프롬프트
│   ├── utils.ts             # 유틸리티 함수
│   └── constants.ts         # 상수
├── supabase/                # Supabase 설정
│   └── migrations/          # 데이터베이스 마이그레이션
├── public/                  # 정적 파일
├── .env.example             # 환경 변수 예시
├── next.config.ts           # Next.js 설정
├── tailwind.config.ts       # Tailwind CSS 설정
├── tsconfig.json            # TypeScript 설정
├── package.json             # 의존성
├── README.md                # 프로젝트 문서
└── keysetting.md            # 환경 변수 설정 가이드
```

## 📝 주요 API 엔드포인트

### 교재 관리
- `POST /api/materials/upload` - 교재 업로드 및 자동 처리
- `GET /api/materials` - 교재 목록 조회
- `GET /api/materials/[id]` - 교재 상세 조회
- `DELETE /api/materials/[id]` - 교재 삭제

### 피드백
- `POST /api/feedback/micro` - Micro 피드백 생성
- `POST /api/feedback/macro` - Macro 작문 평가
- `POST /api/feedback/topic` - 작문 주제 생성

### 단어장
- `GET /api/vocabulary` - 단어장 목록 조회
- `POST /api/vocabulary` - 단어 추가
- `PATCH /api/vocabulary/[id]/review` - 복습 기록

### 크레딧
- `GET /api/credit/balance` - 크레딧 잔액 조회
- `POST /api/credit/purchase` - 크레딧 구매 (Mock/Stripe)

## 🔐 보안

- Row Level Security (RLS) 정책 활성화
- 환경 변수를 통한 API 키 관리
- HTTPS 강제 (프로덕션)
- CORS 설정