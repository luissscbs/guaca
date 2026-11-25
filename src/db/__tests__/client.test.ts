import { Platform } from 'react-native';
import { openGuacaDatabase, createInMemoryDatabase } from '../client';

describe('Database Client: openGuacaDatabase & Web Support', () => {
  const originalPlatform = Platform.OS;

  afterEach(() => {
    Platform.OS = originalPlatform;
    jest.resetModules();
  });

  it('creates an in-memory database successfully and executes queries', async () => {
    const db = createInMemoryDatabase();
    expect(db).toBeDefined();

    await db.execAsync(`
      CREATE TABLE test_items (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL
      );
    `);

    await db.runAsync('INSERT INTO test_items (id, name) VALUES (?, ?)', ['1', 'Item 1']);
    const row = await db.getFirstAsync<{ id: string; name: string }>('SELECT * FROM test_items WHERE id = ?', ['1']);
    expect(row).toEqual({ id: '1', name: 'Item 1' });
  });

  it('returns in-memory database when running on web (Platform.OS === "web")', async () => {
    Platform.OS = 'web';
    const db = await openGuacaDatabase('test-web.db');
    expect(db).toBeDefined();

    // Verify it functions as an in-memory executor
    await db.execAsync('CREATE TABLE web_test (id TEXT);');
    await db.runAsync('INSERT INTO web_test (id) VALUES (?)', ['web-1']);
    const row = await db.getFirstAsync<{ id: string }>('SELECT * FROM web_test');
    expect(row).toEqual({ id: 'web-1' });
  });

  it('falls back to in-memory database when expo-sqlite fails on native platform', async () => {
    Platform.OS = 'android';
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    // Force expo-sqlite to throw or fail
    jest.mock('expo-sqlite', () => {
      throw new Error('Native SQLite module not available');
    }, { virtual: true });

    const db = await openGuacaDatabase('native-fail.db');
    expect(db).toBeDefined();

    await db.execAsync('CREATE TABLE fallback_test (id TEXT);');
    await db.runAsync('INSERT INTO fallback_test (id) VALUES (?)', ['fallback-1']);
    const row = await db.getFirstAsync<{ id: string }>('SELECT * FROM fallback_test');
    expect(row).toEqual({ id: 'fallback-1' });

    consoleSpy.mockRestore();
  });
});
