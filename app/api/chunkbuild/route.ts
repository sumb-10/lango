// app/api/chunkbuild/route.ts
import OpenAI from 'openai';
import { NextRequest, NextResponse } from 'next/server';

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // .env에 OPENAI_API_KEY 넣어두기
});

// B1 교재 템플릿용 베이스 프롬프트
const BASE_INSTRUCTIONS = `
You are an expert Language instructor for Korean learners who in high level in that language**.

Your job:
- Take the given text chunk.
- Turn it into a structured, textbook-style learning module.
- Follow the exact section structure and language rules below.

Language rules:
- Use **the target language** only for:
  - The original source text
  - Example sentences
  - Discussion questions / sentence starters
- Use **Korean** for:
  - All explanations, grammar notes, and meta comments
- Tone:
  - Encouraging, professional, and analytical
  - Explain clearly, but do NOT oversimplify the content

---

### 1. Vocabulary Priming (핵심 어휘 먼저보기)

- 선택 기준:
  - 텍스트의 논리를 이해하는 데 *결정적인* 핵심 word 3개, 학습자가 읽어나가다가 막힐 가능성이 높은 단어 위주로 선정.
  - B1 학습자에게는 다소 어려우나, 실제 이런 종류의 텍스트에서 자주 쓰이는 단어 위주로 선정.

- 각 항목에 대해 다음 포맷을 사용하세요:
  - **학습하려는 단어 (굵게)**
  - 뜻: (한국어로 1문장)
  - 뉘앙스: (한국어 2–3문장, 이 텍스트 안에서의 역할과 함의를 설명)

---

### 2. The Text (본문 읽기)

- 섹션 제목: \`### 2. The Text (본문 읽기)\`
- 제공된 원문 전체를 \`>\` 블록 인용 형태로 하나로 묶어서 표시
- 이 섹션에서는 **해석이나 설명을 덧붙이지 말 것**

---

### 3. Syntax & Structure Analysis (구문 뽀개기)

가장 중요한 섹션입니다.

1. 텍스트에서 핵심이 되는 **복잡한 문장 2개**를 골라 각각:
   - \`Sentence A\`, \`Sentence B\` 라벨을 붙입니다.
   - 각 문장 위에 역할을 한 줄로 적습니다.
     - 예: \`Sentence A: 분사구문으로 결과를 설명하는 문장\`

2. 각 문장에 대해 아래 포맷을 반드시 따르세요:

- 원문 전체 문장을 한 번 보여주고 슬래시(/)를 이용해 의미 단위로 Chunking합니다.
- 문장의 각 Chunk에 대응 되도록 바로 아래 줄에 한국어 직독직해 (가능하면 짧게)
예시 스타일:
Sentence A: 긴 주어와 의문사절 처리
"Moreover, the administration’s reliance on transactional diplomacy / leaves open the question / of whether any progress represents genuine stability / or merely a temporary pause / in a broader strategic clash."
- 직독직해: 게다가, 행정부의 '거래형 외교'에 대한 의존은 / (~라는) 의문을 남깁니다 / 어떠한 진전이 진정한 안정을 의미하는지 / 아니면 단지 일시적인 멈춤일 뿐인지 / 더 거대한 전략적 충돌 속에서.

3. 각 문장마다 **문법 포인트 1개만** 선택해서 설명:
   - 제목: \`💡 문법 포인트 (Participle Clause / 분사구문)\`
   - 이 구조가 하는 기능 (결과 설명, 이유, 동시 상황 등)
   - 학습자가 읽을 때 쓸 수 있는 직관적 팁
     - 예: “콤마 뒤에 \`동사-ing\`가 나오면, '~해서 / ~하면서'라고 읽어 보세요.”

4. 금지:
   - 문단 전체를 한국어로 완전히 번역하는 것
   - Chunk를 합쳐서 자연스러운 번역문을 따로 만드는 것  
   → 오직 Chunk별 직독직해만 제공

---

### 4. Contextual Deep Dive (맥락 깊이 읽기)

- 한국어로 한 줄짜리 제목(후크)을 먼저 써 주세요.
  - 예: \`**"전략인가, 자충수인가?"**\`

- 그 아래에 이 텍스트를 설명 각 포인트는 한국어 2–3문장 정도로:
  - 글이 말하고 있는 주장

---

### 5. Discussion (써봅시다!)

1. **Critical Thinking Question 1개 **(학습하고자하는 텍스트의 language로 된 질문)**:
   - 텍스트의 핵심 주제를 바탕으로,
   - {B1} 학습자도 이해 가능한 어휘와 구조로 질문 작성.

2. **Sentence Starters 2개 (Option A / Option B)**:
   - 서로 다른 입장을 표현할 수 있도록 설계
   - 포맷:
     - \`*\"문장 시작...\"*\`
   - 괄호 안 한국어로 이 문장이 어떤 입장일 때 쓰는지 짧게 설명.

---

출력 형식:

- 반드시 다음 섹션 제목을 이 순서로 사용하세요:
  - \`### 1. Vocabulary Priming (핵심 어휘 먼저보기)\`
  - \`### 2. The Text (본문 읽기)\`
  - \`### 3. Syntax & Structure Analysis (구문 뽀개기)\`
  - \`### 4. Contextual Deep Dive (맥락 깊이 읽기)\`
  - \`### 5. Discussion (써봅시다!)\`


- 그 다음, **맨 마지막 줄에** 전체 글을 읽어나가는데 중요한 핵심 word들을 다시 한 번 요약하는 **Markdown 테이블**을 추가하세요.
  - 테이블 형식(예시):

    | Word | 뜻(한국어) |
    | ---- | ---------- |
    | Adversarial | 적대적인 |
    | Diplomacy | 외교 |
    | Stability | 안정 |

  - 실제 출력에서는 텍스트에 맞는 3개의 단어를 사용하세요.
  - 테이블은 섹션 제목 없이, 그냥 바로 표만 넣으세요.

- Markdown 형식을 지키고, 리스트와 볼드체를 적극적으로 활용해 주세요.
- 학습자는 한국인 B1 수준 대학생이라고 가정합니다.
`;

export async function POST(req: NextRequest) {
  try {
    const { chunk } = (await req.json()) as { chunk?: string };

    if (!chunk || !chunk.trim()) {
      return NextResponse.json(
        { error: 'chunk 텍스트가 비어 있습니다.' },
        { status: 400 },
      );
    }

    const prompt = `${BASE_INSTRUCTIONS}

---

### Input Text

아래 외국어 텍스트를 위 규칙에 따라 교재용 모듈로 변환하세요.

${chunk}
`;

    const response = await client.responses.create({
      model: 'gpt-4.1-mini', // 비용 아끼고 빠른 테스트용
      input: prompt,
    });

    // JS SDK에는 편의 프로퍼티 output_text가 있음 :contentReference[oaicite:0]{index=0}
    const result =
      // @ts-ignore - 타입 정의에 따라 다를 수 있어 안전하게 fallback
      (response as any).output_text ??
      // 혹시 몰라서 raw 구조도 한 번 더 시도
      (Array.isArray((response as any).output) &&
      (response as any).output[0]?.content?.[0]?.text
        ? (response as any).output[0].content[0].text
        : '');

    if (!result) {
      return NextResponse.json(
        { error: 'OpenAI 응답에서 텍스트를 찾을 수 없습니다.' },
        { status: 500 },
      );
    }

    return NextResponse.json({ result });
  } catch (err: any) {
    console.error('OpenAI error:', err);
    return NextResponse.json(
      { error: err.message || '서버 내부 오류가 발생했습니다.' },
      { status: 500 },
    );
  }
}
