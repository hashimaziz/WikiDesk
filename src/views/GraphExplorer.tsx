import { useEffect, useState } from 'react';
import { searchArticles } from '../lib/wikipedia';
import { fetchArticleHtml } from '../lib/wikipedia';
import { GraphModal } from '../components/GraphModal';
import { Share2, Search as SearchIcon, Loader2 } from 'lucide-react';

interface SelectedArticle {
  title: string;
  html: string;
}

export function GraphExplorer() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ pageid: number; title: string }[]>([]);
  const [lastQuery, setLastQuery] = useState<string | null>(null);
  const [selected, setSelected] = useState<SelectedArticle | null>(null);
  const loading = query.trim() !== '' && lastQuery !== query.trim();

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

  const handleSelect = async (title: string) => {
    try {
      const html = await fetchArticleHtml(title);
      setSelected({ title, html });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-10 max-w-4xl mx-auto h-full flex flex-col overflow-y-auto">
      <h2 className="text-3xl font-bold tracking-tight mb-2 flex items-center space-x-3">
        <Share2 className="w-6 h-6 text-blue-500" />
        <span>Knowledge Graph</span>
      </h2>
      <p className="text-gray-500 dark:text-gray-400 mb-8">
        Pick an article to explore its connections as an interactive graph.
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          setQuery(query.trim());
        }}
        className="relative mb-6"
      >
        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for an article..."
          autoFocus
          className="w-full bg-white dark:bg-[#1a1a1a] border border-black/10 dark:border-white/10 rounded-2xl pl-12 pr-4 py-3.5 outline-none focus:border-blue-500 text-lg shadow-sm"
        />
      </form>

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      ) : (
        <div className="space-y-2 pb-10">
          {results.map((result) => (
            <button
              key={result.pageid}
              onClick={() => handleSelect(result.title)}
              className="w-full text-left p-4 rounded-2xl bg-white dark:bg-black/40 border border-black/5 dark:border-white/5 hover:border-blue-500/30 hover:shadow-md transition-all duration-200 group"
            >
              <span className="font-bold group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {result.title}
              </span>
            </button>
          ))}
          {results.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-10">
              Type to search Wikipedia.
            </p>
          )}
        </div>
      )}

      {selected && (
        <GraphModal title={selected.title} html={selected.html} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
