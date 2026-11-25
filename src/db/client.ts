/**
 * Guaca v2: SQLite Database Client
 * Proporciona el conector nativo para expo-sqlite v15 (`openGuacaDatabase`)
 * y un ejecutor en memoria ultra-fiel (`createInMemoryDatabase`) para Jest y entornos sin binarios nativos.
 */

import { Platform } from 'react-native';
import { SQLiteBindParams, SQLiteBindValue, SQLiteExecutor, SQLiteRunResult } from './types';

/**
 * Conector a la base de datos local SQLite de Guaca.
 * - En la web (`Platform.OS === 'web'`), utiliza el motor en memoria ultra-fiel (`createInMemoryDatabase`).
 * - En plataformas móviles (Android / iOS), abre `expo-sqlite` nativo y, ante cualquier fallo o ausencia de binario,
 *   recurre automáticamente al motor en memoria como respaldo resiliente para no bloquear la app.
 */
export async function openGuacaDatabase(dbName: string = 'guaca.db'): Promise<SQLiteExecutor> {
  if (Platform.OS === 'web') {
    return createInMemoryDatabase();
  }

  try {
    const SQLite = require('expo-sqlite');
    const db = await SQLite.openDatabaseAsync(dbName);
    return db as SQLiteExecutor;
  } catch (error) {
    console.warn('[Guaca DB] No se pudo inicializar expo-sqlite nativo, usando base de datos en memoria como respaldo:', error);
    return createInMemoryDatabase();
  }
}

// =========================================================================
// Adaptador en Memoria Fiel para Pruebas Unitarias Deterministas en Jest
// =========================================================================

interface InMemoryState {
  userVersion: number;
  foreignKeys: number;
  journalMode: string;
  tables: Record<string, Record<string, unknown>[]>;
  tableColumns: Record<string, string[]>;
  indexes: Record<string, { tableName: string; indexName: string }>;
}

class InMemorySQLiteExecutor implements SQLiteExecutor {
  private state: InMemoryState = {
    userVersion: 0,
    foreignKeys: 0,
    journalMode: 'delete',
    tables: {},
    tableColumns: {},
    indexes: {},
  };

  /**
   * Ejecuta sentencias SQL DDL o PRAGMAS múltiples.
   */
  async execAsync(sql: string): Promise<void> {
    // Eliminar comentarios de línea (--) y de bloque (/* ... */)
    const cleanSql = sql
      .replace(/--.*$/gm, '')
      .replace(/\/\*[\s\S]*?\*\//g, '');

    const statements = cleanSql
      .split(';')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    for (const stmt of statements) {
      this.executeSingleStatement(stmt);
    }
  }

  /**
   * Ejecuta sentencias de modificación (INSERT, UPDATE, DELETE).
   */
  async runAsync(sql: string, params?: SQLiteBindParams): Promise<SQLiteRunResult> {
    const trimmed = sql
      .replace(/--.*$/gm, '')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\s+/g, ' ')
      .replace(/;+\s*$/, '')
      .trim();
    const cleanParams = params ? [...params] : [];

    if (/^INSERT\s+OR\s+REPLACE\s+INTO\s+/i.test(trimmed) || /^INSERT\s+INTO\s+/i.test(trimmed)) {
      return this.handleInsert(trimmed, cleanParams);
    }

    if (/^UPDATE\s+/i.test(trimmed)) {
      return this.handleUpdate(trimmed, cleanParams);
    }

    if (/^DELETE\s+FROM\s+/i.test(trimmed)) {
      return this.handleDelete(trimmed, cleanParams);
    }

    if (/^PRAGMA\s+/i.test(trimmed)) {
      this.executePragma(trimmed);
      return { lastInsertRowId: 0, changes: 0 };
    }

    return { lastInsertRowId: 0, changes: 0 };
  }

  /**
   * Obtiene la primera fila resultante de una consulta.
   */
  async getFirstAsync<T>(sql: string, params?: SQLiteBindParams): Promise<T | null> {
    const all = await this.getAllAsync<T>(sql, params);
    return all.length > 0 ? all[0] : null;
  }

  /**
   * Obtiene todas las filas resultantes de una consulta.
   */
  async getAllAsync<T>(sql: string, params?: SQLiteBindParams): Promise<T[]> {
    const trimmed = sql
      .replace(/--.*$/gm, '')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\s+/g, ' ')
      .replace(/;+\s*$/, '')
      .trim();
    const cleanParams = params ? [...params] : [];

    // PRAGMA table_info reads
    const tableInfoMatch = trimmed.match(/^PRAGMA\s+table_info\s*\(\s*([a-zA-Z0-9_]+)\s*\)/i);
    if (tableInfoMatch) {
      const tableName = tableInfoMatch[1];
      const cols = this.state.tableColumns[tableName] || [];
      return cols.map((name, cid) => ({
        cid,
        name,
        type: 'TEXT',
        notnull: 0,
        dflt_value: null,
        pk: cid === 0 ? 1 : 0,
      })) as unknown as T[];
    }

    // PRAGMA reads
    if (/^PRAGMA\s+foreign_keys/i.test(trimmed)) {
      return [{ foreign_keys: this.state.foreignKeys } as unknown as T];
    }
    if (/^PRAGMA\s+journal_mode/i.test(trimmed)) {
      return [{ journal_mode: this.state.journalMode } as unknown as T];
    }
    if (/^PRAGMA\s+user_version/i.test(trimmed)) {
      return [{ user_version: this.state.userVersion } as unknown as T];
    }

    // sqlite_master table/index checks
    if (/SELECT\s+name\s+FROM\s+sqlite_master/i.test(trimmed)) {
      const isTable = trimmed.includes("type='table'") || cleanParams.includes('table');
      const literalMatch = trimmed.match(/name\s*=\s*'([a-zA-Z0-9_]+)'/i);
      const targetName = (cleanParams.find((p) => p !== 'table' && p !== 'index') || cleanParams[0] || (literalMatch ? literalMatch[1] : null)) as string;

      if (isTable) {
        if (targetName && this.state.tables[targetName]) {
          return [{ name: targetName } as unknown as T];
        }
      } else {
        if (targetName && this.state.indexes[targetName]) {
          return [{ name: targetName } as unknown as T];
        }
      }
      return [];
    }

    // SELECT queries
    return this.handleSelect<T>(trimmed, cleanParams);
  }

  /**
   * Ejecuta una tarea en transacción atómica. Si falla, revierte el estado en memoria.
   */
  async withTransactionAsync(task: () => Promise<void>): Promise<void> {
    const snapshot = JSON.stringify(this.state);
    try {
      await task();
    } catch (err) {
      this.state = JSON.parse(snapshot);
      throw err;
    }
  }

  // ==========================================
  // Métodos Auxiliares Internos
  // ==========================================

  private executeSingleStatement(stmt: string): void {
    const upper = stmt.toUpperCase();

    if (upper.startsWith('PRAGMA')) {
      this.executePragma(stmt);
      return;
    }

    if (upper.startsWith('CREATE TABLE')) {
      const match = stmt.match(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?([a-zA-Z0-9_]+)(?:\s*\(([\s\S]+)\))?/i);
      if (match) {
        const tableName = match[1];
        if (!this.state.tables[tableName]) {
          this.state.tables[tableName] = [];
        }
        if (match[2]) {
          const lines = match[2]
            .split(/,|\n/)
            .map((l) => l.trim())
            .filter((l) => l.length > 0);
          const cols: string[] = [];
          for (const line of lines) {
            const colMatch = line.match(/^([a-zA-Z0-9_]+)\s+[A-Z]+/i);
            if (
              colMatch &&
              !['PRIMARY', 'FOREIGN', 'CHECK', 'CONSTRAINT', 'UNIQUE'].includes(
                colMatch[1].toUpperCase()
              )
            ) {
              cols.push(colMatch[1]);
            }
          }
          this.state.tableColumns[tableName] = cols;
        }
      }
      return;
    }

    if (upper.startsWith('ALTER TABLE')) {
      const match = stmt.match(
        /ALTER\s+TABLE\s+([a-zA-Z0-9_]+)\s+ADD\s+COLUMN\s+([a-zA-Z0-9_]+)/i
      );
      if (match) {
        const tableName = match[1];
        const colName = match[2];
        let defaultVal: unknown = null;
        const defaultMatch = stmt.match(/DEFAULT\s+('(?:''|[^'])*'|\S+)/i);
        if (defaultMatch) {
          const raw = defaultMatch[1];
          if (raw.startsWith("'") && raw.endsWith("'")) {
            defaultVal = raw.slice(1, -1).replace(/''/g, "'");
          } else if (!isNaN(Number(raw))) {
            defaultVal = Number(raw);
          } else {
            defaultVal = raw;
          }
        }

        if (!this.state.tableColumns[tableName]) {
          this.state.tableColumns[tableName] = [];
        }
        if (!this.state.tableColumns[tableName].includes(colName)) {
          this.state.tableColumns[tableName].push(colName);
        }
        if (this.state.tables[tableName]) {
          for (const row of this.state.tables[tableName]) {
            if (row[colName] === undefined) {
              row[colName] = defaultVal;
            }
          }
        }
      }
      return;
    }

    if (upper.startsWith('INSERT INTO') || upper.startsWith('INSERT OR REPLACE INTO')) {
      this.handleInsert(stmt, []);
      return;
    }

    if (upper.startsWith('CREATE INDEX')) {
      const match = stmt.match(/CREATE\s+INDEX\s+(?:IF\s+NOT\s+EXISTS\s+)?([a-zA-Z0-9_]+)\s+ON\s+([a-zA-Z0-9_]+)/i);
      if (match) {
        const indexName = match[1];
        const tableName = match[2];
        this.state.indexes[indexName] = { tableName, indexName };
      }
      return;
    }

    if (upper.startsWith('DELETE FROM')) {
      const match = stmt.match(/DELETE\s+FROM\s+([a-zA-Z0-9_]+)/i);
      if (match) {
        const tableName = match[1];
        if (this.state.tables[tableName]) {
          this.state.tables[tableName] = [];
        }
      }
      return;
    }
  }

  private executePragma(stmt: string): void {
    const fkMatch = stmt.match(/PRAGMA\s+foreign_keys\s*=\s*(ON|OFF|1|0)/i);
    if (fkMatch) {
      this.state.foreignKeys = ['ON', '1'].includes(fkMatch[1].toUpperCase()) ? 1 : 0;
      return;
    }

    const jmMatch = stmt.match(/PRAGMA\s+journal_mode\s*=\s*([a-zA-Z]+)/i);
    if (jmMatch) {
      this.state.journalMode = jmMatch[1].toLowerCase();
      return;
    }

    const uvMatch = stmt.match(/PRAGMA\s+user_version\s*=\s*(\d+)/i);
    if (uvMatch) {
      this.state.userVersion = parseInt(uvMatch[1], 10);
      return;
    }
  }

  private handleInsert(sql: string, params: SQLiteBindParams): SQLiteRunResult {
    const isReplace = /^INSERT\s+OR\s+REPLACE\s+INTO/i.test(sql);
    const match = sql.match(/INSERT(?:\s+OR\s+REPLACE)?\s+INTO\s+([a-zA-Z0-9_]+)\s*\(([^)]+)\)\s*VALUES\s*\(([^)]+)\)/i);
    if (!match) {
      return { lastInsertRowId: 0, changes: 0 };
    }

    const tableName = match[1];
    const columns = match[2].split(',').map((c) => c.trim());
    const valTokens = match[3].split(',').map((v) => v.trim());

    if (!this.state.tables[tableName]) {
      this.state.tables[tableName] = [];
    }

    const row: Record<string, unknown> = {};
    let pIdx = 0;

    columns.forEach((col, idx) => {
      const token = valTokens[idx];
      if (token === '?') {
        row[col] = params[pIdx++] ?? null;
      } else if (token !== undefined) {
        if (/^\d+$/.test(token)) {
          row[col] = parseInt(token, 10);
        } else if (/^['"].*['"]$/.test(token)) {
          row[col] = token.slice(1, -1);
        } else if (/^null$/i.test(token)) {
          row[col] = null;
        } else {
          row[col] = token;
        }
      } else {
        row[col] = params[pIdx++] ?? null;
      }
    });

    const rows = this.state.tables[tableName];

    if (isReplace && row['id'] !== undefined) {
      const existingIdx = rows.findIndex((r) => r['id'] === row['id']);
      if (existingIdx >= 0) {
        rows[existingIdx] = row;
        return { lastInsertRowId: existingIdx + 1, changes: 1 };
      }
    }

    rows.push(row);
    return { lastInsertRowId: rows.length, changes: 1 };
  }

  private handleUpdate(sql: string, params: SQLiteBindParams): SQLiteRunResult {
    const match = sql.match(/UPDATE\s+([a-zA-Z0-9_]+)\s+SET\s+(.+?)(?:\s+WHERE\s+(.+))?$/i);
    if (!match) {
      return { lastInsertRowId: 0, changes: 0 };
    }

    const tableName = match[1];
    const setClause = match[2];
    const whereClause = match[3];

    const rows = this.state.tables[tableName] || [];
    let paramIndex = 0;

    // Parse SET assignments
    const assignments: { col: string; isExpression?: boolean; exprCol?: string; op?: string; isLiteralParam?: boolean }[] = [];
    const setParts = setClause.split(',').map((s) => s.trim());

    for (const part of setParts) {
      // Check for expr like: balance = balance + ?
      const exprMatch = part.match(/^([a-zA-Z0-9_]+)\s*=\s*([a-zA-Z0-9_]+)\s*([+-])\s*\?$/i);
      if (exprMatch) {
        assignments.push({
          col: exprMatch[1],
          isExpression: true,
          exprCol: exprMatch[2],
          op: exprMatch[3],
        });
      } else {
        const directMatch = part.match(/^([a-zA-Z0-9_]+)\s*=\s*\?$/i);
        if (directMatch) {
          assignments.push({ col: directMatch[1], isLiteralParam: true });
        }
      }
    }

    // Extract assignment values from params
    const resolvedAssignments = assignments.map((assign) => {
      const val = params[paramIndex++];
      return { ...assign, value: val };
    });

    // Where condition
    let changes = 0;
    for (const row of rows) {
      let matches = true;
      if (whereClause) {
        matches = this.evaluateWhere(row, whereClause, params.slice(paramIndex));
      }

      if (matches) {
        for (const assign of resolvedAssignments) {
          if (assign.isExpression && assign.exprCol && assign.op) {
            const current = (row[assign.exprCol] as number) || 0;
            const delta = (assign.value as number) || 0;
            row[assign.col] = assign.op === '+' ? current + delta : current - delta;
          } else {
            row[assign.col] = assign.value;
          }
        }
        changes++;
      }
    }

    return { lastInsertRowId: 0, changes };
  }

  private handleDelete(sql: string, params: SQLiteBindParams): SQLiteRunResult {
    const match = sql.match(/DELETE\s+FROM\s+([a-zA-Z0-9_]+)(?:\s+WHERE\s+(.+))?$/i);
    if (!match) {
      return { lastInsertRowId: 0, changes: 0 };
    }

    const tableName = match[1];
    const whereClause = match[2];
    const rows = this.state.tables[tableName] || [];

    if (!whereClause) {
      const changes = rows.length;
      this.state.tables[tableName] = [];
      return { lastInsertRowId: 0, changes };
    }

    const initialLen = rows.length;
    this.state.tables[tableName] = rows.filter((row) => !this.evaluateWhere(row, whereClause, params));
    return { lastInsertRowId: 0, changes: initialLen - this.state.tables[tableName].length };
  }

  private handleSelect<T>(sql: string, params: SQLiteBindParams): T[] {
    // Parse table name
    const fromMatch = sql.match(/FROM\s+([a-zA-Z0-9_]+)/i);
    if (!fromMatch) {
      return [];
    }

    const tableName = fromMatch[1];
    let rows = [...(this.state.tables[tableName] || [])];

    // WHERE clause
    const whereMatch = sql.match(/WHERE\s+(.+?)(?:\s+GROUP\s+BY|\s+ORDER\s+BY|\s+LIMIT|$)/i);
    let paramsForWhere = [...params];

    // Check if limit & offset params are present at the end
    let limitVal: number | null = null;
    let offsetVal: number | null = null;

    const limitMatch = sql.match(/LIMIT\s+(\?|\d+)(?:\s+OFFSET\s+(\?|\d+))?/i);
    if (limitMatch) {
      if (limitMatch[1] === '?') {
        const offsetParam = limitMatch[2] === '?' ? paramsForWhere.pop() : null;
        const limitParam = paramsForWhere.pop();
        limitVal = typeof limitParam === 'number' ? limitParam : null;
        offsetVal = typeof offsetParam === 'number' ? offsetParam : null;
      } else {
        limitVal = parseInt(limitMatch[1], 10);
        if (limitMatch[2]) {
          offsetVal = limitMatch[2] === '?' ? (paramsForWhere.pop() as number) : parseInt(limitMatch[2], 10);
        }
      }
    }

    if (whereMatch) {
      const whereClause = whereMatch[1];
      rows = rows.filter((row) => this.evaluateWhere(row, whereClause, paramsForWhere));
    }

    // Aggregations: COUNT(*), SUM(...), GROUP BY
    const isCount = /COUNT\(\*\)\s+as\s+total/i.test(sql);
    const isSum = /SUM\(/i.test(sql);
    const groupByMatch = sql.match(/GROUP\s+BY\s+([a-zA-Z0-9_]+)/i);

    if (isCount) {
      return [{ total: rows.length } as unknown as T];
    }

    if (groupByMatch) {
      const groupCol = groupByMatch[1];
      const groups = new Map<string, number>();

      for (const row of rows) {
        const key = String(row[groupCol] ?? '');
        const amount = (row['amount'] as number) || 0;
        groups.set(key, (groups.get(key) || 0) + amount);
      }

      const results: Record<string, unknown>[] = [];
      for (const [key, total] of groups.entries()) {
        results.push({ [groupCol]: key, total });
      }
      return results as unknown as T[];
    }

    if (isSum) {
      // Aggregation queries like getMonthlyCoachSummary
      // e.g.: SELECT COALESCE(SUM(amount), 0) as total FROM ...
      // or: SELECT COALESCE(SUM(remaining_balance), 0) as totalDebt, COALESCE(SUM(minimum_monthly_payment), 0) as totalMinPayment FROM debts ...
      const resultObj: Record<string, unknown> = {};

      if (/SUM\(amount\)/i.test(sql)) {
        const sum = rows.reduce((acc, r) => acc + ((r['amount'] as number) || 0), 0);
        resultObj['total'] = sum;
      }
      if (/SUM\(balance\)/i.test(sql)) {
        const sum = rows.reduce((acc, r) => acc + ((r['balance'] as number) || 0), 0);
        resultObj['totalLiquidity'] = sum;
      }
      if (/SUM\(remaining_balance\)/i.test(sql)) {
        const sumDebt = rows.reduce((acc, r) => acc + ((r['remaining_balance'] as number) || 0), 0);
        resultObj['totalDebt'] = sumDebt;
      }
      if (/SUM\(minimum_monthly_payment\)/i.test(sql)) {
        const sumMin = rows.reduce((acc, r) => acc + ((r['minimum_monthly_payment'] as number) || 0), 0);
        resultObj['totalMinPayment'] = sumMin;
      }

      return [resultObj as unknown as T];
    }

    // ORDER BY
    const orderMatch = sql.match(/ORDER\s+BY\s+(.+?)(?:\s+LIMIT|$)/i);
    if (orderMatch) {
      const orderExprs = orderMatch[1].split(',').map((s) => s.trim());
      rows.sort((a, b) => {
        for (const expr of orderExprs) {
          const [col, dir] = expr.split(/\s+/);
          const isDesc = dir && dir.toUpperCase() === 'DESC';
          const valA = a[col] as string | number;
          const valB = b[col] as string | number;

          if (valA === valB) continue;
          if (valA === undefined || valA === null) return 1;
          if (valB === undefined || valB === null) return -1;

          if (isDesc) {
            return valA > valB ? -1 : 1;
          }
          return valA > valB ? 1 : -1;
        }
        return 0;
      });
    }

    // OFFSET & LIMIT
    if (offsetVal !== null && offsetVal > 0) {
      rows = rows.slice(offsetVal);
    }
    if (limitVal !== null && limitVal >= 0) {
      rows = rows.slice(0, limitVal);
    }

    return rows as unknown as T[];
  }

  private evaluateWhere(row: Record<string, unknown>, whereClause: string, params: SQLiteBindParams): boolean {
    let pIdx = 0;

    // Handle compound clauses split by AND
    const conditions = whereClause.split(/\s+AND\s+/i);

    for (const cond of conditions) {
      const trimmedCond = cond.replace(/;+\s*$/, '').trim();

      // Check for paren OR: (note LIKE ? OR category_id LIKE ?)
      if (trimmedCond.startsWith('(') && trimmedCond.endsWith(')')) {
        const inner = trimmedCond.slice(1, -1);
        const orParts = inner.split(/\s+OR\s+/i);
        let orMatches = false;
        for (const part of orParts) {
          const partParam = params[pIdx++];
          if (this.evalSingleCond(row, part.trim(), partParam)) {
            orMatches = true;
          }
        }
        if (!orMatches) return false;
        continue;
      }

      // Check simple condition with ?
      if (trimmedCond.includes('?')) {
        const paramVal = params[pIdx++];
        if (!this.evalSingleCond(row, trimmedCond, paramVal)) {
          return false;
        }
      } else {
        // Condition without ?, e.g. id = 1, is_archived = 0, is_paid = 0
        if (!this.evalLiteralCond(row, trimmedCond)) {
          return false;
        }
      }
    }

    return true;
  }

  private evalSingleCond(row: Record<string, unknown>, cond: string, param: SQLiteBindValue): boolean {
    const eqMatch = cond.match(/^([a-zA-Z0-9_]+)\s*=\s*\?$/i);
    if (eqMatch) {
      const col = eqMatch[1];
      return row[col] === param;
    }

    const neMatch = cond.match(/^([a-zA-Z0-9_]+)\s*!=\s*\?$/i);
    if (neMatch) {
      const col = neMatch[1];
      return row[col] !== param;
    }

    const gteMatch = cond.match(/^([a-zA-Z0-9_]+)\s*>=\s*\?$/i);
    if (gteMatch) {
      const col = gteMatch[1];
      return (row[col] as number | string) >= (param as number | string);
    }

    const lteMatch = cond.match(/^([a-zA-Z0-9_]+)\s*<=\s*\?$/i);
    if (lteMatch) {
      const col = lteMatch[1];
      return (row[col] as number | string) <= (param as number | string);
    }

    const likeMatch = cond.match(/^([a-zA-Z0-9_]+)\s+LIKE\s+\?(?:\s+ESCAPE\s+['"]\\['"])?$/i);
    if (likeMatch) {
      const col = likeMatch[1];
      const val = String(row[col] ?? '');
      const pattern = String(param ?? '');
      return this.matchLikePattern(val, pattern);
    }

    return true;
  }

  private evalLiteralCond(row: Record<string, unknown>, cond: string): boolean {
    const eqMatch = cond.match(/^([a-zA-Z0-9_]+)\s*=\s*([0-9a-zA-Z_]+)$/i);
    if (eqMatch) {
      const col = eqMatch[1];
      const literal = eqMatch[2];
      const num = parseInt(literal, 10);
      const target = isNaN(num) ? literal : num;
      return row[col] === target;
    }
    return true;
  }

  /**
   * Coincidencia SQL LIKE con escape para comodines % y _.
   */
  private matchLikePattern(value: string, pattern: string): boolean {
    // Si contiene comodines SQL % y _ con posible escape de \
    let regexStr = '^';
    let i = 0;
    while (i < pattern.length) {
      const char = pattern[i];
      if (char === '\\' && i + 1 < pattern.length) {
        // Carácter escapado
        const nextChar = pattern[i + 1];
        regexStr += escapeRegExp(nextChar);
        i += 2;
        continue;
      }
      if (char === '%') {
        regexStr += '.*';
      } else if (char === '_') {
        regexStr += '.';
      } else {
        regexStr += escapeRegExp(char);
      }
      i++;
    }
    regexStr += '$';
    return new RegExp(regexStr, 'i').test(value);
  }
}

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Crea una base de datos en memoria para Jest y pruebas unitarias aisladas.
 */
export function createInMemoryDatabase(): SQLiteExecutor {
  return new InMemorySQLiteExecutor();
}
