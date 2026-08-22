import { describe, it, expect } from 'vitest';
import { buildGraphData, MAX_GRAPH_NODES } from './graph';

const link = (title: string) => `<a rel="mw:WikiLink" href="./${title}" title="${title}">${title}</a>`;

describe('buildGraphData', () => {
  it('centers the current article and links its top entities', () => {
    const html = [link('Relativity'), link('Relativity'), link('Quantum Mechanics')].join('');
    const { nodes, links } = buildGraphData('Albert Einstein', html);

    expect(nodes[0]).toMatchObject({ id: 'Albert Einstein', isCenter: true });
    expect(links).toEqual([
      { source: 'Albert Einstein', target: 'Relativity' },
      { source: 'Albert Einstein', target: 'Quantum Mechanics' },
    ]);
  });

  it('scales node weight by link frequency', () => {
    const html = `${link('Big')}${link('Big')}${link('Big')}${link('Small')}`;
    const { nodes } = buildGraphData('Root', html);
    const big = nodes.find((n) => n.id === 'Big');
    const small = nodes.find((n) => n.id === 'Small');
    expect(big!.val).toBeGreaterThan(small!.val);
  });

  it('caps the graph at MAX_GRAPH_NODES including the center', () => {
    const titles = Array.from({ length: 500 }, (_, i) => `Article ${i}`);
    const html = titles.map((t) => link(t)).join('');
    const { nodes, links } = buildGraphData('Center', html);

    expect(nodes).toHaveLength(MAX_GRAPH_NODES);
    // Center plus (MAX - 1) satellites.
    expect(links).toHaveLength(MAX_GRAPH_NODES - 1);
    expect(nodes.find((n) => n.id === 'Center')?.isCenter).toBe(true);
  });

  it('keeps the highest-frequency links when capping', () => {
    const html = [
      ...Array.from({ length: 10 }, () => link('Important')),
      ...Array.from({ length: 300 }, (_, i) => link(`Filler${i}`)),
    ].join('');
    const { nodes } = buildGraphData('Center', html);
    expect(nodes.find((n) => n.id === 'Important')).toBeDefined();
  });

  it('returns empty data for empty html', () => {
    expect(buildGraphData('X', '')).toEqual({ nodes: [], links: [] });
  });
});
