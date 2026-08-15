import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

const BACKUP_ROOT = path.resolve(process.cwd(), 'backups');
const DB_DIR = path.join(BACKUP_ROOT, 'database');
const MEDIA_DIR = path.join(BACKUP_ROOT, 'media');
const STORAGE_ROOT = path.resolve(process.cwd(), 'storage');
const RETENTION_DAYS = 30;

const FILENAME_RE = /^zenportal_(database|media)_\d{8}_\d{6}\.(sql|tar\.gz)$/;
const IDENTITY_COLUMN_RE = /^nextval\('([^']+)'::regclass\)$/;

// SQL string literal: single quotes doubled. Relies on standard_conforming_strings=on
// (default since PG 9.1; the dump file sets it explicitly).
const sqlLiteral = (v: string) => `'${v.replace(/'/g, "''")}'`;

function sqlValue(v: unknown): string {
  if (v === null || v === undefined) return 'NULL';
  if (typeof v === 'boolean') return v ? 'true' : 'false';
  if (typeof v === 'number') return String(v);
  if (v instanceof Date) return sqlLiteral(v.toISOString());
  if (typeof v === 'object') return sqlLiteral(JSON.stringify(v)); // jsonb
  return sqlLiteral(String(v));
}

// multer/busboy encodes multipart filenames as latin1; decode to UTF-8
// only when the name actually contains high bytes (avoids double-decoding ASCII)
function decodeFilename(name: string): string {
  const hasHighByte = [...name].some((ch) => ch.charCodeAt(0) > 127);
  if (!hasHighByte) return name;
  try {
    const decoded = Buffer.from(name, 'latin1').toString('utf8');
    return decoded.includes('\uFFFD') ? name : decoded;
  } catch {
    return name;
  }
}

// Split SQL into statements, aware of '...' string literals ('' doubling and E'...' backslash escapes).
function splitSqlStatements(sql: string): string[] {
  const statements: string[] = [];
  let current = '';
  let inString = false;
  let escapeString = false;
  let i = 0;
  while (i < sql.length) {
    const ch = sql[i];
    if (inString) {
      current += ch;
      if (ch === '\\' && escapeString) {
        if (i + 1 < sql.length) { current += sql[i + 1]; i += 2; continue; }
      } else if (ch === "'") {
        if (sql[i + 1] === "'") { current += "'"; i += 2; continue; }
        inString = false;
      }
      i += 1;
      continue;
    }
    if (ch === "'") {
      escapeString = /[eE]$/.test(current.trim());
      inString = true;
      current += ch;
      i += 1;
      continue;
    }
    if (ch === ';') {
      const stmt = current.trim();
      if (stmt) statements.push(stmt);
      current = '';
      i += 1;
      continue;
    }
    current += ch;
    i += 1;
  }
  const tail = current.trim();
  if (tail) statements.push(tail);
  return statements;
}

@Injectable()
export class BackupService {
  private readonly logger = new Logger(BackupService.name);

  // ── Backup ─────────────────────────────────────────────────────────────

  async createDatabaseBackup(): Promise<{ path: string; filename: string }> {
    fs.mkdirSync(DB_DIR, { recursive: true });
    const filename = `zenportal_database_${this.timestamp()}.sql`;
    const dest = path.join(DB_DIR, filename);

    const client = await this.newClient();
    try {
      const sql = await this.dumpDatabase(client);
      fs.writeFileSync(dest, sql);
    } finally {
      await client.end();
    }
    this.cleanupOld(DB_DIR);
    return { path: dest, filename };
  }

  async createMediaBackup(): Promise<{ path: string; filename: string }> {
    fs.mkdirSync(STORAGE_ROOT, { recursive: true });
    fs.mkdirSync(MEDIA_DIR, { recursive: true });
    const filename = `zenportal_media_${this.timestamp()}.tar.gz`;
    const dest = path.join(MEDIA_DIR, filename);

    try {
      await execFileAsync('tar', ['-czf', dest, '-C', STORAGE_ROOT, '.'], { maxBuffer: 10 * 1024 * 1024 });
    } catch (e) {
      this.logger.error(`tar failed: ${e instanceof Error ? e.message : e}`);
      throw new BadRequestException('Failed to create media archive (tar unavailable?)');
    }
    this.cleanupOld(MEDIA_DIR);
    return { path: dest, filename };
  }

  async listBackups() {
    const files: { type: string; filename: string; size: number; mtime: string }[] = [];
    for (const [type, dir] of [['database', DB_DIR], ['media', MEDIA_DIR]] as const) {
      if (!fs.existsSync(dir)) continue;
      for (const name of fs.readdirSync(dir)) {
        const p = path.join(dir, name);
        let st: fs.Stats;
        try { st = fs.statSync(p); } catch { continue; }
        if (!st.isFile()) continue;
        files.push({ type, filename: name, size: st.size, mtime: st.mtime.toISOString() });
      }
    }
    files.sort((a, b) => b.mtime.localeCompare(a.mtime));
    return files;
  }

  resolveBackup(filename: string): { path: string; filename: string } {
    const m = filename.match(FILENAME_RE);
    if (!m) throw new BadRequestException('Invalid backup filename');
    const dir = m[1] === 'database' ? DB_DIR : MEDIA_DIR;
    const p = path.join(dir, filename);
    if (!fs.existsSync(p)) throw new NotFoundException('Backup file not found');
    return { path: p, filename };
  }

  removeBackup(filename: string) {
    const { path: p } = this.resolveBackup(filename);
    fs.unlinkSync(p);
    return { deleted: filename };
  }

  // ── Restore ────────────────────────────────────────────────────────────

  async restoreDatabase(uploadPath: string) {
    const sql = fs.readFileSync(uploadPath, 'utf8');
    const statements = splitSqlStatements(sql);
    if (statements.length === 0) throw new BadRequestException('Empty SQL file');

    const client = await this.newClient();
    try {
      await client.query('BEGIN');
      await client.query('SET standard_conforming_strings = on');
      for (const stmt of statements) {
        await client.query(stmt);
      }
      await client.query('COMMIT');
      this.logger.log(`Database restored from SQL (${statements.length} statements)`);
    } catch (e) {
      try { await client.query('ROLLBACK'); } catch { /* connection may be dead */ }
      throw new BadRequestException(`Restore failed, changes rolled back: ${e instanceof Error ? e.message : e}`);
    } finally {
      await client.end();
    }
    return { success: true };
  }

  async restoreMedia(uploadPath: string) {
    // verify archive entries stay inside the extraction dir (block path traversal)
    let listing: string;
    try {
      const res = await execFileAsync('tar', ['-tzf', uploadPath], { maxBuffer: 10 * 1024 * 1024 });
      listing = res.stdout;
    } catch (e) {
      throw new BadRequestException(`Invalid archive: ${e instanceof Error ? e.message : e}`);
    }
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'zenportal_restore_'));
    try {
      for (const line of listing.split('\n')) {
        if (!line) continue;
        const resolved = path.resolve(tmpDir, line);
        if (resolved !== tmpDir && !resolved.startsWith(tmpDir + path.sep)) {
          throw new BadRequestException('Invalid archive: unsafe path');
        }
      }
      await execFileAsync('tar', ['-xzf', uploadPath, '-C', tmpDir], { maxBuffer: 10 * 1024 * 1024 });

      // clear current storage, copy extracted files in
      // (cp, not rename: /tmp and the storage volume may be on different devices → EXDEV)
      fs.mkdirSync(STORAGE_ROOT, { recursive: true });
      for (const e of fs.readdirSync(STORAGE_ROOT)) {
        fs.rmSync(path.join(STORAGE_ROOT, e), { recursive: true, force: true });
      }
      for (const e of fs.readdirSync(tmpDir)) {
        fs.cpSync(path.join(tmpDir, e), path.join(STORAGE_ROOT, e), { recursive: true });
      }
      this.logger.log('Media files restored');
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
    return { success: true };
  }

  // ── Internals ──────────────────────────────────────────────────────────

  private async newClient(): Promise<Client> {
    const url = process.env.DATABASE_URL;
    if (!url) throw new BadRequestException('DATABASE_URL is not configured');
    const client = new Client({ connectionString: url });
    await client.connect();
    return client;
  }

  private timestamp(): string {
    const d = new Date();
    const p = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
  }

  private cleanupOld(dir: string) {
    const cutoff = Date.now() - RETENTION_DAYS * 24 * 3600 * 1000;
    for (const name of fs.readdirSync(dir)) {
      const p = path.join(dir, name);
      try {
        if (fs.statSync(p).isFile() && fs.statSync(p).mtimeMs < cutoff) {
          fs.unlinkSync(p);
          this.logger.log(`Removed expired backup: ${name}`);
        }
      } catch { /* file may have disappeared */ }
    }
  }

  private async dumpDatabase(client: Client): Promise<string> {
    const { rows } = await client.query(
      `SELECT table_name FROM information_schema.tables
       WHERE table_schema = 'public' AND table_type = 'BASE TABLE' ORDER BY table_name`,
    );
    const tables = rows.map((r) => r.table_name as string);

    const lines: string[] = [
      '-- ZenPortal database backup',
      `-- Generated: ${new Date().toISOString()}`,
      '',
      'SET standard_conforming_strings = on;',
      '',
      'BEGIN;',
      '',
    ];

    // schema: drop + create for every table, then indexes
    const sequences: { seq: string; table: string; column: string }[] = [];
    for (const table of tables) {
      const built = await this.buildTableSql(client, table);
      lines.push(...built.ddl);
      sequences.push(...built.sequences);
    }

    // data: parents before children (FK order)
    for (const table of await this.orderTables(client, tables)) {
      lines.push(...await this.buildDataSql(client, table));
    }

    // FK constraints (after data, matching pg_dump behaviour)
    for (const table of tables) {
      lines.push(...await this.buildFkSql(client, table));
    }

    // fix serial sequences
    for (const s of sequences) {
      lines.push(
        `SELECT setval('${s.seq}', COALESCE((SELECT MAX("${s.column}") FROM "public"."${s.table}"), 1), ` +
        `(SELECT MAX("${s.column}") FROM "public"."${s.table}") IS NOT NULL);`,
      );
    }

    lines.push('', 'COMMIT;', '');
    return lines.join('\n');
  }

  private async buildTableSql(client: Client, table: string) {
    const colsRes = await client.query(
      `SELECT a.attname AS name,
              pg_catalog.format_type(a.atttypid, a.atttypmod) AS type,
              a.attnotnull AS notnull,
              pg_get_expr(d.adbin, d.adrelid) AS default_expr
       FROM pg_catalog.pg_attribute a
       LEFT JOIN pg_catalog.pg_attrdef d ON (a.attrelid = d.adrelid AND a.attnum = d.adnum)
       WHERE a.attrelid = $1::regclass AND a.attnum > 0 AND NOT a.attisdropped
       ORDER BY a.attnum`,
      [`"public"."${table}"`],
    );
    const pkRes = await client.query(
      `SELECT a.attname
       FROM pg_catalog.pg_index i
       JOIN pg_catalog.pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
       WHERE i.indrelid = $1::regclass AND i.indisprimary`,
      [`"public"."${table}"`],
    );
    const idxRes = await client.query(
      `SELECT pg_get_indexdef(i.indexrelid) AS indexdef
       FROM pg_catalog.pg_index i
       WHERE i.indrelid = $1::regclass AND NOT i.indisprimary`,
      [`"public"."${table}"`],
    );

    // serial/identity columns: nextval() defaults reference a sequence that
    // Postgres does NOT auto-create, so dump it explicitly before the table
    const sequences = colsRes.rows
      .filter((r) => r.default_expr && IDENTITY_COLUMN_RE.test(r.default_expr))
      .map((r) => {
        const m = r.default_expr.match(IDENTITY_COLUMN_RE)!;
        return { seq: m[1], table, column: r.name as string };
      });

    const defs = colsRes.rows.map((r) => {
      let d = `  "${r.name}" ${r.type}`;
      if (r.default_expr) d += ` DEFAULT ${r.default_expr}`;
      if (r.notnull) d += ' NOT NULL';
      return d;
    });
    const pkCols = pkRes.rows.map((r) => r.attname as string);
    if (pkCols.length > 0) defs.push(`  PRIMARY KEY (${pkCols.map((c) => `"${c}"`).join(', ')})`);

    const ddl: string[] = [`DROP TABLE IF EXISTS "public"."${table}" CASCADE;`, ''];
    for (const s of sequences) {
      ddl.push(`CREATE SEQUENCE IF NOT EXISTS ${s.seq};`);
    }
    ddl.push(
      '',
      `CREATE TABLE "public"."${table}" (`,
      defs.join(',\n'),
      `);`,
      '',
    );
    for (const s of sequences) {
      ddl.push(`ALTER SEQUENCE ${s.seq} OWNED BY "public"."${table}"."${s.column}";`);
    }
    for (const r of idxRes.rows) {
      ddl.push(r.indexdef.replace(' INDEX ', ' INDEX IF NOT EXISTS ') + ';');
    }
    ddl.push('');

    return { ddl, sequences };
  }

  private async buildDataSql(client: Client, table: string): Promise<string[]> {
    const colsRes = await client.query(
      `SELECT column_name FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = $1 ORDER BY ordinal_position`,
      [table],
    );
    const cols = colsRes.rows.map((r) => r.column_name as string);
    if (cols.length === 0) return [];

    const colList = cols.map((c) => `"${c}"`).join(', ');
    const { rows } = await client.query(`SELECT ${colList} FROM "public"."${table}"`);
    if (rows.length === 0) return [];

    const out: string[] = [];
    for (const row of rows) {
      const vals = cols.map((c) => sqlValue(row[c])).join(', ');
      out.push(`INSERT INTO "public"."${table}" (${colList}) VALUES (${vals});`);
    }
    out.push('');
    return out;
  }

  private async buildFkSql(client: Client, table: string): Promise<string[]> {
    const res = await client.query(
      `SELECT conname, pg_get_constraintdef(oid) AS def
       FROM pg_catalog.pg_constraint
       WHERE conrelid = $1::regclass AND contype = 'f'`,
      [`"public"."${table}"`],
    );
    return res.rows.map(
      (r) => `ALTER TABLE "public"."${table}" ADD CONSTRAINT "${r.conname}" ${r.def};`,
    );
  }

  private async orderTables(client: Client, tables: string[]): Promise<string[]> {
    const { rows } = await client.query(
      `SELECT child.relname AS child, parent.relname AS parent
       FROM pg_catalog.pg_constraint c
       JOIN pg_catalog.pg_class child ON child.oid = c.conrelid
       JOIN pg_catalog.pg_class parent ON parent.oid = c.confrelid
       WHERE c.contype = 'f'`,
    );
    const deps = new Map(tables.map((t) => [t, new Set<string>()]));
    for (const r of rows) {
      if (r.child === r.parent) continue; // self-referencing rows are independent
      if (deps.has(r.child) && deps.has(r.parent)) deps.get(r.child)!.add(r.parent);
    }

    const order: string[] = [];
    const remaining = new Set(tables);
    while (remaining.size > 0) {
      const ready = [...remaining].filter((t) => ![...deps.get(t)!].some((d) => remaining.has(d)));
      if (ready.length === 0) { order.push(...remaining); break; } // FK cycle: insert in current order
      for (const t of ready) { remaining.delete(t); order.push(t); }
    }
    return order;
  }
}
