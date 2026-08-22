import { contextBridge, ipcRenderer } from 'electron'

const api = {
  history: {
    record: (articleId: string, title: string) => ipcRenderer.invoke('history:record', articleId, title),
    getRecent: (limit?: number) => ipcRenderer.invoke('history:getRecent', limit),
    getContinueReading: () => ipcRenderer.invoke('history:getContinueReading'),
  },
  collections: {
    list: () => ipcRenderer.invoke('collections:list'),
    create: (name: string) => ipcRenderer.invoke('collections:create', name),
    delete: (collectionId: string) => ipcRenderer.invoke('collections:delete', collectionId),
    getArticles: (collectionId: string) => ipcRenderer.invoke('collections:getArticles', collectionId),
    addArticle: (collectionId: string, articleId: string, title: string, summary: string | null) =>
      ipcRenderer.invoke('collections:addArticle', collectionId, articleId, title, summary),
    removeArticle: (collectionId: string, articleId: string) =>
      ipcRenderer.invoke('collections:removeArticle', collectionId, articleId),
    getForArticle: (articleId: string) => ipcRenderer.invoke('collections:getForArticle', articleId),
  },
  settings: {
    get: () => ipcRenderer.invoke('settings:get'),
    update: (patch: { theme?: 'light' | 'dark'; font_size?: number; content_width?: number }) =>
      ipcRenderer.invoke('settings:update', patch),
  },
}

contextBridge.exposeInMainWorld('wikiDesk', api)

export type WikiDeskApi = typeof api
