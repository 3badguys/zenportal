const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

const TARGETS = {
  'backend/.env': [
    'DATABASE_URL', // generated from DB_* + DB_PORT
    'BACKEND_PORT',
    'ADMIN_TOKEN',
    'VISITOR_SALT',
    'MEDIA_MAX_IMAGE_SIZE_MB',
    'MEDIA_MAX_VIDEO_SIZE_MB',
    'MEDIA_MAX_AUDIO_SIZE_MB',
  ],
  'frontend/.env': [
    'VITE_API_BASE_URL', // default built from BACKEND_PORT
    'VITE_ADMIN_SECRET_PATH',
    'FRONTEND_PORT', // vite dev server (vite.config.ts loadEnv)
    'BACKEND_PORT', // vite dev proxy target (vite.config.ts loadEnv)
  ],
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

  // Derived values — ports live in root .env only, expanded here into child envs
  const derived = {
    DATABASE_URL: `postgresql://${vars.DB_USER || 'postgres'}:${vars.DB_PASSWORD || 'postgres'}@localhost:${vars.DB_PORT || '5432'}/${vars.DB_NAME || 'zenportal'}`,
    BACKEND_PORT: vars.BACKEND_PORT || '3000',
    VITE_API_BASE_URL: vars.VITE_API_BASE_URL || `http://localhost:${vars.BACKEND_PORT || '3000'}/api`,
    FRONTEND_PORT: vars.FRONTEND_PORT || '5173',
  };

  for (const [childRel, keys] of Object.entries(TARGETS)) {
    const childPath = path.join(ROOT, childRel);
    const lines = [];
    for (const key of keys) {
      const val = derived[key] ?? vars[key];
      if (val !== undefined && val !== '') {
        lines.push(`${key}=${val}`);
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
