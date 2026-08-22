import sqlite3 from 'sqlite3'
import { app, ipcMain } from 'electron'
import path from 'path'

let db: sqlite3.Database

export function initializeDB() {
  const userDataPath = app.getPath('userData')
  const dbPath = path.join(userDataPath, 'wikidesk.sqlite')
  
  db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('Could not connect to database', err)
    } else {
      console.log('Connected to SQLite database')
      setupTables()
    }
  })

  setupIpcHandlers()
}

function setupTables() {
  db.serialize(() => {
    db.run(`
      CREATE TABLE IF NOT EXISTS Articles (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        summary TEXT,
        last_viewed INTEGER,
        metadata TEXT
      )
    `)
    db.run(`
      CREATE TABLE IF NOT EXISTS History (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        article_id TEXT,
        timestamp INTEGER
      )
    `)
    db.run(`
      CREATE TABLE IF NOT EXISTS Collections (
        id TEXT PRIMARY KEY,
        name TEXT,
        created_at INTEGER
      )
    `)
    db.run(`
      CREATE TABLE IF NOT EXISTS Collection_Articles (
        collection_id TEXT,
        article_id TEXT,
        PRIMARY KEY (collection_id, article_id)
      )
    `)
    db.run(`
      CREATE TABLE IF NOT EXISTS Settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        theme TEXT DEFAULT 'light',
        focus_mode INTEGER DEFAULT 0,
        font_size INTEGER DEFAULT 16,
        width INTEGER DEFAULT 800
      )
    `)

    db.get('SELECT * FROM Settings WHERE id = 1', (_err, row) => {
      if (!row) {
        db.run('INSERT INTO Settings (id) VALUES (1)')
      }
    })
  })
}

function setupIpcHandlers() {
  ipcMain.handle('db:query', (_event, sql, ...params) => {
    return new Promise((resolve, reject) => {
      if (sql.trim().toUpperCase().startsWith('SELECT')) {
        db.all(sql, params, (err, rows) => {
          if (err) reject(err)
          else resolve(rows)
        })
      } else {
        db.run(sql, params, function(err) {
          if (err) reject(err)
          else resolve({ changes: this.changes, lastID: this.lastID })
        })
      }
    })
  })
}
