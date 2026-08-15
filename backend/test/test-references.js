// Verify reference detection: media referenced ONLY in a comment must be
// flagged as referenced (not unreferenced). Uses temp rows on live DB.
const path = require('path');
const fs = require('fs');
const { PrismaClient } = require('@prisma/client');

const BACKEND = '/mnt/d/code_proj/zenportal/backend';
const env = {};
for (const line of fs.readFileSync(path.join(BACKEND, '.env'), 'utf8').split('\n')) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m) process.env[m[1]] = m[2];
}

const { MediaService } = require(path.join(BACKEND, 'dist/modules/media/media.service.js'));
const { PrismaService } = require(path.join(BACKEND, 'dist/config/prisma.service.js'));

async function main() {
  const prisma = new PrismaService();
  await prisma.$connect();
  const svc = new MediaService(prisma);

  const media = await prisma.medium.create({
    data: {
      filename: 'test_ref_check.png',
      originalName: 'test_ref_check.png',
      filePath: `/media/images/2026/08/test_ref_check_${Date.now()}.png`,
      fileSize: 1,
      mimeType: 'image/png',
    },
  });
  console.log('test file:', media.filePath);

  const before = await svc.findUnreferenced();
  const beforeFlagged = before.some((m) => m.id === media.id);
  console.log('referenced-only-in-comment BEFORE comment:', beforeFlagged ? 'unreferenced ✗' : 'referenced ✓');

  const post = await prisma.post.findFirst();
  const comment = await prisma.comment.create({
    data: { postId: post.id, ip: '0.0.0.0', content: `see image at ${media.filePath}`, isApproved: true },
  });

  const after = await svc.findUnreferenced();
  const afterFlagged = after.some((m) => m.id === media.id);
  console.log('referenced-only-in-comment AFTER comment added:', afterFlagged ? 'unreferenced ✗ FAIL' : 'referenced ✓ PASS');

  await prisma.comment.delete({ where: { id: comment.id } });
  await prisma.medium.delete({ where: { id: media.id } });
  console.log(beforeFlagged && !afterFlagged ? 'TEST PASSED' : 'TEST FAILED');
  await prisma.$disconnect();
  process.exit(beforeFlagged && !afterFlagged ? 0 : 1);
}

main().catch((e) => { console.error('ERROR:', e.message); process.exit(1); });
