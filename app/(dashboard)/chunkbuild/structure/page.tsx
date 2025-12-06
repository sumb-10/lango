// app/(dashboard)/chunkbuild/structure/page.tsx

'use client';

import { useState } from 'react';
import type { SentenceRecord } from '@/lib/processUserMaterial';
import type { StructureChunk } from '@/types/lesson';

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

function parseSentenceRecords(raw: string): SentenceRecord[] {
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed)) {
    throw new Error('최상위 구조가 배열이 아닙니다. SentenceRecord[] 형식이어야 합니다.');
  }

  return parsed.map((item: any) => ({
    paragraph: item.paragraph,
    sentence_id: item.sentence_id,
    text: item.text,
    translate: item.translate ?? '',
    structure: item.structure ?? '',
    structure_translated: item.structure_translated ?? '',
  }));
}

export default function StructureChunkBuildPage() {
  const [rawInput, setRawInput] = useState('');
  const [chunk, setChunk] = useState<StructureChunk | null>(null);
  const [rawResult, setRawResult] = useState('');
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
    setChunk(null);
    setRawResult('');
    setProgress('입력 JSON 파싱 중...');

    try {
      const sentences = parseSentenceRecords(rawInput);

      if (sentences.length === 0) {
        throw new Error('문장 배열이 비어 있습니다.');
      }

      setProgress(
        `총 ${sentences.length}개의 문장을 기반으로 StructureChunk를 생성합니다...`,
      );

      const res = await fetch('/api/chunkbuild/structureChunk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sentences }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          data.error || 'StructureChunk API 호출 중 오류가 발생했습니다.',
        );
      }

      const data = await res.json();
      const receivedChunk: StructureChunk | undefined = data.chunk;

      if (!receivedChunk) {
        throw new Error('응답에서 chunk 데이터를 찾을 수 없습니다.');
      }

      setChunk(receivedChunk);
      setRawResult(JSON.stringify(receivedChunk, null, 2));
      setProgress('StructureChunk 생성 완료.');
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
        SentenceRecord[] → StructureChunk 변환 테스트
      </h1>
      <p style={{ color: '#555', marginBottom: 24 }}>
        1차 파이프라인(processUserMaterial)에서 생성된 JSON 배열
        (SentenceRecord[])을 아래에 붙여넣은 뒤,&nbsp;
        <b>StructureChunk</b> 생성 결과를 확인할 수 있는 개발용 페이지입니다.
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
          {loading ? '생성 중…' : 'StructureChunk 생성하기'}
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
          결과 (StructureChunk 미리보기)
        </h2>
        {!chunk && !loading && !error && (
          <p style={{ color: '#777', fontSize: 14 }}>
            아직 결과가 없습니다. 1차 파이프라인 JSON을 입력하고 버튼을 눌러보세요.
          </p>
        )}
        {loading && (
          <p style={{ color: '#555', fontSize: 14 }}>
            서버에서 StructureChunk를 생성 중입니다…
          </p>
        )}
        {chunk && <StructureChunkView chunk={chunk} />}
      </section>

      {/* 디버그용 Raw JSON */}
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
