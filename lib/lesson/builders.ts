// lib/lesson/builders.ts

import type { SentenceRecord } from '@/lib/processUserMaterial';
import type { ReadingChunk, ReadingParagraph } from '@/types/lesson';
import { randomUUID } from 'crypto';

export function buildReadingChunk(
  sentences: SentenceRecord[],
  options?: { title?: string; order?: number },
): ReadingChunk {
  const byParagraph = new Map<number, SentenceRecord[]>();

  for (const s of sentences) {
    if (typeof s.paragraph !== 'number') continue;
    if (!byParagraph.has(s.paragraph)) {
      byParagraph.set(s.paragraph, []);
    }
    byParagraph.get(s.paragraph)!.push(s);
  }

  const paragraphs: ReadingParagraph[] = Array.from(byParagraph.entries())
    .sort(([a], [b]) => a - b)
    .map(([pIndex, list]) => {
      const sorted = [...list].sort(
        (a, b) => a.sentence_id - b.sentence_id,
      );

      const text = sorted.map((s) => s.text).join(' ');
      const translate = sorted.map((s) => s.translate).join(' ');

      return {
        paragraph: pIndex,
        sentenceIds: sorted.map((s) => s.sentence_id),
        text,
        translate,
      };
    });

  return {
    id: randomUUID(),
    type: 'reading',
    title: options?.title ?? '#읽어봅시다!',
    order: options?.order ?? 1,
    data: {
      paragraphs,
    },
  };
}
