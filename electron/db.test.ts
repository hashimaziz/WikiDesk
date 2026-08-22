// @vitest-environment node
import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import Database from 'better-sqlite3';

const { testState } = vi.hoisted(() => ({
  testState: {
    userDataDir: '',
    handlers: new Map<string, (...args: unknown[]) => unknown>(),
  },
}));

vi.mock('electron', () => ({
  app: {
    getPath: vi.fn(() => testState.userDataDir),
  },
  ipcMain: {
    handle: vi.fn((channel: string, handler: (...args: unknown[]) => unknown) => {
      testState.handlers.set(channel, handler);
    }),
  },
}));

function call(channel: string, ...args: unknown[]): unknown {
  const handler = testState.handlers.get(channel);
  if (!handler) throw new Error(`No handler registered for ${channel}`);
  return handler(undefined, ...args);
}

function freshUserDataDir(): string {
  return mkdtempSync(join(tmpdir(), 'wikidesk-test-'));
}

describe('database layer', () => {
  let initializeDB: () => void;

  beforeAll(async () => {
    const mod = await import('./db');
    initializeDB = mod.initializeDB;
  });

  beforeEach(() => {
    testState.userDataDir = freshUserDataDir();
    testState.handlers.clear();
    vi.clearAllMocks();
  });

  it('registers all expected IPC handlers', () => {
    initializeDB();
    for (const channel of [
      'history:record', 'history:getRecent', 'history:getContinueReading',
      'collections:list', 'collections:create', 'collections:delete',
      'collections:getArticles', 'collections:addArticle', 'collections:removeArticle',
      'collections:getForArticle', 'settings:get', 'settings:update',
    ]) {
      expect(testState.handlers.has(channel)).toBe(true);
    }
  });

  it('returns default settings and persists partial updates', () => {
    initializeDB();

    expect(call('settings:get')).toEqual({ theme: 'light', font_size: 18, content_width: 768 });

    call('settings:update', { theme: 'dark' });
    expect(call('settings:get')).toEqual({ theme: 'dark', font_size: 18, content_width: 768 });

    call('settings:update', { font_size: 24, content_width: 1152 });
    expect(call('settings:get')).toEqual({ theme: 'dark', font_size: 24, content_width: 1152 });
  });

  it('deduplicates continue-reading per article and orders by recency', () => {
    initializeDB();

    call('history:record', 'Rome', 'Rome');
    call('history:record', 'Rome', 'Rome'); // viewed again
    call('history:record', 'Tesla', 'Tesla');

    const reading = call('history:getContinueReading') as { article_id: string; title: string }[];
    expect(reading.map((r) => r.article_id)).toEqual(['Tesla', 'Rome']);
    expect(reading).toHaveLength(2);
  });

  it('respects the recent-reads limit', () => {
    initializeDB();

    call('history:record', 'A', 'A');
    call('history:record', 'B', 'B');
    call('history:record', 'C', 'C');

    const recent = call('history:getRecent', 2) as { article_id: string }[];
    expect(recent).toHaveLength(2);
    expect(recent[0].article_id).toBe('C');
  });

  it('manages collections end to end including cascade delete', () => {
    initializeDB();

    const col = call('collections:create', 'Ancient Rome') as { id: string; name: string };
    expect(col.name).toBe('Ancient Rome');

    call('collections:addArticle', col.id, 'Roman Empire', 'Roman Empire', 'The Roman Empire was…');
    call('collections:addArticle', col.id, 'Roman Empire', 'Roman Empire', null); // idempotent
    call('collections:addArticle', col.id, 'Colosseum', 'Colosseum', null);

    let listed = call('collections:list') as { id: string; article_count: number }[];
    expect(listed.find((c) => c.id === col.id)?.article_count).toBe(2);

    expect(call('collections:getForArticle', 'Roman Empire')).toEqual([col.id]);

    const articles = call('collections:getArticles', col.id) as { id: string }[];
    expect(articles.map((a) => a.id)).toEqual(['Colosseum', 'Roman Empire']); // newest first

    call('collections:removeArticle', col.id, 'Colosseum');
    listed = call('collections:list') as { id: string; article_count: number }[];
    expect(listed.find((c) => c.id === col.id)?.article_count).toBe(1);

    call('collections:delete', col.id);
    expect(call('collections:list')).toEqual([]);
    // Cascade removed the join rows.
    expect(call('collections:getForArticle', 'Roman Empire')).toEqual([]);
  });

  it('recreates incompatible v0 databases instead of crashing on old schemas', () => {
    // Simulate a pre-versioning database containing the old Settings schema.
    const legacy = new Database(join(testState.userDataDir, 'wikidesk.sqlite'));
    legacy.exec(`
      CREATE TABLE Settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        theme TEXT DEFAULT 'light',
        focus_mode INTEGER DEFAULT 0,
        font_size INTEGER DEFAULT 16,
        width INTEGER DEFAULT 800
      );
      INSERT INTO Settings (id) VALUES (1);
      PRAGMA user_version = 0;
    `);
    legacy.close();

    initializeDB();

    // Old columns are gone; the new singleton row exists with defaults.
    expect(call('settings:get')).toEqual({ theme: 'light', font_size: 18, content_width: 768 });
  });
});
