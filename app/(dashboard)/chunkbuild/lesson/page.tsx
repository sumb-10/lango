// app/(dashboard)/chunkbuild/lesson/page.tsx

'use client';

import { useState } from 'react';
import type { SentenceRecord } from '@/lib/processUserMaterial';
import type {
  LessonJson,
  LessonChunk,
  ReadingChunk,
  StructureChunk,
  VocabChunk,
  BackgroundChunk,
  ComprehensionChunk,
  WritingChunk,
  Question,
  WritingPrompt,
} from '@/types/lesson';

type CEFRLevel = 'B2' | 'C1' | 'C2';

// ---------- 개별 Chunk View들 ----------

function ReadingChunkView({ chunk }: { chunk: ReadingChunk }) {
  return (
    <section
      style={{
        marginTop: 24,
        padding: 16,
        borderRadius: 12,
        border: '1px solid #e5e7eb',
        backgroundColor: '#f9fafb',
      }}
    >
      <h2
        style={{
          fontSize: 18,
          fontWeight: 700,
          marginBottom: 12,
        }}
      >
        {chunk.title}
      </h2>

      {chunk.data.paragraphs.map((p) => (
        <article
          key={p.paragraph}
          style={{
            padding: '12px 0',
            borderTop: '1px solid #e5e7eb',
          }}
        >
          <p
            style={{
              marginBottom: 8,
              lineHeight: 1.6,
              fontSize: 14,
            }}
          >
            {p.text}
          </p>

          <details>
            <summary
              style={{
                cursor: 'pointer',
                fontSize: 13,
                color: '#2563eb',
                userSelect: 'none',
              }}
            >
              /&gt; 해석 보기
            </summary>
            <p
              style={{
                marginTop: 6,
                lineHeight: 1.6,
                fontSize: 13,
                color: '#374151',
              }}
            >
              {p.translate}
            </p>
          </details>
        </article>
      ))}
    </section>
  );
}

function StructureChunkView({ chunk }: { chunk: StructureChunk }) {
  return (
    <section
      style={{
        marginTop: 24,
        padding: 16,
        borderRadius: 12,
        border: '1px solid #e5e7eb',
        backgroundColor: '#f9fafb',
      }}
    >
      <h2
        style={{
          fontSize: 18,
          fontWeight: 700,
          marginBottom: 8,
        }}
      >
        {chunk.title}
      </h2>

      <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 12 }}>
        각 문장의 구조와 핵심 표현을 정리한 영역입니다.
      </p>

      <ul
        style={{
          listStyle: 'none',
          padding: 0,
          margin: 0,
        }}
      >
        {chunk.data.items.map((item) => (
          <li
            key={`${item.paragraph}-${item.sentence_id}`}
            style={{
              padding: '10px 0',
              borderTop: '1px solid #e5e7eb',
            }}
          >
            <div
              style={{
                fontSize: 12,
                color: '#9ca3af',
                marginBottom: 4,
              }}
            >
              P{item.paragraph} · S{item.sentence_id}
            </div>
            <p
              style={{
                fontSize: 14,
                marginBottom: 4,
              }}
            >
              {item.text}
            </p>
            <p
              style={{
                fontSize: 13,
                color: '#111827',
                marginBottom: 4,
              }}
            >
              <strong>Structure: </strong>
              {item.structure}
            </p>
            <p
              style={{
                fontSize: 13,
                color: '#4b5563',
              }}
            >
              <strong>Key Point: </strong>
              {item.structure_translated}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}

function VocabChunkView({ chunk }: { chunk: VocabChunk }) {
  const { items, level } = chunk.data;

  return (
    <section
      style={{
        marginTop: 24,
        padding: 16,
        borderRadius: 12,
        border: '1px solid #e5e7eb',
        backgroundColor: '#f9fafb',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          marginBottom: 8,
        }}
      >
        <h2
          style={{
            fontSize: 18,
            fontWeight: 700,
          }}
        >
          {chunk.title}
        </h2>
        <span
          style={{
            fontSize: 11,
            color: '#6b7280',
          }}
        >
          Level: {level}
        </span>
      </div>

      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: 13,
          marginTop: 4,
        }}
      >
        <thead>
          <tr>
            <th
              style={{
                textAlign: 'left',
                padding: '6px 4px',
                borderBottom: '1px solid #e5e7eb',
              }}
            >
              Word
            </th>
            <th
              style={{
                textAlign: 'left',
                padding: '6px 4px',
                borderBottom: '1px solid #e5e7eb',
              }}
            >
              POS
            </th>
            <th
              style={{
                textAlign: 'left',
                padding: '6px 4px',
                borderBottom: '1px solid #e5e7eb',
              }}
            >
              Meaning (KO)
            </th>
            <th
              style={{
                textAlign: 'left',
                padding: '6px 4px',
                borderBottom: '1px solid #e5e7eb',
              }}
            >
              Example
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((v, idx) => (
            <tr key={`${v.word}-${idx}`}>
              <td
                style={{
                  padding: '6px 4px',
                  borderBottom: '1px solid #f3f4f6',
                  fontWeight: 600,
                }}
              >
                {v.word}
              </td>
              <td
                style={{
                  padding: '6px 4px',
                  borderBottom: '1px solid #f3f4f6',
                  color: '#6b7280',
                }}
              >
                {v.pos}
              </td>
              <td
                style={{
                  padding: '6px 4px',
                  borderBottom: '1px solid #f3f4f6',
                }}
              >
                {v.meaning_ko}
              </td>
              <td
                style={{
                  padding: '6px 4px',
                  borderBottom: '1px solid #f3f4f6',
                  color: '#374151',
                }}
              >
                {v.example_en}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function BackgroundChunkView({ chunk }: { chunk: BackgroundChunk }) {
  const { paragraphs, key_terms } = chunk.data;

  return (
    <section
      style={{
        marginTop: 24,
        padding: 16,
        borderRadius: 12,
        border: '1px solid #e5e7eb',
        backgroundColor: '#f9fafb',
      }}
    >
      <h2
        style={{
          fontSize: 18,
          fontWeight: 700,
          marginBottom: 8,
        }}
      >
        {chunk.title}
      </h2>

      {key_terms && key_terms.length > 0 && (
        <div
          style={{
            marginBottom: 12,
            display: 'flex',
            flexWrap: 'wrap',
            gap: 6,
          }}
        >
          {key_terms.map((term, idx) => (
            <span
              key={`${term}-${idx}`}
              style={{
                fontSize: 11,
                padding: '4px 8px',
                borderRadius: 999,
                border: '1px solid #d1d5db',
                backgroundColor: '#f3f4f6',
                color: '#374151',
              }}
            >
              {term}
            </span>
          ))}
        </div>
      )}

      {paragraphs.map((p, idx) => (
        <p
          key={idx}
          style={{
            marginBottom: 10,
            lineHeight: 1.7,
            fontSize: 14,
            color: '#111827',
          }}
        >
          {p}
        </p>
      ))}
    </section>
  );
}

function ComprehensionChunkView({ chunk }: { chunk: ComprehensionChunk }) {
  const { questions } = chunk.data;

  // q.id 기준으로 유저 답안 / 제출 상태를 로컬에 저장
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState<Record<string, boolean>>({});

  const handleChange = (id: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = (id: string) => {
    setSubmitted((prev) => ({ ...prev, [id]: true }));
    // TODO: 추후 여기서 LLM 평가 API 호출 or 서버 저장 로직 붙이면 됨
  };

  return (
    <section
      style={{
        marginTop: 24,
        padding: 16,
        borderRadius: 12,
        border: '1px solid #e5e7eb',
        backgroundColor: '#f9fafb',
      }}
    >
      <h2
        style={{
          fontSize: 18,
          fontWeight: 700,
          marginBottom: 8,
        }}
      >
        {chunk.title}
      </h2>

      <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 8 }}>
        각 문항에 대해 직접 답안을 작성해 보고,&nbsp;
        <b>정답/해설 토글</b>로 모범 답안과 비교해 보세요. (현재는 로컬 미리보기용입니다.)
      </p>

      <ol style={{ paddingLeft: 20, fontSize: 14 }}>
        {questions.map((q: Question) => (
          <li
            key={q.id}
            style={{
              marginBottom: 16,
              paddingBottom: 16,
              borderBottom: '1px solid #e5e7eb',
            }}
          >
            {/* 문제 본문 */}
            <div
              style={{
                fontSize: 13,
                marginBottom: 6,
              }}
            >
              <span
                style={{
                  display: 'inline-block',
                  marginRight: 8,
                  padding: '2px 6px',
                  borderRadius: 999,
                  backgroundColor: '#eef2ff',
                  fontSize: 11,
                  color: '#4f46e5',
                  textTransform: 'uppercase',
                }}
              >
                {q.type}
              </span>
              {q.stem}
            </div>

            {/* 유저 답안 작성 영역 */}
            <div
              style={{
                marginTop: 6,
                marginBottom: 6,
              }}
            >
              <label
                style={{
                  display: 'block',
                  fontSize: 12,
                  color: '#6b7280',
                  marginBottom: 4,
                }}
              >
                나의 답안
              </label>
              <textarea
                value={answers[q.id] ?? ''}
                onChange={(e) => handleChange(q.id, e.target.value)}
                rows={4}
                placeholder="이곳에 영어로 답안을 작성해 보세요."
                style={{
                  width: '100%',
                  padding: 8,
                  borderRadius: 8,
                  border: '1px solid #d1d5db',
                  fontSize: 13,
                  fontFamily:
                    'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
                  resize: 'vertical',
                  boxSizing: 'border-box',
                }}
              />
              <div
                style={{
                  marginTop: 6,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  flexWrap: 'wrap',
                }}
              >
                <button
                  type="button"
                  onClick={() => handleSubmit(q.id)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 999,
                    border: 'none',
                    cursor: 'pointer',
                    backgroundColor: '#111827',
                    color: '#fff',
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  이 답안 제출 (로컬)
                </button>
                {submitted[q.id] && (
                  <span
                    style={{
                      fontSize: 12,
                      color: '#16a34a',
                    }}
                  >
                    이 문항의 답안이 제출되었습니다. (현재는 브라우저 메모리에서만 유지)
                  </span>
                )}
              </div>
            </div>

            {/* 정답 / 해설 토글 */}
            <details style={{ marginTop: 6 }}>
              <summary
                style={{
                  fontSize: 12,
                  color: '#2563eb',
                  cursor: 'pointer',
                  userSelect: 'none',
                }}
              >
                정답/해설 보기
              </summary>
              <div
                style={{
                  marginTop: 6,
                  fontSize: 13,
                  color: '#111827',
                }}
              >
                <p>
                  <strong>Model Answer:</strong> {q.answer}
                </p>
                {q.explanation && (
                  <p
                    style={{
                      marginTop: 4,
                      color: '#4b5563',
                    }}
                  >
                    <strong>해설(KO):</strong> {q.explanation}
                  </p>
                )}
              </div>
            </details>
          </li>
        ))}
      </ol>
    </section>
  );
}

function WritingChunkView({ chunk }: { chunk: WritingChunk }) {
  const { prompts } = chunk.data;

  // prompt.id 기준으로 유저 작성 답안 / 제출 상태
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState<Record<string, boolean>>({});

  const handleChange = (id: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = (id: string) => {
    setSubmitted((prev) => ({ ...prev, [id]: true }));
    // TODO: 짧은 작문 평가용 LLM API를 붙일 때 여기서 호출
  };

  return (
    <section
      style={{
        marginTop: 24,
        padding: 16,
        borderRadius: 12,
        border: '1px solid #e5e7eb',
        backgroundColor: '#f9fafb',
      }}
    >
      <h2
        style={{
          fontSize: 18,
          fontWeight: 700,
          marginBottom: 8,
        }}
      >
        {chunk.title}
      </h2>

      <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 8 }}>
        각 작문 문제에 대해 자유롭게 답안을 작성해 보세요. 현재는 개발용으로,&nbsp;
        <b>브라우저 메모리에서만</b> 답안을 저장합니다.
      </p>

      {prompts.map((p: WritingPrompt) => (
        <article
          key={p.id}
          style={{
            padding: '12px 0',
            borderTop: '1px solid #e5e7eb',
          }}
        >
          <h3
            style={{
              fontSize: 15,
              fontWeight: 600,
              marginBottom: 6,
            }}
          >
            {p.title}
          </h3>

          {/* 문제 지문 */}
          <pre
            style={{
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              fontSize: 13,
              fontFamily:
                'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
              marginBottom: 6,
            }}
          >
            {p.prompt}
          </pre>

          {p.guidance_ko && (
            <p
              style={{
                fontSize: 12,
                color: '#4b5563',
                marginBottom: 4,
              }}
            >
              {p.guidance_ko}
            </p>
          )}
          <p
            style={{
              fontSize: 12,
              color: '#9ca3af',
              marginBottom: 8,
            }}
          >
            최소 문단 수: {p.min_paragraphs}, 최소 문장 수: {p.min_sentences}
          </p>

          {/* 유저 답안 작성 영역 */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: 12,
                color: '#6b7280',
                marginBottom: 4,
              }}
            >
              나의 작문 답안
            </label>
            <textarea
              value={answers[p.id] ?? ''}
              onChange={(e) => handleChange(p.id, e.target.value)}
              rows={8}
              placeholder="문제에서 요구하는 내용에 맞추어 1–2개 단락으로 영어 작문을 작성해 보세요."
              style={{
                width: '100%',
                padding: 10,
                borderRadius: 8,
                border: '1px solid #d1d5db',
                fontSize: 13,
                fontFamily:
                  'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
                resize: 'vertical',
                boxSizing: 'border-box',
              }}
            />
            <div
              style={{
                marginTop: 8,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                flexWrap: 'wrap',
              }}
            >
              <button
                type="button"
                onClick={() => handleSubmit(p.id)}
                style={{
                  padding: '8px 14px',
                  borderRadius: 999,
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: '#111827',
                  color: '#fff',
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                이 작문 답안 제출 (로컬)
              </button>
              {submitted[p.id] && (
                <span
                  style={{
                    fontSize: 12,
                    color: '#16a34a',
                  }}
                >
                  이 문제의 답안이 제출되었습니다. (현재는 화면 내 미리보기용)
                </span>
              )}
            </div>
          </div>
        </article>
      ))}
    </section>
  );
}

// ---------- Lesson 전체 View ----------

function LessonView({ lesson }: { lesson: LessonJson }) {
  const sorted = [...lesson.chunks].sort((a, b) => a.order - b.order);

  return (
    <section style={{ marginTop: 32 }}>
      <h2
        style={{
          fontSize: 22,
          fontWeight: 800,
          marginBottom: 4,
        }}
      >
        {lesson.title}
      </h2>
      <p
        style={{
          fontSize: 13,
          color: '#6b7280',
          marginBottom: 16,
        }}
      >
        Level: {lesson.level} · 총 {lesson.chunks.length}개 섹션
      </p>

      {sorted.map((chunk) => {
        switch (chunk.type) {
          case 'reading':
            return (
              <ReadingChunkView
                key={chunk.id}
                chunk={chunk as ReadingChunk}
              />
            );
          case 'structure':
            return (
              <StructureChunkView
                key={chunk.id}
                chunk={chunk as StructureChunk}
              />
            );
          case 'vocab':
            return (
              <VocabChunkView
                key={chunk.id}
                chunk={chunk as VocabChunk}
              />
            );
          case 'background':
            return (
              <BackgroundChunkView
                key={chunk.id}
                chunk={chunk as BackgroundChunk}
              />
            );
          case 'comprehension':
            return (
              <ComprehensionChunkView
                key={chunk.id}
                chunk={chunk as ComprehensionChunk}
              />
            );
          case 'writing':
            return (
              <WritingChunkView
                key={chunk.id}
                chunk={chunk as WritingChunk}
              />
            );
          default:
            return null;
        }
      })}
    </section>
  );
}

export default function LessonDevBuildPage() {
  const [rawInput, setRawInput] = useState('');
  const [level, setLevel] = useState<CEFRLevel>('C1');
  const [lesson, setLesson] = useState<LessonJson | null>(null);
  const [rawResult, setRawResult] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string | null>(null);

  const handleConvert = async () => {
    if (!rawInput.trim()) {
      setError('먼저 1차 파이프라인 JSON(SentenceRecord[])을 입력해 주세요.');
      return;
    }

    setError(null);
    setLoading(true);
    setLesson(null);
    setRawResult('');
    setProgress('입력 JSON 파싱 중...');

    try {
      const parsed = JSON.parse(rawInput);

      if (!Array.isArray(parsed)) {
        throw new Error(
          '최상위 구조가 배열이 아닙니다. SentenceRecord[] 형식이어야 합니다.',
        );
      }

      const sentences: SentenceRecord[] = parsed.map((item: any) => ({
        paragraph: item.paragraph,
        sentence_id: item.sentence_id,
        text: item.text,
        translate: item.translate ?? '',
        structure: item.structure ?? '',
        structure_translated: item.structure_translated ?? '',
      }));

      if (sentences.length === 0) {
        throw new Error('문장 배열이 비어 있습니다.');
      }

      setProgress(
        `총 ${sentences.length}개의 문장을 기반으로 통합 LessonJson을 생성합니다...`,
      );

      const res = await fetch('/api/chunkbuild/lessonDev', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sentences,
          level,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          data.error || 'lessonDev API 호출 중 오류가 발생했습니다.',
        );
      }

      const data = await res.json();
      const receivedLesson: LessonJson | undefined = data.lesson;

      if (!receivedLesson) {
        throw new Error('응답에서 lesson 데이터를 찾을 수 없습니다.');
      }

      setLesson(receivedLesson);
      setRawResult(JSON.stringify(receivedLesson, null, 2));
      setProgress('LessonJson 생성 완료.');
    } catch (err: any) {
      console.error(err);
      setError(err.message || '알 수 없는 오류가 발생했습니다.');
      setProgress(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      style={{
        maxWidth: 900,
        margin: '40px auto',
        padding: '0 16px 40px',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
      }}
    >
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>
        SentenceRecord[] → 통합 LessonJson 변환 테스트
      </h1>
      <p style={{ color: '#555', marginBottom: 24 }}>
        1차 파이프라인(processUserMaterial)에서 생성된 JSON 배열
        (SentenceRecord[])을 아래에 붙여넣은 뒤,&nbsp;
        <b>Reading / Comprehension / Structure / Vocab / Background / Writing</b>
        를 모두 포함한 통합 교재(LessonJson)를 생성해보는 개발용 페이지입니다.
      </p>

      <section
        style={{
          marginBottom: 16,
          display: 'flex',
          gap: 12,
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        <label style={{ fontSize: 13 }}>
          Level:&nbsp;
          <select
            value={level}
            onChange={(e) => setLevel(e.target.value as CEFRLevel)}
            style={{
              padding: '4px 8px',
              borderRadius: 6,
              border: '1px solid #d1d5db',
              fontSize: 13,
            }}
          >
            <option value="B2">B2</option>
            <option value="C1">C1</option>
            <option value="C2">C2</option>
          </select>
        </label>
      </section>

      <label
        htmlFor="lesson-input"
        style={{ display: 'block', fontWeight: 600, marginBottom: 8 }}
      >
        Input JSON (SentenceRecord[])
      </label>
      <textarea
        id="lesson-input"
        value={rawInput}
        onChange={(e) => setRawInput(e.target.value)}
        placeholder={`예) [\n  {\n    "paragraph": 0,\n    "sentence_id": 0,\n    "text": "...",\n    "translate": "...",\n    "structure": "...",\n    "structure_translated": "..." \n  },\n  ...\n]`}
        rows={16}
        style={{
          width: '100%',
          padding: 12,
          borderRadius: 8,
          border: '1px solid #ccc',
          fontFamily: 'Menlo, ui-monospace, SFMono-Regular, Monaco, Consolas',
          fontSize: 13,
          resize: 'vertical',
          boxSizing: 'border-box',
        }}
      />

      <div
        style={{
          marginTop: 16,
          display: 'flex',
          gap: 12,
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        <button
          type="button"
          onClick={handleConvert}
          disabled={loading}
          style={{
            padding: '10px 18px',
            borderRadius: 999,
            border: 'none',
            cursor: loading ? 'default' : 'pointer',
            backgroundColor: loading ? '#999' : '#111827',
            color: '#fff',
            fontWeight: 600,
            fontSize: 14,
          }}
        >
          {loading ? '생성 중…' : '통합 LessonJson 생성하기'}
        </button>
        {error && (
          <span style={{ color: 'crimson', fontSize: 13 }}>{error}</span>
        )}
        {!error && progress && (
          <span style={{ color: '#555', fontSize: 13 }}>{progress}</span>
        )}
      </div>

      {/* HTML 교재 미리보기 */}
      <section style={{ marginTop: 32 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>
          결과 (통합 Lesson HTML 미리보기)
        </h2>
        {!lesson && !loading && !error && (
          <p style={{ color: '#777', fontSize: 14 }}>
            아직 결과가 없습니다. 1차 파이프라인 JSON을 입력하고 버튼을 눌러보세요.
          </p>
        )}
        {loading && (
          <p style={{ color: '#555', fontSize: 14 }}>
            서버에서 LessonJson을 생성 중입니다…
          </p>
        )}
        {lesson && <LessonView lesson={lesson} />}
      </section>

      {/* 디버그용 Raw JSON */}
      <section style={{ marginTop: 32 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
          Raw Lesson JSON (디버그용)
        </h2>
        {rawResult && (
          <pre
            style={{
              marginTop: 8,
              padding: 16,
              backgroundColor: '#f5f5f5',
              borderRadius: 8,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              fontSize: 13,
            }}
          >
            {rawResult}
          </pre>
        )}
      </section>
    </main>
  );
}
