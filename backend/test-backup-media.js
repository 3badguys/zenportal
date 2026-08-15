// Media backup/restore test — runs in a temp sandbox cwd so real storage/backups are untouched.
const path = require('path');
const fs = require('fs');
const os = require('os');
const { execFileSync } = require('child_process');

const BACKEND = '/mnt/d/code_proj/zenportal/backend';

const SANDBOX = fs.mkdtempSync(path.join(os.tmpdir(), 'zp_media_'));
process.chdir(SANDBOX);
console.log('sandbox:', SANDBOX);

// require AFTER chdir: STORAGE_ROOT/backups resolve against cwd at module load
const { BackupService } = require(path.join(BACKEND, 'dist/modules/backup/backup.service.js'));

const storage = path.join(SANDBOX, 'storage');
fs.mkdirSync(path.join(storage, 'images/2026/08'), { recursive: true });
fs.writeFileSync(path.join(storage, 'images/2026/08', 'a.jpg'), 'AAA');
fs.mkdirSync(path.join(storage, 'videos'), { recursive: true });
fs.writeFileSync(path.join(storage, 'videos', 'b.mp4'), 'BBB');

async function main() {
  const svc = new BackupService();

  // 1. create backup
  const b = await svc.createMediaBackup();
  console.log('backup file:', b.filename);
  const listing = execFileSync('tar', ['-tzf', b.path]).toString().trim().split('\n').filter(Boolean).map((l) => l.replace(/^\.\//, ''));
  console.log('tar entries:', listing);
  if (!listing.includes('images/2026/08/a.jpg') || !listing.includes('videos/b.mp4')) {
    console.error('MISSING ENTRIES'); process.exit(1);
  }

  // 2. mutate storage
  fs.unlinkSync(path.join(storage, 'images/2026/08', 'a.jpg'));
  fs.writeFileSync(path.join(storage, 'images', 'c.png'), 'CCC');

  // 3. restore
  await svc.restoreMedia(b.path);
  const restored = fs.readdirSync(path.join(storage, 'images/2026/08'));
  console.log('restored images/2026/08:', restored);
  if (!restored.includes('a.jpg')) { console.error('RESTORE LOST FILE'); process.exit(1); }
  if (fs.existsSync(path.join(storage, 'images', 'c.png'))) { console.error('STALE FILE NOT CLEARED'); process.exit(1); }
  if (fs.readFileSync(path.join(storage, 'videos', 'b.mp4'), 'utf8') !== 'BBB') { console.error('CONTENT MISMATCH'); process.exit(1); }

  // 4. malicious tar must be rejected
  const evilDir = fs.mkdtempSync(path.join(os.tmpdir(), 'zp_evil_'));
  const evilTar = path.join(SANDBOX, 'evil.tar.gz');
  try {
    execFileSync('tar', ['-czf', evilTar, '-C', evilDir, '--transform', 's|^|../|', '.']);
    let rejected = false;
    try { await svc.restoreMedia(evilTar); } catch (e) { rejected = e.message.includes('unsafe path'); }
    console.log('malicious tar rejected:', rejected);
    if (!rejected) { console.error('EVIL TAR ACCEPTED'); process.exit(1); }
  } finally {
    fs.rmSync(evilDir, { recursive: true, force: true });
  }

  console.log('MEDIA TESTS PASSED');
  process.exit(0);
}

main().catch((e) => { console.error('MEDIA TEST FAILED:', e); process.exit(1); });
