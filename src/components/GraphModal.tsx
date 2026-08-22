import { useMemo, useRef, useEffect, useState } from 'react';
import { X, Network } from 'lucide-react';
import ForceGraph2D, { type NodeObject } from 'react-force-graph-2d';
import { useNavigate } from 'react-router-dom';
import { buildGraphData, type GraphNode } from '../lib/graph';

interface GraphModalProps {
  title: string;
  html: string;
  onClose: () => void;
}

type GraphNodeObject = NodeObject & GraphNode & { __bckgDimensions?: [number, number] };

export function GraphModal({ title, html, onClose }: GraphModalProps) {
  const navigate = useNavigate();
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    setDimensions({
      width: container.clientWidth,
      height: container.clientHeight,
    });
  }, []);

  const graphData = useMemo(() => buildGraphData(title, html), [html, title]);

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
            width={dimensions.width}
            height={dimensions.height}
            graphData={graphData}
            nodeLabel="name"
            nodeColor="color"
            linkColor={() => 'rgba(156, 163, 175, 0.2)'}
            nodeRelSize={1}
            onNodeClick={(node: GraphNodeObject) => {
              navigate(`/article/${encodeURIComponent(String(node.id))}`);
              onClose();
            }}
            nodeCanvasObject={(node: GraphNodeObject, ctx, globalScale) => {
              if (node.x === null || node.x === undefined || node.y === null || node.y === undefined) return;
              const label = node.name;
              const fontSize = (node.isCenter ? 14 : 10) / globalScale;
              ctx.font = `${fontSize}px Sans-Serif`;
              const textWidth = ctx.measureText(label).width;
              const padX = textWidth + fontSize * 0.2;
              const padY = fontSize + fontSize * 0.2;

              if (node.isCenter) {
                ctx.fillStyle = 'rgba(59, 130, 246, 0.1)';
                ctx.fillRect(node.x - padX / 2, node.y - padY / 2, padX, padY);
              }

              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillStyle = node.isCenter
                ? '#3b82f6'
                : (document.documentElement.classList.contains('dark') ? '#d1d5db' : '#4b5563');
              ctx.fillText(label, node.x, node.y);

              node.__bckgDimensions = [padX, padY];
            }}
            nodePointerAreaPaint={(node: GraphNodeObject, color, ctx) => {
              const dims = node.__bckgDimensions;
              if (!dims || node.x == null || node.y == null) return;
              ctx.fillStyle = color;
              ctx.fillRect(node.x - dims[0] / 2, node.y - dims[1] / 2, dims[0], dims[1]);
            }}
          />
        </div>
      </div>
    </div>
  );
}
