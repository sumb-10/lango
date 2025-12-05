// app/(dashboard)/chunkbuild/page.tsx

'use client';

import { useState } from 'react';

// 한 청크당 최대 단어 수 (원하는 대로 조절 가능)
const MAX_WORDS_PER_CHUNK = 500;

// 1) 텍스트를 문장 단위로 쪼개기
function splitTextIntoSentences(text: string): string[] {
  const cleaned = text.trim();
  if (!cleaned) return [];

  // 대충 영어용 문장 나누기 (., ?, ! 기준)
  const sentenceRegex = /[^.!?]+[.!?]+["')\]]*|[^.!?]+$/g;
  const matches = cleaned.match(sentenceRegex);

  if (!matches) return [cleaned];
  return matches.map((s) => s.trim()).filter(Boolean);
}

// 2) 문장 배열을 단어 수 기준으로 chunk 묶기
function splitSentencesIntoChunks(
  sentences: string[],
  maxWordsPerChunk: number = MAX_WORDS_PER_CHUNK,
): string[] {
  const chunks: string[] = [];

  let currentChunk: string[] = [];
  let currentWordCount = 0;

  for (const sentence of sentences) {
    const wordCount = sentence.split(/\s+/).filter(Boolean).length;

    // 아직 아무것도 없는 상태면 그냥 시작
    if (currentChunk.length === 0) {
      currentChunk.push(sentence);
      currentWordCount = wordCount;
      continue;
    }

    // 이 문장을 추가해도 limit 안 넘으면 같은 청크에 추가
    if (currentWordCount + wordCount <= maxWordsPerChunk) {
      currentChunk.push(sentence);
      currentWordCount += wordCount;
    } else {
      // 지금까지 모은 문장으로 하나의 청크 완성
      chunks.push(currentChunk.join(' '));

      // 새 청크 시작
      currentChunk = [sentence];
      currentWordCount = wordCount;
    }
  }

  // 마지막 청크 처리
  if (currentChunk.length > 0) {
    chunks.push(currentChunk.join(' '));
  }

  return chunks;
}

// 3) 전체 텍스트 → 문장 단위 → 청크 배열
function chunkLongText(text: string, maxWordsPerChunk = MAX_WORDS_PER_CHUNK): string[] {
  const sentences = splitTextIntoSentences(text);
  if (sentences.length === 0) return [];
  return splitSentencesIntoChunks(sentences, maxWordsPerChunk);
}

export default function ChunkBuildPage() {
  const [chunk, setChunk] = useState('');
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string | null>(null);

  const handleConvert = async () => {
    if (!chunk.trim()) {
      setError('먼저 텍스트를 입력해 주세요.');
      return;
    }

    setError(null);
    setLoading(true);
    setResult('');
    setProgress(null);

    try {
      // 1) 긴 글을 여러 청크로 나누기
      const chunks = chunkLongText(chunk, MAX_WORDS_PER_CHUNK);

      if (chunks.length === 0) {
        throw new Error('청크를 생성하지 못했습니다.');
      }

      if (chunks.length === 1) {
        setProgress('1개의 청크로 처리합니다.');
      } else {
        setProgress(`총 ${chunks.length}개의 청크로 분할되었습니다.`);
      }

      let combinedResult = '';

      // 2) 각 청크를 순차적으로 /api/chunkbuild에 보내기
      for (let i = 0; i < chunks.length; i++) {
        const chunkText = chunks[i];

        setProgress(
          `총 ${chunks.length}개 중 ${i + 1}번째 청크 변환 중입니다...`,
        );

        const res = await fetch('/api/chunkbuild', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ chunk: chunkText }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(
            data.error ||
              `${i + 1}번째 청크 처리 중 OpenAI 요청 오류가 발생했습니다.`,
          );
        }

        const data = await res.json();
        const chunkResult: string = data.result ?? '';

        if (!chunkResult) {
          throw new Error(
            `${i + 1}번째 청크 처리 결과에서 텍스트를 찾을 수 없습니다.`,
          );
        }

        // 3) 결과 이어 붙이기
        // 청크 사이에 구분선 넣고 싶으면 아래에 "---" 같은 구분선 추가
        if (combinedResult) {
          combinedResult += '\n\n---\n\n';
        }
        combinedResult += chunkResult;
      }

      setResult(combinedResult);
      setProgress(`모든 ${chunks.length}개 청크 변환 완료.`);
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
        Chunk → B1 교재 변환 테스트
      </h1>
      <p style={{ color: '#555', marginBottom: 24 }}>
        아래 텍스트 박스에 영어 기사/문단을 여러 개 넣어도 됩니다. 내부적으로
        일정 단어 수 기준으로 문장 단위로 청크를 나눈 뒤, 각 청크를
        OpenAI API에 보내서 B1 수준 교재 템플릿으로 변환합니다.
      </p>

      <label
        htmlFor="chunk-input"
        style={{ display: 'block', fontWeight: 600, marginBottom: 8 }}
      >
        Input Text (영어 긴 텍스트)
      </label>
      <textarea
        id="chunk-input"
        value={chunk}
        onChange={(e) => setChunk(e.target.value)}
        placeholder="여기에 영어 텍스트를 붙여넣으세요. (여러 문단 가능)"
        rows={12}
        style={{
          width: '100%',
          padding: 12,
          borderRadius: 8,
          border: '1px solid #ccc',
          fontFamily:
            'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
          fontSize: 14,
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
          {loading ? '변환 중…' : '변환하기'}
        </button>
        {error && (
          <span style={{ color: 'crimson', fontSize: 13 }}>{error}</span>
        )}
        {!error && progress && (
          <span style={{ color: '#555', fontSize: 13 }}>{progress}</span>
        )}
      </div>

      <section style={{ marginTop: 32 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>
          결과 (Generated Module)
        </h2>
        {!result && !loading && !error && (
          <p style={{ color: '#777', fontSize: 14 }}>
            아직 결과가 없습니다. 텍스트를 입력하고 변환하기 버튼을 눌러보세요.
          </p>
        )}
        {loading && (
          <p style={{ color: '#555', fontSize: 14 }}>
            OpenAI에 여러 청크를 순차적으로 요청 중입니다…
          </p>
        )}
        {result && (
          <pre
            style={{
              marginTop: 8,
              padding: 16,
              backgroundColor: '#f5f5f5',
              borderRadius: 8,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              fontSize: 14,
            }}
          >
            {result}
          </pre>
        )}
      </section>
    </main>
  );
}
