// app/(dashboard)/chunkbuild/page.tsx

'use client';

import { useState } from 'react';
import type { SentenceRecord } from '@/lib/processUserMaterial';
import type { ReadingChunk } from '@/types/lesson';

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
            해석 보기
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

export default function ChunkBuildPage() {
  const [rawInput, setRawInput] = useState('');
  const [result, setResult] = useState<string>(''); // 디버그용 JSON
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string | null>(null);
  const [chunk, setChunk] = useState<ReadingChunk | null>(null); // ✅ HTML 렌더용

  const handleConvert = async () => {
    if (!rawInput.trim()) {
      setError('먼저 1차 파이프라인 JSON(SentenceRecord[])을 입력해 주세요.');
      return;
    }

    setError(null);
    setLoading(true);
    setResult('');
    setChunk(null); // ✅ 이전 결과 초기화
    setProgress('입력 JSON 파싱 중...');

    try {
      // 1) 입력 문자열을 SentenceRecord[] 로 파싱
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

      setProgress(`총 ${sentences.length}개의 문장을 기반으로 ReadingChunk를 생성합니다...`);

      // 2) 서버 API 호출
      const res = await fetch('/api/chunkbuild/readingChunk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sentences }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'ReadingChunk API 호출 중 오류가 발생했습니다.');
      }

      const data = await res.json();
      const receivedChunk: ReadingChunk | undefined = data.chunk;

      if (!receivedChunk) {
        throw new Error('응답에서 chunk 데이터를 찾을 수 없습니다.');
      }

      // ✅ HTML 렌더용 상태에 저장
      setChunk(receivedChunk);

      // ✅ 디버그용 JSON도 보고 싶으면 유지
      setResult(JSON.stringify(receivedChunk, null, 2));
      setProgress('ReadingChunk 생성 완료.');
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
        maxWidth: 800,
        margin: '40px auto',
        padding: '0 16px 40px',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
      }}
    >
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>
        SentenceRecord[] → ReadingChunk 변환 테스트
      </h1>
      <p style={{ color: '#555', marginBottom: 24 }}>
        1차 파이프라인(processUserMaterial)에서 생성된 JSON 배열
        (SentenceRecord[])을 아래에 붙여넣은 뒤,&nbsp;
        <b>ReadingChunk</b> 생성 결과를 확인할 수 있는 개발용 페이지입니다.
      </p>

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
          {loading ? '생성 중…' : 'ReadingChunk 생성하기'}
        </button>
        {error && (
          <span style={{ color: 'crimson', fontSize: 13 }}>{error}</span>
        )}
        {!error && progress && (
          <span style={{ color: '#555', fontSize: 13 }}>{progress}</span>
        )}
      </div>

      {/* ✅ 실제 HTML 교재 미리보기 */}
      <section style={{ marginTop: 32 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>
          결과 (ReadingChunk 미리보기)
        </h2>
        {!chunk && !loading && !error && (
          <p style={{ color: '#777', fontSize: 14 }}>
            아직 결과가 없습니다. 1차 파이프라인 JSON을 입력하고 버튼을 눌러보세요.
          </p>
        )}
        {loading && (
          <p style={{ color: '#555', fontSize: 14 }}>
            서버에서 ReadingChunk를 생성 중입니다…
          </p>
        )}
        {chunk && <ReadingChunkView chunk={chunk} />}
      </section>

      {/* 디버그용 Raw JSON (선택적으로 유지) */}
      <section style={{ marginTop: 32 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
          Raw JSON (디버그용)
        </h2>
        {result && (
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
            {result}
          </pre>
        )}
      </section>
    </main>
  );
}
