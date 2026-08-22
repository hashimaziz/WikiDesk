import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getCollections,
  createCollection,
  deleteCollection,
  getCollectionArticles,
  removeArticleFromCollection,
} from '../lib/db-client';
import type { Collection, ArticleRecord } from '../lib/db-client';
import { BookMarked, Plus, Folder, FileText, Trash2, X } from 'lucide-react';
import { cn } from '../lib/utils';

export function Collections() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [articles, setArticles] = useState<ArticleRecord[]>([]);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    getCollections()
      .then((cols) => {
        if (cancelled) return;
        setCollections(cols);
        if (cols.length > 0) setSelectedId((current) => current ?? cols[0].id);
      })
      .catch((err) => console.error(err));
    return () => {
      cancelled = true;
    };
  }, []);

  const selectedCollection = collections.find((c) => c.id === selectedId) ?? null;

  useEffect(() => {
    if (!selectedId) return;
    let cancelled = false;
    getCollectionArticles(selectedId)
      .then((arts) => {
        if (!cancelled) setArticles(arts);
      })
      .catch((err) => console.error(err));
    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  const handleCreateCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newCollectionName.trim();
    if (!name) return;

    try {
      const col = await createCollection(name);
      setNewCollectionName('');
      setIsCreating(false);
      const cols = await getCollections();
      setCollections(cols);
      setSelectedId(col.id);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteCollection = async (e: React.MouseEvent, collectionId: string) => {
    e.stopPropagation();
    try {
      await deleteCollection(collectionId);
      const cols = await getCollections();
      setCollections(cols);
      if (selectedId === collectionId) {
        setSelectedId(cols[0]?.id ?? null);
        setArticles([]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemoveArticle = async (articleId: string) => {
    if (!selectedId) return;
    try {
      await removeArticleFromCollection(selectedId, articleId);
      setArticles((arts) => arts.filter((a) => a.id !== articleId));
      setCollections((cols) =>
        cols.map((c) => (c.id === selectedId ? { ...c, article_count: Math.max(0, c.article_count - 1) } : c)),
      );
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex h-full w-full">
      {/* Left pane: Collections List */}
      <div className="w-1/3 min-w-[250px] border-r border-black/5 dark:border-white/5 bg-sidebar flex flex-col">
        <div className="p-6 border-b border-black/5 dark:border-white/5 flex items-center justify-between">
          <h2 className="text-xl font-bold flex items-center space-x-2">
            <BookMarked className="w-5 h-5 text-blue-500" />
            <span>Library</span>
          </h2>
          <button
            onClick={() => setIsCreating(!isCreating)}
            className="p-1.5 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {isCreating && (
          <div className="p-4 border-b border-black/5 dark:border-white/5 bg-blue-50 dark:bg-blue-900/20">
            <form onSubmit={handleCreateCollection} className="flex flex-col space-y-2">
              <input
                autoFocus
                type="text"
                value={newCollectionName}
                onChange={(e) => setNewCollectionName(e.target.value)}
                placeholder="Collection name..."
                className="px-3 py-2 rounded-lg border border-blue-200 dark:border-blue-800 bg-white dark:bg-black/40 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex justify-end space-x-2">
                <button type="button" onClick={() => setIsCreating(false)} className="px-3 py-1 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">Cancel</button>
                <button type="submit" className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600">Create</button>
              </div>
            </form>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {collections.map((col) => (
            <button
              key={col.id}
              onClick={() => setSelectedId(col.id)}
              className={cn(
                'w-full group flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200',
                selectedId === col.id
                  ? 'bg-white dark:bg-white/10 shadow-sm border border-black/5 dark:border-white/5 text-blue-600 dark:text-blue-400 font-medium'
                  : 'hover:bg-black/5 dark:hover:bg-white/5 text-gray-700 dark:text-gray-300',
              )}
            >
              <Folder className={cn('w-5 h-5 shrink-0', selectedId === col.id && 'fill-blue-100 dark:fill-blue-900/50')} />
              <span className="truncate flex-1 text-left">{col.name}</span>
              <span className="text-xs opacity-50">{col.article_count}</span>
              <Trash2
                role="button"
                aria-label={`Delete ${col.name}`}
                onClick={(e) => handleDeleteCollection(e, col.id)}
                className="w-4 h-4 opacity-0 group-hover:opacity-50 hover:!opacity-100 hover:text-red-500 shrink-0 transition-opacity"
              />
            </button>
          ))}
          {collections.length === 0 && !isCreating && (
            <div className="text-center py-10 text-gray-400">
              <p className="text-sm">No collections yet.</p>
            </div>
          )}
        </div>
      </div>

      {/* Right pane: Articles in selected collection */}
      <div className="flex-1 overflow-y-auto bg-transparent">
        {selectedCollection ? (
          <div className="p-10 max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold tracking-tight mb-8">{selectedCollection.name}</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {articles.map((article) => (
                <div
                  key={article.id}
                  onClick={() => navigate(`/article/${encodeURIComponent(article.id)}`)}
                  className="relative p-5 pr-10 rounded-2xl bg-white dark:bg-black/40 border border-black/5 dark:border-white/5 hover:border-blue-500/30 hover:shadow-md cursor-pointer transition-all duration-200 group"
                >
                  <button
                    aria-label={`Remove ${article.title}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveArticle(article.id);
                    }}
                    className="absolute top-3 right-3 p-1 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <div className="flex items-start space-x-3">
                    <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-500">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {article.title}
                      </h3>
                      {article.summary && (
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                          {article.summary}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {articles.length === 0 && (
                <div className="col-span-full py-20 flex flex-col items-center justify-center text-gray-400">
                  <FileText className="w-12 h-12 mb-4 opacity-20" />
                  <p>This collection is empty.</p>
                  <p className="text-sm mt-1">Add articles while reading.</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            <p>Select a collection to view articles.</p>
          </div>
        )}
      </div>
    </div>
  );
}
