export type EntityCategory = 'person' | 'place' | 'event' | 'topic';

export interface LinkedEntity {
  title: string;
  count: number;
}

/**
 * Counts internal Wikipedia links ([rel="mw:WikiLink"]) in REST API HTML,
 * excluding namespaced pages (File:, Category:, Help:, …) which are not
 * articles. Frequency is used later as an importance signal.
 */
export function countWikiLinks(html: string): Record<string, number> {
  if (!html) return {};
  const div = document.createElement('div');
  div.innerHTML = html;
  const counts: Record<string, number> = {};
  div.querySelectorAll('a[rel="mw:WikiLink"]').forEach((a) => {
    const title = a.getAttribute('title');
    if (!title || title.includes(':')) return;
    counts[title] = (counts[title] ?? 0) + 1;
  });
  return counts;
}

/** Top N linked entities sorted by link frequency. */
export function topLinkedEntities(html: string, limit: number): LinkedEntity[] {
  return Object.entries(countWikiLinks(html))
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([title, count]) => ({ title, count }));
}

/**
 * Heuristic entity classification based on the Wikipedia short description,
 * e.g. "French military officer", "capital city", "1994 conflict".
 * Order matters: people are matched before places so "king of France"
 * does not hit the "France" place rule.
 */
const PERSON_RE =
  /\b(actor|actress|artist|astronaut|author|bishop|composer|diplomat|director|emperor|general|king|mathematician|minister|monk|musician|noble|novelist|painter|philosopher|physician|physicist|poet|politician|pope|president|prime minister|queen|revolutionary|scientist|singer|statesman|writer|born)\b/i;
const PLACE_RE =
  /\b(country|city|town|village|state|province|capital|region|county|district|river|lake|sea|ocean|mountain|island|continent|empire\b.*\blocated|located in|archipelago|desert|forest|valley|fortress|castle|building|cathedral|palace|museum)\b/i;
const EVENT_RE =
  /\b(war|battle|revolution|uprising|rebellion|conflict|treaty|siege|massacre|coup|election|congress|council|crusade|exhibition|festival|olympics|world cup|dynasty|period|era)\b/i;

export function categorizeEntity(description: string | undefined): EntityCategory {
  const desc = (description ?? '').toLowerCase();
  if (!desc) return 'topic';
  if (PERSON_RE.test(desc)) return 'person';
  if (EVENT_RE.test(desc)) return 'event';
  if (PLACE_RE.test(desc)) return 'place';
  return 'topic';
}
