export interface Collection {
  id: string
  name: string
  created_at: number
  article_count: number
}

export interface ArticleRecord {
  id: string
  title: string
  summary: string | null
  last_viewed: number | null
}

export interface HistoryEntry {
  id: number
  article_id: string
  title: string
  timestamp: number
}

export interface Settings {
  theme: 'light' | 'dark'
  font_size: number
  content_width: number
}

interface WikiDeskApi {
  history: {
    record(articleId: string, title: string): Promise<void>
    getRecent(limit?: number): Promise<HistoryEntry[]>
    getContinueReading(): Promise<HistoryEntry[]>
  }
  collections: {
    list(): Promise<Collection[]>
    create(name: string): Promise<Collection>
    delete(collectionId: string): Promise<void>
    getArticles(collectionId: string): Promise<ArticleRecord[]>
    addArticle(collectionId: string, articleId: string, title: string, summary: string | null): Promise<void>
    removeArticle(collectionId: string, articleId: string): Promise<void>
    getForArticle(articleId: string): Promise<string[]>
  }
  settings: {
    get(): Promise<Settings>
    update(patch: Partial<Settings>): Promise<Settings>
  }
}

declare global {
  interface Window {
    wikiDesk?: WikiDeskApi
  }
}

// All wrappers are async so a missing preload bridge surfaces as a rejected
// promise (loggable) instead of a synchronous TypeError that crashes React.
function bridge(): WikiDeskApi {
  if (!window.wikiDesk) {
    throw new Error('WikiDesk bridge unavailable: the Electron preload script failed to load')
  }
  return window.wikiDesk
}

// ---- History ----

export async function recordArticleView(articleId: string, title: string) {
  return bridge().history.record(articleId, title)
}

export async function getRecentArticles(limit = 12): Promise<HistoryEntry[]> {
  return bridge().history.getRecent(limit)
}

export async function getContinueReading(): Promise<HistoryEntry[]> {
  return bridge().history.getContinueReading()
}

// ---- Collections ----

export async function getCollections(): Promise<Collection[]> {
  return bridge().collections.list()
}

export async function createCollection(name: string): Promise<Collection> {
  return bridge().collections.create(name)
}

export async function deleteCollection(collectionId: string): Promise<void> {
  return bridge().collections.delete(collectionId)
}

export async function getCollectionArticles(collectionId: string): Promise<ArticleRecord[]> {
  return bridge().collections.getArticles(collectionId)
}

export async function addArticleToCollection(
  collectionId: string,
  articleId: string,
  title: string,
  summary: string | null,
): Promise<void> {
  return bridge().collections.addArticle(collectionId, articleId, title, summary)
}

export async function removeArticleFromCollection(collectionId: string, articleId: string): Promise<void> {
  return bridge().collections.removeArticle(collectionId, articleId)
}

export async function getCollectionsForArticle(articleId: string): Promise<string[]> {
  return bridge().collections.getForArticle(articleId)
}

// ---- Settings ----

export async function getSettings(): Promise<Settings> {
  return bridge().settings.get()
}

export async function updateSettings(patch: Partial<Settings>): Promise<Settings> {
  return bridge().settings.update(patch)
}
