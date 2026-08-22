import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search as SearchIcon, History, BookMarked, ArrowRight, FileText } from 'lucide-react';
import { getContinueReading, getCollections, getRecentArticles } from '../lib/db-client';
import type { Collection, HistoryEntry } from '../lib/db-client';

export function Home() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [continueReading, setContinueReading] = useState<HistoryEntry[]>([]);
  const [recent, setRecent] = useState<HistoryEntry[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);

  useEffect(() => {
    let cancelled = false;
    getContinueReading()
      .then((entries) => {
        if (!cancelled) setContinueReading(entries);
      })
      .catch((err) => console.error(err));
    getRecentArticles(6)
      .then((entries) => {
        if (!cancelled) setRecent(entries);
      })
      .catch((err) => console.error(err));
    getCollections()
      .then((cols) => {
        if (!cancelled) setCollections(cols);
      })
      .catch((err) => console.error(err));
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    navigate(`/search?q=${encodeURIComponent(q)}`);
  };

  const renderEntryList = (entries: HistoryEntry[], emptyText: string) => {
    if (entries.length === 0) {
      return <p className="text-sm text-gray-400">{emptyText}</p>;
    }
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {entries.map((entry) => (
          <button
            key={entry.id}
            onClick={() => navigate(`/article/${encodeURIComponent(entry.article_id)}`)}
            className="flex items-center space-x-3 p-4 rounded-2xl bg-white dark:bg-black/40 border border-black/5 dark:border-white/5 hover:border-blue-500/30 hover:shadow-md transition-all duration-200 text-left group"
          >
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-500 shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="font-medium truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {entry.title}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {new Date(entry.timestamp).toLocaleDateString()}
              </p>
            </div>
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="p-10 max-w-4xl mx-auto h-full flex flex-col overflow-y-auto">
      <div className="mt-12 space-y-2">
        <h2 className="text-4xl font-bold tracking-tight">Explore the sum of human knowledge.</h2>
        <p className="text-lg text-gray-500 dark:text-gray-400">Search for any topic to begin your journey.</p>
      </div>

      <form onSubmit={handleSearch} className="mt-12 relative group">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
        <div className="relative bg-white dark:bg-[#1a1a1a] rounded-2xl border border-black/5 dark:border-white/10 p-2 flex items-center shadow-sm">
          <SearchIcon className="w-6 h-6 text-gray-400 ml-4" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search Wikipedia..."
            className="w-full bg-transparent border-none outline-none px-4 py-3 text-lg text-gray-900 dark:text-gray-100 placeholder-gray-400"
          />
          <button
            type="submit"
            disabled={!query.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white px-5 py-2.5 rounded-xl font-medium transition-colors m-1 shrink-0 flex items-center space-x-1"
          >
            <span>Search</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>

      <section className="mt-12">
        <h3 className="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-4 flex items-center">
          <History className="w-4 h-4 mr-2" />
          Continue Reading
        </h3>
        {renderEntryList(continueReading.slice(0, 3), 'Nothing yet. Articles you open will appear here.')}
      </section>

      <section className="mt-10">
        <h3 className="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-4">
          Recent Articles
        </h3>
        {renderEntryList(recent, 'Your reading history will appear here.')}
      </section>

      <section className="mt-10 mb-10">
        <h3 className="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-4 flex items-center">
          <BookMarked className="w-4 h-4 mr-2" />
          Collections
        </h3>
        {collections.length === 0 ? (
          <p className="text-sm text-gray-400">
            No collections yet.{' '}
            <button onClick={() => navigate('/collections')} className="text-blue-500 hover:underline">
              Create one in the Library.
            </button>
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {collections.slice(0, 6).map((col) => (
              <button
                key={col.id}
                onClick={() => navigate('/collections')}
                className="flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-black/40 border border-black/5 dark:border-white/5 hover:border-blue-500/30 hover:shadow-md transition-all duration-200 text-left group"
              >
                <span className="font-medium truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {col.name}
                </span>
                <span className="text-xs text-gray-400 shrink-0 ml-2">
                  {col.article_count} {col.article_count === 1 ? 'article' : 'articles'}
                </span>
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
