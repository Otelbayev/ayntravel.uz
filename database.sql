-- ═══════════════════════════════════════════════════════════════
--  AYN TRAVEL — ayntravel.uz
--  Ma'lumotlar bazasi: FAQAT STRUKTURA (ma'lumotsiz)
--
--  Bu fayl avtomatik yaratilgan:  npm run db:export
--  Qo'lda tahrirlamang — sxema o'zgarganda qaytadan yarating.
--
--  Talab: PostgreSQL 14 yoki undan yuqori.
--
--  ── O'RNATISH ──────────────────────────────────────────────────
--
--  Odatiy yo'l — Prisma migratsiyalari (tavsiya etiladi):
--      cd backend && npx prisma migrate deploy
--
--  Yoki shu faylni to'g'ridan-to'g'ri yuklash:
--      psql "$DATABASE_URL" -f database.sql
--
--  ── ADMIN HISOBI ───────────────────────────────────────────────
--
--  Bu faylda hech qanday foydalanuvchi YO'Q. Birinchi adminni
--  seed skripti yaratadi:
--
--      cd backend
--      SEED_ADMIN_EMAIL=siz@example.com \
--      SEED_ADMIN_PASSWORD='kuchli-parol' npm run db:seed:admin
--
--  ── ESLATMA ────────────────────────────────────────────────────
--
--  Fayl BUTUNLAY bo'sh: turlar, yo'nalishlar, rasmlar, sozlamalar —
--  hammasi admin panel orqali kiritiladi.
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
--  4. Kalitlar va yagonalik cheklovlari
--
--  Jadvallardan keyin qo'shiladi — shunda CREATE TABLE tartibi
--  ahamiyatsiz bo'lib qoladi.
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
--  Import tugagach jadvallar yaratilganini shunday tekshiring:
--
--    \dt
--
--  14 ta jadval ko'rinishi kerak. Baza bo'sh — kontent admin
--  panel orqali kiritiladi.
-- ═══════════════════════════════════════════════════════════════
