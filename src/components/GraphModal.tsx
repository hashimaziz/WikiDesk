import { useMemo, useRef, useEffect, useState } from 'react';
import { X, Network } from 'lucide-react';
import ForceGraph2D, { type ForceGraphMethods } from 'react-force-graph-2d';
import { useNavigate } from 'react-router-dom';

interface GraphModalProps {
  title: string;
  html: string;
  onClose: () => void;
}

export function GraphModal({ title, html, onClose }: GraphModalProps) {
  const navigate = useNavigate();
  const graphRef = useRef<ForceGraphMethods | undefined>(undefined);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      setDimensions({
        width: containerRef.current.clientWidth,
        height: containerRef.current.clientHeight
      });
    }
  }, []);

  const graphData = useMemo(() => {
    if (!html) return { nodes: [], links: [] };
    
    const div = document.createElement('div');
    div.innerHTML = html;
    const links = div.querySelectorAll('a[rel="mw:WikiLink"]');
    
    const linkCounts: Record<string, number> = {};
    links.forEach(a => {
      let t = a.getAttribute('title');
      if (t && !t.includes(':')) {
        linkCounts[t] = (linkCounts[t] || 0) + 1;
      }
    });

    // Top 100 links
    const topLinks = Object.entries(linkCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 100);

    const nodes = [
      { id: title, name: title, val: 20, color: '#3b82f6', isCenter: true },
      ...topLinks.map(([t, count]) => ({
        id: t,
        name: t,
        val: Math.min(15, 3 + count), // Size based on frequency
        color: '#6b7280',
        isCenter: false
      }))
    ];

    const graphLinks = topLinks.map(([t]) => ({
      source: title,
      target: t
    }));

    return { nodes, links: graphLinks };
  }, [html, title]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-10">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full h-full bg-white dark:bg-[#1a1a1a] rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-black/10 dark:border-white/10">
        <div className="absolute top-6 right-6 z-10 flex space-x-2">
          <div className="bg-white/90 dark:bg-black/90 backdrop-blur px-4 py-2 rounded-xl shadow-lg border border-black/5 dark:border-white/10 flex items-center space-x-2 mr-4">
            <Network className="w-5 h-5 text-blue-500" />
            <span className="font-bold text-sm">Knowledge Graph ({graphData.nodes.length} nodes)</span>
          </div>
          <button 
            onClick={onClose}
            className="p-3 bg-white/90 dark:bg-black/90 backdrop-blur rounded-xl shadow-lg border border-black/5 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>
        
        <div className="flex-1 bg-gray-50 dark:bg-[#0f0f0f]" ref={containerRef}>
          <ForceGraph2D
            ref={graphRef}
            width={dimensions.width}
            height={dimensions.height}
            graphData={graphData}
            nodeLabel="name"
            nodeColor="color"
            linkColor={() => 'rgba(156, 163, 175, 0.2)'}
            nodeRelSize={1}
            onNodeClick={(node: any) => {
              navigate(`/article/${encodeURIComponent(node.id)}`);
              onClose();
            }}
            nodeCanvasObject={(node: any, ctx, globalScale) => {
              const label = node.name;
              const fontSize = node.isCenter ? 14/globalScale : 10/globalScale;
              ctx.font = `${fontSize}px Sans-Serif`;
              const textWidth = ctx.measureText(label).width;
              const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.2); 

              ctx.fillStyle = node.isCenter ? 'rgba(59, 130, 246, 0.1)' : 'transparent';
              if (node.isCenter) {
                ctx.fillRect(node.x - bckgDimensions[0] / 2, node.y - bckgDimensions[1] / 2, bckgDimensions[0], bckgDimensions[1]);
              }

              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillStyle = node.isCenter ? '#3b82f6' : (document.documentElement.classList.contains('dark') ? '#d1d5db' : '#4b5563');
              ctx.fillText(label, node.x, node.y);
              
              node.__bckgDimensions = bckgDimensions; 
            }}
            nodePointerAreaPaint={(node: any, color, ctx) => {
              ctx.fillStyle = color;
              const bckgDimensions = node.__bckgDimensions;
              bckgDimensions && ctx.fillRect(node.x - bckgDimensions[0] / 2, node.y - bckgDimensions[1] / 2, bckgDimensions[0], bckgDimensions[1]);
            }}
          />
        </div>
      </div>
    </div>
  );
}
