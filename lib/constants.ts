// 구독 플랜
export const SUBSCRIPTION_PLANS = {
  free: {
    name: '무료',
    price: 0,
    monthlyCredits: 0,
    features: ['기본 학습 기능', '월 100 크레딧'],
  },
  basic: {
    name: '베이직',
    price: 9900,
    monthlyCredits: 1000,
    features: ['모든 학습 기능', '월 1,000 크레딧', '우선 지원'],
  },
  standard: {
    name: '스탠다드',
    price: 19900,
    monthlyCredits: 3000,
    features: ['모든 학습 기능', '월 3,000 크레딧', '우선 지원', 'CEFR 레벨 평가'],
  },
  pro: {
    name: '프로',
    price: 39900,
    monthlyCredits: 10000,
    features: [
      '모든 학습 기능',
      '월 10,000 크레딧',
      '최우선 지원',
      'CEFR 레벨 평가',
      '고급 분석',
    ],
  },
} as const;

// 크레딧 패키지
export const CREDIT_PACKAGES = [
  { credits: 500, price: 5000, bonus: 0 },
  { credits: 1000, price: 9000, bonus: 100 },
  { credits: 3000, price: 25000, bonus: 500 },
  { credits: 5000, price: 40000, bonus: 1000 },
] as const;

// CEFR 레벨
export const CEFR_LEVELS = [
  { value: 'A1', label: 'A1 - 초급', description: '기초적인 일상 표현 이해' },
  { value: 'A2', label: 'A2 - 초중급', description: '간단한 의사소통 가능' },
  { value: 'B1', label: 'B1 - 중급', description: '일상적인 주제 이해 및 표현' },
  { value: 'B2', label: 'B2 - 중상급', description: '복잡한 텍스트 이해' },
  { value: 'C1', label: 'C1 - 고급', description: '유창하고 자연스러운 표현' },
  { value: 'C2', label: 'C2 - 최상급', description: '원어민 수준의 이해와 표현' },
] as const;

// 앱 설정
export const APP_CONFIG = {
  name: 'Lango',
  description: 'LLM 기반 언어 학습 플랫폼',
  maxFileSize: 10 * 1024 * 1024, // 10MB
  supportedFileTypes: ['txt'], // MVP는 TXT만
  chunkSize: 500, // 청크 크기 (문자 수)
} as const;

// 피드백 타입
export const FEEDBACK_TYPES = {
  interpretation: { label: '해석', icon: '📖', cost: 10 },
  grammar: { label: '문법', icon: '✏️', cost: 10 },
  vocabulary: { label: '어휘', icon: '📚', cost: 10 },
  question: { label: '질문', icon: '❓', cost: 10 },
  macro: { label: '작문 평가', icon: '📝', cost: 50 },
} as const;
