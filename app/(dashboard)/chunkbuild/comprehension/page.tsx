// app/(dashboard)/chunkbuild/comprehension/page.tsx

'use client';

import { useState } from 'react';
import type { SentenceRecord } from '@/lib/processUserMaterial';
import type {
  ComprehensionChunk,
  Question,
  QuestionType,
} from '@/types/lesson';

type CEFRLevel = 'B2' | 'C1' | 'C2';

interface EvalResult {
  score: number;
  comment_ko: string;
  strengths_ko: string;
  tips_ko: string;
}

function QuestionTypeLabel({ type }: { type: QuestionType }) {
  const map: Record<QuestionType, string> = {
    short_answer: '단답형',
    fill_blank: '빈칸 채우기',
    rewrite: '문장 바꾸기',
  };
  return (
    <span
      style={{
        fontSize: 11,
        padding: '2px 8px',
        borderRadius: 999,
        border: '1px solid #d1d5db',
        backgroundColor: '#f3f4f6',
        color: '#4b5563',
      }}
    >
      {map[type]}
    </span>
  );
}

function QuestionView({
  q,
  onEval,
  evalResult,
  evalLoading,
}: {
  q: Question;
  onEval: (answer: string) => void;
  evalResult?: EvalResult | null;
  evalLoading: boolean;
}) {
  const [userAnswer, setUserAnswer] = useState('');

  return (
    <article
      style={{
        padding: '12px 0',
        borderTop: '1px solid #e5e7eb',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          gap: 8,
          marginBottom: 4,
        }}
      >
        <QuestionTypeLabel type={q.type} />
        {q.ref_sentence_ids && q.ref_sentence_ids.length > 0 && (
          <span
            style={{
              fontSize: 11,
              color: '#9ca3af',
            }}
          >
            ref: sentences {q.ref_sentence_ids.join(', ')}
          </span>
        )}
      </div>

      <p
        style={{
          fontSize: 14,
          lineHeight: 1.6,
          marginBottom: 8,
        }}
      >
        {q.stem}
      </p>

      {/* 정답/해설 토글 */}
      <details
        style={{
          marginBottom: 10,
        }}
      >
        <summary
          style={{
            cursor: 'pointer',
            fontSize: 13,
            color: '#2563eb',
            userSelect: 'none',
          }}
        >
          /&gt; 정답 & 해설 보기
        </summary>
        <div
          style={{
            marginTop: 6,
            padding: 8,
            borderRadius: 8,
            backgroundColor: '#f3f4f6',
          }}
        >
          <p
            style={{
              fontSize: 13,
              marginBottom: 4,
            }}
          >
            <strong style={{ fontSize: 12, color: '#6b7280' }}>모범답안:</strong>{' '}
            {q.answer}
          </p>
          {q.explanation && (
            <p
              style={{
                fontSize: 12,
                color: '#4b5563',
              }}
            >
              {q.explanation}
            </p>
          )}
        </div>
      </details>

      {/* 짧은 답안 평가 영역 */}
      <div
        style={{
          marginTop: 8,
        }}
      >
        <label
          style={{
            display: 'block',
            fontSize: 12,
            fontWeight: 600,
            marginBottom: 4,
          }}
        >
          ✏ 내 답안 (짧게 작성해보고 평가 받아보기)
        </label>
        <textarea
          value={userAnswer}
          onChange={(e) => setUserAnswer(e.target.value)}
          rows={3}
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
          placeholder="여기에 영어로 답안을 적어보세요."
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
            onClick={() => onEval(userAnswer)}
            disabled={evalLoading || !userAnswer.trim()}
            style={{
              padding: '6px 12px',
              borderRadius: 999,
              border: 'none',
              cursor:
                evalLoading || !userAnswer.trim() ? 'default' : 'pointer',
              backgroundColor: evalLoading ? '#9ca3af' : '#111827',
              color: '#fff',
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            {evalLoading ? '평가 중…' : '이 답안 평가 받기'}
          </button>
          {!userAnswer.trim() && (
            <span
              style={{
                fontSize: 11,
                color: '#9ca3af',
              }}
            >
              답안을 입력하면 평가 버튼이 활성화됩니다.
            </span>
          )}
        </div>

        {evalResult && (
          <div
            style={{
              marginTop: 8,
              padding: 8,
              borderRadius: 8,
              backgroundColor: '#fefce8',
              border: '1px solid #facc15',
            }}
          >
            <p
              style={{
                fontSize: 12,
                marginBottom: 4,
                color: '#854d0e',
              }}
            >
              점수: {evalResult.score} / 5
            </p>
            <p
              style={{
                fontSize: 12,
                marginBottom: 4,
              }}
            >
              <strong>총평:</strong> {evalResult.comment_ko}
            </p>
            {evalResult.strengths_ko && (
              <p
                style={{
                  fontSize: 12,
                  marginBottom: 4,
                }}
              >
                <strong>잘한 점:</strong> {evalResult.strengths_ko}
              </p>
            )}
            {evalResult.tips_ko && (
              <p
                style={{
                  fontSize: 12,
                }}
              >
                <strong>개선 팁:</strong> {evalResult.tips_ko}
              </p>
            )}
          </div>
        )}
      </div>
    </article>
  );
}

export default function ComprehensionChunkBuildPage() {
  const [rawInput, setRawInput] = useState('');
  const [level, setLevel] = useState<CEFRLevel>('C1');
  const [numQuestions, setNumQuestions] = useState<number>(4);
  const [chunk, setChunk] = useState<ComprehensionChunk | null>(null);
  const [rawResult, setRawResult] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string | null>(null);

  // 질문별 평가 결과/로딩 상태 관리 (id → EvalResult)
  const [evalState, setEvalState] = useState<
    Record<
      string,
      {
        loading: boolean;
        result: EvalResult | null;
      }
    >
  >({});

  const handleConvert = async () => {
    if (!rawInput.trim()) {
      setError('먼저 1차 파이프라인 JSON(SentenceRecord[])을 입력해 주세요.');
      return;
    }

    setError(null);
    setLoading(true);
    setChunk(null);
    setRawResult('');
    setProgress('입력 JSON 파싱 중...');
    setEvalState({});

    try {
      const parsed = JSON.parse(rawInput);

      if (!Array.isArray(parsed)) {
        throw new Error('최상위 구조가 배열이 아닙니다. SentenceRecord[] 형식이어야 합니다.');
      }

      const sentences: SentenceRecord[] = parsed.map((item: any) => ({
        paragraph: item.paragraph,
        sentence_id: item.sentence_id,
        text: item.text,
        translate: item.translate ?? '',
        structure: item.structure ?? '',
        key_point: item.key_point ?? '',
      }));

      if (sentences.length === 0) {
        throw new Error('문장 배열이 비어 있습니다.');
      }

      setProgress(
        `총 ${sentences.length}개의 문장을 기반으로 ComprehensionChunk를 생성합니다...`,
      );

      const res = await fetch('/api/chunkbuild/comprehensionChunk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sentences,
          level,
          numQuestions,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          data.error || 'ComprehensionChunk API 호출 중 오류가 발생했습니다.',
        );
      }

      const data = await res.json();
      const receivedChunk: ComprehensionChunk | undefined = data.chunk;

      if (!receivedChunk) {
        throw new Error('응답에서 chunk 데이터를 찾을 수 없습니다.');
      }

      setChunk(receivedChunk);
      setRawResult(JSON.stringify(receivedChunk, null, 2));
      setProgress('ComprehensionChunk 생성 완료.');
    } catch (err: any) {
      console.error(err);
      setError(err.message || '알 수 없는 오류가 발생했습니다.');
      setProgress(null);
    } finally {
      setLoading(false);
    }
  };

  const handleEval = async (q: Question, userAnswer: string) => {
    if (!userAnswer.trim()) return;

    setEvalState((prev) => ({
      ...prev,
      [q.id]: {
        loading: true,
        result: prev[q.id]?.result ?? null,
      },
    }));

    try {
      const res = await fetch('/api/eval/shortAnswer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionStem: q.stem,
          referenceAnswer: q.answer,
          userAnswer,
          level,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || '짧은 답안 평가 API 호출 중 오류가 발생했습니다.');
      }

      const data = await res.json();
      const result: EvalResult | undefined = data.result;

      if (!result) {
        throw new Error('응답에서 result 데이터를 찾을 수 없습니다.');
      }

      setEvalState((prev) => ({
        ...prev,
        [q.id]: {
          loading: false,
          result,
        },
      }));
    } catch (err) {
      console.error(err);
      setEvalState((prev) => ({
        ...prev,
        [q.id]: {
          loading: false,
          result: prev[q.id]?.result ?? null,
        },
      }));
      alert('평가 중 오류가 발생했습니다. 콘솔을 확인해 주세요.');
    }
  };

  return (
    <main
      style={{
        maxWidth: 800,
        margin: '40px auto',
        padding: '0 16px 40px',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
      }}
    >
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>
        SentenceRecord[] → ComprehensionChunk(읽기 확인 문제) 테스트
      </h1>
      <p style={{ color: '#555', marginBottom: 24 }}>
        1차 파이프라인(processUserMaterial)에서 생성된 JSON 배열
        (SentenceRecord[])을 아래에 붙여넣은 뒤,&nbsp;
        <b>ComprehensionChunk</b> 생성 결과를 확인할 수 있는 개발용 페이지입니다.
        <br />
        문제의 정답과 해설은 토글로 감춰두고, 짧은 답안을 입력하면 LLM으로 평가를 받을 수 있습니다.
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

        <label style={{ fontSize: 13 }}>
          # of questions:&nbsp;
          <input
            type="number"
            min={1}
            max={8}
            value={numQuestions}
            onChange={(e) => setNumQuestions(Number(e.target.value) || 1)}
            style={{
              width: 70,
              padding: '4px 6px',
              borderRadius: 6,
              border: '1px solid #d1d5db',
              fontSize: 13,
            }}
          />
        </label>
      </section>

      <label
        htmlFor="chunk-input"
        style={{ display: 'block', fontWeight: 600, marginBottom: 8 }}
      >
        Input JSON (SentenceRecord[])
      </label>
      <textarea
        id="chunk-input"
        value={rawInput}
        onChange={(e) => setRawInput(e.target.value)}
        placeholder={`예) [\n  {\n    "paragraph": 0,\n    "sentence_id": 0,\n    "text": "...",\n    "translate": "...",\n    "structure": "...",\n    "key_point": "..." \n  },\n  ...\n]`}
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
          {loading ? '생성 중…' : 'ComprehensionChunk 생성하기'}
        </button>
        {error && (
          <span style={{ color: 'crimson', fontSize: 13 }}>{error}</span>
        )}
        {!error && progress && (
          <span style={{ color: '#555', fontSize: 13 }}>{progress}</span>
        )}
      </div>

      {/* HTML 미리보기 */}
      <section style={{ marginTop: 32 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>
          결과 (ComprehensionChunk 미리보기)
        </h2>
        {!chunk && !loading && !error && (
          <p style={{ color: '#777', fontSize: 14 }}>
            아직 결과가 없습니다. 1차 파이프라인 JSON을 입력하고 버튼을 눌러보세요.
          </p>
        )}
        {loading && (
          <p style={{ color: '#555', fontSize: 14 }}>
            서버에서 ComprehensionChunk를 생성 중입니다…
          </p>
        )}
        {chunk && (
          <section
            style={{
              marginTop: 8,
              padding: 16,
              borderRadius: 12,
              border: '1px solid #e5e7eb',
              backgroundColor: '#f9fafb',
            }}
          >
            <h3
              style={{
                fontSize: 18,
                fontWeight: 700,
                marginBottom: 8,
              }}
            >
              {chunk.title}
            </h3>
            {chunk.data.questions.map((q) => (
              <QuestionView
                key={q.id}
                q={q}
                onEval={(answer) => handleEval(q, answer)}
                evalLoading={!!evalState[q.id]?.loading}
                evalResult={evalState[q.id]?.result ?? null}
              />
            ))}
          </section>
        )}
      </section>

      {/* Raw JSON 디버그 */}
      <section style={{ marginTop: 32 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
          Raw JSON (디버그용)
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
