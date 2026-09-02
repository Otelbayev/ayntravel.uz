#!/usr/bin/env node
/**
 * Serverga yuklashga tayyor to'plam yig'adi: `frontend/dist/`
 *
 * Next «standalone» rejimida faqat kerakli modullarni `.next/standalone`
 * ichiga ko'chiradi, lekin statik fayllar va `public/` ni ko'chirmaydi —
 * ularni qo'lda qo'shish kerak. Bu skript shuni bajaradi.
 *
 * Natija (~60 MB) serverga to'g'ridan-to'g'ri yuklanadi va u yerda
 * `npm install` qilish SHART EMAS.
 *
 * Ishga tushirish:  npm run pack   (avval `npm run build`)
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const STANDALONE = path.join(ROOT, '.next/standalone');
const OUT = path.join(ROOT, 'dist');

if (!fs.existsSync(STANDALONE)) {
  console.error('\n✗ .next/standalone topilmadi. Avval `npm run build` qiling.\n');
  process.exit(1);
}

fs.rmSync(OUT, { recursive: true, force: true });

// 1. Standalone serveri va uning modullari
fs.cpSync(STANDALONE, OUT, { recursive: true });

// 2. Statik fayllar (CSS, JS chunk'lar) — standalone ichiga kirmaydi
fs.cpSync(path.join(ROOT, '.next/static'), path.join(OUT, '.next/static'), { recursive: true });

// 3. public/ (logo, favicon, robots)
const publicDir = path.join(ROOT, 'public');
if (fs.existsSync(publicDir)) {
  fs.cpSync(publicDir, path.join(OUT, 'public'), { recursive: true });
}

/*
 * XAVFSIZLIK: Next standalone chiqishga `.env` faylini ham ko'chiradi.
 * Uni to'plamda qoldirish maxfiy sozlamalarni oshkor qiladi — serverda
 * `.env` alohida yaratiladi.
 */
let removed = 0;
for (const entry of fs.readdirSync(OUT)) {
  if (entry === '.env' || entry.startsWith('.env.')) {
    fs.rmSync(path.join(OUT, entry), { force: true });
    removed++;
  }
}

fs.writeFileSync(
  path.join(OUT, '.env.example'),
  `# Frontend sozlamalari. Bu faylni .env deb nusxalang.
#
# DIQQAT: baza paroli va JWT kalitlari bu yerga YOZILMAYDI —
# ular faqat backend'ga tegishli.

NODE_ENV=production
PORT=3000

# Server tomondan backend'ga murojaat (rasmlar ham shu orqali uzatiladi).
API_INTERNAL_URL=http://127.0.0.1:4000

# Brauzer uchun ommaviy API manzili.
NEXT_PUBLIC_API_URL=https://api.ayntravel.uz

# Saytning o'z manzili — canonical va sitemap uchun.
NEXT_PUBLIC_SITE_URL=https://ayntravel.uz

# Backend kesh yangilashda shu maxfiy so'zni yuboradi (backend bilan bir xil).
REVALIDATE_SECRET=
`,
);

// cPanel Passenger uchun kirish nuqtasi
fs.writeFileSync(
  path.join(OUT, 'app.js'),
  `/**
 * cPanel (Passenger) ishga tushirish nuqtasi.
 * «Application startup file» sifatida shu faylni ko'rsating: app.js
 */
require('./server.js');
`,
);

const du = (dir) => {
  let total = 0;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    total += e.isDirectory() ? du(p) : fs.statSync(p).size;
  }
  return total;
};

console.log(`
✓ dist/ tayyor  (${Math.round(du(OUT) / 1024 / 1024)} MB)

  Ishga tushirish:  cd dist && node server.js
  cPanel'da:        startup file = app.js
  ${removed > 0 ? `\n  ${removed} ta .env fayl olib tashlandi (maxfiy ma'lumot)` : ''}
`);
