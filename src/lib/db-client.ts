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
    wikiDesk: WikiDeskApi
  }
}

const api = (): WikiDeskApi => window.wikiDesk

// ---- History ----

export const recordArticleView = (articleId: string, title: string) => api().history.record(articleId, title)
export const getRecentArticles = (limit = 12) => api().history.getRecent(limit)
export const getContinueReading = () => api().history.getContinueReading()

// ---- Collections ----

export const getCollections = () => api().collections.list()
export const createCollection = (name: string) => api().collections.create(name)
export const deleteCollection = (collectionId: string) => api().collections.delete(collectionId)
export const getCollectionArticles = (collectionId: string) => api().collections.getArticles(collectionId)
export const addArticleToCollection = (
  collectionId: string,
  articleId: string,
  title: string,
  summary: string | null,
) => api().collections.addArticle(collectionId, articleId, title, summary)
export const removeArticleFromCollection = (collectionId: string, articleId: string) =>
  api().collections.removeArticle(collectionId, articleId)
export const getCollectionsForArticle = (articleId: string) => api().collections.getForArticle(articleId)

// ---- Settings ----

export const getSettings = () => api().settings.get()
export const updateSettings = (patch: Partial<Settings>) => api().settings.update(patch)
