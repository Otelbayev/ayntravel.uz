#!/usr/bin/env node
/**
 * Umumiy kodni backend'dan frontend'ga ko'chiradi.
 *
 * Nega shunday: tiplar, zod sxemalari va kichik yordamchilar (`slugify`,
 * `normalizeUzPhone`, `pick`) ikkala ilovaga ham kerak. Ularni npm paketi
 * qilib chiqarish yoki monorepo workspace ishlatish — ikkalasi ham deploy'ni
 * murakkablashtiradi (shared hosting workspace'ni tushunmaydi).
 *
 * Shuning uchun asosiy nusxa `backend/src/shared/` da yashaydi va bu skript
 * uni `frontend/src/shared/` ga ko'chiradi. Ikkala nusxa ham git'ga tushadi,
 * natijada HAR BIR PAPKA MUSTAQIL DEPLOY QILINADI — asosiy maqsad shu.
 *
 * Ishga tushirish:  node sync-shared.mjs
 * Qachon: `backend/src/shared/` ichidagi biror fayl o'zgarganda.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const FROM = path.join(ROOT, 'backend/src/shared');
const TO = path.join(ROOT, 'frontend/src/shared');

const BANNER = `/*
 * ┌─────────────────────────────────────────────────────────────┐
 * │  AVTOMATIK NUSXA — BU FAYLNI TAHRIRLAMANG                   │
 * │                                                             │
 * │  Asosiy nusxa:  backend/src/shared/${'{FILE}'}
 * │  Yangilash:     node sync-shared.mjs                        │
 * └─────────────────────────────────────────────────────────────┘
 */

`;

if (!fs.existsSync(FROM)) {
  console.error(`✗ Manba topilmadi: ${FROM}`);
  process.exit(1);
}

fs.rmSync(TO, { recursive: true, force: true });
fs.mkdirSync(TO, { recursive: true });

let count = 0;

/** Papkani rekursiv ko'chiradi va har bir faylga ogohlantirish qo'shadi. */
function copyDir(from, to) {
  fs.mkdirSync(to, { recursive: true });

  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    const src = path.join(from, entry.name);
    const dst = path.join(to, entry.name);

    if (entry.isDirectory()) {
      copyDir(src, dst);
      continue;
    }
    if (!entry.name.endsWith('.ts')) continue;

    const rel = path.relative(FROM, src);
    const body = fs.readFileSync(src, 'utf-8');

    /*
     * Backend Node ESM'da ishlaydi va u nisbiy importlarda `.js`
     * kengaytmasini TALAB qiladi (`from './enums.js'`).
     *
     * Next.js bundler'i esa aksincha — `.js` faylni qidiradi, topa olmaydi
     * va «module not found» beradi. Shuning uchun nusxa ko'chirayotganda
     * faqat nisbiy importlardagi kengaytmani olib tashlaymiz.
     */
    const forWeb = body.replace(
      /(from\s+['"]\.{1,2}\/[^'"]+)\.js(['"])/g,
      '$1$2',
    );

    fs.writeFileSync(dst, BANNER.replace('{FILE}', rel.padEnd(24)) + forWeb, 'utf-8');
    count++;
  }
}

copyDir(FROM, TO);

console.log(`✓ ${count} ta fayl ko'chirildi: backend/src/shared → frontend/src/shared`);
