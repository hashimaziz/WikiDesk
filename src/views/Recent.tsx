import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getRecentArticles } from '../lib/db-client';
import type { HistoryEntry } from '../lib/db-client';
import { History as HistoryIcon, FileText } from 'lucide-react';

export function Recent() {
  const [entries, setEntries] = useState<HistoryEntry[] | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    getRecentArticles(50)
      .then((rows) => {
        if (!cancelled) setEntries(rows);
      })
      .catch((err) => console.error(err));
    return () => {
      cancelled = true;
    };
  }, []);

  if (entries === null) {
    return (
      <div className="flex h-full items-center justify-center text-gray-400">Loading history...</div>
    );
  }

  return (
    <div className="p-10 max-w-4xl mx-auto h-full flex flex-col overflow-y-auto">
      <h2 className="text-3xl font-bold tracking-tight mb-8 flex items-center space-x-3">
        <HistoryIcon className="w-6 h-6 text-blue-500" />
        <span>Recent Reads</span>
      </h2>

      {entries.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center text-gray-400">
          <HistoryIcon className="w-12 h-12 mb-4 opacity-20" />
          <p>No reading history yet.</p>
          <p className="text-sm mt-1">Articles you open will be tracked here.</p>
        </div>
      ) : (
        <div className="space-y-2 pb-10">
          {entries.map((entry) => (
            <button
              key={entry.id}
              onClick={() => navigate(`/article/${encodeURIComponent(entry.article_id)}`)}
              className="w-full flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-black/40 border border-black/5 dark:border-white/5 hover:border-blue-500/30 hover:shadow-md transition-all duration-200 text-left group"
            >
              <div className="flex items-center space-x-3 min-w-0">
                <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-500 shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <span className="font-medium truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {entry.title}
                </span>
              </div>
              <span className="text-xs text-gray-400 shrink-0 ml-4">
                Viewed {new Date(entry.timestamp).toLocaleString()}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
