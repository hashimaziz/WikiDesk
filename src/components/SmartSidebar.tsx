import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchArticleSummary } from '../lib/wikipedia';
import { Loader2, User, MapPin, Calendar, Link2 } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

interface SmartSidebarProps {
  html: string;
}

interface LinkedEntity {
  title: string;
  count: number;
  category?: 'person' | 'place' | 'event' | 'topic';
  summary?: string;
  thumbnail?: string;
}

export function SmartSidebar({ html }: SmartSidebarProps) {
  const [entities, setEntities] = useState<LinkedEntity[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { focusMode } = useAppContext();

  useEffect(() => {
    if (!html) return;
    
    // Parse links from HTML
    const div = document.createElement('div');
    div.innerHTML = html;
    const links = div.querySelectorAll('a[rel="mw:WikiLink"]');
    
    const linkCounts: Record<string, number> = {};
    links.forEach(a => {
      let title = a.getAttribute('title');
      if (title && !title.includes(':')) { // Exclude special Wikipedia pages
        linkCounts[title] = (linkCounts[title] || 0) + 1;
      }
    });

    // Sort by frequency and take top 25
    const topTitles = Object.entries(linkCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 25)
      .map(([title, count]) => ({ title, count, category: 'topic' as const }));

    setEntities(topTitles);
    categorizeEntities(topTitles);

  }, [html]);

  const categorizeEntities = async (initialEntities: LinkedEntity[]) => {
    setLoading(true);
    const updated = [...initialEntities];
    
    // Batch fetch summaries to categorize (up to 15 to save time/requests)
    for (let i = 0; i < Math.min(15, updated.length); i++) {
      try {
        const summary = await fetchArticleSummary(updated[i].title);
        const desc = (summary.description || '').toLowerCase();
        
        updated[i].summary = summary.extract;
        if (summary.thumbnail) {
          updated[i].thumbnail = summary.thumbnail.source;
        }

        // Simple heuristic categorization
        if (desc.match(/actor|politician|scientist|philosopher|king|queen|emperor|person|writer|born|player/i)) {
          updated[i].category = 'person';
        } else if (desc.match(/country|city|state|capital|region|river|mountain|lake|island/i)) {
          updated[i].category = 'place';
        } else if (desc.match(/war|battle|revolution|century|conflict|treaty|event|dynasty/i)) {
          updated[i].category = 'event';
        } else {
          updated[i].category = 'topic';
        }
      } catch (err) {
        // ignore fetch errors for specific summaries
      }
    }
    
    setEntities(updated);
    setLoading(false);
  };

  if (focusMode) return null;

  const people = entities.filter(e => e.category === 'person');
  const places = entities.filter(e => e.category === 'place');
  const events = entities.filter(e => e.category === 'event');
  const topics = entities.filter(e => e.category === 'topic').slice(0, 10); // Limit unclassified topics

  const renderSection = (title: string, icon: React.ReactNode, items: LinkedEntity[]) => {
    if (items.length === 0) return null;
    return (
      <div className="mb-6">
        <h3 className="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3 flex items-center">
          {icon}
          <span className="ml-2">{title}</span>
        </h3>
        <div className="space-y-2">
          {items.map(item => (
            <div 
              key={item.title}
              onClick={() => navigate(`/article/${encodeURIComponent(item.title)}`)}
              className="flex items-center space-x-3 p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition-colors group"
            >
              {item.thumbnail ? (
                <img src={item.thumbnail} className="w-8 h-8 rounded-full object-cover" alt="" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-500 font-bold text-xs">
                  {item.title.charAt(0)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate group-hover:text-blue-500 transition-colors">
                  {item.title}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="w-72 h-full bg-sidebar border-l border-black/5 dark:border-white/5 overflow-y-auto pt-6 px-4 pb-20">
      <div className="mb-6 pb-4 border-b border-black/5 dark:border-white/5">
        <h2 className="text-lg font-bold">Related Discovery</h2>
        <p className="text-xs text-gray-500 mt-1">Extracted from this article</p>
      </div>
      
      {loading && entities.length === 0 ? (
        <div className="flex justify-center py-10">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      ) : (
        <>
          {renderSection('Key People', <User className="w-4 h-4" />, people)}
          {renderSection('Key Events', <Calendar className="w-4 h-4" />, events)}
          {renderSection('Key Places', <MapPin className="w-4 h-4" />, places)}
          {renderSection('Related Topics', <Link2 className="w-4 h-4" />, topics)}
        </>
      )}
    </div>
  );
}
