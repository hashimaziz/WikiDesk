import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { searchArticles } from '../lib/wikipedia';
import { Search as SearchIcon, Loader2 } from 'lucide-react';

interface SearchResult {
  pageid: number;
  title: string;
  snippet: string;
}

export function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') ?? '';
  const [input, setInput] = useState(query);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [lastQuery, setLastQuery] = useState<string | null>(null);
  const navigate = useNavigate();

  // Derived loading state: a query is in flight while the results on screen
  // belong to a different (or no) query.
  const loading = query.trim() !== '' && lastQuery !== query.trim();
  const hasSearched = lastQuery !== null;

  useEffect(() => {
    if (!query.trim() || lastQuery === query.trim()) return;
    let cancelled = false;
    searchArticles(query.trim())
      .then((hits) => {
        if (cancelled) return;
        setResults(hits);
        setLastQuery(query.trim());
      })
      .catch((err) => console.error(err));
    return () => {
      cancelled = true;
    };
  }, [query, lastQuery]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = input.trim();
    if (!q) return;
    setSearchParams({ q });
  };

  return (
    <div className="p-10 max-w-4xl mx-auto h-full flex flex-col">
      <div className="mb-8">
        <h2 className="text-3xl font-bold tracking-tight mb-6">Search Wikipedia</h2>
        <form onSubmit={handleSubmit} className="relative group">
          <div className="absolute inset-0 bg-blue-500 rounded-2xl blur opacity-10 group-hover:opacity-20 transition duration-500"></div>
          <div className="relative bg-white dark:bg-[#1a1a1a] rounded-2xl border border-black/5 dark:border-white/10 p-1 flex items-center shadow-sm">
            <SearchIcon className="w-6 h-6 text-gray-400 ml-4" />
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              autoFocus
              placeholder="Search for any topic..."
              className="w-full bg-transparent border-none outline-none px-4 py-3 text-lg text-gray-900 dark:text-gray-100 placeholder-gray-400"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl font-medium transition-colors m-1"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Search'}
            </button>
          </div>
        </form>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 pb-10">
        {loading && (
          <div className="flex justify-center py-10">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        )}
        {!loading && results.map((result) => (
          <button
            key={result.pageid}
            onClick={() => navigate(`/article/${encodeURIComponent(result.title)}`)}
            className="w-full text-left p-5 rounded-2xl bg-white dark:bg-black/40 border border-black/5 dark:border-white/5 hover:border-blue-500/30 hover:bg-blue-50 dark:hover:bg-blue-900/10 cursor-pointer transition-all duration-200 group"
          >
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              {result.title}
            </h3>
            <p
              className="mt-2 text-gray-600 dark:text-gray-400 line-clamp-2"
              dangerouslySetInnerHTML={{ __html: result.snippet + '...' }}
            />
          </button>
        ))}
        {!loading && !hasSearched && (
          <p className="text-sm text-gray-400 text-center py-10">
            Type a topic above and press Search.
          </p>
        )}
        {!loading && hasSearched && results.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-10">
            No results found. Try a different search.
          </p>
        )}
      </div>
    </div>
  );
}
