import { app, ipcMain } from 'electron'
import Database from 'better-sqlite3'
import path from 'path'

let db: Database.Database

export interface CollectionRow {
  id: string
  name: string
  created_at: number
}

export interface ArticleRow {
  id: string
  title: string
  summary: string | null
  last_viewed: number | null
}

export interface HistoryRow {
  id: number
  article_id: string
  title: string
  timestamp: number
}

export interface SettingsRow {
  theme: 'light' | 'dark'
  font_size: number
  content_width: number
}

export function initializeDB() {
  const userDataPath = app.getPath('userData')
  db = new Database(path.join(userDataPath, 'wikidesk.sqlite'))
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')

  setupTables()
  setupIpcHandlers()
}

const SCHEMA_VERSION = 1

function setupTables() {
  // v0 databases predate schema versioning and have an incompatible Settings
  // table (focus_mode/width columns). The data is only cache/history, so
  // start fresh rather than attempting a migration.
  if (db.pragma('user_version', { simple: true }) < SCHEMA_VERSION) {
    db.exec(`
      DROP TABLE IF EXISTS Collection_Articles;
      DROP TABLE IF EXISTS Collections;
      DROP TABLE IF EXISTS History;
      DROP TABLE IF EXISTS Articles;
      DROP TABLE IF EXISTS Settings;
    `)
  }

  db.exec(`
    CREATE TABLE IF NOT EXISTS Articles (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      summary TEXT,
      last_viewed INTEGER
    );
    CREATE TABLE IF NOT EXISTS History (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      article_id TEXT NOT NULL REFERENCES Articles(id),
      timestamp INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS Collections (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS Collection_Articles (
      collection_id TEXT NOT NULL REFERENCES Collections(id) ON DELETE CASCADE,
      article_id TEXT NOT NULL REFERENCES Articles(id),
      added_at INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (collection_id, article_id)
    );
    CREATE TABLE IF NOT EXISTS Settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      theme TEXT NOT NULL DEFAULT 'light',
      font_size INTEGER NOT NULL DEFAULT 18,
      content_width INTEGER NOT NULL DEFAULT 768
    );
    INSERT OR IGNORE INTO Settings (id) VALUES (1);
    CREATE INDEX IF NOT EXISTS idx_history_timestamp ON History(timestamp DESC);
  `)
  db.pragma(`user_version = ${SCHEMA_VERSION}`)
}

function recordArticleView(articleId: string, title: string) {
  db.prepare(`
    INSERT INTO Articles (id, title, last_viewed) VALUES (?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET title = excluded.title, last_viewed = excluded.last_viewed
  `).run(articleId, title, Date.now())
  db.prepare('INSERT INTO History (article_id, timestamp) VALUES (?, ?)').run(articleId, Date.now())
}

function setupIpcHandlers() {
  // ---- History / recent reads ----

  ipcMain.handle('history:record', (_e, articleId: string, title: string) => {
    recordArticleView(articleId, title)
  })

  ipcMain.handle('history:getRecent', (_e, limit: number = 12): HistoryRow[] => {
    // Order by id rather than timestamp: several views can land in the same
    // millisecond, and ids are strictly monotonic.
    return db.prepare(`
      SELECT h.id, h.article_id, a.title, h.timestamp
      FROM History h JOIN Articles a ON a.id = h.article_id
      ORDER BY h.id DESC LIMIT ?
    `).all(limit) as HistoryRow[]
  })

  ipcMain.handle('history:getContinueReading', (): HistoryRow[] => {
    // Most recently viewed distinct articles; MAX(h.id) is each article's
    // latest view event.
    return db.prepare(`
      SELECT MAX(h.id) as id, h.article_id, a.title, MAX(h.timestamp) as timestamp
      FROM History h JOIN Articles a ON a.id = h.article_id
      GROUP BY h.article_id
      ORDER BY id DESC LIMIT 6
    `).all() as HistoryRow[]
  })

  // ---- Collections ----

  ipcMain.handle('collections:list', (): (CollectionRow & { article_count: number })[] => {
    return db.prepare(`
      SELECT c.*, COUNT(ca.article_id) as article_count
      FROM Collections c LEFT JOIN Collection_Articles ca ON ca.collection_id = c.id
      GROUP BY c.id ORDER BY c.created_at DESC
    `).all() as (CollectionRow & { article_count: number })[]
  })

  ipcMain.handle('collections:create', (_e, name: string): CollectionRow => {
    const id = `col_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`
    const createdAt = Date.now()
    db.prepare('INSERT INTO Collections (id, name, created_at) VALUES (?, ?, ?)').run(id, name.trim(), createdAt)
    return { id, name: name.trim(), created_at: createdAt }
  })

  ipcMain.handle('collections:delete', (_e, collectionId: string) => {
    db.transaction(() => {
      db.prepare('DELETE FROM Collection_Articles WHERE collection_id = ?').run(collectionId)
      db.prepare('DELETE FROM Collections WHERE id = ?').run(collectionId)
    })()
  })

  ipcMain.handle('collections:getArticles', (_e, collectionId: string): ArticleRow[] => {
    return db.prepare(`
      SELECT a.* FROM Articles a
      JOIN Collection_Articles ca ON ca.article_id = a.id
      WHERE ca.collection_id = ?
      ORDER BY ca.added_at DESC
    `).all(collectionId) as ArticleRow[]
  })

  ipcMain.handle('collections:addArticle', (_e, collectionId: string, articleId: string, title: string, summary: string | null) => {
    db.transaction(() => {
      db.prepare(`
        INSERT INTO Articles (id, title, summary, last_viewed) VALUES (?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET title = excluded.title,
          summary = COALESCE(excluded.summary, Articles.summary)
      `).run(articleId, title, summary, Date.now())
      db.prepare(`
        INSERT OR IGNORE INTO Collection_Articles (collection_id, article_id, added_at) VALUES (?, ?, ?)
      `).run(collectionId, articleId, Date.now())
    })()
  })

  ipcMain.handle('collections:removeArticle', (_e, collectionId: string, articleId: string) => {
    db.prepare('DELETE FROM Collection_Articles WHERE collection_id = ? AND article_id = ?').run(collectionId, articleId)
  })

  ipcMain.handle('collections:getForArticle', (_e, articleId: string): string[] => {
    const rows = db.prepare('SELECT collection_id FROM Collection_Articles WHERE article_id = ?').all(articleId) as { collection_id: string }[]
    return rows.map((r) => r.collection_id)
  })

  // ---- Settings ----

  ipcMain.handle('settings:get', (): SettingsRow => {
    return db.prepare('SELECT theme, font_size, content_width FROM Settings WHERE id = 1').get() as SettingsRow
  })

  ipcMain.handle('settings:update', (_e, patch: Partial<SettingsRow>) => {
    const current = db.prepare('SELECT theme, font_size, content_width FROM Settings WHERE id = 1').get() as SettingsRow
    const next = { ...current, ...patch }
    db.prepare('UPDATE Settings SET theme = ?, font_size = ?, content_width = ? WHERE id = 1')
      .run(next.theme, next.font_size, next.content_width)
    return next
  })
}
