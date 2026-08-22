import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchEntityMetadata } from '../lib/wikipedia';
import { topLinkedEntities, categorizeEntity, type EntityCategory } from '../lib/links';
import { useAppContext } from '../context/useAppContext';
import { Loader2, User, MapPin, Calendar, Link2 } from 'lucide-react';

const SIDEBAR_ENTITY_LIMIT = 25;
const METADATA_FETCH_LIMIT = 20;

interface EntityDisplay {
  title: string;
  thumbnail?: string;
  summary?: string;
  category: EntityCategory;
}

interface SmartSidebarProps {
  html: string;
}

export function SmartSidebar({ html }: SmartSidebarProps) {
  const navigate = useNavigate();
  const { focusMode } = useAppContext();

  // Link extraction is a pure derivation of the article HTML.
  const topEntities = useMemo(() => topLinkedEntities(html, SIDEBAR_ENTITY_LIMIT), [html]);

  const [metadata, setMetadata] = useState<Record<string, { description?: string; extract?: string; thumbnail?: string }>>({});
  const requestedRef = useRef<Set<string>>(new Set());
  const htmlRef = useRef<string>('');
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    // New article: forget which titles were requested (stale metadata under
    // other keys is harmless and may serve as cache on revisit).
    if (htmlRef.current !== html) {
      htmlRef.current = html;
      requestedRef.current = new Set();
    }
    if (!html) return;
    const missing = topEntities
      .map((e) => e.title)
      .filter((title) => !requestedRef.current.has(title))
      .slice(0, METADATA_FETCH_LIMIT);
    if (missing.length === 0) return;

    missing.forEach((title) => requestedRef.current.add(title));
    let cancelled = false;
    setFetching(true);
    fetchEntityMetadata(missing)
      .then((result) => {
        if (cancelled) return;
        setMetadata((prev) => ({ ...prev, ...result }));
      })
      .catch((err) => console.error(err))
      .finally(() => {
        if (!cancelled) setFetching(false);
      });
    return () => {
      cancelled = true;
    };
  }, [html, topEntities]);

  const sections = useMemo(() => {
    const grouped: Record<EntityCategory, EntityDisplay[]> = { person: [], place: [], event: [], topic: [] };
    for (const entity of topEntities) {
      const m = metadata[entity.title];
      grouped[categorizeEntity(m?.description)].push({
        title: entity.title,
        thumbnail: m?.thumbnail,
        summary: m?.extract,
        category: categorizeEntity(m?.description),
      });
    }
    return grouped;
  }, [topEntities, metadata]);

  if (focusMode) return null;

  const loading = topEntities.length > 0 && fetching && Object.keys(metadata).length === 0;

  const renderSection = (title: string, icon: React.ReactNode, items: EntityDisplay[]) => {
    if (items.length === 0) return null;
    return (
      <div className="mb-6">
        <h3 className="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3 flex items-center">
          {icon}
          <span className="ml-2">{title}</span>
        </h3>
        <div className="space-y-1">
          {items.map((item) => (
            <button
              key={item.title}
              onClick={() => navigate(`/article/${encodeURIComponent(item.title)}`)}
              className="w-full flex items-center space-x-3 p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors group text-left"
            >
              {item.thumbnail ? (
                <img src={item.thumbnail} className="w-8 h-8 rounded-full object-cover" alt="" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-500 font-bold text-xs shrink-0">
                  {item.title.charAt(0)}
                </div>
              )}
              <span className="flex-1 min-w-0 text-sm font-medium text-gray-900 dark:text-gray-100 truncate group-hover:text-blue-500 transition-colors">
                {item.title}
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="w-72 shrink-0 h-full bg-sidebar border-l border-black/5 dark:border-white/5 overflow-y-auto pt-6 px-4 pb-20">
      <div className="mb-6 pb-4 border-b border-black/5 dark:border-white/5">
        <h2 className="text-lg font-bold">Related Discovery</h2>
        <p className="text-xs text-gray-500 mt-1">Extracted from this article</p>
      </div>

      {topEntities.length === 0 ? (
        <p className="text-sm text-gray-400 py-6">No linked topics found in this article.</p>
      ) : loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      ) : (
        <>
          {renderSection('Key People', <User className="w-4 h-4" />, sections.person)}
          {renderSection('Key Events', <Calendar className="w-4 h-4" />, sections.event)}
          {renderSection('Key Places', <MapPin className="w-4 h-4" />, sections.place)}
          {renderSection('Related Topics', <Link2 className="w-4 h-4" />, sections.topic.slice(0, 10))}
        </>
      )}
    </div>
  );
}
