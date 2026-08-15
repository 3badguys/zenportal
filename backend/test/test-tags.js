// Tags service test: create/merge/delete-refs logic against the live DB (temp rows only).
const path = require('path');
const fs = require('fs');

const BACKEND = '/mnt/d/code_proj/zenportal/backend';
const { PrismaService } = require(path.join(BACKEND, 'dist/config/prisma.service.js'));
const { TagsService } = require(path.join(BACKEND, 'dist/modules/tags/tags.service.js'));
const { PostsService } = require(path.join(BACKEND, 'dist/modules/posts/posts.service.js'));

for (const line of fs.readFileSync(path.join(BACKEND, '.env'), 'utf8').split('\n')) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m) process.env[m[1]] = m[2];
}

async function main() {
  const prisma = new PrismaService();
  await prisma.$connect();
  const tags = new TagsService(prisma);
  const posts = new PostsService(prisma);
  const stamp = Date.now();

  const a = await tags.create({ name: `TagA_${stamp}` });
  const b = await tags.create({ name: `TagB_${stamp}` });
  const c = await tags.create({ name: `TagC_${stamp}` });
  console.log('created:', a.name, b.name, c.name);

  const post = await posts.create({
    slug: `tag-test-${stamp}`,
    title: `Tag Test ${stamp}`,
    body: 'body',
    isPublished: true,
    tagIds: [a.id, b.id],
  });
  console.log('post created with tags A+B');

  // duplicate slug rejection
  let dupRejected = false;
  try { await tags.create({ name: a.name }); } catch (e) { dupRejected = e.message.includes('already exists'); }
  console.log('duplicate name rejected:', dupRejected);

  // public list includes postCount
  const pub = await tags.findAllPublic();
  const pubA = pub.find((t) => t.id === a.id);
  console.log('public postCount A (published):', pubA.postCount);
  const countOk = pubA.postCount === 1;

  // merge A into B
  const merged = await tags.merge(a.id, b.id);
  console.log('merged:', JSON.stringify(merged));
  const after = await posts.findById(post.id);
  const afterSlugs = after.tags.map((t) => t.slug).sort();
  const mergeOk = afterSlugs.length === 1 && afterSlugs[0] === b.slug;
  console.log('post tags after merge:', afterSlugs);

  // delete B (in use) → BadRequest with refs
  let refsOk = false;
  try { await tags.remove(b.id); } catch (e) { const res = e.getResponse?.() || {}; refsOk = Array.isArray(res.refs) && res.refs[0].includes(`Tag Test ${stamp}`); }
  console.log('delete in-use rejected with refs:', refsOk);

  // delete C (unused) → ok
  const del = await tags.remove(c.id);
  console.log('delete unused ok:', del.deleted === c.name);

  // merge self → error
  let selfOk = false;
  try { await tags.merge(b.id, b.id); } catch (e) { selfOk = e.message.includes('itself'); }
  console.log('merge self rejected:', selfOk);

  // cleanup
  await prisma.post.delete({ where: { id: post.id } });
  await prisma.tag.delete({ where: { id: b.id } }).catch(() => {});
  await prisma.$disconnect();

  const allOk = countOk && mergeOk && refsOk && dupRejected && selfOk && del.deleted === c.name;
  console.log(allOk ? 'ALL TAG TESTS PASSED' : 'TAG TEST FAILED');
  process.exit(allOk ? 0 : 1);
}

main().catch((e) => { console.error('ERROR:', e.message); process.exit(1); });
