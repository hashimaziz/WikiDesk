import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchArticleHtml, fetchArticleSummary } from '../lib/wikipedia';
import { useAppContext } from '../context/AppContext';
import { Maximize, Minimize, Minus, Plus, Clock, Network, BookMarked, X, Columns } from 'lucide-react';
import { SmartSidebar } from '../components/SmartSidebar';
import { TimelineModal } from '../components/TimelineModal';
import { GraphModal } from '../components/GraphModal';
import { CompareModal } from '../components/CompareModal';
import { getCollections, addArticleToCollection } from '../lib/db-client';
import { cn } from '../lib/utils';

export function Article() {
  const { title } = useParams<{ title: string }>();
  const navigate = useNavigate();
  const [html, setHtml] = useState<string>('');
  const [loading, setLoading] = useState(true);
  
  // Reading mode settings from context
  const { focusMode, setFocusMode, fontSize, setFontSize } = useAppContext();
  const [contentWidth] = useState('max-w-3xl');
  const [showTimeline, setShowTimeline] = useState(false);
  const [showGraph, setShowGraph] = useState(false);
  const [showCompare, setShowCompare] = useState(false);
  
  const [collections, setCollections] = useState<any[]>([]);
  const [showCollections, setShowCollections] = useState(false);

  useEffect(() => {
    if (!title) return;
    setLoading(true);
    fetchArticleHtml(title)
      .then((htmlContent) => {
        // Strip out some Wikipedia UI elements if needed, but the REST API is quite clean
        setHtml(htmlContent);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [title]);

  // Intercept internal Wikipedia links to stay inside the app
  const handleContentClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    const anchor = target.closest('a');
    if (anchor && anchor.hasAttribute('href')) {
      const href = anchor.getAttribute('href');
      // Wikipedia internal links in REST API often look like "./Article_Name"
      if (href?.startsWith('./')) {
        e.preventDefault();
        const nextTitle = decodeURIComponent(href.replace('./', ''));
        navigate(`/article/${encodeURIComponent(nextTitle)}`);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center animate-pulse">
        <div className="text-xl font-medium text-gray-500">Loading article...</div>
      </div>
    );
  }

  const handleSaveToCollection = async (collectionId: string) => {
    if (!title) return;
    try {
      // First get a short summary for the db
      let summary = '';
      try {
        const sum = await fetchArticleSummary(title);
        summary = sum.extract || '';
      } catch (e) {}
      
      await addArticleToCollection(collectionId, encodeURIComponent(title), title.replace(/_/g, ' '), summary);
      setShowCollections(false);
    } catch (err) {
      console.error(err);
    }
  };

  const loadCollections = async () => {
    const cols = await getCollections();
    setCollections(cols);
    setShowCollections(true);
  };

  return (
    <div className="flex h-full w-full">
      <div className={cn("relative flex-1 h-full flex flex-col transition-all duration-300", focusMode ? "bg-background" : "bg-transparent")}>
        {/* Article Header & Controls */}
        <div className={cn(
          "sticky top-0 z-10 flex items-center justify-between px-8 py-4 backdrop-blur-xl bg-background/80 border-b border-black/5 dark:border-white/5 transition-opacity duration-300",
          focusMode ? "opacity-0 hover:opacity-100" : "opacity-100"
        )}>
        <h1 className="text-2xl font-bold font-serif tracking-tight truncate flex-1 mr-4">
          {title?.replace(/_/g, ' ')}
        </h1>
        
        <div className="flex items-center space-x-4">
          <div className="relative">
            <button 
              onClick={() => showCollections ? setShowCollections(false) : loadCollections()}
              className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
              title="Add to Collection"
            >
              <BookMarked className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
            {showCollections && (
              <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-[#1a1a1a] rounded-xl shadow-xl border border-black/10 dark:border-white/10 py-2 z-50 overflow-hidden">
                <div className="px-4 py-2 border-b border-black/5 dark:border-white/5 flex justify-between items-center">
                  <span className="font-bold text-sm">Save to Collection</span>
                  <button onClick={() => setShowCollections(false)}><X className="w-4 h-4 text-gray-400" /></button>
                </div>
                <div className="max-h-60 overflow-y-auto">
                  {collections.map(c => (
                    <button
                      key={c.id}
                      onClick={() => handleSaveToCollection(c.id)}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    >
                      {c.name}
                    </button>
                  ))}
                  {collections.length === 0 && (
                    <div className="px-4 py-4 text-center text-sm text-gray-500">
                      No collections yet. Create one in the Library.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-2 bg-black/5 dark:bg-white/5 rounded-full px-3 py-1.5">
            <button onClick={() => setFontSize(Math.max(12, fontSize - 2))} className="p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded-full"><Minus className="w-4 h-4" /></button>
            <span className="text-sm font-medium w-6 text-center">{fontSize}</span>
            <button onClick={() => setFontSize(Math.min(32, fontSize + 2))} className="p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded-full"><Plus className="w-4 h-4" /></button>
          </div>
          
          <button 
            onClick={() => setShowTimeline(true)}
            className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            title="Timeline View"
          >
            <Clock className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
          
          <button 
            onClick={() => setShowCompare(true)}
            className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            title="Compare With..."
          >
            <Columns className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
          
          <button 
            onClick={() => setShowGraph(true)}
            className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            title="Knowledge Graph"
          >
            <Network className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
          
          <button 
            onClick={() => setFocusMode(!focusMode)}
            className={cn("p-2 rounded-full transition-colors", focusMode ? "bg-blue-500/20 text-blue-500" : "hover:bg-black/5 dark:hover:bg-white/10")}
            title="Focus Mode"
          >
            {focusMode ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Article Content Area */}
      <div className="flex-1 overflow-y-auto px-8 py-12 scroll-smooth">
        <div 
          className={cn("mx-auto transition-all duration-300", contentWidth)}
          style={{ fontSize: `${fontSize}px`, lineHeight: 1.6 }}
        >
          <div 
            className="wikipedia-content prose prose-lg dark:prose-invert prose-blue max-w-none font-serif"
            onClick={handleContentClick}
            dangerouslySetInnerHTML={{ __html: html }} 
          />
        </div>
      </div>
      </div>
      
      {!focusMode && <SmartSidebar html={html} />}
      
      {showTimeline && (
        <TimelineModal html={html} onClose={() => setShowTimeline(false)} />
      )}
      
      {showCompare && title && (
        <CompareModal currentTitle={title} onClose={() => setShowCompare(false)} />
      )}
      
      {showGraph && title && html && (
        <GraphModal title={title} html={html} onClose={() => setShowGraph(false)} />
      )}
    </div>
  );
}
