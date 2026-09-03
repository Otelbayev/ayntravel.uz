-- ═══════════════════════════════════════════════════════════════
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

CREATE TYPE "ContentStatus" AS ENUM (
    'DRAFT',
    'PUBLISHED'
);

CREATE TYPE "LeadStatus" AS ENUM (
    'NEW',
    'CONTACTED',
    'BOOKED',
    'LOST',
    'SPAM'
);

CREATE TYPE "MealPlan" AS ENUM (
    'RO',
    'BB',
    'HB',
    'FB',
    'AI',
    'UAI'
);

CREATE TYPE "MediaKind" AS ENUM (
    'IMAGE',
    'VIDEO'
);

CREATE TYPE "UserRole" AS ENUM (
    'ADMIN',
    'MANAGER'
);


-- ═══════════════════════════════════════════════════════════════
--  2. Jadvallar
-- ═══════════════════════════════════════════════════════════════

-- audit_logs: Kim nimani o‘zgartirdi. «Bu turni kim o‘chirdi?» savoliga javob.
CREATE TABLE audit_logs (
    id text NOT NULL,
    "userId" text,
    entity text NOT NULL,
    "entityId" text,
    action text NOT NULL,
    diff jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- destinations: Yo‘nalishlar (Turkiya, Dubay...). Har biri alohida SEO sahifasi.
CREATE TABLE destinations (
    id text NOT NULL,
    slug text NOT NULL,
    "nameUz" text NOT NULL,
    "nameRu" text,
    "countryCode" character varying(2),
    "descriptionUz" text,
    "descriptionRu" text,
    "heroImageId" text,
    "sortOrder" integer DEFAULT 0 NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "seoTitleUz" text,
    "seoTitleRu" text,
    "seoDescriptionUz" text,
    "seoDescriptionRu" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);

-- faqs: Savol-javob. Saytda akkordeon + Google uchun FAQPage.
CREATE TABLE faqs (
    id text NOT NULL,
    "questionUz" text NOT NULL,
    "questionRu" text,
    "answerUz" text NOT NULL,
    "answerRu" text,
    "sortOrder" integer DEFAULT 0 NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);

-- leads: ARIZALAR — saytning asosiy biznes qiymati.
CREATE TABLE leads (
    id text NOT NULL,
    name text NOT NULL,
    phone text NOT NULL,
    message text,
    source text DEFAULT 'other'::text NOT NULL,
    locale character varying(2) DEFAULT 'uz'::character varying NOT NULL,
    "tourId" text,
    status "LeadStatus" DEFAULT 'NEW'::"LeadStatus" NOT NULL,
    "managerNote" text,
    "assignedToId" text,
    utm jsonb,
    "ipHash" text,
    "userAgent" text,
    "notifiedAt" timestamp(3) without time zone,
    "contactedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);

-- media: Yuklangan rasmlar. variants: {"poster":{"webp":"...","avif":"..."}}
CREATE TABLE media (
    id text NOT NULL,
    filename text NOT NULL,
    "originalName" text NOT NULL,
    "mimeType" text NOT NULL,
    width integer NOT NULL,
    height integer NOT NULL,
    "sizeBytes" integer NOT NULL,
    variants jsonb NOT NULL,
    "blurDataUrl" text,
    "altUz" text,
    "altRu" text,
    "uploadedById" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "durationSeconds" integer,
    kind "MediaKind" DEFAULT 'IMAGE'::"MediaKind" NOT NULL,
    "sourceUrl" text
);

-- pages: Statik sahifalar: biz haqimizda, oferta.
CREATE TABLE pages (
    id text NOT NULL,
    slug text NOT NULL,
    "titleUz" text NOT NULL,
    "titleRu" text,
    "bodyUz" text,
    "bodyRu" text,
    "seoTitleUz" text,
    "seoTitleRu" text,
    "seoDescriptionUz" text,
    "seoDescriptionRu" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);

-- posts: Blog maqolalari.
CREATE TABLE posts (
    id text NOT NULL,
    slug text NOT NULL,
    "titleUz" text NOT NULL,
    "titleRu" text,
    "excerptUz" text,
    "excerptRu" text,
    "bodyUz" text,
    "bodyRu" text,
    "coverImageId" text,
    category text,
    tags text[] DEFAULT ARRAY[]::text[],
    "readingTime" integer DEFAULT 1 NOT NULL,
    status "ContentStatus" DEFAULT 'DRAFT'::"ContentStatus" NOT NULL,
    "publishedAt" timestamp(3) without time zone,
    "viewCount" integer DEFAULT 0 NOT NULL,
    "seoTitleUz" text,
    "seoTitleRu" text,
    "seoDescriptionUz" text,
    "seoDescriptionRu" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);

-- refresh_tokens: Sessiyalar. Faqat hash saqlanadi — baza sizib chiqsa ham token ishlamaydi.
CREATE TABLE refresh_tokens (
    id text NOT NULL,
    "tokenHash" text NOT NULL,
    "userId" text NOT NULL,
    "expiresAt" timestamp(3) without time zone NOT NULL,
    "revokedAt" timestamp(3) without time zone,
    "userAgent" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- services: Xizmatlar: viza, aviachipta, transport.
CREATE TABLE services (
    id text NOT NULL,
    slug text NOT NULL,
    icon text,
    "titleUz" text NOT NULL,
    "titleRu" text,
    "descriptionUz" text,
    "descriptionRu" text,
    "sortOrder" integer DEFAULT 0 NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);

-- site_settings: Telefonlar, linklar, manzil — kodga tegmasdan o‘zgaradi.
CREATE TABLE site_settings (
    key text NOT NULL,
    value jsonb NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);

-- testimonials: Mijoz fikrlari.
CREATE TABLE testimonials (
    id text NOT NULL,
    "clientName" text NOT NULL,
    "textUz" text NOT NULL,
    "textRu" text,
    rating integer DEFAULT 5 NOT NULL,
    "photoId" text,
    "tourId" text,
    "isPublished" boolean DEFAULT true NOT NULL,
    "sortOrder" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);

-- tour_images: Tur galereyasi. Rasm tartibini saqlash uchun alohida jadval.
CREATE TABLE tour_images (
    id text NOT NULL,
    "tourId" text NOT NULL,
    "mediaId" text NOT NULL,
    "sortOrder" integer DEFAULT 0 NOT NULL
);

-- tours: Asosiy mahsulot. Narx numeric — suzuvchi nuqta xatosi bo‘lmaydi.
CREATE TABLE tours (
    id text NOT NULL,
    slug text NOT NULL,
    "titleUz" text NOT NULL,
    "titleRu" text,
    "summaryUz" text,
    "summaryRu" text,
    "bodyUz" text,
    "bodyRu" text,
    "destinationId" text NOT NULL,
    "priceFrom" numeric(10,2) NOT NULL,
    "extraFee" numeric(10,2),
    currency character varying(3) DEFAULT 'USD'::character varying NOT NULL,
    "departureDate" timestamp(3) without time zone,
    "returnDate" timestamp(3) without time zone,
    "durationDays" integer,
    "durationNights" integer,
    "hotelStars" integer,
    "mealPlan" "MealPlan",
    "citiesUz" text[] DEFAULT ARRAY[]::text[],
    "citiesRu" text[] DEFAULT ARRAY[]::text[],
    includes text[] DEFAULT ARRAY[]::text[],
    excludes text[] DEFAULT ARRAY[]::text[],
    "posterImageId" text,
    "isHot" boolean DEFAULT false NOT NULL,
    "isFeatured" boolean DEFAULT false NOT NULL,
    "seatsLeft" integer,
    status "ContentStatus" DEFAULT 'DRAFT'::"ContentStatus" NOT NULL,
    "publishedAt" timestamp(3) without time zone,
    "viewCount" integer DEFAULT 0 NOT NULL,
    "seoTitleUz" text,
    "seoTitleRu" text,
    "seoDescriptionUz" text,
    "seoDescriptionRu" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);

-- users: Admin va menejerlar. Parol argon2 bilan hashlanadi.
CREATE TABLE users (
    id text NOT NULL,
    email text NOT NULL,
    "passwordHash" text NOT NULL,
    name text NOT NULL,
    role "UserRole" DEFAULT 'MANAGER'::"UserRole" NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "lastLoginAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


-- ═══════════════════════════════════════════════════════════════
--  3. Boshlang'ich kontent
--
--  AYN TRAVEL ning haqiqiy ma'lumotlari — Instagram posterlaridan
--  olingan turlar, yo'nalishlar va kompaniya kontaktlari.
-- ═══════════════════════════════════════════════════════════════


-- ── Administrator hisobi (1 ta) ──
INSERT INTO users (id, email, "passwordHash", name, role, "isActive", "lastLoginAt", "createdAt", "updatedAt") VALUES ('cmtcwnnwh00000k5e47f3vsnj', 'admin@ayntravel.uz', '$argon2id$v=19$m=65536,t=3,p=4$SvlUwhBNoGtotV/Eu7wg8Q$0Vi1vaRVtEyLrc5wXWmbwjrLjMPgIFdyob0I835tako', 'AYN TRAVEL Admin', 'ADMIN', true, '2026-09-02 20:38:35.652', '2026-08-28 12:05:43.745', '2026-09-02 20:38:35.652');

-- ── Rasmlar (18 ta) ──
INSERT INTO media (id, filename, "originalName", "mimeType", width, height, "sizeBytes", variants, "blurDataUrl", "altUz", "altRu", "uploadedById", "createdAt", "updatedAt", "durationSeconds", kind, "sourceUrl") VALUES ('cmtkjjhdx00000kesijdxnywm', '2026-09/demo-turkiya-f37389628990', 'demo-turkiya.png', 'image/png', 1080, 1350, 71904, '{"wide": {"avif": "/uploads/2026-09/demo-turkiya-f37389628990-wide.avif", "webp": "/uploads/2026-09/demo-turkiya-f37389628990-wide.webp"}, "thumb": {"avif": "/uploads/2026-09/demo-turkiya-f37389628990-thumb.avif", "webp": "/uploads/2026-09/demo-turkiya-f37389628990-thumb.webp"}, "poster": {"avif": "/uploads/2026-09/demo-turkiya-f37389628990-poster.avif", "webp": "/uploads/2026-09/demo-turkiya-f37389628990-poster.webp"}, "square": {"avif": "/uploads/2026-09/demo-turkiya-f37389628990-square.avif", "webp": "/uploads/2026-09/demo-turkiya-f37389628990-square.webp"}}', 'data:image/webp;base64,UklGRlYAAABXRUJQVlA4IEoAAACQAwCdASoUABkAPxGAt1WsKCUjKAgBgCIJQBTo3RA1QBWxCSSAAP7jDl+dlS8e1uGpNDxtg8kitYQCkxyEVLXfubCuUUTjctKgAA==', 'Turkiya — AYN TRAVEL yo‘nalishi', NULL, NULL, '2026-09-02 20:20:43.077', '2026-09-02 20:20:43.077', NULL, 'IMAGE', NULL);
INSERT INTO media (id, filename, "originalName", "mimeType", width, height, "sizeBytes", variants, "blurDataUrl", "altUz", "altRu", "uploadedById", "createdAt", "updatedAt", "durationSeconds", kind, "sourceUrl") VALUES ('cmtkjjiml00010kes13kng20v', '2026-09/demo-ozarbayjon-ad5802fe1c27', 'demo-ozarbayjon.png', 'image/png', 1080, 1350, 88018, '{"wide": {"avif": "/uploads/2026-09/demo-ozarbayjon-ad5802fe1c27-wide.avif", "webp": "/uploads/2026-09/demo-ozarbayjon-ad5802fe1c27-wide.webp"}, "thumb": {"avif": "/uploads/2026-09/demo-ozarbayjon-ad5802fe1c27-thumb.avif", "webp": "/uploads/2026-09/demo-ozarbayjon-ad5802fe1c27-thumb.webp"}, "poster": {"avif": "/uploads/2026-09/demo-ozarbayjon-ad5802fe1c27-poster.avif", "webp": "/uploads/2026-09/demo-ozarbayjon-ad5802fe1c27-poster.webp"}, "square": {"avif": "/uploads/2026-09/demo-ozarbayjon-ad5802fe1c27-square.avif", "webp": "/uploads/2026-09/demo-ozarbayjon-ad5802fe1c27-square.webp"}}', 'data:image/webp;base64,UklGRlwAAABXRUJQVlA4IFAAAACQAwCdASoUABkAPxF2s1IsJySnsBgIAYAiCWUAs4APR6oDWhLAAP7o8NxVo9W7pxw9nBU67f/q0NGuvJm7OYqp7Erxg8AZg1s5fwJMcsKsAA==', 'Ozarbayjon — AYN TRAVEL yo‘nalishi', NULL, NULL, '2026-09-02 20:20:44.685', '2026-09-02 20:20:44.685', NULL, 'IMAGE', NULL);
INSERT INTO media (id, filename, "originalName", "mimeType", width, height, "sizeBytes", variants, "blurDataUrl", "altUz", "altRu", "uploadedById", "createdAt", "updatedAt", "durationSeconds", kind, "sourceUrl") VALUES ('cmtkjjjsb00020kes6xdbj0lc', '2026-09/demo-gruziya-625fe221dd69', 'demo-gruziya.png', 'image/png', 1080, 1350, 73380, '{"wide": {"avif": "/uploads/2026-09/demo-gruziya-625fe221dd69-wide.avif", "webp": "/uploads/2026-09/demo-gruziya-625fe221dd69-wide.webp"}, "thumb": {"avif": "/uploads/2026-09/demo-gruziya-625fe221dd69-thumb.avif", "webp": "/uploads/2026-09/demo-gruziya-625fe221dd69-thumb.webp"}, "poster": {"avif": "/uploads/2026-09/demo-gruziya-625fe221dd69-poster.avif", "webp": "/uploads/2026-09/demo-gruziya-625fe221dd69-poster.webp"}, "square": {"avif": "/uploads/2026-09/demo-gruziya-625fe221dd69-square.avif", "webp": "/uploads/2026-09/demo-gruziya-625fe221dd69-square.webp"}}', 'data:image/webp;base64,UklGRlQAAABXRUJQVlA4IEgAAACQAwCdASoUABkAPxGAuFWsKCUjKAgBgCIJZQC+SBEcy/aAWC8AAP7jDl/fEIRAu8EOV8a5fp8Juw6DC2rzjjX/q1B8ZdcIgAA=', 'Gruziya — AYN TRAVEL yo‘nalishi', NULL, NULL, '2026-09-02 20:20:46.188', '2026-09-02 20:20:46.188', NULL, 'IMAGE', NULL);
INSERT INTO media (id, filename, "originalName", "mimeType", width, height, "sizeBytes", variants, "blurDataUrl", "altUz", "altRu", "uploadedById", "createdAt", "updatedAt", "durationSeconds", kind, "sourceUrl") VALUES ('cmtkjjkz400030kes7wa3o0lz', '2026-09/demo-vyetnam-d0645c689a27', 'demo-vyetnam.png', 'image/png', 1080, 1350, 74155, '{"wide": {"avif": "/uploads/2026-09/demo-vyetnam-d0645c689a27-wide.avif", "webp": "/uploads/2026-09/demo-vyetnam-d0645c689a27-wide.webp"}, "thumb": {"avif": "/uploads/2026-09/demo-vyetnam-d0645c689a27-thumb.avif", "webp": "/uploads/2026-09/demo-vyetnam-d0645c689a27-thumb.webp"}, "poster": {"avif": "/uploads/2026-09/demo-vyetnam-d0645c689a27-poster.avif", "webp": "/uploads/2026-09/demo-vyetnam-d0645c689a27-poster.webp"}, "square": {"avif": "/uploads/2026-09/demo-vyetnam-d0645c689a27-square.avif", "webp": "/uploads/2026-09/demo-vyetnam-d0645c689a27-square.webp"}}', 'data:image/webp;base64,UklGRlgAAABXRUJQVlA4IEwAAABwAwCdASoUABkAPxGAuFWsKCUjKAgBgCIJZQDCgA9nooZGkAAA/ujw3FVHNodmt4wmnCs5A7DmFYUMdmF1JM6+rVlEEMHbChCSqAAA', 'Vyetnam — AYN TRAVEL yo‘nalishi', NULL, NULL, '2026-09-02 20:20:47.729', '2026-09-02 20:20:47.729', NULL, 'IMAGE', NULL);
INSERT INTO media (id, filename, "originalName", "mimeType", width, height, "sizeBytes", variants, "blurDataUrl", "altUz", "altRu", "uploadedById", "createdAt", "updatedAt", "durationSeconds", kind, "sourceUrl") VALUES ('cmtkjjm6u00040kesap5ywk44', '2026-09/demo-dubay-96aa866c4d19', 'demo-dubay.png', 'image/png', 1080, 1350, 82448, '{"wide": {"avif": "/uploads/2026-09/demo-dubay-96aa866c4d19-wide.avif", "webp": "/uploads/2026-09/demo-dubay-96aa866c4d19-wide.webp"}, "thumb": {"avif": "/uploads/2026-09/demo-dubay-96aa866c4d19-thumb.avif", "webp": "/uploads/2026-09/demo-dubay-96aa866c4d19-thumb.webp"}, "poster": {"avif": "/uploads/2026-09/demo-dubay-96aa866c4d19-poster.avif", "webp": "/uploads/2026-09/demo-dubay-96aa866c4d19-poster.webp"}, "square": {"avif": "/uploads/2026-09/demo-dubay-96aa866c4d19-square.avif", "webp": "/uploads/2026-09/demo-dubay-96aa866c4d19-square.webp"}}', 'data:image/webp;base64,UklGRl4AAABXRUJQVlA4IFIAAACwAwCdASoUABkAPxF8sFIsKCQnsBgIAYAiCWMApawPSH8AvaJIgAD+40nHLjNG4FUbLnsUgkNwMPROlEvCZhxLgbNwKs8JkXHayXn0eCQCZaAA', 'Dubay (BAA) — AYN TRAVEL yo‘nalishi', NULL, NULL, '2026-09-02 20:20:49.302', '2026-09-02 20:20:49.302', NULL, 'IMAGE', NULL);
INSERT INTO media (id, filename, "originalName", "mimeType", width, height, "sizeBytes", variants, "blurDataUrl", "altUz", "altRu", "uploadedById", "createdAt", "updatedAt", "durationSeconds", kind, "sourceUrl") VALUES ('cmtkjjncy00050kes0zmffkhe', '2026-09/demo-xitoy-d82b8cf71287', 'demo-xitoy.png', 'image/png', 1080, 1350, 68786, '{"wide": {"avif": "/uploads/2026-09/demo-xitoy-d82b8cf71287-wide.avif", "webp": "/uploads/2026-09/demo-xitoy-d82b8cf71287-wide.webp"}, "thumb": {"avif": "/uploads/2026-09/demo-xitoy-d82b8cf71287-thumb.avif", "webp": "/uploads/2026-09/demo-xitoy-d82b8cf71287-thumb.webp"}, "poster": {"avif": "/uploads/2026-09/demo-xitoy-d82b8cf71287-poster.avif", "webp": "/uploads/2026-09/demo-xitoy-d82b8cf71287-poster.webp"}, "square": {"avif": "/uploads/2026-09/demo-xitoy-d82b8cf71287-square.avif", "webp": "/uploads/2026-09/demo-xitoy-d82b8cf71287-square.webp"}}', 'data:image/webp;base64,UklGRlQAAABXRUJQVlA4IEgAAACwAwCdASoUABkAPxGCuFWsKKUjKAgBgCIJQBTo7IA1P2PdHSTWAAD+4w+R05HW3tlG0T+swT6SIF/UspU5Yep3cNHXVxCAAAA=', 'Xitoy — AYN TRAVEL yo‘nalishi', NULL, NULL, '2026-09-02 20:20:50.819', '2026-09-02 20:20:50.819', NULL, 'IMAGE', NULL);
INSERT INTO media (id, filename, "originalName", "mimeType", width, height, "sizeBytes", variants, "blurDataUrl", "altUz", "altRu", "uploadedById", "createdAt", "updatedAt", "durationSeconds", kind, "sourceUrl") VALUES ('cmtkjjohh00060kesm3l3upl8', '2026-09/demo-misr-14e811823e1f', 'demo-misr.png', 'image/png', 1080, 1350, 65271, '{"wide": {"avif": "/uploads/2026-09/demo-misr-14e811823e1f-wide.avif", "webp": "/uploads/2026-09/demo-misr-14e811823e1f-wide.webp"}, "thumb": {"avif": "/uploads/2026-09/demo-misr-14e811823e1f-thumb.avif", "webp": "/uploads/2026-09/demo-misr-14e811823e1f-thumb.webp"}, "poster": {"avif": "/uploads/2026-09/demo-misr-14e811823e1f-poster.avif", "webp": "/uploads/2026-09/demo-misr-14e811823e1f-poster.webp"}, "square": {"avif": "/uploads/2026-09/demo-misr-14e811823e1f-square.avif", "webp": "/uploads/2026-09/demo-misr-14e811823e1f-square.webp"}}', 'data:image/webp;base64,UklGRlgAAABXRUJQVlA4IEwAAADwAwCdASoUABkAPxF8tFOsJ6qiqAqpgCIJYwC7KIAA7RlwqFu1J1AAAP7jEEWoGsb31N7pdyPfsArqi8QC/++9DV/9xPgTW7bFYgAA', 'Misr — AYN TRAVEL yo‘nalishi', NULL, NULL, '2026-09-02 20:20:52.278', '2026-09-02 20:20:52.278', NULL, 'IMAGE', NULL);
INSERT INTO media (id, filename, "originalName", "mimeType", width, height, "sizeBytes", variants, "blurDataUrl", "altUz", "altRu", "uploadedById", "createdAt", "updatedAt", "durationSeconds", kind, "sourceUrl") VALUES ('cmtkjjpmx00070kesrqx71v34', '2026-09/demo-tailand-1ecb861e9a38', 'demo-tailand.png', 'image/png', 1080, 1350, 68046, '{"wide": {"avif": "/uploads/2026-09/demo-tailand-1ecb861e9a38-wide.avif", "webp": "/uploads/2026-09/demo-tailand-1ecb861e9a38-wide.webp"}, "thumb": {"avif": "/uploads/2026-09/demo-tailand-1ecb861e9a38-thumb.avif", "webp": "/uploads/2026-09/demo-tailand-1ecb861e9a38-thumb.webp"}, "poster": {"avif": "/uploads/2026-09/demo-tailand-1ecb861e9a38-poster.avif", "webp": "/uploads/2026-09/demo-tailand-1ecb861e9a38-poster.webp"}, "square": {"avif": "/uploads/2026-09/demo-tailand-1ecb861e9a38-square.avif", "webp": "/uploads/2026-09/demo-tailand-1ecb861e9a38-square.webp"}}', 'data:image/webp;base64,UklGRlYAAABXRUJQVlA4IEoAAABwAwCdASoUABkAPxGAuFWsKCUjKAgBgCIJZQCzgBEcy+/+RgAA/uMOX97wszu4RdI04a9QS1sjDRrVtDWgKs79oM34wltRCEAAAA==', 'Tailand — AYN TRAVEL yo‘nalishi', NULL, NULL, '2026-09-02 20:20:53.77', '2026-09-02 20:20:53.77', NULL, 'IMAGE', NULL);
INSERT INTO media (id, filename, "originalName", "mimeType", width, height, "sizeBytes", variants, "blurDataUrl", "altUz", "altRu", "uploadedById", "createdAt", "updatedAt", "durationSeconds", kind, "sourceUrl") VALUES ('cmtkjjqwy00080kesxe0ozbdt', '2026-09/demo-maldiv-0c4992d78b72', 'demo-maldiv.png', 'image/png', 1080, 1350, 94550, '{"wide": {"avif": "/uploads/2026-09/demo-maldiv-0c4992d78b72-wide.avif", "webp": "/uploads/2026-09/demo-maldiv-0c4992d78b72-wide.webp"}, "thumb": {"avif": "/uploads/2026-09/demo-maldiv-0c4992d78b72-thumb.avif", "webp": "/uploads/2026-09/demo-maldiv-0c4992d78b72-thumb.webp"}, "poster": {"avif": "/uploads/2026-09/demo-maldiv-0c4992d78b72-poster.avif", "webp": "/uploads/2026-09/demo-maldiv-0c4992d78b72-poster.webp"}, "square": {"avif": "/uploads/2026-09/demo-maldiv-0c4992d78b72-square.avif", "webp": "/uploads/2026-09/demo-maldiv-0c4992d78b72-square.webp"}}', 'data:image/webp;base64,UklGRmgAAABXRUJQVlA4IFwAAACwAwCdASoUABkAPxFwtFMsJaSoMBgIAYAiCWUfAAAAV0o/YDhNAAD+6PDcVVV0DPV3HNCzWJyIiZu/vjw7/nY9wfuKd08LCcNeB3ta/92bCqaAXyA8hwpOtAAAAA==', 'Maldiv orollari — AYN TRAVEL yo‘nalishi', NULL, NULL, '2026-09-02 20:20:55.427', '2026-09-02 20:20:55.427', NULL, 'IMAGE', NULL);
INSERT INTO media (id, filename, "originalName", "mimeType", width, height, "sizeBytes", variants, "blurDataUrl", "altUz", "altRu", "uploadedById", "createdAt", "updatedAt", "durationSeconds", kind, "sourceUrl") VALUES ('cmtkjjs9t00090kesy823nvuo', '2026-09/demo-tour-ozarbayjon-baku-turi-3846715590c7', 'demo-tour-ozarbayjon-baku-turi.png', 'image/png', 1080, 1350, 129935, '{"wide": {"avif": "/uploads/2026-09/demo-tour-ozarbayjon-baku-turi-3846715590c7-wide.avif", "webp": "/uploads/2026-09/demo-tour-ozarbayjon-baku-turi-3846715590c7-wide.webp"}, "thumb": {"avif": "/uploads/2026-09/demo-tour-ozarbayjon-baku-turi-3846715590c7-thumb.avif", "webp": "/uploads/2026-09/demo-tour-ozarbayjon-baku-turi-3846715590c7-thumb.webp"}, "poster": {"avif": "/uploads/2026-09/demo-tour-ozarbayjon-baku-turi-3846715590c7-poster.avif", "webp": "/uploads/2026-09/demo-tour-ozarbayjon-baku-turi-3846715590c7-poster.webp"}, "square": {"avif": "/uploads/2026-09/demo-tour-ozarbayjon-baku-turi-3846715590c7-square.avif", "webp": "/uploads/2026-09/demo-tour-ozarbayjon-baku-turi-3846715590c7-square.webp"}}', 'data:image/webp;base64,UklGRmQAAABXRUJQVlA4IFgAAADwAwCdASoUABkAPxF6tFQsJ6SkKAqpgCIJZQCzgA9nrgXwKSDjUXwAAP7o8NxV8ncj05cYcdiQtohprIDTBvOEsQGgY3SQz22XHNPT5uMuCFPEc+t5tAAA', 'Ozarbayjon — Baku sayohati — 275$ dan', NULL, NULL, '2026-09-02 20:20:57.185', '2026-09-02 20:20:57.185', NULL, 'IMAGE', NULL);
INSERT INTO media (id, filename, "originalName", "mimeType", width, height, "sizeBytes", variants, "blurDataUrl", "altUz", "altRu", "uploadedById", "createdAt", "updatedAt", "durationSeconds", kind, "sourceUrl") VALUES ('cmtkjjtkh000a0kesryqykz3o', '2026-09/demo-tour-tbilisi-batumi-turi-fe233613c760', 'demo-tour-tbilisi-batumi-turi.png', 'image/png', 1080, 1350, 97684, '{"wide": {"avif": "/uploads/2026-09/demo-tour-tbilisi-batumi-turi-fe233613c760-wide.avif", "webp": "/uploads/2026-09/demo-tour-tbilisi-batumi-turi-fe233613c760-wide.webp"}, "thumb": {"avif": "/uploads/2026-09/demo-tour-tbilisi-batumi-turi-fe233613c760-thumb.avif", "webp": "/uploads/2026-09/demo-tour-tbilisi-batumi-turi-fe233613c760-thumb.webp"}, "poster": {"avif": "/uploads/2026-09/demo-tour-tbilisi-batumi-turi-fe233613c760-poster.avif", "webp": "/uploads/2026-09/demo-tour-tbilisi-batumi-turi-fe233613c760-poster.webp"}, "square": {"avif": "/uploads/2026-09/demo-tour-tbilisi-batumi-turi-fe233613c760-square.avif", "webp": "/uploads/2026-09/demo-tour-tbilisi-batumi-turi-fe233613c760-square.webp"}}', 'data:image/webp;base64,UklGRmgAAABXRUJQVlA4IFwAAAAQBACdASoUABkAPxFys1MsJiSisBgIAYAiCWUApIU1AFFYTZq3IXrqAAD+5QFvMlmIfNjR48NYTltVYVibsONKg4+DW0FNPzQiLe2F9GLwpyeqjgFyzwrKuroAAA==', 'Tbilisi + Batumi — 635$ dan', NULL, NULL, '2026-09-02 20:20:58.866', '2026-09-02 20:20:58.866', NULL, 'IMAGE', NULL);
INSERT INTO media (id, filename, "originalName", "mimeType", width, height, "sizeBytes", variants, "blurDataUrl", "altUz", "altRu", "uploadedById", "createdAt", "updatedAt", "durationSeconds", kind, "sourceUrl") VALUES ('cmtkjjuyk000b0kesn15rpxtb', '2026-09/demo-tour-istanbul-tarix-va-zamonaviylik-ba2c2aa0716f', 'demo-tour-istanbul-tarix-va-zamonaviylik.png', 'image/png', 1080, 1350, 132166, '{"wide": {"avif": "/uploads/2026-09/demo-tour-istanbul-tarix-va-zamonaviylik-ba2c2aa0716f-wide.avif", "webp": "/uploads/2026-09/demo-tour-istanbul-tarix-va-zamonaviylik-ba2c2aa0716f-wide.webp"}, "thumb": {"avif": "/uploads/2026-09/demo-tour-istanbul-tarix-va-zamonaviylik-ba2c2aa0716f-thumb.avif", "webp": "/uploads/2026-09/demo-tour-istanbul-tarix-va-zamonaviylik-ba2c2aa0716f-thumb.webp"}, "poster": {"avif": "/uploads/2026-09/demo-tour-istanbul-tarix-va-zamonaviylik-ba2c2aa0716f-poster.avif", "webp": "/uploads/2026-09/demo-tour-istanbul-tarix-va-zamonaviylik-ba2c2aa0716f-poster.webp"}, "square": {"avif": "/uploads/2026-09/demo-tour-istanbul-tarix-va-zamonaviylik-ba2c2aa0716f-square.avif", "webp": "/uploads/2026-09/demo-tour-istanbul-tarix-va-zamonaviylik-ba2c2aa0716f-square.webp"}}', 'data:image/webp;base64,UklGRnIAAABXRUJQVlA4IGYAAAAwBACdASoUABkAPxFyrFEsJqQisBgMAYAiCUAVhlvgNT/utR7q7xqvi4AA/uMOZAH6G0ZPXJGcAe64I9z7v7sFcD62CXjQUCJHx7HTVfoECLusKCR1AYGBbkLDvTWsru3zKlgAAAA=', 'Istanbul — tarix va zamonaviylik uyg‘unligi — 728$ dan', NULL, NULL, '2026-09-02 20:21:00.668', '2026-09-02 20:21:00.668', NULL, 'IMAGE', NULL);
INSERT INTO media (id, filename, "originalName", "mimeType", width, height, "sizeBytes", variants, "blurDataUrl", "altUz", "altRu", "uploadedById", "createdAt", "updatedAt", "durationSeconds", kind, "sourceUrl") VALUES ('cmtkjjwbm000c0kesqy94mpq3', '2026-09/demo-tour-nha-trang-vyetnam-turi-a48d9ef64052', 'demo-tour-nha-trang-vyetnam-turi.png', 'image/png', 1080, 1350, 129241, '{"wide": {"avif": "/uploads/2026-09/demo-tour-nha-trang-vyetnam-turi-a48d9ef64052-wide.avif", "webp": "/uploads/2026-09/demo-tour-nha-trang-vyetnam-turi-a48d9ef64052-wide.webp"}, "thumb": {"avif": "/uploads/2026-09/demo-tour-nha-trang-vyetnam-turi-a48d9ef64052-thumb.avif", "webp": "/uploads/2026-09/demo-tour-nha-trang-vyetnam-turi-a48d9ef64052-thumb.webp"}, "poster": {"avif": "/uploads/2026-09/demo-tour-nha-trang-vyetnam-turi-a48d9ef64052-poster.avif", "webp": "/uploads/2026-09/demo-tour-nha-trang-vyetnam-turi-a48d9ef64052-poster.webp"}, "square": {"avif": "/uploads/2026-09/demo-tour-nha-trang-vyetnam-turi-a48d9ef64052-square.avif", "webp": "/uploads/2026-09/demo-tour-nha-trang-vyetnam-turi-a48d9ef64052-square.webp"}}', 'data:image/webp;base64,UklGRmwAAABXRUJQVlA4IGAAAAAQBACdASoUABkAPxF4tlOsJyUkKAqpgCIJZQAAKdIPHBUf+dn+lQFsAAD+6PDcVaPxgMBDkNtawRsxMNfYy6fZLheVKE2WQ25wXko20kZ1hI8Do6oxcSNZDPhqUbKsoAA=', 'Nha Trang — tropik jannatga sayohat — 580$ dan', NULL, NULL, '2026-09-02 20:21:02.435', '2026-09-02 20:21:02.435', NULL, 'IMAGE', NULL);
INSERT INTO media (id, filename, "originalName", "mimeType", width, height, "sizeBytes", variants, "blurDataUrl", "altUz", "altRu", "uploadedById", "createdAt", "updatedAt", "durationSeconds", kind, "sourceUrl") VALUES ('cmtkjjxmd000d0kes0r0i5p70', '2026-09/demo-tour-xitoy-xaynan-oroli-36533156e398', 'demo-tour-xitoy-xaynan-oroli.png', 'image/png', 1080, 1350, 110284, '{"wide": {"avif": "/uploads/2026-09/demo-tour-xitoy-xaynan-oroli-36533156e398-wide.avif", "webp": "/uploads/2026-09/demo-tour-xitoy-xaynan-oroli-36533156e398-wide.webp"}, "thumb": {"avif": "/uploads/2026-09/demo-tour-xitoy-xaynan-oroli-36533156e398-thumb.avif", "webp": "/uploads/2026-09/demo-tour-xitoy-xaynan-oroli-36533156e398-thumb.webp"}, "poster": {"avif": "/uploads/2026-09/demo-tour-xitoy-xaynan-oroli-36533156e398-poster.avif", "webp": "/uploads/2026-09/demo-tour-xitoy-xaynan-oroli-36533156e398-poster.webp"}, "square": {"avif": "/uploads/2026-09/demo-tour-xitoy-xaynan-oroli-36533156e398-square.avif", "webp": "/uploads/2026-09/demo-tour-xitoy-xaynan-oroli-36533156e398-square.webp"}}', 'data:image/webp;base64,UklGRmIAAABXRUJQVlA4IFYAAAAwBACdASoUABkAPxFwr1EsJiQisBgMAYAiCUAVJOq4NT9unep3q1R7xoAA/uMPklD/PYufXNKmlVny68Rn3mO3O6ISHssWpwPsjGSubtwNB4ajH4AAAA==', 'Xitoy — Xaynan oroli — 640$ dan', NULL, NULL, '2026-09-02 20:21:04.117', '2026-09-02 20:21:04.117', NULL, 'IMAGE', NULL);
INSERT INTO media (id, filename, "originalName", "mimeType", width, height, "sizeBytes", variants, "blurDataUrl", "altUz", "altRu", "uploadedById", "createdAt", "updatedAt", "durationSeconds", kind, "sourceUrl") VALUES ('cmtkjjz04000e0kesw7kc4kll', '2026-09/demo-tour-antalya-goryashiy-tur-abc1c6f2f3e8', 'demo-tour-antalya-goryashiy-tur.png', 'image/png', 1080, 1350, 123704, '{"wide": {"avif": "/uploads/2026-09/demo-tour-antalya-goryashiy-tur-abc1c6f2f3e8-wide.avif", "webp": "/uploads/2026-09/demo-tour-antalya-goryashiy-tur-abc1c6f2f3e8-wide.webp"}, "thumb": {"avif": "/uploads/2026-09/demo-tour-antalya-goryashiy-tur-abc1c6f2f3e8-thumb.avif", "webp": "/uploads/2026-09/demo-tour-antalya-goryashiy-tur-abc1c6f2f3e8-thumb.webp"}, "poster": {"avif": "/uploads/2026-09/demo-tour-antalya-goryashiy-tur-abc1c6f2f3e8-poster.avif", "webp": "/uploads/2026-09/demo-tour-antalya-goryashiy-tur-abc1c6f2f3e8-poster.webp"}, "square": {"avif": "/uploads/2026-09/demo-tour-antalya-goryashiy-tur-abc1c6f2f3e8-square.avif", "webp": "/uploads/2026-09/demo-tour-antalya-goryashiy-tur-abc1c6f2f3e8-square.webp"}}', 'data:image/webp;base64,UklGRmgAAABXRUJQVlA4IFwAAABwBACdASoUABkAPxFyrlCsJqQisBgMAYAiCUAVhmMANT/7NLBnXwTxW/SjNAD+4w5j9+Cb4di+ni0b2V4Y30yoYZy/OtO0ILF9GMDUjw72AxJsHdg+UFinI4AAAA==', 'Antalya — dengiz bo‘yida dam olish — 600$ dan', NULL, NULL, '2026-09-02 20:21:05.908', '2026-09-02 20:21:05.908', NULL, 'IMAGE', NULL);
INSERT INTO media (id, filename, "originalName", "mimeType", width, height, "sizeBytes", variants, "blurDataUrl", "altUz", "altRu", "uploadedById", "createdAt", "updatedAt", "durationSeconds", kind, "sourceUrl") VALUES ('cmtkjk0ds000f0kes13hrofpu', '2026-09/demo-tour-dubay-turi-a9193c48c474', 'demo-tour-dubay-turi.png', 'image/png', 1080, 1350, 131455, '{"wide": {"avif": "/uploads/2026-09/demo-tour-dubay-turi-a9193c48c474-wide.avif", "webp": "/uploads/2026-09/demo-tour-dubay-turi-a9193c48c474-wide.webp"}, "thumb": {"avif": "/uploads/2026-09/demo-tour-dubay-turi-a9193c48c474-thumb.avif", "webp": "/uploads/2026-09/demo-tour-dubay-turi-a9193c48c474-thumb.webp"}, "poster": {"avif": "/uploads/2026-09/demo-tour-dubay-turi-a9193c48c474-poster.avif", "webp": "/uploads/2026-09/demo-tour-dubay-turi-a9193c48c474-poster.webp"}, "square": {"avif": "/uploads/2026-09/demo-tour-dubay-turi-a9193c48c474-square.avif", "webp": "/uploads/2026-09/demo-tour-dubay-turi-a9193c48c474-square.webp"}}', 'data:image/webp;base64,UklGRmoAAABXRUJQVlA4IF4AAAAwBACdASoUABkAPxF4sVKsJyQiqA1RgCIJYwCqXA9ojSdAJ+pf9IbfigAA/uNJxzCuImCAmNFF+FjTg9nphQa1jFRsGAkrswDIaEXpve0QJekqfpGQB4//0iLdOAAA', 'Dubay — cho‘l va osmono‘parlar — 560$ dan', NULL, NULL, '2026-09-02 20:21:07.697', '2026-09-02 20:21:07.697', NULL, 'IMAGE', NULL);
INSERT INTO media (id, filename, "originalName", "mimeType", width, height, "sizeBytes", variants, "blurDataUrl", "altUz", "altRu", "uploadedById", "createdAt", "updatedAt", "durationSeconds", kind, "sourceUrl") VALUES ('cmtkjk1p2000g0keseo1kpuwy', '2026-09/demo-tour-turkiya-mojizalari-istanbul-ch-b69a913cc3fe', 'demo-tour-turkiya-mojizalari-istanbul-chanakkale-pamukkale-antalya.png', 'image/png', 1080, 1350, 108485, '{"wide": {"avif": "/uploads/2026-09/demo-tour-turkiya-mojizalari-istanbul-ch-b69a913cc3fe-wide.avif", "webp": "/uploads/2026-09/demo-tour-turkiya-mojizalari-istanbul-ch-b69a913cc3fe-wide.webp"}, "thumb": {"avif": "/uploads/2026-09/demo-tour-turkiya-mojizalari-istanbul-ch-b69a913cc3fe-thumb.avif", "webp": "/uploads/2026-09/demo-tour-turkiya-mojizalari-istanbul-ch-b69a913cc3fe-thumb.webp"}, "poster": {"avif": "/uploads/2026-09/demo-tour-turkiya-mojizalari-istanbul-ch-b69a913cc3fe-poster.avif", "webp": "/uploads/2026-09/demo-tour-turkiya-mojizalari-istanbul-ch-b69a913cc3fe-poster.webp"}, "square": {"avif": "/uploads/2026-09/demo-tour-turkiya-mojizalari-istanbul-ch-b69a913cc3fe-square.avif", "webp": "/uploads/2026-09/demo-tour-turkiya-mojizalari-istanbul-ch-b69a913cc3fe-square.webp"}}', 'data:image/webp;base64,UklGRmAAAABXRUJQVlA4IFQAAACwAwCdASoUABkAPxF8s1QsJ6QjKAqpgCIJQBUk2+A1QBXP/YL2gAD+4w5f3XwQ7ofT/sMZkDLQUnq3d4xvlk1CVXZFz7puUcSVzfTIPt9fSjwAAAA=', 'Turkiya mo‘jizalari: Istanbul • Chanakkale • Pamukkale • Antalya — 800$ dan', NULL, NULL, '2026-09-02 20:21:09.398', '2026-09-02 20:21:09.398', NULL, 'IMAGE', NULL);
INSERT INTO media (id, filename, "originalName", "mimeType", width, height, "sizeBytes", variants, "blurDataUrl", "altUz", "altRu", "uploadedById", "createdAt", "updatedAt", "durationSeconds", kind, "sourceUrl") VALUES ('cmtlmex8x000p0kp77qpnvds8', '2026-09/jasurbek-0c4a1947e863', 'jasurbek.jpg', 'image/jpeg', 640, 640, 252813, '{"wide": {"avif": "/uploads/2026-09/jasurbek-0c4a1947e863-wide.avif", "webp": "/uploads/2026-09/jasurbek-0c4a1947e863-wide.webp"}, "thumb": {"avif": "/uploads/2026-09/jasurbek-0c4a1947e863-thumb.avif", "webp": "/uploads/2026-09/jasurbek-0c4a1947e863-thumb.webp"}, "poster": {"avif": "/uploads/2026-09/jasurbek-0c4a1947e863-poster.avif", "webp": "/uploads/2026-09/jasurbek-0c4a1947e863-poster.webp"}, "square": {"avif": "/uploads/2026-09/jasurbek-0c4a1947e863-square.avif", "webp": "/uploads/2026-09/jasurbek-0c4a1947e863-square.webp"}}', 'data:image/webp;base64,UklGRu4AAABXRUJQVlA4IOIAAABwBQCdASoUABkAPxGAt1WsJ6UjKAgBgCIJbACdMy/lywnCbvrHq+1cTL4+986dToGE9bAoAP6/txieHt0sKIv3Y75YWh6Vdzn1uCkRKpObAtYbtFGur77D7xrOHSJi3tkUaHcEIwm7cBIay9GSSR5x9PPi4bK6RFY7Vm46jiUk83NfVS9XTRFV44hdXeSmHAi0T7PSX3DGwuieg1UbZBYh6YDx56kZHN4S+iXv5MxTr9rMIR3QP2BEUD7ZnI6JwrteGQFipgLDEe3k+lZDJcsbte6B1K4WN/aJg0TwCTZy54AA', 'jasurbek o''telayev', NULL, 'cmtcwnnwh00000k5e47f3vsnj', '2026-09-03 14:28:55.377', '2026-09-03 14:29:11.169', NULL, 'IMAGE', NULL);

-- ── Yo'nalishlar (9 ta) ──
INSERT INTO destinations (id, slug, "nameUz", "nameRu", "countryCode", "descriptionUz", "descriptionRu", "heroImageId", "sortOrder", "isActive", "seoTitleUz", "seoTitleRu", "seoDescriptionUz", "seoDescriptionRu", "createdAt", "updatedAt") VALUES ('cmtd3d7ri00040kuh2rsk1h90', 'vyetnam', 'Vyetnam', 'Вьетнам', 'VN', 'Nha Trang va Danang — oq qumli plyajlar, iliq okean va tropik tabiat. Vizasiz 15 kungacha.', 'Нячанг и Дананг — белые пляжи, тёплый океан и тропическая природа. Без визы до 15 дней.', 'cmtkjjkz400030kes7wa3o0lz', 4, true, 'Vyetnam turlari — Nha Trang, Danang 580$ dan', 'Туры во Вьетнам — Нячанг, Дананг от 580$', NULL, NULL, '2026-08-28 15:13:33.582', '2026-09-02 20:20:47.73');
INSERT INTO destinations (id, slug, "nameUz", "nameRu", "countryCode", "descriptionUz", "descriptionRu", "heroImageId", "sortOrder", "isActive", "seoTitleUz", "seoTitleRu", "seoDescriptionUz", "seoDescriptionRu", "createdAt", "updatedAt") VALUES ('cmtd3d7rk00050kuhfzmnisi4', 'dubay', 'Dubay (BAA)', 'Дубай (ОАЭ)', 'AE', 'Dubay — osmono‘par binolar, cho‘l safari va dunyodagi eng yirik savdo markazlari.', 'Дубай — небоскрёбы, сафари в пустыне и крупнейшие торговые центры мира.', 'cmtkjjm6u00040kesap5ywk44', 5, true, NULL, NULL, NULL, NULL, '2026-08-28 15:13:33.585', '2026-09-02 20:20:49.303');
INSERT INTO destinations (id, slug, "nameUz", "nameRu", "countryCode", "descriptionUz", "descriptionRu", "heroImageId", "sortOrder", "isActive", "seoTitleUz", "seoTitleRu", "seoDescriptionUz", "seoDescriptionRu", "createdAt", "updatedAt") VALUES ('cmtd3d7rm00060kuhl96jzqb8', 'xitoy', 'Xitoy', 'Китай', 'CN', 'Xaynan oroli va Guanchjou — tropik dam olish va shopping turlari.', 'Остров Хайнань и Гуанчжоу — тропический отдых и шоп-туры.', 'cmtkjjncy00050kes0zmffkhe', 6, true, NULL, NULL, NULL, NULL, '2026-08-28 15:13:33.586', '2026-09-02 20:20:50.82');
INSERT INTO destinations (id, slug, "nameUz", "nameRu", "countryCode", "descriptionUz", "descriptionRu", "heroImageId", "sortOrder", "isActive", "seoTitleUz", "seoTitleRu", "seoDescriptionUz", "seoDescriptionRu", "createdAt", "updatedAt") VALUES ('cmtd3d7r800010kuhy1i6sojv', 'turkiya', 'Turkiya', 'Турция', 'TR', 'Turkiya — tarix, dengiz va zamonaviylik uyg‘unlashgan yo‘nalish. Istanbulning tarixiy masjidlari, Antalyaning moviy sohillari, Pamukkalening oq teraslari va Kapadokiyaning shar sayohatlari bir sayohatda.', 'Турция — направление, где история, море и современность сливаются воедино. Исторические мечети Стамбула, лазурные пляжи Антальи, белые террасы Памуккале.', 'cmtkjjhdx00000kesijdxnywm', 1, true, 'Turkiyaga turlar — Istanbul, Antalya narxlari', 'Туры в Турцию — Стамбул, Анталия цены', 'Toshkentdan Turkiyaga turlar: Istanbul, Antalya, Pamukkale, Chanakkale. Aviachipta, mehmonxona va transfer kiritilgan. Narxlar 600$ dan.', 'Туры в Турцию из Ташкента: Стамбул, Анталия, Памуккале. Перелёт, отель и трансфер включены. Цены от 600$.', '2026-08-28 15:13:33.573', '2026-09-02 20:20:43.083');
INSERT INTO destinations (id, slug, "nameUz", "nameRu", "countryCode", "descriptionUz", "descriptionRu", "heroImageId", "sortOrder", "isActive", "seoTitleUz", "seoTitleRu", "seoDescriptionUz", "seoDescriptionRu", "createdAt", "updatedAt") VALUES ('cmtd3d7rg00020kuhr7upjg8p', 'ozarbayjon', 'Ozarbayjon', 'Азербайджан', 'AZ', 'Baku — Kaspiy bo‘yidagi zamonaviy poytaxt. Alanga minoralari, Icheri Sheher qadimiy shahri va Boulevard sayrgohi bilan mashhur.', 'Баку — современная столица на Каспии: Пламенные башни, старый город Ичери-шехер и знаменитый Приморский бульвар.', 'cmtkjjiml00010kes13kng20v', 2, true, 'Ozarbayjon (Baku) turlari — narxlar 275$ dan', 'Туры в Азербайджан (Баку) — цены от 275$', NULL, NULL, '2026-08-28 15:13:33.58', '2026-09-02 20:20:44.686');
INSERT INTO destinations (id, slug, "nameUz", "nameRu", "countryCode", "descriptionUz", "descriptionRu", "heroImageId", "sortOrder", "isActive", "seoTitleUz", "seoTitleRu", "seoDescriptionUz", "seoDescriptionRu", "createdAt", "updatedAt") VALUES ('cmtd3d7rm00070kuhdrzkrjhz', 'misr', 'Misr', 'Египет', 'EG', 'Sharm el-Shayx va Hurgada — Qizil dengiz, rifllar va all inclusive.', 'Шарм-эль-Шейх и Хургада — Красное море, рифы и «всё включено».', 'cmtkjjohh00060kesm3l3upl8', 7, true, NULL, NULL, NULL, NULL, '2026-08-28 15:13:33.587', '2026-09-02 20:20:52.279');
INSERT INTO destinations (id, slug, "nameUz", "nameRu", "countryCode", "descriptionUz", "descriptionRu", "heroImageId", "sortOrder", "isActive", "seoTitleUz", "seoTitleRu", "seoDescriptionUz", "seoDescriptionRu", "createdAt", "updatedAt") VALUES ('cmtd3d7rn00080kuhkug6jdct', 'tailand', 'Tailand', 'Таиланд', 'TH', 'Pattaya va Phuket — tropik orollar, ekskursiyalar va tungi hayot.', 'Паттайя и Пхукет — тропические острова, экскурсии и ночная жизнь.', 'cmtkjjpmx00070kesrqx71v34', 8, true, NULL, NULL, NULL, NULL, '2026-08-28 15:13:33.587', '2026-09-02 20:20:53.773');
INSERT INTO destinations (id, slug, "nameUz", "nameRu", "countryCode", "descriptionUz", "descriptionRu", "heroImageId", "sortOrder", "isActive", "seoTitleUz", "seoTitleRu", "seoDescriptionUz", "seoDescriptionRu", "createdAt", "updatedAt") VALUES ('cmtd3d7rn00090kuhzn90c1we', 'maldiv', 'Maldiv orollari', 'Мальдивы', 'MV', 'Suv ustidagi villalar, kristal okean va eng yaxshi asal oyi yo‘nalishi.', 'Виллы над водой, кристальный океан — лучшее направление для медового месяца.', 'cmtkjjqwy00080kesxe0ozbdt', 9, true, NULL, NULL, NULL, NULL, '2026-08-28 15:13:33.588', '2026-09-02 20:20:55.428');
INSERT INTO destinations (id, slug, "nameUz", "nameRu", "countryCode", "descriptionUz", "descriptionRu", "heroImageId", "sortOrder", "isActive", "seoTitleUz", "seoTitleRu", "seoDescriptionUz", "seoDescriptionRu", "createdAt", "updatedAt") VALUES ('cmtd3d7rh00030kuh4o5l83zr', 'gruziya', 'Gruziya', 'Грузия', 'GE', 'Tbilisi va Batumi — tog‘lar, Qora dengiz sohili va o‘ziga xos gruzin oshxonasi. Vizasiz sayohat.', 'Тбилиси и Батуми — горы, побережье Чёрного моря и знаменитая грузинская кухня. Без визы.', 'cmtlmex8x000p0kp77qpnvds8', 3, true, 'Gruziya turlari — Tbilisi va Batumi 635$ dan', 'Туры в Грузию — Тбилиси и Батуми от 635$', '', '', '2026-08-28 15:13:33.582', '2026-09-03 14:29:35.103');

-- ── Savol-javob (6 ta) ──
INSERT INTO faqs (id, "questionUz", "questionRu", "answerUz", "answerRu", "sortOrder", "isActive", "createdAt", "updatedAt") VALUES ('cmtcwnnxo000g0k5ek9bkt5rz', 'Tur narxiga nimalar kiradi?', 'Что входит в стоимость тура?', 'Odatda narxga aviachipta (borish-kelish), mehmonxonada yashash, tanlangan ovqatlanish turi, aeroport–mehmonxona transferi va tibbiy sug‘urta kiradi. Har bir turda aniq ro‘yxat tur sahifasida ko‘rsatilgan.', 'Обычно в стоимость входят авиабилеты (туда-обратно), проживание в отеле, выбранный тип питания, трансфер аэропорт–отель и медицинская страховка. Точный список указан на странице тура.', 1, true, '2026-08-28 12:05:43.788', '2026-08-28 12:05:43.788');
INSERT INTO faqs (id, "questionUz", "questionRu", "answerUz", "answerRu", "sortOrder", "isActive", "createdAt", "updatedAt") VALUES ('cmtcwnnxo000h0k5ep04bopd3', 'Turni qanday band qilaman?', 'Как забронировать тур?', 'Saytdagi formani to‘ldiring yoki +998 91 544 31 60 raqamiga qo‘ng‘iroq qiling. Menejerimiz 15 daqiqa ichida bog‘lanadi va barcha savollaringizga javob beradi.', 'Заполните форму на сайте или позвоните по номеру +998 91 544 31 60. Менеджер свяжется с вами в течение 15 минут.', 2, true, '2026-08-28 12:05:43.788', '2026-08-28 12:05:43.788');
INSERT INTO faqs (id, "questionUz", "questionRu", "answerUz", "answerRu", "sortOrder", "isActive", "createdAt", "updatedAt") VALUES ('cmtcwnnxo000i0k5e0o78pm6a', 'Oldindan qancha to‘lash kerak?', 'Какая нужна предоплата?', 'Odatda tur narxining 30% oldindan to‘lanadi, qolgani jo‘nashdan 7 kun oldin. Ba‘zi aksiyalarda shartlar boshqacha bo‘lishi mumkin — menejerdan aniqlashtiring.', 'Обычно предоплата составляет 30% от стоимости, остаток — за 7 дней до вылета. По некоторым акциям условия могут отличаться.', 3, true, '2026-08-28 12:05:43.788', '2026-08-28 12:05:43.788');
INSERT INTO faqs (id, "questionUz", "questionRu", "answerUz", "answerRu", "sortOrder", "isActive", "createdAt", "updatedAt") VALUES ('cmtcwnnxo000j0k5e098qznrn', '«Goryashiy tur» nima?', 'Что такое «горящий тур»?', 'Jo‘nash sanasiga kam vaqt qolgan va shu sababli chegirma bilan sotilayotgan tur. Joylar cheklangan, shuning uchun tez bron qilish kerak.', 'Это тур с ближайшей датой вылета, который продаётся со скидкой. Мест ограниченное количество, поэтому бронировать нужно быстро.', 4, true, '2026-08-28 12:05:43.788', '2026-08-28 12:05:43.788');
INSERT INTO faqs (id, "questionUz", "questionRu", "answerUz", "answerRu", "sortOrder", "isActive", "createdAt", "updatedAt") VALUES ('cmtcwnnxo000k0k5erndnkawq', 'Viza kerakmi?', 'Нужна ли виза?', 'O‘zbekiston fuqarolari uchun Turkiya, Gruziya, Ozarbayjon, Vyetnam, Malayziya va boshqa ko‘p davlatlarga viza kerak emas. AQSH, Angliya va Shengen uchun biz viza olishda to‘liq yordam beramiz.', 'Гражданам Узбекистана виза не нужна в Турцию, Грузию, Азербайджан, Вьетнам, Малайзию и ряд других стран. Для США, Великобритании и Шенгена мы полностью помогаем с оформлением.', 5, true, '2026-08-28 12:05:43.788', '2026-08-28 12:05:43.788');
INSERT INTO faqs (id, "questionUz", "questionRu", "answerUz", "answerRu", "sortOrder", "isActive", "createdAt", "updatedAt") VALUES ('cmtcwnnxo000l0k5etzzntazv', 'Bolalar uchun chegirma bormi?', 'Есть ли скидки для детей?', 'Ha. Aksariyat mehmonxonalarda 2 yoshgacha bolalar bepul, 2–12 yosh oralig‘ida esa sezilarli chegirma qo‘llaniladi. Aniq narxni menejer hisoblab beradi.', 'Да. В большинстве отелей дети до 2 лет — бесплатно, от 2 до 12 лет действует существенная скидка. Точную цену рассчитает менеджер.', 6, true, '2026-08-28 12:05:43.788', '2026-08-28 12:05:43.788');

-- ── Statik sahifalar (3 ta) ──
INSERT INTO pages (id, slug, "titleUz", "titleRu", "bodyUz", "bodyRu", "seoTitleUz", "seoTitleRu", "seoDescriptionUz", "seoDescriptionRu", "createdAt", "updatedAt") VALUES ('cmtcwnnxs000n0k5eflko28fq', 'ommaviy-oferta', 'Ommaviy oferta', 'Публичная оферта', '<p>Ushbu hujjat AYN TRAVEL va mijoz o‘rtasidagi turistik xizmatlar ko‘rsatish shartlarini belgilaydi.</p><h2>1. Umumiy qoidalar</h2><p>Saytdagi ariza formasini to‘ldirish orqali mijoz ushbu oferta shartlariga rozilik bildiradi.</p><h2>2. To‘lov tartibi</h2><p>Tur narxining 30% oldindan to‘lanadi, qolgan qismi jo‘nash sanasidan 7 kun oldin.</p><h2>3. Bekor qilish</h2><p>Bekor qilish shartlari har bir tur uchun alohida belgilanadi va shartnomada ko‘rsatiladi.</p>', '<p>Настоящий документ определяет условия оказания туристических услуг между AYN TRAVEL и клиентом.</p><h2>1. Общие положения</h2><p>Заполняя форму заявки на сайте, клиент соглашается с условиями настоящей оферты.</p><h2>2. Порядок оплаты</h2><p>Предоплата составляет 30% от стоимости тура, остаток — за 7 дней до вылета.</p><h2>3. Отмена</h2><p>Условия отмены определяются индивидуально для каждого тура и указываются в договоре.</p>', NULL, NULL, NULL, NULL, '2026-08-28 12:05:43.792', '2026-09-02 20:19:45.399');
INSERT INTO pages (id, slug, "titleUz", "titleRu", "bodyUz", "bodyRu", "seoTitleUz", "seoTitleRu", "seoDescriptionUz", "seoDescriptionRu", "createdAt", "updatedAt") VALUES ('cmtcwnnxt000o0k5e27x43qmp', 'maxfiylik-siyosati', 'Maxfiylik siyosati', 'Политика конфиденциальности', '<p>Biz sizning shaxsiy ma’lumotlaringizni himoya qilamiz va uchinchi shaxslarga bermaymiz.</p><h2>Qanday ma’lumot yig‘amiz</h2><p>Ariza formasi orqali: ism va telefon raqami. Bu ma’lumotlar faqat siz bilan bog‘lanish va xizmat ko‘rsatish uchun ishlatiladi.</p><h2>Saqlash muddati</h2><p>Ma’lumotlar xizmat ko‘rsatilgandan keyin 3 yil davomida saqlanadi.</p><h2>Cookie fayllari</h2><p>Sayt ish faoliyatini yaxshilash va statistika uchun cookie fayllardan foydalanadi.</p>', '<p>Мы защищаем ваши персональные данные и не передаём их третьим лицам.</p><h2>Какие данные мы собираем</h2><p>Через форму заявки: имя и номер телефона. Эти данные используются только для связи с вами и оказания услуг.</p><h2>Срок хранения</h2><p>Данные хранятся в течение 3 лет после оказания услуги.</p><h2>Файлы cookie</h2><p>Сайт использует cookie для улучшения работы и сбора статистики.</p>', NULL, NULL, NULL, NULL, '2026-08-28 12:05:43.793', '2026-09-02 20:19:45.399');
INSERT INTO pages (id, slug, "titleUz", "titleRu", "bodyUz", "bodyRu", "seoTitleUz", "seoTitleRu", "seoDescriptionUz", "seoDescriptionRu", "createdAt", "updatedAt") VALUES ('cmtcwnnxp000m0k5esmckh87m', 'biz-haqimizda', 'Biz haqimizda', 'О нас', '<p><strong>AYN TRAVEL</strong> — Toshkentdagi turizm kompaniyasi. Biz mijozlarimizga tayyor turlar, aviachiptalar, mehmonxona bronlari, viza yordami va transport xizmatlarini taklif qilamiz.</p><p>Instagram sahifamizda 25 000 dan ortiq obunachi bizning takliflarimizni kuzatib boradi. Har hafta yangi yo‘nalishlar va «goryashiy» turlar e’lon qilinadi.</p><h2>Nega aynan biz?</h2><ul><li>Har bir mijoz uchun individual yondashuv</li><li>Tezkor va sifatli xizmat</li><li>Shaffof narxlar — yashirin to‘lovlar yo‘q</li><li>Sayohat davomida 24/7 aloqa</li></ul><p>Ofisimiz: Toshkent shahri, Shota Rustaveli ko‘chasi, 136/2.</p>', '<p><strong>AYN TRAVEL</strong> — туристическая компания в Ташкенте. Мы предлагаем готовые туры, авиабилеты, бронирование отелей, визовую поддержку и транспортные услуги.</p><p>За нашими предложениями следят более 25 000 подписчиков в Instagram. Каждую неделю — новые направления и горящие туры.</p><h2>Почему мы?</h2><ul><li>Индивидуальный подход к каждому клиенту</li><li>Быстрый и качественный сервис</li><li>Прозрачные цены — без скрытых платежей</li><li>Связь 24/7 во время поездки</li></ul><p>Наш офис: г. Ташкент, улица Шота Руставели, 136/2.</p>', NULL, NULL, NULL, NULL, '2026-08-28 12:05:43.79', '2026-09-02 20:35:54.297');

-- ── Blog maqolalari (3 ta) ──
INSERT INTO posts (id, slug, "titleUz", "titleRu", "excerptUz", "excerptRu", "bodyUz", "bodyRu", "coverImageId", category, tags, "readingTime", status, "publishedAt", "viewCount", "seoTitleUz", "seoTitleRu", "seoDescriptionUz", "seoDescriptionRu", "createdAt", "updatedAt") VALUES ('cmtd3d7sx000z0kuh66zc9vkl', 'ozbekistonliklar-uchun-vizasiz-davlatlar-2026', 'O‘zbekistonliklar uchun vizasiz davlatlar — 2026 yil ro‘yxati', 'Безвизовые страны для граждан Узбекистана — список 2026 года', 'O‘zbekiston pasporti bilan vizasiz yoki soddalashtirilgan tartibda borish mumkin bo‘lgan davlatlar va ularda qancha turish mumkinligi.', 'Страны, куда можно поехать с паспортом Узбекистана без визы или по упрощённой процедуре, и сроки пребывания.', '<p>O‘zbekiston fuqarolari 2026 yil holatiga ko‘ra 60 dan ortiq davlatga vizasiz sayohat qila oladi. Quyida eng ommabop yo‘nalishlar keltirilgan.</p><h2>Vizasiz — 30 kungacha</h2><ul><li><strong>Turkiya</strong> — 30 kun</li><li><strong>Gruziya</strong> — 30 kun</li><li><strong>Ozarbayjon</strong> — 10 kun</li><li><strong>Malayziya</strong> — 30 kun</li><li><strong>Vyetnam</strong> — 15 kun</li></ul><h2>Elektron viza (e-visa)</h2><ul><li><strong>BAA (Dubay)</strong> — onlayn rasmiylashtiriladi, 2–3 kun</li><li><strong>Misr</strong> — kelganda yoki onlayn</li><li><strong>Tailand</strong> — 30 kungacha vizasiz</li></ul><p>Aniq shartlar o‘zgarib turishi mumkin. Jo‘nashdan oldin menejerimiz bilan tekshiring: <a href="tel:+998915443160">+998 91 544 31 60</a>.</p>', '<p>По состоянию на 2026 год граждане Узбекистана могут посещать более 60 стран без визы. Ниже — самые популярные направления.</p><h2>Без визы — до 30 дней</h2><ul><li><strong>Турция</strong> — 30 дней</li><li><strong>Грузия</strong> — 30 дней</li><li><strong>Азербайджан</strong> — 10 дней</li><li><strong>Малайзия</strong> — 30 дней</li><li><strong>Вьетнам</strong> — 15 дней</li></ul><h2>Электронная виза</h2><ul><li><strong>ОАЭ (Дубай)</strong> — оформляется онлайн за 2–3 дня</li><li><strong>Египет</strong> — по прилёте или онлайн</li><li><strong>Таиланд</strong> — без визы до 30 дней</li></ul>', NULL, 'Foydali', '{viza,maslahat,hujjatlar}', 1, 'PUBLISHED', '2026-09-02 20:19:45.421', 9, 'Vizasiz davlatlar 2026 — O‘zbekiston pasporti bilan qayerga borish mumkin', NULL, NULL, NULL, '2026-08-28 15:13:33.633', '2026-09-02 20:38:02.247');
INSERT INTO posts (id, slug, "titleUz", "titleRu", "excerptUz", "excerptRu", "bodyUz", "bodyRu", "coverImageId", category, tags, "readingTime", status, "publishedAt", "viewCount", "seoTitleUz", "seoTitleRu", "seoDescriptionUz", "seoDescriptionRu", "createdAt", "updatedAt") VALUES ('cmtcwnnym00160k5edw89gpvv', 'goryashiy-tur-nima-va-qanday-tanlash-kerak', '«Goryashiy tur» nima va uni qanday to‘g‘ri tanlash kerak?', 'Что такое «горящий тур» и как его правильно выбрать?', 'Chegirmali turlar qanday paydo bo‘ladi, ularda nimaga e’tibor berish kerak va qachon bron qilgan ma’qul.', 'Откуда берутся туры со скидкой, на что обращать внимание и когда лучше бронировать.', '<p>Goryashiy tur — jo‘nash sanasiga 3–14 kun qolganda sotiladigan, narxi 20–40% gacha arzon bo‘lgan paket.</p><h2>Nega arzon?</h2><p>Tur operator chartered reyslardagi va mehmonxonalardagi bo‘sh joylarni sotib bo‘lmasa, ularni zararga ketkazgandan ko‘ra chegirma bilan sotgani foydali.</p><h2>Nimaga e’tibor berish kerak</h2><ul><li>Mehmonxonaning aniq nomi va yulduzi ko‘rsatilganmi</li><li>Ovqatlanish turi (BB, HB, AI)</li><li>Transfer narxga kiradimi</li><li>Pasport amal qilish muddati — kamida 6 oy</li></ul><p>Bizning goryashiy takliflarimiz Telegram kanalimizda birinchi bo‘lib e’lon qilinadi: <a href="https://t.me/ayn_travel">t.me/ayn_travel</a></p>', '<p>Горящий тур — это пакет, который продаётся за 3–14 дней до вылета со скидкой 20–40%.</p><h2>Почему дешевле?</h2><p>Туроператору выгоднее продать оставшиеся места со скидкой, чем потерять их полностью.</p><h2>На что смотреть</h2><ul><li>Указаны ли название и категория отеля</li><li>Тип питания (BB, HB, AI)</li><li>Входит ли трансфер</li><li>Срок действия паспорта — минимум 6 месяцев</li></ul>', NULL, 'Maslahat', '{goryashiy,chegirma,maslahat}', 1, 'PUBLISHED', '2026-09-02 20:19:45.425', 16, NULL, NULL, NULL, NULL, '2026-08-28 12:05:43.822', '2026-09-02 20:38:02.536');
INSERT INTO posts (id, slug, "titleUz", "titleRu", "excerptUz", "excerptRu", "bodyUz", "bodyRu", "coverImageId", category, tags, "readingTime", status, "publishedAt", "viewCount", "seoTitleUz", "seoTitleRu", "seoDescriptionUz", "seoDescriptionRu", "createdAt", "updatedAt") VALUES ('cmtcwnnyo00170k5e4ff5z16f', 'birinchi-marta-chet-elga-chiqayotganlar-uchun-yodnoma', 'Birinchi marta chet elga chiqayotganlar uchun yodnoma', 'Памятка для тех, кто впервые едет за границу', 'Hujjatlar, bagaj qoidalari, valyuta, sug‘urta va aeroportdagi tartib — bilishingiz kerak bo‘lgan hamma narsa.', 'Документы, правила багажа, валюта, страховка и порядок в аэропорту — всё, что нужно знать.', '<h2>Hujjatlar</h2><ul><li>Xorijiy pasport — amal qilish muddati sayohat tugagach kamida 6 oy</li><li>Aviachipta (elektron nusxa yetarli)</li><li>Mehmonxona bronu</li><li>Tibbiy sug‘urta polisi</li></ul><h2>Bagaj</h2><p>Odatda 20 kg yuk + 7 kg qo‘l bagaji. Qo‘l bagajida 100 ml dan ortiq suyuqlik olib o‘tish taqiqlanadi.</p><h2>Aeroportga qachon kelish kerak</h2><p>Xalqaro reyslarga jo‘nashdan <strong>3 soat</strong> oldin.</p>', '<h2>Документы</h2><ul><li>Загранпаспорт — срок действия минимум 6 месяцев после поездки</li><li>Авиабилет (достаточно электронной копии)</li><li>Бронь отеля</li><li>Полис медицинского страхования</li></ul><h2>Багаж</h2><p>Обычно 20 кг багажа + 7 кг ручной клади. Жидкости более 100 мл в ручной клади запрещены.</p><h2>Когда приезжать в аэропорт</h2><p>За <strong>3 часа</strong> до международного рейса.</p>', NULL, 'Foydali', '{yodnoma,aeroport,bagaj}', 1, 'PUBLISHED', '2026-09-02 20:19:45.426', 23, NULL, NULL, NULL, NULL, '2026-08-28 12:05:43.824', '2026-09-03 14:46:42.5');

-- ── Xizmatlar (6 ta) ──
INSERT INTO services (id, slug, icon, "titleUz", "titleRu", "descriptionUz", "descriptionRu", "sortOrder", "isActive", "createdAt", "updatedAt") VALUES ('cmtcwnnxf000a0k5ea269s7hq', 'turlar', 'plane', 'Tayyor turlar', 'Готовые туры', 'Aviachipta, mehmonxona, transfer va sug‘urta kiritilgan tayyor paketlar. Har hafta yangi yo‘nalishlar va «goryashiy» takliflar.', 'Готовые пакеты с перелётом, отелем, трансфером и страховкой. Каждую неделю новые направления и горящие предложения.', 1, true, '2026-08-28 12:05:43.78', '2026-09-02 20:19:45.391');
INSERT INTO services (id, slug, icon, "titleUz", "titleRu", "descriptionUz", "descriptionRu", "sortOrder", "isActive", "createdAt", "updatedAt") VALUES ('cmtcwnnxi000b0k5e8rmuu9rh', 'aviachiptalar', 'ticket', 'Aviachiptalar', 'Авиабилеты', 'Dunyoning istalgan nuqtasiga chiptalar. Eng qulay narxni topamiz va bron qilamiz.', 'Билеты в любую точку мира. Найдём самый выгодный тариф и оформим бронирование.', 2, true, '2026-08-28 12:05:43.783', '2026-09-02 20:19:45.392');
INSERT INTO services (id, slug, icon, "titleUz", "titleRu", "descriptionUz", "descriptionRu", "sortOrder", "isActive", "createdAt", "updatedAt") VALUES ('cmtcwnnxj000c0k5eltm9qpdo', 'mehmonxonalar', 'hotel', 'Mehmonxonalar', 'Отели', '3★ dan 5★ gacha mehmonxonalar. Joylashuvi va sharhlarini tekshirib, sizga mosini tanlaymiz.', 'Отели от 3★ до 5★. Проверим расположение и отзывы, подберём подходящий вариант.', 3, true, '2026-08-28 12:05:43.784', '2026-09-02 20:19:45.392');
INSERT INTO services (id, slug, icon, "titleUz", "titleRu", "descriptionUz", "descriptionRu", "sortOrder", "isActive", "createdAt", "updatedAt") VALUES ('cmtcwnnxk000d0k5e7dxf6ouv', 'viza', 'passport', 'Viza yordami', 'Визовая поддержка', 'AQSH, Angliya, Shengen va boshqa davlatlar vizasi. Anketa to‘ldirish, hujjatlar va konsultatsiya — bo‘sh pasport bilan ham.', 'Визы США, Великобритании, Шенген и другие. Заполнение анкеты, документы и консультация — даже с пустым паспортом.', 4, true, '2026-08-28 12:05:43.784', '2026-09-02 20:19:45.392');
INSERT INTO services (id, slug, icon, "titleUz", "titleRu", "descriptionUz", "descriptionRu", "sortOrder", "isActive", "createdAt", "updatedAt") VALUES ('cmtcwnnxl000e0k5ec2fnm63s', 'transport', 'bus', 'Transport xizmati', 'Транспортные услуги', 'Aeroportga transfer, shahar bo‘ylab va guruhlar uchun mikroavtobus xizmati.', 'Трансфер в аэропорт, поездки по городу и микроавтобусы для групп.', 5, true, '2026-08-28 12:05:43.785', '2026-09-02 20:19:45.393');
INSERT INTO services (id, slug, icon, "titleUz", "titleRu", "descriptionUz", "descriptionRu", "sortOrder", "isActive", "createdAt", "updatedAt") VALUES ('cmtcwnnxl000f0k5elnza2dl0', 'korporativ', 'briefcase', 'Korporativ sayohatlar', 'Корпоративные поездки', 'Jamoa uchun tur, biznes safar va konferensiyalarga tashkiliy yordam.', 'Туры для коллектива, деловые поездки и организация участия в конференциях.', 6, true, '2026-08-28 12:05:43.786', '2026-09-02 20:19:45.393');

-- ── Sayt sozlamalari — telefonlar, linklar, manzil, hero matni (22 ta) ──
INSERT INTO site_settings (key, value, "updatedAt") VALUES ('phonePrimary', '"+998915443160"', '2026-09-02 20:19:45.369');
INSERT INTO site_settings (key, value, "updatedAt") VALUES ('phoneSecondary', '"+998772696767"', '2026-09-02 20:19:45.375');
INSERT INTO site_settings (key, value, "updatedAt") VALUES ('managerMadinaPhone', '"+998772696767"', '2026-09-02 20:19:45.376');
INSERT INTO site_settings (key, value, "updatedAt") VALUES ('managerUmidPhone', '"+998915443160"', '2026-09-02 20:19:45.376');
INSERT INTO site_settings (key, value, "updatedAt") VALUES ('telegramChannel', '"https://t.me/ayn_travel"', '2026-09-02 20:19:45.377');
INSERT INTO site_settings (key, value, "updatedAt") VALUES ('telegramAdmin', '"https://t.me/ayntravel01"', '2026-09-02 20:19:45.377');
INSERT INTO site_settings (key, value, "updatedAt") VALUES ('telegramManagerMadina', '"https://t.me/ayntravelmanager"', '2026-09-02 20:19:45.377');
INSERT INTO site_settings (key, value, "updatedAt") VALUES ('telegramManagerUmid', '"https://t.me/ayntravel01"', '2026-09-02 20:19:45.378');
INSERT INTO site_settings (key, value, "updatedAt") VALUES ('instagram', '"https://www.instagram.com/ayntravel.uz/"', '2026-09-02 20:19:45.378');
INSERT INTO site_settings (key, value, "updatedAt") VALUES ('email', '"info@ayntravel.uz"', '2026-09-02 20:19:45.378');
INSERT INTO site_settings (key, value, "updatedAt") VALUES ('addressUz', '"Toshkent sh., Shota Rustaveli ko‘chasi, 136/2"', '2026-09-02 20:19:45.379');
INSERT INTO site_settings (key, value, "updatedAt") VALUES ('addressRu', '"г. Ташкент, улица Шота Руставели, 136/2"', '2026-09-02 20:19:45.379');
INSERT INTO site_settings (key, value, "updatedAt") VALUES ('mapUrl', '"https://yandex.uz/maps/-/CTHanBlc"', '2026-09-02 20:19:45.381');
INSERT INTO site_settings (key, value, "updatedAt") VALUES ('mapEmbedUrl', '""', '2026-09-02 20:19:45.381');
INSERT INTO site_settings (key, value, "updatedAt") VALUES ('workingHoursUz', '"Dushanba–Shanba: 09:00–18:00"', '2026-09-02 20:19:45.382');
INSERT INTO site_settings (key, value, "updatedAt") VALUES ('workingHoursRu', '"Понедельник–Суббота: 09:00–18:00"', '2026-09-02 20:19:45.382');
INSERT INTO site_settings (key, value, "updatedAt") VALUES ('heroTitleUz', '"Sayohatingizni biz bilan boshlang"', '2026-09-02 20:19:45.382');
INSERT INTO site_settings (key, value, "updatedAt") VALUES ('heroTitleRu', '"Начните путешествие с нами"', '2026-09-02 20:19:45.382');
INSERT INTO site_settings (key, value, "updatedAt") VALUES ('heroSubtitleUz', '"Turlar • Aviachiptalar • Mehmonxonalar • Viza yordami"', '2026-09-02 20:19:45.383');
INSERT INTO site_settings (key, value, "updatedAt") VALUES ('heroSubtitleRu', '"Туры • Авиабилеты • Отели • Визовая поддержка"', '2026-09-02 20:19:45.383');
INSERT INTO site_settings (key, value, "updatedAt") VALUES ('stats', '{"toursCount": 120, "yearsCount": 5, "clientsCount": 5000, "followersCount": 25900}', '2026-09-02 20:19:45.383');
INSERT INTO site_settings (key, value, "updatedAt") VALUES ('defaultOgImage', 'null', '2026-09-02 20:19:45.383');

-- ── Turlar (7 ta) ──
INSERT INTO tours (id, slug, "titleUz", "titleRu", "summaryUz", "summaryRu", "bodyUz", "bodyRu", "destinationId", "priceFrom", "extraFee", currency, "departureDate", "returnDate", "durationDays", "durationNights", "hotelStars", "mealPlan", "citiesUz", "citiesRu", includes, excludes, "posterImageId", "isHot", "isFeatured", "seatsLeft", status, "publishedAt", "viewCount", "seoTitleUz", "seoTitleRu", "seoDescriptionUz", "seoDescriptionRu", "createdAt", "updatedAt") VALUES ('cmtkji8w9000w0ka4i18ecl56', 'antalya-goryashiy-tur', 'Antalya — dengiz bo‘yida dam olish', 'Анталия — отдых у моря', 'Turkiyaning eng mashhur kurorti: moviy dengiz, hashamatli mehmonxonalar va quyoshli plyajlar. Cheklangan joylar!', 'Самый популярный курорт Турции: лазурное море, роскошные отели и солнечные пляжи. Мест ограничено!', NULL, NULL, 'cmtd3d7r800010kuhy1i6sojv', 600.00, NULL, 'USD', '2026-09-20 00:00:00', NULL, 7, 6, 5, 'AI', '{Antalya}', '{Анталия}', '{"Toshkent–Antalya–Toshkent aviachiptasi","6 kecha 5★ mehmonxonada","Hammasi kiritilgan (All Inclusive)","Aeroport transferi","Tibbiy sug‘urta"}', '{Ekskursiyalar,"Shaxsiy xarajatlar"}', 'cmtkjjz04000e0kesw7kc4kll', true, true, 4, 'DRAFT', NULL, 3, 'Antalya goryashiy tur 600$ — All Inclusive 5★', NULL, NULL, NULL, '2026-09-02 20:19:45.417', '2026-09-03 14:28:04.549');
INSERT INTO tours (id, slug, "titleUz", "titleRu", "summaryUz", "summaryRu", "bodyUz", "bodyRu", "destinationId", "priceFrom", "extraFee", currency, "departureDate", "returnDate", "durationDays", "durationNights", "hotelStars", "mealPlan", "citiesUz", "citiesRu", includes, excludes, "posterImageId", "isHot", "isFeatured", "seatsLeft", status, "publishedAt", "viewCount", "seoTitleUz", "seoTitleRu", "seoDescriptionUz", "seoDescriptionRu", "createdAt", "updatedAt") VALUES ('cmtkji8w5000s0ka4ksccb2eu', 'istanbul-tarix-va-zamonaviylik', 'Istanbul — tarix va zamonaviylik uyg‘unligi', 'Стамбул — гармония истории и современности', 'Ayasofya, Sultonahmad, Topqopi saroyi va Bosfor bo‘g‘ozi bo‘ylab kruiz. Ikki qit‘ani bir kunda ko‘ring.', 'Айя-София, Султанахмет, дворец Топкапы и круиз по Босфору. Увидьте два континента за один день.', NULL, NULL, 'cmtd3d7r800010kuhy1i6sojv', 728.00, NULL, 'USD', '2026-09-03 00:00:00', NULL, 5, 4, 4, 'BB', '{Istanbul}', '{Стамбул}', '{"Toshkent–Istanbul–Toshkent aviachiptasi","4 kecha mehmonxonada yashash",Nonushta,"Aeroport transferi","Tibbiy sug‘urta"}', '{Ekskursiyalar,"Muzey chiptalari"}', 'cmtkjjuyk000b0kesn15rpxtb', false, true, 15, 'PUBLISHED', '2026-09-03 14:31:09.823', 3, 'Istanbul turi 728$ — 3-sentyabr jo‘nash', NULL, NULL, NULL, '2026-09-02 20:19:45.413', '2026-09-03 14:31:09.824');
INSERT INTO tours (id, slug, "titleUz", "titleRu", "summaryUz", "summaryRu", "bodyUz", "bodyRu", "destinationId", "priceFrom", "extraFee", currency, "departureDate", "returnDate", "durationDays", "durationNights", "hotelStars", "mealPlan", "citiesUz", "citiesRu", includes, excludes, "posterImageId", "isHot", "isFeatured", "seatsLeft", status, "publishedAt", "viewCount", "seoTitleUz", "seoTitleRu", "seoDescriptionUz", "seoDescriptionRu", "createdAt", "updatedAt") VALUES ('cmtkji8w3000q0ka44k17uerv', 'nha-trang-vyetnam-turi', 'Nha Trang — tropik jannatga sayohat', 'Нячанг — путешествие в тропический рай', 'Oppoq plyajlar, moviy dengiz, tropik tabiat va mazali taomlar. Vyetnamning eng mashhur kurorti.', 'Белоснежные пляжи, лазурное море, тропическая природа и вкусная кухня. Самый популярный курорт Вьетнама.', NULL, NULL, 'cmtd3d7ri00040kuh2rsk1h90', 580.00, NULL, 'USD', '2026-09-05 00:00:00', NULL, 8, 7, 4, 'BB', '{"Nha Trang"}', '{Нячанг}', '{"Aviachipta (borish-kelish)","7 kecha mehmonxonada yashash",Nonushta,"Aeroport transferi","Tibbiy sug‘urta"}', '{Ekskursiyalar,"Vizа yig‘imi (agar kerak bo‘lsa)"}', 'cmtkjjwbm000c0kesqy94mpq3', true, true, 10, 'DRAFT', NULL, 3, 'Nha Trang (Vyetnam) turi 580$ — 5-sentyabr', NULL, NULL, NULL, '2026-09-02 20:19:45.412', '2026-09-03 14:28:02.334');
INSERT INTO tours (id, slug, "titleUz", "titleRu", "summaryUz", "summaryRu", "bodyUz", "bodyRu", "destinationId", "priceFrom", "extraFee", currency, "departureDate", "returnDate", "durationDays", "durationNights", "hotelStars", "mealPlan", "citiesUz", "citiesRu", includes, excludes, "posterImageId", "isHot", "isFeatured", "seatsLeft", status, "publishedAt", "viewCount", "seoTitleUz", "seoTitleRu", "seoDescriptionUz", "seoDescriptionRu", "createdAt", "updatedAt") VALUES ('cmtkji8w7000u0ka4nx6zm3vo', 'xitoy-xaynan-oroli', 'Xitoy — Xaynan oroli', 'Китай — остров Хайнань', 'Xitoyning «Gavayisi»: tropik iqlim, issiq okean va mineral buloqlar.', 'Китайские «Гавайи»: тропический климат, тёплый океан и минеральные источники.', NULL, NULL, 'cmtd3d7rm00060kuhl96jzqb8', 640.00, NULL, 'USD', '2026-09-15 00:00:00', NULL, 8, 7, 4, 'BB', '{Sanya,Xaynan}', '{Санья,Хайнань}', '{Aviachipta,"7 kecha yashash",Nonushta,Transfer,Sug‘urta}', '{Ekskursiyalar}', 'cmtkjjxmd000d0kes0r0i5p70', true, false, 9, 'DRAFT', NULL, 3, NULL, NULL, NULL, NULL, '2026-09-02 20:19:45.415', '2026-09-03 14:28:01.735');
INSERT INTO tours (id, slug, "titleUz", "titleRu", "summaryUz", "summaryRu", "bodyUz", "bodyRu", "destinationId", "priceFrom", "extraFee", currency, "departureDate", "returnDate", "durationDays", "durationNights", "hotelStars", "mealPlan", "citiesUz", "citiesRu", includes, excludes, "posterImageId", "isHot", "isFeatured", "seatsLeft", status, "publishedAt", "viewCount", "seoTitleUz", "seoTitleRu", "seoDescriptionUz", "seoDescriptionRu", "createdAt", "updatedAt") VALUES ('cmtkji8wa000y0ka4ryjsvvcq', 'dubay-turi', 'Dubay — cho‘l va osmono‘parlar', 'Дубай — пустыня и небоскрёбы', 'Burj Khalifa, cho‘l safari, Dubai Mall va Palm Jumeirah. Shopping va zamonaviy hashamat.', 'Бурдж-Халифа, сафари в пустыне, Dubai Mall и Пальма Джумейра. Шопинг и современная роскошь.', NULL, NULL, 'cmtd3d7rk00050kuhfzmnisi4', 560.00, NULL, 'USD', '2026-10-05 00:00:00', NULL, 6, 5, 4, 'BB', '{Dubay}', '{Дубай}', '{Aviachipta,"5 kecha yashash",Nonushta,Transfer,Sug‘urta}', '{Ekskursiyalar,"Viza yig‘imi"}', 'cmtkjk0ds000f0kes13hrofpu', false, true, 11, 'DRAFT', NULL, 3, NULL, NULL, NULL, NULL, '2026-09-02 20:19:45.419', '2026-09-03 14:28:03.152');
INSERT INTO tours (id, slug, "titleUz", "titleRu", "summaryUz", "summaryRu", "bodyUz", "bodyRu", "destinationId", "priceFrom", "extraFee", currency, "departureDate", "returnDate", "durationDays", "durationNights", "hotelStars", "mealPlan", "citiesUz", "citiesRu", includes, excludes, "posterImageId", "isHot", "isFeatured", "seatsLeft", status, "publishedAt", "viewCount", "seoTitleUz", "seoTitleRu", "seoDescriptionUz", "seoDescriptionRu", "createdAt", "updatedAt") VALUES ('cmtkji8vz000m0ka4ddk4s52a', 'ozarbayjon-baku-turi', 'Ozarbayjon — Baku sayohati', 'Азербайджан — путешествие в Баку', 'Kaspiy bo‘yidagi Baku: Alanga minoralari, Icheri Sheher qadimiy shahri va Boulevard. 3★, 4★ va 5★ mehmonxonalar tanlovi.', 'Баку на Каспии: Пламенные башни, старый город Ичери-шехер и Приморский бульвар. На выбор отели 3★, 4★ и 5★.', '<h2>Mehmonxona tanlovi</h2><ul><li><strong>3★ mehmonxona — 275$</strong></li><li><strong>4★ mehmonxona — 300$</strong></li><li><strong>5★ mehmonxona — 317$</strong></li></ul><p>Narxlar 1 kishi uchun, 2 kishilik joylashuv asosida.</p>', '<h2>Выбор отеля</h2><ul><li><strong>Отель 3★ — 275$</strong></li><li><strong>Отель 4★ — 300$</strong></li><li><strong>Отель 5★ — 317$</strong></li></ul><p>Цены за 1 человека при двухместном размещении.</p>', 'cmtd3d7rg00020kuhr7upjg8p', 275.00, NULL, 'USD', '2026-08-31 00:00:00', NULL, 4, 3, 3, 'BB', '{Baku}', '{Баку}', '{"Toshkent–Baku–Toshkent aviachiptasi","3 kecha mehmonxonada yashash",Nonushta,"Aeroport transferi","Tibbiy sug‘urta"}', '{Ekskursiyalar,"Tushlik va kechki ovqat"}', 'cmtkjjs9t00090kesy823nvuo', true, true, 6, 'DRAFT', NULL, 3, 'Baku turi 275$ dan — 31-avgust jo‘nash', NULL, NULL, NULL, '2026-09-02 20:19:45.407', '2026-09-03 14:28:00.468');
INSERT INTO tours (id, slug, "titleUz", "titleRu", "summaryUz", "summaryRu", "bodyUz", "bodyRu", "destinationId", "priceFrom", "extraFee", currency, "departureDate", "returnDate", "durationDays", "durationNights", "hotelStars", "mealPlan", "citiesUz", "citiesRu", includes, excludes, "posterImageId", "isHot", "isFeatured", "seatsLeft", status, "publishedAt", "viewCount", "seoTitleUz", "seoTitleRu", "seoDescriptionUz", "seoDescriptionRu", "createdAt", "updatedAt") VALUES ('cmtkji8vs000k0ka4xmuhpvve', 'turkiya-mojizalari-istanbul-chanakkale-pamukkale-antalya', 'Turkiya mo‘jizalari: Istanbul • Chanakkale • Pamukkale • Antalya', 'Чудеса Турции: Стамбул • Чанаккале • Памуккале • Анталия', '7 kun / 6 kecha davomida Turkiyaning to‘rt eng go‘zal shahri: Istanbulning tarixiy markazi, Chanakkaledagi Troya oti, Pamukkalening oq teraslari va Antalyaning moviy sohili.', '7 дней / 6 ночей по четырём самым красивым городам Турции: исторический центр Стамбула, Троянский конь в Чанаккале, белые террасы Памуккале и лазурный берег Антальи.', NULL, NULL, 'cmtd3d7r800010kuhy1i6sojv', 800.00, 250.00, 'USD', '2026-10-28 00:00:00', NULL, 7, 6, 4, 'BB', '{Istanbul,Chanakkale,Pamukkale,Antalya}', '{Стамбул,Чанаккале,Памуккале,Анталия}', '{"Toshkent–Istanbul–Toshkent aviachiptasi","6 kecha mehmonxonada yashash (2 kishilik xonada)","Nonushta (BB)","Shaharlararo transport","Rus/o‘zbek tilida gid","Tibbiy sug‘urta"}', '{"Qo‘shimcha to‘lov 250$","Muzeylarga kirish chiptalari","Shaxsiy xarajatlar"}', 'cmtkjk1p2000g0keseo1kpuwy', false, true, 12, 'DRAFT', NULL, 3, 'Turkiya mo‘jizalari turi — 7 kun 800$ | 28-oktabr', NULL, 'Istanbul, Chanakkale, Pamukkale va Antalya bo‘ylab 7 kunlik tur. 28-oktabr jo‘nash, narx 800$ dan. Aviachipta, mehmonxona va transfer kiritilgan.', NULL, '2026-09-02 20:19:45.401', '2026-09-03 14:28:01.084');

-- ── Mijoz fikrlari (4 ta) ──
INSERT INTO testimonials (id, "clientName", "textUz", "textRu", rating, "photoId", "tourId", "isPublished", "sortOrder", "createdAt", "updatedAt") VALUES ('cmtdfi5pg00120kbzg4rkslbw', 'Dilnoza Karimova', 'Turkiyaga oilamiz bilan bordik. Hamma narsa aytilganidek bo‘ldi — mehmonxona ham, transfer ham. Madina opa har bir savolimizga sabr bilan javob berdi. Rahmat!', 'Ездили в Турцию всей семьёй. Всё было как обещали — и отель, и трансфер. Спасибо Мадине за терпение и ответы на все вопросы!', 5, NULL, NULL, true, 1, '2026-08-28 20:53:19.588', '2026-08-28 20:53:19.588');
INSERT INTO testimonials (id, "clientName", "textUz", "textRu", rating, "photoId", "tourId", "isPublished", "sortOrder", "createdAt", "updatedAt") VALUES ('cmtdfi5pg00130kbz1a2a2a1f', 'Sardor Yusupov', 'Goryashiy tur bilan Antalyaga uchdim. Narxi juda qulay chiqdi, 5 yulduzli mehmonxona all inclusive. Keyingi safar ham shu yerdan olaman.', 'Улетел в Анталию по горящему туру. Вышло очень выгодно — 5 звёзд, всё включено. В следующий раз тоже к ним.', 5, NULL, NULL, true, 2, '2026-08-28 20:53:19.588', '2026-08-28 20:53:19.588');
INSERT INTO testimonials (id, "clientName", "textUz", "textRu", rating, "photoId", "tourId", "isPublished", "sortOrder", "createdAt", "updatedAt") VALUES ('cmtdfi5pg00140kbzobiqm2nb', 'Nilufar Rahimova', 'Angliya vizasini olishda yordam berishdi. Anketani to‘g‘ri to‘ldirib, hujjatlarni tayyorlab berishdi — birinchi urinishda oldim.', 'Помогли получить визу в Великобританию. Правильно заполнили анкету, подготовили документы — получила с первого раза.', 5, NULL, NULL, true, 3, '2026-08-28 20:53:19.588', '2026-08-28 20:53:19.588');
INSERT INTO testimonials (id, "clientName", "textUz", "textRu", rating, "photoId", "tourId", "isPublished", "sortOrder", "createdAt", "updatedAt") VALUES ('cmtdfi5pg00150kbztfeb6i8n', 'Jamshid Tursunov', 'Baku turi ajoyib o‘tdi. Menejer Umid aka doim aloqada bo‘ldi, hatto u yerda ham savollarimizga javob berdi.', 'Тур в Баку прошёл отлично. Менеджер Умид всегда был на связи, отвечал на вопросы даже на месте.', 5, NULL, NULL, true, 4, '2026-08-28 20:53:19.588', '2026-08-28 20:53:19.588');


-- ═══════════════════════════════════════════════════════════════
--  4. Kalitlar va yagonalik cheklovlari
--
--  Ma'lumotdan KEYIN qo'shiladi: yuklash tezroq bo'ladi va
--  INSERT'lar tartibi ahamiyatsiz bo'lib qoladi.
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE ONLY audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);
ALTER TABLE ONLY destinations
    ADD CONSTRAINT destinations_pkey PRIMARY KEY (id);
ALTER TABLE ONLY faqs
    ADD CONSTRAINT faqs_pkey PRIMARY KEY (id);
ALTER TABLE ONLY leads
    ADD CONSTRAINT leads_pkey PRIMARY KEY (id);
ALTER TABLE ONLY media
    ADD CONSTRAINT media_pkey PRIMARY KEY (id);
ALTER TABLE ONLY pages
    ADD CONSTRAINT pages_pkey PRIMARY KEY (id);
ALTER TABLE ONLY posts
    ADD CONSTRAINT posts_pkey PRIMARY KEY (id);
ALTER TABLE ONLY refresh_tokens
    ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id);
ALTER TABLE ONLY services
    ADD CONSTRAINT services_pkey PRIMARY KEY (id);
ALTER TABLE ONLY site_settings
    ADD CONSTRAINT site_settings_pkey PRIMARY KEY (key);
ALTER TABLE ONLY testimonials
    ADD CONSTRAINT testimonials_pkey PRIMARY KEY (id);
ALTER TABLE ONLY tour_images
    ADD CONSTRAINT tour_images_pkey PRIMARY KEY (id);
ALTER TABLE ONLY tours
    ADD CONSTRAINT tours_pkey PRIMARY KEY (id);
ALTER TABLE ONLY users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);

-- ═══════════════════════════════════════════════════════════════
--  5. Tashqi kalitlar
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE ONLY audit_logs
    ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL;
ALTER TABLE ONLY destinations
    ADD CONSTRAINT "destinations_heroImageId_fkey" FOREIGN KEY ("heroImageId") REFERENCES media(id) ON UPDATE CASCADE ON DELETE SET NULL;
ALTER TABLE ONLY leads
    ADD CONSTRAINT "leads_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL;
ALTER TABLE ONLY leads
    ADD CONSTRAINT "leads_tourId_fkey" FOREIGN KEY ("tourId") REFERENCES tours(id) ON UPDATE CASCADE ON DELETE SET NULL;
ALTER TABLE ONLY media
    ADD CONSTRAINT "media_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL;
ALTER TABLE ONLY posts
    ADD CONSTRAINT "posts_coverImageId_fkey" FOREIGN KEY ("coverImageId") REFERENCES media(id) ON UPDATE CASCADE ON DELETE SET NULL;
ALTER TABLE ONLY refresh_tokens
    ADD CONSTRAINT "refresh_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE ONLY testimonials
    ADD CONSTRAINT "testimonials_photoId_fkey" FOREIGN KEY ("photoId") REFERENCES media(id) ON UPDATE CASCADE ON DELETE SET NULL;
ALTER TABLE ONLY testimonials
    ADD CONSTRAINT "testimonials_tourId_fkey" FOREIGN KEY ("tourId") REFERENCES tours(id) ON UPDATE CASCADE ON DELETE SET NULL;
ALTER TABLE ONLY tour_images
    ADD CONSTRAINT "tour_images_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES media(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE ONLY tour_images
    ADD CONSTRAINT "tour_images_tourId_fkey" FOREIGN KEY ("tourId") REFERENCES tours(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE ONLY tours
    ADD CONSTRAINT "tours_destinationId_fkey" FOREIGN KEY ("destinationId") REFERENCES destinations(id) ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE ONLY tours
    ADD CONSTRAINT "tours_posterImageId_fkey" FOREIGN KEY ("posterImageId") REFERENCES media(id) ON UPDATE CASCADE ON DELETE SET NULL;

-- ═══════════════════════════════════════════════════════════════
--  6. Indekslar
--
--  Saytdagi eng ko'p uchraydigan so'rovlar uchun: nashr etilgan
--  turlarni sana va narx bo'yicha saralash, arizalarni status
--  bo'yicha filtrlash, slug orqali sahifa ochish.
-- ═══════════════════════════════════════════════════════════════

CREATE INDEX "audit_logs_createdAt_idx" ON audit_logs USING btree ("createdAt");
CREATE INDEX "audit_logs_entity_entityId_idx" ON audit_logs USING btree (entity, "entityId");
CREATE INDEX "destinations_isActive_sortOrder_idx" ON destinations USING btree ("isActive", "sortOrder");
CREATE UNIQUE INDEX destinations_slug_key ON destinations USING btree (slug);
CREATE INDEX "faqs_isActive_sortOrder_idx" ON faqs USING btree ("isActive", "sortOrder");
CREATE INDEX "leads_createdAt_idx" ON leads USING btree ("createdAt");
CREATE INDEX leads_phone_idx ON leads USING btree (phone);
CREATE INDEX "leads_status_createdAt_idx" ON leads USING btree (status, "createdAt");
CREATE INDEX "leads_tourId_idx" ON leads USING btree ("tourId");
CREATE INDEX "media_createdAt_idx" ON media USING btree ("createdAt");
CREATE UNIQUE INDEX media_filename_key ON media USING btree (filename);
CREATE INDEX "media_kind_createdAt_idx" ON media USING btree (kind, "createdAt");
CREATE UNIQUE INDEX pages_slug_key ON pages USING btree (slug);
CREATE UNIQUE INDEX posts_slug_key ON posts USING btree (slug);
CREATE INDEX "posts_status_publishedAt_idx" ON posts USING btree (status, "publishedAt");
CREATE UNIQUE INDEX "refresh_tokens_tokenHash_key" ON refresh_tokens USING btree ("tokenHash");
CREATE INDEX "refresh_tokens_userId_idx" ON refresh_tokens USING btree ("userId");
CREATE INDEX "services_isActive_sortOrder_idx" ON services USING btree ("isActive", "sortOrder");
CREATE UNIQUE INDEX services_slug_key ON services USING btree (slug);
CREATE INDEX "testimonials_isPublished_sortOrder_idx" ON testimonials USING btree ("isPublished", "sortOrder");
CREATE UNIQUE INDEX "tour_images_tourId_mediaId_key" ON tour_images USING btree ("tourId", "mediaId");
CREATE INDEX "tour_images_tourId_sortOrder_idx" ON tour_images USING btree ("tourId", "sortOrder");
CREATE INDEX "tours_destinationId_status_idx" ON tours USING btree ("destinationId", status);
CREATE INDEX "tours_priceFrom_idx" ON tours USING btree ("priceFrom");
CREATE UNIQUE INDEX tours_slug_key ON tours USING btree (slug);
CREATE INDEX "tours_status_departureDate_idx" ON tours USING btree (status, "departureDate");
CREATE INDEX "tours_status_destinationId_priceFrom_idx" ON tours USING btree (status, "destinationId", "priceFrom");
CREATE INDEX "tours_status_isFeatured_idx" ON tours USING btree (status, "isFeatured");
CREATE INDEX "tours_status_isHot_idx" ON tours USING btree (status, "isHot");
CREATE UNIQUE INDEX users_email_key ON users USING btree (email);

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
