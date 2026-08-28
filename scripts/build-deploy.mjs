#!/usr/bin/env node
/**
 * Shared hosting (cPanel) uchun deploy to'plamini yig'adi.
 *
 * Nega kerak: cPanel'dagi Node.js ilovasi monorepo va npm workspaces bilan
 * ishlay olmaydi — u faqat bitta papkaga qarab `npm install` qiladi. Shuning
 * uchun bu skript ikkita mustaqil papka tayyorlaydi:
 *
 *     deploy/
 *       backend/     ← alohida Node ilovasi (API)
 *       frontend/    ← alohida Node ilovasi (sayt)
 *       database.sql ← bazani o'rnatish uchun
 *
 * Frontend butunlay mustaqil (Next standalone) — serverda `npm install`
 * umuman kerak emas. Backend uchun faqat bir necha paket o'rnatiladi.
 *
 * Ishga tushirish:  npm run deploy:build
 */

import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'deploy');

const log = (msg) => console.log(`  ${msg}`);
const step = (msg) => console.log(`\n\x1b[1m${msg}\x1b[0m`);

function run(cmd, cwd = ROOT) {
  execSync(cmd, { cwd, stdio: 'inherit' });
}

/** Papkani rekursiv nusxalaydi. */
function copy(from, to, { filter } = {}) {
  if (!fs.existsSync(from)) return false;
  fs.cpSync(from, to, {
    recursive: true,
    filter: filter ?? (() => true),
  });
  return true;
}

function size(dir) {
  if (!fs.existsSync(dir)) return '0';
  const out = execSync(`du -sh "${dir}" | cut -f1`, { encoding: 'utf-8' });
  return out.trim();
}

// ─────────────────────────────────────────────────────────────
step('1/5  Loyihani yig\'ish');
// ─────────────────────────────────────────────────────────────

/*
 * Next statik sahifalarni yig'ish paytida API'dan ma'lumot oladi
 * (turlar, yo'nalishlar, sozlamalar). API ishlamasa build shunchaki
 * bo'sh sahifalar chiqaradi va sababi tushunarsiz bo'ladi — shuning
 * uchun oldindan tekshiramiz.
 */
const API_URL = process.env.API_INTERNAL_URL ?? 'http://localhost:4000';
try {
  const res = await fetch(`${API_URL}/health`, { signal: AbortSignal.timeout(4000) });
  if (!res.ok) throw new Error(`status ${res.status}`);
  log(`API javob berdi: ${API_URL}`);
} catch (err) {
  console.error(`
\x1b[31m✗ API ishlamayapti: ${API_URL}\x1b[0m

  Sayt statik sahifalarni yig'ish uchun API'dan ma'lumot oladi.
  Avval backend'ni ishga tushiring:

      npm run dev:api

  So'ng shu buyruqni qaytadan bajaring.
`);
  process.exit(1);
}

run('npm run build');

// ─────────────────────────────────────────────────────────────
step('2/5  Eski deploy papkasini tozalash');
// ─────────────────────────────────────────────────────────────
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
log('deploy/ tayyor');

// ─────────────────────────────────────────────────────────────
step('3/5  Backend (API)');
// ─────────────────────────────────────────────────────────────
const API_OUT = path.join(OUT, 'backend');
fs.mkdirSync(API_OUT, { recursive: true });

// Kompilyatsiya qilingan kod
copy(path.join(ROOT, 'apps/api/dist'), path.join(API_OUT, 'dist'));
log('dist/ ko\'chirildi');

// Prisma sxemasi — client generatsiyasi uchun kerak
fs.mkdirSync(path.join(API_OUT, 'prisma'), { recursive: true });
fs.copyFileSync(
  path.join(ROOT, 'apps/api/prisma/schema.prisma'),
  path.join(API_OUT, 'prisma/schema.prisma'),
);
log('prisma/schema.prisma ko\'chirildi');

/*
 * `@ayntravel/shared` npm'da yo'q — u monorepo ichidagi paket. Uni yig'ilgan
 * holda yonma-yon qo'yamiz va package.json'da `file:` bog'liqlik sifatida
 * ko'rsatamiz. `npm install` uni o'zi ulab qo'yadi.
 */
const SHARED_OUT = path.join(API_OUT, 'shared');
fs.mkdirSync(SHARED_OUT, { recursive: true });
copy(path.join(ROOT, 'packages/shared/dist'), path.join(SHARED_OUT, 'dist'));
const sharedPkg = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'packages/shared/package.json'), 'utf-8'),
);
delete sharedPkg.devDependencies;
delete sharedPkg.scripts;
fs.writeFileSync(
  path.join(SHARED_OUT, 'package.json'),
  JSON.stringify(sharedPkg, null, 2) + '\n',
);
log('shared/ paketi ko\'chirildi');

// Backend package.json — faqat production bog'liqliklari
const apiPkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'apps/api/package.json'), 'utf-8'));
const deployApiPkg = {
  name: 'ayntravel-backend',
  version: apiPkg.version,
  private: true,
  type: 'module',
  main: 'app.js',
  scripts: {
    start: 'node app.js',
    postinstall: 'prisma generate',
  },
  dependencies: {
    ...apiPkg.dependencies,
    '@ayntravel/shared': 'file:./shared',
  },
  // `prisma` CLI postinstall uchun kerak
  devDependencies: { prisma: apiPkg.devDependencies.prisma },
  engines: { node: '>=20.11.0' },
};
fs.writeFileSync(
  path.join(API_OUT, 'package.json'),
  JSON.stringify(deployApiPkg, null, 2) + '\n',
);
log('package.json yozildi');

/*
 * cPanel Passenger ishga tushirish fayli.
 * Passenger `PORT` ni o'zi beradi va shu faylni `node app.js` bilan ishga tushiradi.
 */
fs.writeFileSync(
  path.join(API_OUT, 'app.js'),
  `/**
 * cPanel (Passenger) ishga tushirish nuqtasi — backend.
 *
 * cPanel «Setup Node.js App» da «Application startup file» sifatida
 * shu faylni ko'rsating: app.js
 */
import './dist/server.js';
`,
);
log('app.js (Passenger kirish nuqtasi) yozildi');

// Yuklangan rasmlar uchun papka
fs.mkdirSync(path.join(API_OUT, 'uploads'), { recursive: true });
fs.writeFileSync(path.join(API_OUT, 'uploads/.gitkeep'), '');
log('uploads/ papkasi yaratildi');

/*
 * Backend uchun .env namunasi. Haqiqiy `.env` HECH QACHON to'plamga
 * qo'shilmaydi — kalitlar faqat serverda, cPanel muhit o'zgaruvchilari
 * yoki qo'lda yaratilgan fayl orqali beriladi.
 */
fs.writeFileSync(
  path.join(API_OUT, '.env.example'),
  `# ═══════════════════════════════════════════════════════════
#  Backend sozlamalari — bu faylni .env deb nusxalang
# ═══════════════════════════════════════════════════════════

NODE_ENV=production
PORT=4000

# ── Baza ──────────────────────────────────────────────────
# cPanel'da: PostgreSQL Databases bo'limidagi ma'lumotlar.
# Foydalanuvchi nomi odatda cpanelaccount_ayn ko'rinishida bo'ladi.
DATABASE_URL=postgresql://FOYDALANUVCHI:PAROL@127.0.0.1:5432/BAZA_NOMI

# ── Xavfsizlik kalitlari ──────────────────────────────────
# Yangi kalit yaratish:  openssl rand -base64 48
# Bu qiymatlarni HECH KIMGA bermang va git'ga qo'shmang.
JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=
IP_HASH_SALT=

# ── Manzillar ─────────────────────────────────────────────
WEB_URL=https://ayntravel.uz
CORS_ORIGINS=https://ayntravel.uz,https://www.ayntravel.uz
ASSET_BASE_URL=https://api.ayntravel.uz/uploads

# Sayt keshini yangilash uchun umumiy maxfiy so'z.
# Frontend'dagi qiymat bilan bir xil bo'lishi shart emas — u faqat
# shu yerda ishlatiladi va so'rov sarlavhasida yuboriladi.
REVALIDATE_SECRET=

# ── Fayl saqlash ──────────────────────────────────────────
STORAGE_DRIVER=local
UPLOAD_DIR=./uploads

# ── Telegram (yangi ariza xabarnomasi) ────────────────────
# @BotFather dan token oling, botni menejerlar guruhiga admin qiling.
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=

LOG_LEVEL=info
`,
);
log('.env.example (backend uchun) yozildi');

// ─────────────────────────────────────────────────────────────
step('4/5  Frontend (sayt)');
// ─────────────────────────────────────────────────────────────
const WEB_OUT = path.join(OUT, 'frontend');
const STANDALONE = path.join(ROOT, 'apps/web/.next/standalone');

if (!fs.existsSync(STANDALONE)) {
  console.error('\n✗ .next/standalone topilmadi. next.config.ts da output: "standalone" bo\'lishi kerak.');
  process.exit(1);
}

/*
 * Standalone chiqish monorepo tuzilishini saqlaydi:
 *     .next/standalone/apps/web/server.js
 *     .next/standalone/node_modules/
 * Uni tekislaymiz, shunda cPanel'da ilova ildizi to'g'ridan-to'g'ri
 * `server.js` yonida bo'ladi.
 */
copy(path.join(STANDALONE, 'apps/web'), WEB_OUT);
copy(path.join(STANDALONE, 'node_modules'), path.join(WEB_OUT, 'node_modules'));
log('standalone chiqishi tekislandi');

// Statik fayllar standalone ichiga kirmaydi — qo'lda ko'chiriladi
copy(path.join(ROOT, 'apps/web/.next/static'), path.join(WEB_OUT, '.next/static'));
log('.next/static ko\'chirildi');

copy(path.join(ROOT, 'apps/web/public'), path.join(WEB_OUT, 'public'));
log('public/ ko\'chirildi');

// Passenger kirish nuqtasi — standalone server.js ni chaqiradi
fs.writeFileSync(
  path.join(WEB_OUT, 'app.js'),
  `/**
 * cPanel (Passenger) ishga tushirish nuqtasi — frontend.
 *
 * Next.js "standalone" rejimida yig'ilgan: barcha kerakli modullar
 * shu papka ichida, serverda \`npm install\` qilish SHART EMAS.
 *
 * cPanel «Setup Node.js App» da «Application startup file»: app.js
 */
require('./server.js');
`,
);

/*
 * Standalone `server.js` CommonJS. Ilova ildizidagi package.json'da
 * "type": "module" bo'lsa u ishlamaydi — shuning uchun aniq belgilaymiz.
 */
const webPkgPath = path.join(WEB_OUT, 'package.json');
const webPkg = fs.existsSync(webPkgPath)
  ? JSON.parse(fs.readFileSync(webPkgPath, 'utf-8'))
  : {};
fs.writeFileSync(
  webPkgPath,
  JSON.stringify(
    {
      ...webPkg,
      name: 'ayntravel-frontend',
      private: true,
      type: 'commonjs',
      main: 'app.js',
      scripts: { start: 'node app.js' },
      engines: { node: '>=20.11.0' },
    },
    null,
    2,
  ) + '\n',
);
log('app.js va package.json yozildi');

/*
 * XAVFSIZLIK: Next standalone chiqishga ildizdagi `.env` faylini ham
 * ko'chirib qo'yadi — u yerda baza paroli, JWT kalitlari va Telegram
 * tokeni bor. Bunday to'plamni serverga yuklash yoki birovga berish
 * barcha maxfiy ma'lumotni oshkor qiladi. Shuning uchun ularni
 * majburan olib tashlaymiz.
 */
let removedEnv = 0;
for (const entry of fs.readdirSync(WEB_OUT)) {
  if (entry === '.env' || entry.startsWith('.env.')) {
    fs.rmSync(path.join(WEB_OUT, entry), { force: true });
    removedEnv++;
  }
}
if (removedEnv > 0) log(`${removedEnv} ta .env fayl olib tashlandi (maxfiy ma'lumot)`);

/*
 * Frontend'ga faqat unga tegishli, ochiq o'zgaruvchilar kerak.
 * `NEXT_PUBLIC_*` qiymatlar build paytida kodga kirib bo'lgan; bu yerda
 * server tomonda ishlatiladiganlari uchun namuna qoldiramiz.
 */
fs.writeFileSync(
  path.join(WEB_OUT, '.env.example'),
  `# Frontend uchun muhit o'zgaruvchilari.
# Bu faylni .env deb nusxalang va qiymatlarni to'ldiring.
#
# DIQQAT: bu yerga baza paroli yoki JWT kalitlarini YOZMANG —
# ular faqat backend'ga tegishli.

# Sayt server tomonda API'ga qaysi manzil orqali murojaat qiladi.
# Bir serverda bo'lsa localhost tezroq va tashqi tarmoqqa chiqmaydi.
API_INTERNAL_URL=http://127.0.0.1:4000

# Passenger portni o'zi beradi; qo'lda ishga tushirsangiz kerak bo'ladi.
PORT=3000
NODE_ENV=production
`,
);
log('.env.example (frontend uchun) yozildi');

// ─────────────────────────────────────────────────────────────
step('5/5  Baza va yo\'riqnoma');
// ─────────────────────────────────────────────────────────────
fs.copyFileSync(path.join(ROOT, 'database.sql'), path.join(OUT, 'database.sql'));
log('database.sql ko\'chirildi');

// Yo'riqnoma to'plam ichida bo'lsin — serverda qo'l ostida turadi.
const deployDoc = path.join(ROOT, 'DEPLOY.md');
if (fs.existsSync(deployDoc)) {
  fs.copyFileSync(deployDoc, path.join(OUT, 'DEPLOY.md'));
  log('DEPLOY.md ko\'chirildi');
}

// ─────────────────────────────────────────────────────────────
console.log('\n\x1b[32m✓ Deploy to\'plami tayyor\x1b[0m\n');
console.log(`  deploy/backend    ${size(API_OUT)}`);
console.log(`  deploy/frontend   ${size(WEB_OUT)}`);
console.log(`  deploy/database.sql`);
console.log('\n  Keyingi qadam: DEPLOY.md faylini o\'qing.\n');
