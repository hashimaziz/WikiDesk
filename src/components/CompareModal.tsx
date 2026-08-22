import { useState } from 'react';
import { X, Search as SearchIcon, Loader2 } from 'lucide-react';
import { searchArticles, type SearchResultHit } from '../lib/wikipedia';
import { useNavigate } from 'react-router-dom';

interface CompareModalProps {
  currentTitle: string;
  onClose: () => void;
}

export function CompareModal({ currentTitle, onClose }: CompareModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResultHit[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    setLoading(true);
    try {
      const hits = await searchArticles(query, 5);
      setResults(hits);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-2xl bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-black/10 dark:border-white/10 max-h-[80vh]">
        <div className="flex items-center justify-between p-4 border-b border-black/5 dark:border-white/5">
          <h2 className="text-lg font-bold">Compare with...</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        <div className="p-4 border-b border-black/5 dark:border-white/5">
          <form onSubmit={handleSearch} className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input 
              type="text" 
              autoFocus
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search article to compare..." 
              className="w-full bg-gray-50 dark:bg-black/40 border border-black/10 dark:border-white/10 rounded-xl px-10 py-3 outline-none focus:border-blue-500"
            />
          </form>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : results.length > 0 ? (
            results.map(r => (
              <div 
                key={r.pageid}
                onClick={() => {
                  navigate(`/compare/${encodeURIComponent(currentTitle)}/${encodeURIComponent(r.title)}`);
                  onClose();
                }}
                className="p-3 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer transition-colors"
              >
                <h3 className="font-bold text-gray-900 dark:text-gray-100">{r.title}</h3>
                <p className="text-sm text-gray-500 line-clamp-1" dangerouslySetInnerHTML={{ __html: r.snippet }} />
              </div>
            ))
          ) : (
            <div className="text-center py-10 text-gray-400 text-sm">
              Search for a topic to compare side-by-side.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
