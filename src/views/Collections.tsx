import React, { useEffect, useState } from 'react';
import { getCollections, createCollection, getCollectionArticles } from '../lib/db-client';
import { BookMarked, Plus, Folder, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function Collections() {
  const [collections, setCollections] = useState<any[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<any>(null);
  const [articles, setArticles] = useState<any[]>([]);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadCollections();
  }, []);

  const loadCollections = async () => {
    const cols = await getCollections();
    setCollections(cols);
    if (cols.length > 0 && !selectedCollection) {
      handleSelectCollection(cols[0]);
    }
  };

  const handleSelectCollection = async (col: any) => {
    setSelectedCollection(col);
    const arts = await getCollectionArticles(col.id);
    setArticles(arts);
  };

  const handleCreateCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCollectionName.trim()) return;
    
    const id = await createCollection(newCollectionName);
    setNewCollectionName('');
    setIsCreating(false);
    await loadCollections();
    handleSelectCollection({ id, name: newCollectionName });
  };

  return (
    <div className="flex h-full w-full">
      {/* Left pane: Collections List */}
      <div className="w-1/3 min-w-[250px] border-r border-black/5 dark:border-white/5 bg-gray-50/50 dark:bg-black/10 flex flex-col">
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
                onChange={e => setNewCollectionName(e.target.value)}
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
          {collections.map(col => (
            <button
              key={col.id}
              onClick={() => handleSelectCollection(col)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                selectedCollection?.id === col.id 
                  ? 'bg-white dark:bg-white/10 shadow-sm border border-black/5 dark:border-white/5 text-blue-600 dark:text-blue-400 font-medium' 
                  : 'hover:bg-black/5 dark:hover:bg-white/5 text-gray-700 dark:text-gray-300'
              }`}
            >
              <Folder className={`w-5 h-5 ${selectedCollection?.id === col.id ? 'fill-blue-100 dark:fill-blue-900/50' : ''}`} />
              <span className="truncate">{col.name}</span>
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
              {articles.map(article => (
                <div 
                  key={article.id}
                  onClick={() => navigate(`/article/${encodeURIComponent(article.id)}`)}
                  className="p-5 rounded-2xl bg-white dark:bg-black/40 border border-black/5 dark:border-white/5 hover:border-blue-500/30 hover:shadow-md cursor-pointer transition-all duration-200 group"
                >
                  <div className="flex items-start space-x-3">
                    <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-500">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {article.title}
                      </h3>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                        {article.summary}
                      </p>
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
