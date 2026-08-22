import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchArticleHtml } from '../lib/wikipedia';
import { useAppContext } from '../context/useAppContext';
import { FONT_MIN, FONT_MAX } from '../lib/constants';
import { X, Minus, Plus, Link2, Unlink } from 'lucide-react';
import { cn } from '../lib/utils';

export function Compare() {
  const { title1, title2 } = useParams<{ title1: string, title2: string }>();
  const navigate = useNavigate();
  const { fontSize, setFontSize } = useAppContext();
  
  const [html1, setHtml1] = useState('');
  const [html2, setHtml2] = useState('');
  const [loadedPair, setLoadedPair] = useState<string | null>(null);
  const loading = Boolean(title1 && title2) && loadedPair !== `${title1}|${title2}`;
  const [synced, setSynced] = useState(true);

  const col1Ref = useRef<HTMLDivElement>(null);
  const col2Ref = useRef<HTMLDivElement>(null);
  const isScrollingRef = useRef<1 | 2 | null>(null);

  useEffect(() => {
    if (!title1 || !title2 || loadedPair === `${title1}|${title2}`) return;
    let cancelled = false;
    Promise.all([
      fetchArticleHtml(title1),
      fetchArticleHtml(title2)
    ])
    .then(([htmlContent1, htmlContent2]) => {
      if (cancelled) return;
      setHtml1(htmlContent1);
      setHtml2(htmlContent2);
      setLoadedPair(`${title1}|${title2}`);
    })
    .catch(err => console.error(err));
    return () => {
      cancelled = true;
    };
  }, [title1, title2, loadedPair]);

  // Synchronized scrolling
  const handleScroll = (col: 1 | 2) => {
    if (!synced) return;
    
    const source = col === 1 ? col1Ref.current : col2Ref.current;
    const target = col === 1 ? col2Ref.current : col1Ref.current;
    
    if (!source || !target) return;
    
    if (isScrollingRef.current === null) {
      isScrollingRef.current = col;
      
      const percentage = source.scrollTop / (source.scrollHeight - source.clientHeight);
      target.scrollTop = percentage * (target.scrollHeight - target.clientHeight);
      
      // Reset after a tiny delay to allow scroll event to fire on target without infinite loop
      setTimeout(() => {
        isScrollingRef.current = null;
      }, 50);
    }
  };

  const handleContentClick = (e: React.MouseEvent<HTMLDivElement>, col: 1 | 2) => {
    const target = e.target as HTMLElement;
    const anchor = target.closest('a');
    if (anchor && anchor.hasAttribute('href')) {
      const href = anchor.getAttribute('href');
      if (href?.startsWith('./')) {
        e.preventDefault();
        const nextTitle = decodeURIComponent(href.replace('./', ''));
        if (col === 1) {
          navigate(`/compare/${encodeURIComponent(nextTitle)}/${encodeURIComponent(title2!)}`);
        } else {
          navigate(`/compare/${encodeURIComponent(title1!)}/${encodeURIComponent(nextTitle)}`);
        }
      }
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center animate-pulse">
        <div className="text-xl font-medium text-gray-500">Loading comparison...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-black/5 dark:border-white/5 bg-gray-50/80 dark:bg-[#1a1a1a]/80 backdrop-blur">
        <div className="flex-1 text-center font-bold font-serif text-lg truncate px-4">{title1?.replace(/_/g, ' ')}</div>
        
        <div className="flex items-center space-x-4 shrink-0">
          <button 
            onClick={() => setSynced(!synced)}
            className={cn("p-2 rounded-lg transition-colors flex items-center space-x-2 text-sm font-medium", synced ? "bg-blue-500/10 text-blue-500" : "hover:bg-black/5 dark:hover:bg-white/10 text-gray-500")}
          >
            {synced ? <Link2 className="w-4 h-4" /> : <Unlink className="w-4 h-4" />}
            <span>{synced ? 'Synced' : 'Independent'}</span>
          </button>
          
          <div className="flex items-center space-x-2 bg-black/5 dark:bg-white/5 rounded-full px-3 py-1.5">
            <button onClick={() => setFontSize(fontSize - 2)} disabled={fontSize <= FONT_MIN} className="p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded-full disabled:opacity-30"><Minus className="w-4 h-4" /></button>
            <span className="text-sm font-medium w-6 text-center">{fontSize}</span>
            <button onClick={() => setFontSize(fontSize + 2)} disabled={fontSize >= FONT_MAX} className="p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded-full disabled:opacity-30"><Plus className="w-4 h-4" /></button>
          </div>
          
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        <div className="flex-1 text-center font-bold font-serif text-lg truncate px-4">{title2?.replace(/_/g, ' ')}</div>
      </div>
      
      {/* Split view */}
      <div className="flex flex-1 overflow-hidden">
        <div 
          className="w-1/2 h-full overflow-y-auto px-6 py-8 border-r border-black/5 dark:border-white/5"
          ref={col1Ref}
          onScroll={() => handleScroll(1)}
        >
          <div 
            className="wikipedia-content prose prose-sm dark:prose-invert prose-blue max-w-none font-serif"
            style={{ fontSize: `${fontSize}px`, lineHeight: 1.6 }}
            onClick={(e) => handleContentClick(e, 1)}
            dangerouslySetInnerHTML={{ __html: html1 }} 
          />
        </div>
        <div 
          className="w-1/2 h-full overflow-y-auto px-6 py-8"
          ref={col2Ref}
          onScroll={() => handleScroll(2)}
        >
          <div 
            className="wikipedia-content prose prose-sm dark:prose-invert prose-blue max-w-none font-serif"
            style={{ fontSize: `${fontSize}px`, lineHeight: 1.6 }}
            onClick={(e) => handleContentClick(e, 2)}
            dangerouslySetInnerHTML={{ __html: html2 }} 
          />
        </div>
      </div>
    </div>
  );
}
