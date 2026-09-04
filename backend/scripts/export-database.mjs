#!/usr/bin/env node
/**
 * Lokal bazadan `database.sql` faylini qayta yaratadi.
 *
 * Qachon ishlatiladi: `prisma/schema.prisma` o'zgartirilib, `npm run db:migrate`
 * bajarilgandan keyin. Aks holda `database.sql` eskirib qoladi va yangi
 * serverga o'rnatilgan baza kod kutgan tuzilishga mos kelmaydi.
 *
 * Nima eksport qilinadi:
 *   ✅ jadvallar, enum'lar, kalitlar, indekslar
 *   ✅ boshlang'ich kontent (turlar, yo'nalishlar, xizmatlar, sozlamalar, admin)
 *   ❌ arizalar, sessiyalar, audit jurnali — bular mijoz ma'lumoti
 *
 * Ishga tushirish:  npm run db:export
 */

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Skript `backend/scripts/` da, `.env` esa `backend/` da.
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
// Natija loyiha ildiziga yoziladi — u backend va frontend uchun umumiy.
const OUTPUT = path.join(ROOT, '..', 'database.sql');

// .env dan DATABASE_URL ni o'qiymiz
const envPath = path.join(ROOT, '.env');
if (!fs.existsSync(envPath)) {
  console.error('✗ .env fayli topilmadi. `cp .env.example .env` qiling.');
  process.exit(1);
}
const dbUrl = fs
  .readFileSync(envPath, 'utf-8')
  .split('\n')
  .find((l) => l.trim().startsWith('DATABASE_URL='))
  ?.split('=')
  .slice(1)
  .join('=')
  .trim()
  .replace(/^["']|["']$/g, '');

if (!dbUrl) {
  console.error('✗ .env ichida DATABASE_URL topilmadi.');
  process.exit(1);
}

/*
 * Prisma URL'ga o'ziga xos parametrlar qo'shishga ruxsat beradi
 * (`?schema=public`, `?connection_limit=...`), lekin `pg_dump` ularni
 * tushunmaydi va «invalid URI query parameter» xatosini beradi.
 * Shuning uchun faqat standart PostgreSQL parametrlarini qoldiramiz.
 */
const PG_SAFE_PARAMS = new Set([
  'sslmode', 'sslcert', 'sslkey', 'sslrootcert',
  'application_name', 'connect_timeout', 'options',
]);

function toPgUrl(url) {
  try {
    const parsed = new URL(url);
    for (const key of [...parsed.searchParams.keys()]) {
      if (!PG_SAFE_PARAMS.has(key)) parsed.searchParams.delete(key);
    }
    return parsed.toString();
  } catch {
    // URL sifatida o'qib bo'lmasa, o'zgartirmasdan qaytaramiz.
    return url;
  }
}

const pgUrl = toPgUrl(dbUrl);

/**
 * Eksportga qo'shiladigan ma'lumot jadvallari.
 *
 * Ataylab BO'SH: `database.sql` faqat struktura bo'lishi kerak. Baza
 * ochiq repoda yotadi, kontent esa admin panel orqali kiritiladi —
 * demo ma'lumotni SQL faylga qotirib qo'yish yangi o'rnatishda faqat
 * keyin qo'lda o'chiriladigan axlat qoldiradi. Admin hisobi ham bu
 * yerda emas: `npm run db:seed:admin` uni parolni env'dan olib yaratadi.
 */
const CONTENT_TABLES = [];

const TABLE_NOTES = {
  users: 'Admin va menejerlar. Parol argon2 bilan hashlanadi.',
  refresh_tokens: 'Sessiyalar. Faqat hash saqlanadi — baza sizib chiqsa ham token ishlamaydi.',
  media: 'Yuklangan rasmlar. variants: {"poster":{"webp":"...","avif":"..."}}',
  destinations: 'Yo‘nalishlar (Turkiya, Dubay...). Har biri alohida SEO sahifasi.',
  tours: 'Asosiy mahsulot. Narx numeric — suzuvchi nuqta xatosi bo‘lmaydi.',
  tour_images: 'Tur galereyasi. Rasm tartibini saqlash uchun alohida jadval.',
  posts: 'Blog maqolalari.',
  leads: 'ARIZALAR — saytning asosiy biznes qiymati.',
  services: 'Xizmatlar: viza, aviachipta, transport.',
  testimonials: 'Mijoz fikrlari.',
  faqs: 'Savol-javob. Saytda akkordeon + Google uchun FAQPage.',
  pages: 'Statik sahifalar: biz haqimizda, oferta.',
  site_settings: 'Telefonlar, linklar, manzil — kodga tegmasdan o‘zgaradi.',
  audit_logs: 'Kim nimani o‘zgartirdi. «Bu turni kim o‘chirdi?» savoliga javob.',
};

const GROUP_LABELS = {
  users: 'Administrator hisobi',
  site_settings: 'Sayt sozlamalari — telefonlar, linklar, manzil, hero matni',
  destinations: "Yo'nalishlar",
  services: 'Xizmatlar',
  faqs: 'Savol-javob',
  tours: 'Turlar',
  posts: 'Blog maqolalari',
  testimonials: 'Mijoz fikrlari',
  pages: 'Statik sahifalar',
  media: 'Rasmlar',
  tour_images: 'Tur galereyalari',
};

function pgDump(args) {
  try {
    return execFileSync('pg_dump', [pgUrl, ...args], {
      encoding: 'utf-8',
      maxBuffer: 64 * 1024 * 1024,
    });
  } catch (err) {
    console.error('✗ pg_dump ishlamadi. PostgreSQL client o‘rnatilganini tekshiring.');
    console.error(String(err.stderr ?? err.message).slice(0, 500));
    process.exit(1);
  }
}

console.log('  Bazadan o‘qilmoqda...');

const schemaSql = pgDump([
  '--schema-only',
  '--no-owner',
  '--no-privileges',
  '--no-comments',
  '--exclude-table=_prisma_migrations',
]);

const dataSql = pgDump([
  '--data-only',
  '--no-owner',
  '--no-privileges',
  '--column-inserts',
  ...CONTENT_TABLES.map((t) => `--table=${t}`),
]);

/** pg_dump'ning xizmat qatorlarini olib tashlaydi. */
function stripNoise(text) {
  return text
    .split('\n')
    .filter((line) => {
      const s = line.trim();
      if (s.startsWith('\\restrict') || s.startsWith('\\unrestrict')) return false;
      if (s.startsWith('SET ') || s.startsWith('SELECT pg_catalog.set_config')) return false;
      if (s.startsWith('--')) return false;
      return true;
    })
    .join('\n');
}

/** Berilgan buyruq bilan boshlanadigan to'liq SQL bloklarini ajratadi. */
function blocks(text, starts) {
  const result = [];
  let current = null;
  for (const line of text.split('\n')) {
    if (current === null) {
      if (starts.some((s) => line.startsWith(s))) {
        current = [line];
        if (line.trimEnd().endsWith(';')) {
          result.push(current.join('\n'));
          current = null;
        }
      }
    } else {
      current.push(line);
      if (line.trimEnd().endsWith(';')) {
        result.push(current.join('\n'));
        current = null;
      }
    }
  }
  return result;
}

const clean = (s) => s.replaceAll('public.', '');
const schema = stripNoise(schemaSql);

const types = blocks(schema, ['CREATE TYPE']).map(clean);
const tables = blocks(schema, ['CREATE TABLE']).map(clean);
const alters = blocks(schema, ['ALTER TABLE ONLY']).map(clean);
const indexes = blocks(schema, ['CREATE INDEX', 'CREATE UNIQUE INDEX']).map(clean);
const inserts = stripNoise(dataSql)
  .split('\n')
  .filter((l) => l.startsWith('INSERT INTO'))
  .map(clean);

const pkUnique = alters.filter((a) => a.includes('PRIMARY KEY') || a.includes('UNIQUE'));
const foreign = alters.filter((a) => a.includes('FOREIGN KEY'));

if (tables.length === 0) {
  console.error('✗ Jadvallar topilmadi. Baza bo‘sh bo‘lishi mumkin — `npm run db:migrate` qiling.');
  process.exit(1);
}

// INSERT'larni jadval bo'yicha guruhlaymiz — fayl o'qishga qulay bo'lsin
const groups = new Map();
for (const line of inserts) {
  const table = line.split('INSERT INTO ')[1].split(' ')[0];
  if (!groups.has(table)) groups.set(table, []);
  groups.get(table).push(line);
}

const tableName = (sql) => sql.split('CREATE TABLE ')[1].split(' ')[0].trim();

const out = [];
const w = (s) => out.push(s);

w(`-- ═══════════════════════════════════════════════════════════════
--  AYN TRAVEL — ayntravel.uz
--  Ma'lumotlar bazasi: struktura + boshlang'ich kontent
--
--  Bu fayl avtomatik yaratilgan:  npm run db:export
--  Qo'lda tahrirlamang — sxema o'zgarganda qaytadan yarating.
--
--  Talab: PostgreSQL 14 yoki undan yuqori.
--
--  ── O'RNATISH ──────────────────────────────────────────────────
--
--  SSH orqali:
--      createdb ayntravel
--      psql ayntravel < database.sql
--
--  cPanel orqali:
--      1. «PostgreSQL Databases» → baza va foydalanuvchi yarating,
--         foydalanuvchini bazaga biriktiring (ALL PRIVILEGES)
--      2. «phpPgAdmin» → bazani tanlang → SQL → shu faylni yuklang
--
--  ── KIRISH MA'LUMOTLARI ────────────────────────────────────────
--
--      Email:  admin@ayntravel.uz
--      Parol:  AynTravel2026!
--
--      >>> BIRINCHI KIRISHDAN KEYIN PAROLNI O'ZGARTIRING <<<
--      Admin panel → Foydalanuvchilar → o'zingizni tanlang
--
--  ── ESLATMA ────────────────────────────────────────────────────
--
--  Arizalar (leads), sessiyalar va audit jurnali bu faylda BO'SH —
--  ular faqat sayt ishlash paytida to'ldiriladi.
-- ═══════════════════════════════════════════════════════════════

SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET client_min_messages = warning;

-- Hammasi bitta tranzaksiyada: xato bo'lsa yarim o'rnatilgan baza qolmaydi.
BEGIN;

-- Bu fayl bir marta ishga tushirilishi kerak. Agar jadvallar allaqachon
-- mavjud bo'lsa, tushunarli xabar beramiz — aks holda PostgreSQL
-- «type already exists» degan noaniq xato qaytaradi.
DO $guard$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'tours'
  ) THEN
    RAISE EXCEPTION
      'Baza allaqachon o''rnatilgan. Qaytadan o''rnatish uchun avval bazani tozalang: DROP SCHEMA public CASCADE; CREATE SCHEMA public;';
  END IF;
END
$guard$;


-- ═══════════════════════════════════════════════════════════════
--  1. ENUM turlari
-- ═══════════════════════════════════════════════════════════════
`);

for (const t of types) w(t + '\n');

w(`
-- ═══════════════════════════════════════════════════════════════
--  2. Jadvallar
-- ═══════════════════════════════════════════════════════════════
`);
for (const t of tables) {
  const name = tableName(t);
  if (TABLE_NOTES[name]) w(`-- ${name}: ${TABLE_NOTES[name]}`);
  w(t + '\n');
}

w(`
-- ═══════════════════════════════════════════════════════════════
--  3. Boshlang'ich kontent
--
--  AYN TRAVEL ning haqiqiy ma'lumotlari — Instagram posterlaridan
--  olingan turlar, yo'nalishlar va kompaniya kontaktlari.
-- ═══════════════════════════════════════════════════════════════
`);
for (const [table, rows] of groups) {
  w(`\n-- ── ${GROUP_LABELS[table] ?? table} (${rows.length} ta) ──`);
  for (const row of rows) w(row);
}

w(`

-- ═══════════════════════════════════════════════════════════════
--  4. Kalitlar va yagonalik cheklovlari
--
--  Ma'lumotdan KEYIN qo'shiladi: yuklash tezroq bo'ladi va
--  INSERT'lar tartibi ahamiyatsiz bo'lib qoladi.
-- ═══════════════════════════════════════════════════════════════
`);
for (const a of pkUnique) w(a);

w(`
-- ═══════════════════════════════════════════════════════════════
--  5. Tashqi kalitlar
-- ═══════════════════════════════════════════════════════════════
`);
for (const a of foreign) w(a);

w(`
-- ═══════════════════════════════════════════════════════════════
--  6. Indekslar
--
--  Saytdagi eng ko'p uchraydigan so'rovlar uchun: nashr etilgan
--  turlarni sana va narx bo'yicha saralash, arizalarni status
--  bo'yicha filtrlash, slug orqali sahifa ochish.
-- ═══════════════════════════════════════════════════════════════
`);
for (const i of indexes) w(i);

w(`
COMMIT;


-- ═══════════════════════════════════════════════════════════════
--  TEKSHIRISH
--
--  Import tugagach shuni ishga tushiring:
--
--    SELECT
--      (SELECT count(*) FROM tours)        AS turlar,
--      (SELECT count(*) FROM destinations) AS yonalishlar,
--      (SELECT count(*) FROM services)     AS xizmatlar,
--      (SELECT count(*) FROM faqs)         AS savollar,
--      (SELECT count(*) FROM users)        AS adminlar;
-- ═══════════════════════════════════════════════════════════════
`);

const sql = out.join('\n');
fs.writeFileSync(OUTPUT, sql, 'utf-8');

console.log(`
✓ database.sql yangilandi

  jadvallar:  ${tables.length}
  enum:       ${types.length}
  indekslar:  ${indexes.length}
  INSERT:     ${inserts.length}
  hajmi:      ${Math.round(sql.length / 1024)} KB
`);
