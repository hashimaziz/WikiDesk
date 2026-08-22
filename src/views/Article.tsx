import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchArticleHtml, fetchArticleSummary } from '../lib/wikipedia';
import { useAppContext } from '../context/useAppContext';
import { FONT_MIN, FONT_MAX, CONTENT_WIDTH_PRESETS } from '../lib/constants';
import {
  Maximize, Minimize, Minus, Plus, Clock, Network, BookMarked, X, Columns,
  PanelRightClose, PanelRightOpen,
} from 'lucide-react';
import { SmartSidebar } from '../components/SmartSidebar';
import { TimelineModal } from '../components/TimelineModal';
import { GraphModal } from '../components/GraphModal';
import { CompareModal } from '../components/CompareModal';
import { getCollections, addArticleToCollection, getCollectionsForArticle, recordArticleView } from '../lib/db-client';
import type { Collection } from '../lib/db-client';
import { cn, safeDecode } from '../lib/utils';
import { useMinWidth } from '../hooks/useMinWidth';

/** Below this width the reading column would be too narrow with the sidebar open. */
const SIDEBAR_MIN_VIEWPORT = 1024;

export function Article() {
  const { title } = useParams<{ title: string }>();
  const navigate = useNavigate();
  const [html, setHtml] = useState<string>('');
  const [loadedTitle, setLoadedTitle] = useState<string | null>(null);
  const loading = Boolean(title) && loadedTitle !== title;

  // Reading mode settings from context
  const { focusMode, setFocusMode, fontSize, setFontSize, contentWidth, setContentWidth } = useAppContext();
  const [showTimeline, setShowTimeline] = useState(false);
  const [showGraph, setShowGraph] = useState(false);
  const [showCompare, setShowCompare] = useState(false);

  // Discovery panel: defaults to "open when there is room for it" and the
  // toolbar button overrides that default. No effect needed — collapsing on
  // narrow windows falls out of the derivation.
  const wideEnough = useMinWidth(SIDEBAR_MIN_VIEWPORT);
  const [sidebarOverride, setSidebarOverride] = useState<boolean | null>(null);
  const sidebarVisible = !focusMode && (sidebarOverride ?? wideEnough);

  const toggleSidebar = () => setSidebarOverride(!(sidebarOverride ?? wideEnough));

  const [collections, setCollections] = useState<Collection[]>([]);
  const [savedCollectionIds, setSavedCollectionIds] = useState<string[]>([]);
  const [showCollections, setShowCollections] = useState(false);

  useEffect(() => {
    if (!title || loadedTitle === title) return;
    let cancelled = false;
    fetchArticleHtml(title)
      .then((htmlContent) => {
        if (cancelled) return;
        setHtml(htmlContent);
        setLoadedTitle(title);
      })
      .catch((err) => console.error(err));

    const decodedTitle = safeDecode(title);
    recordArticleView(decodedTitle, decodedTitle.replace(/_/g, ' ')).catch((err) => console.error(err));
    getCollectionsForArticle(decodedTitle)
      .then(setSavedCollectionIds)
      .catch((err) => console.error(err));
    return () => {
      cancelled = true;
    };
  }, [title, loadedTitle]);

  // Intercept internal Wikipedia links to stay inside the app
  const handleContentClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    const anchor = target.closest('a');
    if (anchor && anchor.hasAttribute('href')) {
      const href = anchor.getAttribute('href');
      // Wikipedia internal links in REST API often look like "./Article_Name"
      if (href?.startsWith('./')) {
        e.preventDefault();
        const nextTitle = safeDecode(href.slice(2));
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
    const decodedTitle = safeDecode(title);
    try {
      let summary: string | null = null;
      try {
        const sum = await fetchArticleSummary(decodedTitle);
        summary = sum.extract || null;
      } catch {
        summary = null;
      }

      await addArticleToCollection(collectionId, decodedTitle, decodedTitle.replace(/_/g, ' '), summary);
      setSavedCollectionIds((ids) => (ids.includes(collectionId) ? ids : [...ids, collectionId]));
    } catch (err) {
      console.error(err);
    }
  };

  const loadCollections = async () => {
    try {
      const [cols, savedIds] = await Promise.all([
        getCollections(),
        getCollectionsForArticle(safeDecode(title!)),
      ]);
      setCollections(cols);
      setSavedCollectionIds(savedIds);
      setShowCollections(true);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex h-full w-full">
      <div className={cn("relative flex-1 min-w-0 h-full flex flex-col transition-all duration-300", focusMode ? "bg-background" : "bg-transparent")}>
        {/* Article Header & Controls */}
        <div className={cn(
          "sticky top-0 z-10 flex items-center justify-between gap-3 px-4 sm:px-8 py-4 backdrop-blur-xl bg-background/80 border-b border-black/5 dark:border-white/5 transition-opacity duration-300",
          focusMode ? "opacity-0 hover:opacity-100" : "opacity-100"
        )}>
        <h1 className="text-xl sm:text-2xl font-bold font-serif tracking-tight truncate flex-1 min-w-0">
          {title?.replace(/_/g, ' ')}
        </h1>

        <div className="flex items-center space-x-2 sm:space-x-4 shrink-0">
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
                  {collections.map(c => {
                    const saved = savedCollectionIds.includes(c.id);
                    return (
                      <button
                        key={c.id}
                        onClick={() => handleSaveToCollection(c.id)}
                        className="w-full flex items-center justify-between text-left px-4 py-2 text-sm hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      >
                        <span className="truncate">{c.name}</span>
                        {saved && <span className="text-xs text-blue-500 ml-2 shrink-0">Saved</span>}
                      </button>
                    );
                  })}
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
            <button onClick={() => setFontSize(fontSize - 2)} disabled={fontSize <= FONT_MIN} className="p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded-full disabled:opacity-30"><Minus className="w-4 h-4" /></button>
            <span className="text-sm font-medium w-6 text-center">{fontSize}</span>
            <button onClick={() => setFontSize(fontSize + 2)} disabled={fontSize >= FONT_MAX} className="p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded-full disabled:opacity-30"><Plus className="w-4 h-4" /></button>
          </div>

          <div className="hidden md:flex items-center bg-black/5 dark:bg-white/5 rounded-full p-1" title="Content Width">
            {CONTENT_WIDTH_PRESETS.map((width) => (
              <button
                key={width}
                onClick={() => setContentWidth(width)}
                className={cn(
                  'px-2.5 py-0.5 rounded-full text-xs font-semibold transition-colors',
                  contentWidth === width
                    ? 'bg-white dark:bg-white/20 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200',
                )}
              >
                {{ 640: 'S', 896: 'M', 1152: 'L' }[width]}
              </button>
            ))}
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
            onClick={toggleSidebar}
            className={cn(
              'p-2 rounded-full transition-colors',
              sidebarVisible ? 'bg-blue-500/20 text-blue-500' : 'hover:bg-black/5 dark:hover:bg-white/10',
            )}
            title={sidebarVisible ? 'Hide Discovery Panel' : 'Show Discovery Panel'}
          >
            {sidebarVisible ? <PanelRightClose className="w-5 h-5" /> : <PanelRightOpen className="w-5 h-5" />}
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
      <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-12 scroll-smooth">
        <div
          className="mx-auto transition-all duration-300"
          style={{ fontSize: `${fontSize}px`, lineHeight: 1.6, maxWidth: `${contentWidth}px` }}
        >
          <div 
            className="wikipedia-content prose prose-lg dark:prose-invert prose-blue max-w-none font-serif"
            onClick={handleContentClick}
            dangerouslySetInnerHTML={{ __html: html }} 
          />
        </div>
      </div>
      </div>
      
      {sidebarVisible && <SmartSidebar html={html} />}
      
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
