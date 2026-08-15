// Round-trip test: dump live DB → restore into zenportal_test → compare.
// Run: DATABASE_URL=... node test-backup.js
const path = require('path');
const fs = require('fs');
const { Client } = require('pg');

const ROOT = '/mnt/d/code_proj/zenportal';
const BACKEND = path.join(ROOT, 'backend');
const { BackupService } = require(path.join(BACKEND, 'dist/modules/backup/backup.service.js'));

function readEnv(file) {
  const out = {};
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z_]+)=(.*)$/);
    if (m) out[m[1]] = m[2];
  }
  return out;
}

const env = readEnv(path.join(BACKEND, '.env'));
const DB_URL = env.DATABASE_URL;
if (!DB_URL) { console.error('no DATABASE_URL'); process.exit(1); }
process.env.DATABASE_URL = DB_URL; // needed by PrismaService (reads process.env)
const TEST_URL = DB_URL.replace(/\/[^/]+$/, '/zenportal_test');

async function main() {
  const admin = new Client({ connectionString: DB_URL.replace(/\/[^/]+$/, '/postgres') });
  await admin.connect();
  await admin.query('DROP DATABASE IF EXISTS zenportal_test');
  await admin.query('CREATE DATABASE zenportal_test');
  await admin.end();

  const svc = new BackupService();

  // seed a tagged post so the tags + _PostTags join table are part of the round-trip
  const { PrismaService } = require(path.join(BACKEND, 'dist/config/prisma.service.js'));
  const prisma = new PrismaService();
  await prisma.$connect();
  const seedTag = await prisma.tag.create({ data: { name: `SeedTag_${Date.now()}`, slug: `seedtag-${Date.now()}` } });
  const seedPost = await prisma.post.create({
    data: {
      slug: `seed-post-${Date.now()}`, title: 'Seed Post', body: 'seed', isPublished: true,
      tags: { connect: { id: seedTag.id } },
    },
  });

  // 1. dump live DB
  process.env.DATABASE_URL = DB_URL;
  const dump = await svc.createDatabaseBackup();
  const sql = fs.readFileSync(dump.path, 'utf8');
  console.log('DUMP FILE:', dump.filename, fs.statSync(dump.path).size, 'bytes');
  for (const needle of ['BEGIN;', 'DROP TABLE IF EXISTS', 'CREATE TABLE "public"."posts"', 'PRIMARY KEY', 'INSERT INTO "public"."', 'COMMIT;']) {
    if (!sql.includes(needle)) { console.error('MISSING IN DUMP:', needle); process.exit(1); }
  }
  if (!/ALTER TABLE "public"."comments" ADD CONSTRAINT/.test(sql)) { console.error('MISSING FK'); process.exit(1); }
  console.log('dump structure OK');

  // 2. restore into test DB
  process.env.DATABASE_URL = TEST_URL;
  await svc.restoreDatabase(dump.path);
  console.log('restore OK');

  // 3. compare
  const a = new Client({ connectionString: DB_URL });
  const b = new Client({ connectionString: TEST_URL });
  await a.connect(); await b.connect();

  const tables = ['posts', 'comments', 'media', 'page_layouts', 'site_config', 'tags', '_PostTags'];
  for (const t of tables) {
    const ra = await a.query(`SELECT count(*)::int AS n FROM "${t}"`);
    const rb = await b.query(`SELECT count(*)::int AS n FROM "${t}"`);
    const ok = ra.rows[0].n === rb.rows[0].n;
    console.log(`table ${t}: live=${ra.rows[0].n} restored=${rb.rows[0].n} ${ok ? 'OK' : 'MISMATCH'}`);
    if (!ok) process.exit(1);
  }
  // schema comparison: columns of posts
  const ca = await a.query(`SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name='posts' ORDER BY ordinal_position`);
  const cb = await b.query(`SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name='posts' ORDER BY ordinal_position`);
  const same = JSON.stringify(ca.rows) === JSON.stringify(cb.rows);
  console.log('posts schema identical:', same);
  if (!same) { console.log(JSON.stringify(ca.rows, null, 1)); console.log(JSON.stringify(cb.rows, null, 1)); process.exit(1); }

  // FK present?
  const fk = await b.query(`SELECT count(*)::int AS n FROM pg_constraint WHERE contype='f' AND conrelid='public.comments'::regclass`);
  console.log('FKs on comments in restored DB:', fk.rows[0].n);
  if (fk.rows[0].n < 1) { console.error('FK missing'); process.exit(1); }

  // join table rows restored
  const jt = await b.query(`SELECT count(*)::int AS n FROM "_PostTags"`);
  console.log('_PostTags rows in restored DB:', jt.rows[0].n);
  if (jt.rows[0].n !== 1) { console.error('_PostTags rows missing'); process.exit(1); }

  // serial sequence advanced past max id?
  const seq = await b.query(`SELECT last_value FROM page_layouts_id_seq`);
  const maxId = await b.query(`SELECT COALESCE(MAX(id),0)::bigint AS m FROM page_layouts`);
  console.log('sequence last_value:', seq.rows[0].last_value, 'max id:', maxId.rows[0].m, '-> next insert valid:', seq.rows[0].last_value >= maxId.rows[0].m);

  // spot-check row equality on first post
  const pa = await a.query('SELECT * FROM posts ORDER BY "created_at" LIMIT 1');
  const pb = await b.query('SELECT * FROM posts ORDER BY "created_at" LIMIT 1');
  const samePost = JSON.stringify(pa.rows[0]) === JSON.stringify(pb.rows[0]);
  console.log('first post row identical:', samePost);

  await a.end(); await b.end();
  await admin.end();

  // cleanup test db + seeded rows
  await prisma.post.delete({ where: { id: seedPost.id } });
  await prisma.tag.delete({ where: { id: seedTag.id } });
  await prisma.$disconnect();
  const admin2 = new Client({ connectionString: DB_URL.replace(/\/[^/]+$/, '/postgres') });
  await admin2.connect();
  await admin2.query('DROP DATABASE IF EXISTS zenportal_test');
  await admin2.end();
  fs.rmSync(dump.path, { force: true });

  console.log(samePost ? 'ALL TESTS PASSED' : 'POST MISMATCH');
  process.exit(samePost ? 0 : 1);
}

main().catch((e) => { console.error('TEST FAILED:', e); process.exit(1); });
