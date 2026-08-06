const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

const TARGETS = {
  'backend/.env': [
    'DATABASE_URL',
    'PORT',
    'ADMIN_TOKEN',
    'VISITOR_SALT',
  ],
  'frontend/.env': [
    'VITE_API_BASE_URL',
    'VITE_ADMIN_SECRET_PATH',
  ],
};

// defaults when .env does not provide a value
const DEFAULTS = {
  VITE_API_BASE_URL: 'http://localhost:3000/api',
  VITE_ADMIN_SECRET_PATH: 'my-admin-path',
};

function parseEnv(filePath) {
  const vars = {};
  const raw = fs.readFileSync(filePath, 'utf-8');
  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    let key = trimmed.slice(0, eqIdx).trim();
    let val = trimmed.slice(eqIdx + 1).trim();

    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    vars[key] = val;
  }
  return vars;
}

function main() {
  const rootEnv = path.join(ROOT, '.env');
  if (!fs.existsSync(rootEnv)) {
    console.error('Root .env not found. Run: cp .env.example .env  and fill in values.');
    process.exit(1);
  }

  const vars = parseEnv(rootEnv);

  for (const [childRel, keys] of Object.entries(TARGETS)) {
    const childPath = path.join(ROOT, childRel);
    const lines = [];
    for (const key of keys) {
      if (vars[key] !== undefined && vars[key] !== '') {
        lines.push(`${key}=${vars[key]}`);
      } else if (DEFAULTS[key]) {
        lines.push(`${key}=${DEFAULTS[key]}`);
      } else {
        console.warn(`  ⚠ ${childRel}: ${key} not set — skipped`);
      }
    }
    fs.writeFileSync(childPath, lines.join('\n') + '\n');
    console.log(`  ✓ ${childRel} (${lines.length} vars)`);
  }

  console.log('\nDone.');
}

main();
