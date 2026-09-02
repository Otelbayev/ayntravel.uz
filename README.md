# AYN TRAVEL — ayntravel.uz

Toshkentdagi **AYN TRAVEL** turizm kompaniyasining rasmiy sayti.

Ikki tilli (o'zbek / rus), Instagram poster formatidagi tur kartochkalari,
scroll animatsiyalari, to'liq SEO va admin panel.

- **Instagram:** [@ayntravel.uz](https://www.instagram.com/ayntravel.uz/)
- **Telegram:** [t.me/ayn_travel](https://t.me/ayn_travel)
- **Manzil:** Toshkent, Shota Rustaveli ko'chasi 136/2

---

## Loyiha uchta mustaqil qismdan iborat

```
ayntravel.uz/
├─ database.sql      Baza: jadvallar + boshlang'ich kontent + demo rasmlar
├─ backend/          API (Express + Prisma + PostgreSQL) — port 4000
├─ frontend/         Sayt va admin panel (Next.js) — port 3000
└─ sync-shared.mjs   Umumiy tiplarni backend → frontend ko'chiradi
```

**Backend va frontend bir-biriga bog'liq emas.** Har biri o'z papkasida,
o'z `package.json` va `.env` fayli bilan ishlaydi. Ular faqat HTTP API
orqali gaplashadi — turli serverlarda ham ishlashi mumkin.

| Qism | Texnologiya |
|---|---|
| Frontend | Next.js 16 (App Router), React 19, Tailwind CSS v4 |
| Animatsiya | Motion (Framer Motion) + Lenis |
| Ko'p tillilik | next-intl 4 (URL'lar ham tarjima qilingan) |
| Backend | Express 5, TypeScript |
| Baza | PostgreSQL 14+ va Prisma 6 |
| Rasmlar | sharp — AVIF/WebP, 4 ta nisbat |

---

## Ishga tushirish

Talab: **Node.js 20+** va **PostgreSQL 14+**

### 1. Baza

```bash
createdb ayntravel
psql ayntravel < database.sql
```

Shu bitta fayl jadvallarni yaratadi va boshlang'ich kontentni yuklaydi:
9 yo'nalish, 8 tur, 6 xizmat, blog maqolalari, mijoz fikrlari, admin hisobi
va **17 ta demo poster rasm** — sayt darhol to'liq ko'rinadi.

### 2. Backend

```bash
cd backend
cp .env.example .env      # DATABASE_URL va kalitlarni to'ldiring
npm install
npm run dev               # http://localhost:4000
```

Kalit yaratish: `openssl rand -base64 48`

### 3. Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev               # http://localhost:3000
```

- Sayt: http://localhost:3000
- Admin: http://localhost:3000/admin
- Kirish: `admin@ayntravel.uz` / `AynTravel2026!`

**Birinchi kirishdan keyin parolni albatta o'zgartiring.**

### Ikkalasini birdan

Ildizdan:

```bash
npm install       # faqat npm-run-all
npm run dev       # backend + frontend parallel
```

---

## Buyruqlar

### backend/

```bash
npm run dev          # ishlab chiqish (avtomatik qayta yuklash)
npm run build        # TypeScript → dist/
npm start            # production
npm run db:migrate   # sxema o'zgarishini bazaga qo'llash
npm run db:seed      # boshlang'ich kontent
npm run db:export    # database.sql ni qayta yaratish
npm run demo:images  # demo poster rasmlarni generatsiya qilish
npm run db:studio    # Prisma Studio — bazani ko'rish
```

### frontend/

```bash
npm run dev          # ishlab chiqish
npm run build        # production build
npm start            # production (pack + standalone server)
npm run pack         # dist/ — serverga yuklashga tayyor to'plam
npm run lint
npm run typecheck
```

---

## Umumiy kod (`shared`)

Tiplar, zod sxemalari va kichik yordamchilar (`slugify`, `normalizeUzPhone`,
`pick`) ikkala ilovaga ham kerak.

**Asosiy nusxa:** `backend/src/shared/`

O'zgartirgandan keyin frontend'ga ko'chiring:

```bash
node sync-shared.mjs
```

`frontend/src/shared/` — avtomatik nusxa, uni qo'lda tahrirlamang.
Ikkala nusxa ham git'ga tushadi, shuning uchun har bir papka mustaqil
deploy qilinadi.

---

## Baza sxemasi o'zgarganda

`database.sql` — **avtomatik yaratiladigan** fayl. `schema.prisma` ni
o'zgartirsangiz uni ham yangilash kerak:

```bash
cd backend
npm run db:migrate     # lokal bazaga o'zgarishni qo'llaydi
npm run db:export      # database.sql ni qaytadan yaratadi
```

---

## Rasmlar qanday ishlaydi

Menejer admin panel orqali rasm yuklaydi → backend uni `sharp` bilan
darhol **4 nisbat × 2 formatga** kesadi (4:5 Instagram posteri, 1:1, 16:9,
thumbnail; har biri AVIF va WebP) va `backend/uploads/` ga yozadi.

Saytda rasmlar **sayt domeni orqali** beriladi: `/uploads/...`. Next.js
ularni backend'dan olib beradi (`next.config.ts` dagi `rewrites`).

Nega shunday:

- Next 16 tashqi rasm hostini xususiy IP'ga yechilsa SSRF himoyasi tufayli
  bloklaydi — `localhost` bilan ishlaganda rasmlar umuman chiqmasdi
- domen o'zgarganda `remotePatterns` ni qayta sozlash kerak emas
- rasmlar sayt bilan bir domenda — kesh va CDN sozlash osonroq

Shu sababli `ASSET_BASE_URL=/uploads` (nisbiy) bo'lishi shart.

---

## Admin panel

`/admin` manzilida, o'zbek tilida.

| Bo'lim | Imkoniyatlar |
|---|---|
| Boshqaruv paneli | Kunlik/haftalik arizalar, statuslar, ommabop turlar |
| Arizalar | Ro'yxat, filtr, qidiruv, **to'liq kartochka**, CSV eksport |
| Turlar | Poster (4:5), narx, sana, «goryashiy» belgisi, galereya |
| Yo'nalishlar | SEO landing sahifalari |
| Blog | Maqolalar (HTML) |
| Rasmlar | Yuklash, **alt matn tahriri**, qayerda ishlatilayotgani |
| Xizmatlar / Fikrlar / Savol-javob | To'liq CRUD |
| Statik sahifalar | Biz haqimizda, oferta, maxfiylik siyosati |
| Foydalanuvchilar | Faqat ADMIN roli uchun |
| Sozlamalar | Telefonlar, linklar, manzil, hero matni |

Barcha bo'limlarda **yaratish, tahrirlash va o'chirish** ishlaydi.

### Forma va xabarlar

- **To'liq sahifa**, modal emas: `/admin/tours/new`, `/admin/posts/<id>`
- **Birinchi bo'lim doim ochiq** — faqat majburiy maydonlar (`*` bilan);
  qolganlari yig'ilgan va sarlavhasida qisqa holat ko'rinadi
- Pastda ikkita aniq tugma: **[Qoralama]** va **[Nashr etish]**
- Saqlanmagan o'zgarish bo'lsa sahifadan chiqishda ogohlantirish
- Har bir amal **toast xabari** beradi; o'chirishda sayt uslubidagi dialog

Yangi model qo'shish: `frontend/src/lib/admin-models.ts` ga konfiguratsiya
yoziladi — ro'yxat va forma sahifalari o'zi shakllanadi.

Kontent nashr etilganda sayt keshi **darhol** yangilanadi (ISR).

---

## Deploy

**To'liq yo'riqnoma:** [`DEPLOY.md`](./DEPLOY.md) — cPanel va VPS uchun.

Qisqacha:

```bash
# 1. Baza
psql BAZA < database.sql

# 2. Backend
cd backend && npm install && npm run build && npm start

# 3. Frontend
cd frontend && npm install && npm run build && npm run pack
#    natija: frontend/dist/ (~60 MB, npm install kerak emas)
cd dist && node server.js
```

Hosting **PostgreSQL** qo'llab-quvvatlashi shart — sayt massiv ustunlari,
JSONB va enum turlaridan foydalanadi.

---

## Telegram xabarnomalari

Yangi ariza kelganda menejerlar guruhiga darhol xabar boradi.

1. [@BotFather](https://t.me/BotFather) da bot yarating → token oling
2. Botni menejerlar guruhiga **admin** sifatida qo'shing
3. Guruh `chat_id` sini aniqlang (`-100...` bilan boshlanadi)
4. `backend/.env` ga yozing va qayta ishga tushiring

Telegram ishlamay qolsa ham **ariza yo'qolmaydi** — u bazaga yoziladi va
admin panelda ko'rinadi.

---

## SEO

- `hreflang` juftliklari: `/uz/turlar/x` ↔ `/ru/tury/x` (URL'lar tarjima qilingan)
- Har bir sahifada `canonical`
- **JSON-LD:** `TravelAgency`, `Product`+`Offer` (Google natijalarida narx
  ko'rinadi), `BlogPosting`, `BreadcrumbList`, `FAQPage`
- Dinamik `sitemap.xml` va `robots.txt`
- Rasmlar AVIF/WebP, blur placeholder, CLS = 0
- Yandex.Metrika va Google Analytics (sozlamalarda yoqiladi)

---

## Zaxira nusxa

```bash
# Baza
pg_dump -U foydalanuvchi ayntravel | gzip > zaxira-$(date +%F).sql.gz

# Menejerlar yuklagan rasmlar
tar -czf rasmlar-$(date +%F).tar.gz backend/uploads
```

> `database.sql` — **boshlang'ich o'rnatish** fayli, zaxira emas.
> Ishlab turgan saytning zaxirasi `pg_dump` orqali olinadi.
