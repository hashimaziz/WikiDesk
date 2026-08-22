declare global {
  interface Window {
    ipcRenderer: {
      invoke(channel: string, ...args: any[]): Promise<any>;
    }
  }
}

export async function query(sql: string, ...params: any[]) {
  return await window.ipcRenderer.invoke('db:query', sql, ...params);
}

// Collections API
export async function getCollections() {
  return await query('SELECT * FROM Collections ORDER BY created_at DESC');
}

export async function createCollection(name: string) {
  const id = Date.now().toString() + Math.random().toString(36).substr(2, 5);
  await query('INSERT INTO Collections (id, name, created_at) VALUES (?, ?, ?)', id, name, Date.now());
  return id;
}

export async function getCollectionArticles(collectionId: string) {
  return await query(`
    SELECT a.* FROM Articles a
    JOIN Collection_Articles ca ON a.id = ca.article_id
    WHERE ca.collection_id = ?
  `, collectionId);
}

export async function addArticleToCollection(collectionId: string, articleId: string, title: string, summary: string) {
  // Ensure article exists in Articles table
  try {
    await query('INSERT OR IGNORE INTO Articles (id, title, summary, last_viewed) VALUES (?, ?, ?, ?)', articleId, title, summary, Date.now());
    await query('INSERT INTO Collection_Articles (collection_id, article_id) VALUES (?, ?)', collectionId, articleId);
  } catch (err) {
    // Already in collection
  }
}

export async function removeArticleFromCollection(collectionId: string, articleId: string) {
  await query('DELETE FROM Collection_Articles WHERE collection_id = ? AND article_id = ?', collectionId, articleId);
}
