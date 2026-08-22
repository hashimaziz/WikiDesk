export interface TimelineEvent {
  year: number;
  text: string;
}

const YEAR_RE = /\b(1[0-9]{3}|20[0-4][0-9])\b/g;
const SENTENCE_RE = /[^.!?]+[.!?]+/g;
const MAX_EVENT_LENGTH = 400;

/**
 * Extracts a chronological timeline from Wikipedia REST HTML by scanning
 * paragraphs and list items for 4-digit years (1000-2049) and pairing each
 * year with its surrounding sentence.
 */
export function extractTimelineEvents(html: string, limit = 100): TimelineEvent[] {
  if (!html) return [];

  const div = document.createElement('div');
  div.innerHTML = html;
  const textNodes = Array.from(div.querySelectorAll('p, li')).map((el) => el.textContent ?? '');

  const events: TimelineEvent[] = [];
  const seen = new Set<string>();

  for (const text of textNodes) {
    const sentences = text.match(SENTENCE_RE) ?? [text];
    for (const rawSentence of sentences) {
      const sentence = rawSentence.trim();
      if (!sentence || sentence.length > MAX_EVENT_LENGTH) continue;

      // Only consider the first year of the sentence as the anchor date.
      const match = sentence.match(YEAR_RE);
      if (!match) continue;

      if (seen.has(sentence)) continue;
      seen.add(sentence);
      events.push({ year: parseInt(match[0], 10), text: sentence });
    }
  }

  return events.sort((a, b) => a.year - b.year).slice(0, limit);
}

/** Minimum events before we consider the timeline meaningful enough to show. */
export const MIN_TIMELINE_EVENTS = 5;
