import { countWikiLinks } from './links';

export const MAX_GRAPH_NODES = 100;

export interface GraphNode {
  id: string;
  name: string;
  val: number;
  color?: string;
  isCenter?: boolean;
}

export interface GraphLink {
  source: string;
  target: string;
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

const CENTER_COLOR = '#3b82f6';
const NODE_COLOR = '#6b7280';

/**
 * Builds the knowledge graph for an article: the article itself as the
 * center node surrounded by its most frequently-linked articles, capped at
 * MAX_GRAPH_NODES to prevent visual overload.
 */
export function buildGraphData(title: string, html: string): GraphData {
  if (!html) return { nodes: [], links: [] };

  // -1 keeps room for the center node within the cap.
  const topLinks = Object.entries(countWikiLinks(html))
    .sort((a, b) => b[1] - a[1])
    .slice(0, MAX_GRAPH_NODES - 1);

  return {
    nodes: [
      { id: title, name: title.replace(/_/g, ' '), val: 20, color: CENTER_COLOR, isCenter: true },
      ...topLinks.map(([t, count]) => ({
        id: t,
        name: t.replace(/_/g, ' '),
        val: Math.min(15, 3 + count),
        color: NODE_COLOR,
        isCenter: false,
      })),
    ],
    links: topLinks.map(([t]) => ({ source: title, target: t })),
  };
}
