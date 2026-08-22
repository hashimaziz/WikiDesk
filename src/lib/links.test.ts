import { describe, it, expect } from 'vitest';
import { countWikiLinks, topLinkedEntities, categorizeEntity } from './links';

const wikiLink = (title: string) => `<a rel="mw:WikiLink" href="./${title}" title="${title}">${title}</a>`;

describe('countWikiLinks', () => {
  it('counts internal wiki links by frequency', () => {
    const html = `<div>
      ${wikiLink('Robespierre')} ${wikiLink('Bastille')} ${wikiLink('Robespierre')}
      <p>${wikiLink('Robespierre')}</p>
    </div>`;
    expect(countWikiLinks(html)).toEqual({ Robespierre: 3, Bastille: 1 });
  });

  it('excludes namespaced pages like File: and Category:', () => {
    const html = `<a rel="mw:WikiLink" href="./File:X.png" title="File:X.png">x</a>
      <a rel="mw:WikiLink" href="./Category:France" title="Category:France">fr</a>
      ${wikiLink('France')}`;
    expect(countWikiLinks(html)).toEqual({ France: 1 });
  });

  it('ignores external and non-wiki anchors', () => {
    const html = `<a href="https://example.com">ext</a><a rel="nofollow">none</a>`;
    expect(countWikiLinks(html)).toEqual({});
  });

  it('returns empty for empty html', () => {
    expect(countWikiLinks('')).toEqual({});
  });
});

describe('topLinkedEntities', () => {
  it('sorts by frequency and applies the limit', () => {
    const html = [
      ...Array.from({ length: 5 }, () => wikiLink('A')),
      ...Array.from({ length: 3 }, () => wikiLink('B')),
      wikiLink('C'),
    ].join('');
    expect(topLinkedEntities(html, 2)).toEqual([
      { title: 'A', count: 5 },
      { title: 'B', count: 3 },
    ]);
  });
});

describe('categorizeEntity', () => {
  it.each<[string | undefined, ReturnType<typeof categorizeEntity>]>([
    ['French lawyer and politician', 'person'],
    ['King of England from 1066', 'person'],
    ['Capital city of France', 'place'],
    ['Island in the Mediterranean Sea', 'place'],
    ['Decisive battle of the Napoleonic Wars', 'event'],
    ['Treaty signed in 1648', 'event'],
    ['Branch of physics', 'topic'],
    [undefined, 'topic'],
  ])('classifies %j as %j', (description, expected) => {
    expect(categorizeEntity(description)).toBe(expected);
  });

  it('prefers person over place for descriptions mentioning both', () => {
    // "king of France" must be a person, not a place.
    expect(categorizeEntity('king of France')).toBe('person');
  });
});
