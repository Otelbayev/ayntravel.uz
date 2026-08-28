# AYN TRAVEL — ayntravel.uz

Toshkentdagi **AYN TRAVEL** turizm kompaniyasining rasmiy sayti.

Ikki tilli (o'zbek / rus), Instagram poster formatidagi tur kartochkalari,
scroll-based animatsiyalar, to'liq SEO va admin panel.

- **Instagram:** [@ayntravel.uz](https://www.instagram.com/ayntravel.uz/)
- **Telegram:** [t.me/ayn_travel](https://t.me/ayn_travel)
- **Manzil:** Toshkent, Shota Rustaveli ko'chasi 136/2

---

## Texnologiyalar

| Qism | Texnologiya |
|---|---|
| Frontend | Next.js 16 (App Router), React 19, Tailwind CSS v4 |
| Animatsiya | Motion (Framer Motion) + Lenis |
| Ko'p tillilik | next-intl 4 (lokalizatsiyalangan URL'lar) |
| Backend | Express 5, TypeScript |
| Baza | PostgreSQL 16 + Prisma 6 |
| Rasmlar | sharp (AVIF/WebP, 4 ta nisbat) |
| Deploy | Node.js ilovasi (cPanel / VPS) + bitta SQL fayl |

## Tuzilma

```
ayntravel.uz/
├─ apps/
│  ├─ api/          Express + Prisma (port 4000)
│  │  ├─ prisma/    sxema, migratsiyalar, seed
│  │  └─ src/       routes, services, middleware, storage
│  └─ web/          Next.js — sayt + /admin panel (port 3000)
│     └─ src/
│        ├─ app/[locale]/   ochiq sayt (uz / ru)
│        ├─ app/admin/      boshqaruv paneli
│        ├─ components/     UI, motion, admin
│        └─ messages/       tarjimalar (uz.json, ru.json)
├─ packages/shared/  Zod sxemalari va TS tiplar (ikkalasi ishlatadi)
├─ scripts/
│  ├─ build-deploy.mjs    deploy to'plamini yig'adi
│  └─ export-database.mjs database.sql ni qayta yaratadi
├─ database.sql      baza: jadvallar + boshlang'ich kontent
└─ DEPLOY.md         serverga o'rnatish yo'riqnomasi
```

---

## Ishga tushirish (lokal)

Talab: **Node.js 20+**, **PostgreSQL 16+**

```bash
# 1. Bog'liqliklar
npm install

# 2. Muhit sozlamalari
cp .env.example .env
# .env ni oching va kamida DATABASE_URL, JWT_* kalitlarini to'ldiring
# Kalit yaratish: openssl rand -base64 48

# 3. Baza — bitta fayldan o'rnatiladi
createdb ayntravel
psql ayntravel < database.sql      # jadvallar + boshlang'ich kontent + admin

# 4. Ishga tushirish (API + sayt birga)
npm run dev
```

- Sayt: http://localhost:3000
- API: http://localhost:4000
- Admin: http://localhost:3000/admin

Seed'dan keyingi kirish ma'lumotlari konsolda chiqadi
(standart: `admin@ayntravel.uz` / `AynTravel2026!`).
**Birinchi kirishdan keyin parolni albatta o'zgartiring.**

### Foydali buyruqlar

```bash
npm run dev            # API + sayt (parallel)
npm run build          # hammasini yig'ish
npm run typecheck      # barcha workspace'lar
npm run lint           # ESLint (web)
npm run db:studio      # Prisma Studio — bazani ko'rish
npm run db:export      # database.sql ni qayta yaratish
npm run deploy:build   # serverga yuklash uchun to'plam yig'ish
```

### Baza sxemasi o'zgarganda

`database.sql` — bu **avtomatik yaratiladigan** fayl. `schema.prisma` ni
o'zgartirsangiz, uni ham yangilash kerak, aks holda yangi serverga
o'rnatilgan baza kod kutgan tuzilishga mos kelmaydi:

```bash
npm run db:migrate     # lokal bazaga o'zgarishni qo'llaydi
npm run db:export      # database.sql ni qaytadan yaratadi
```

---

## Deploy

Docker ishlatilmaydi. Sayt uchta mustaqil qismdan iborat:

```
database.sql   →  PostgreSQL bazasiga import qilinadi
backend/       →  Node.js ilovasi (API, port 4000)
frontend/      →  Node.js ilovasi (sayt, port 3000)
```

### Deploy to'plamini yig'ish

```bash
npm run dev:api          # API ishlab tursin (build undan ma'lumot oladi)
npm run deploy:build     # deploy/ papkasini tayyorlaydi
```

Natija:

| Papka | Hajmi | Serverda `npm install` |
|---|---|---|
| `deploy/database.sql` | ~130 KB | — |
| `deploy/backend/` | ~600 KB | ✅ kerak |
| `deploy/frontend/` | ~60 MB | ❌ kerak emas |

Frontend Next.js «standalone» rejimida yig'iladi — barcha kerakli modullar
ichida. Bu shared hostingda muhim: `next build` va `npm install` uchun
odatda xotira yetmaydi.

**To'liq yo'riqnoma:** [`DEPLOY.md`](./DEPLOY.md) — cPanel va VPS uchun
qadam-baqadam.

### Muhim eslatma

Hosting **PostgreSQL** qo'llab-quvvatlashi shart. Sayt PostgreSQL'ning
massiv ustunlari, JSONB va enum turlaridan foydalanadi — faqat MySQL bor
hostingda ishlamaydi.

### Rasmlarni S3/CDN'ga o'tkazish

Diskda saqlash o'rniga bulutdan foydalanmoqchi bo'lsangiz:

1. `npm i @aws-sdk/client-s3 -w @ayntravel/api`
2. `STORAGE_DRIVER=s3` va S3/R2 kalitlarini kiriting
3. `next.config.ts` dagi `images.remotePatterns` ga CDN hostini qo'shing

Kodda boshqa o'zgarish kerak emas — saqlash qatlami adapter ortida.

---

## Telegram xabarnomalari

Yangi ariza kelganda menejerlar guruhiga darhol xabar boradi.

1. [@BotFather](https://t.me/BotFather) da bot yarating → tokenni oling
2. Botni menejerlar guruhiga **admin** sifatida qo'shing
3. Guruh `chat_id` sini aniqlang (guruhlarda `-100...` bilan boshlanadi)
4. `.env` ga yozing:
   ```
   TELEGRAM_BOT_TOKEN=...
   TELEGRAM_CHAT_ID=-100...
   ```

Telegram ishlamay qolsa ham ariza **hech qachon yo'qolmaydi** — u bazaga
yoziladi va admin panelda ko'rinadi.

---

## Dizayn tizimi

Sayt **oq** temada, brend kuchini saqlash uchun ba'zi bloklar to'q navy:
hero, narx tasmasi, aloqa bo'limi va footer.

Ranglar komponentlarda hech qachon qattiq yozilmaydi — faqat semantik tokenlar:

| Token | Oq fonda | To'q blokda |
|---|---|---|
| `text-ink` | navy `#0B1E3A` | oq |
| `text-ink-muted` | `#4A5A72` | `#A8B6CC` |
| `text-accent` | chuqur oltin `#8A6A15` | yorqin oltin `#F5C842` |
| `bg-surface` / `bg-surface-raised` | oq | navy |
| `border-line` | navy 10% | oq 10% |

Blokni to'q qilish uchun `data-tone="dark"` yetarli — ichidagi barcha
tokenlar avtomatik teskarisiga o'tadi:

```tsx
<section data-tone="dark" className="bg-navy-900">
  <h2 className="text-ink">Oq matn bo'ladi</h2>
</section>
```

`Section` komponentida bu `tone="dark"` propi orqali beriladi.

**Kontrast:** oq fondagi barcha matn WCAG AA (≥ 4.5:1) talabini qondiradi.
Yorqin oltin `#D4AF37` oq fonda atigi 2.1:1 beradi, shuning uchun u faqat
fon va ramka sifatida ishlatiladi; matn uchun `text-accent` (5.06:1).

### Bosh sahifa

- **Jonli narx tasmasi** — hero ostida aylanuvchi lenta (CSS, JS'siz)
- **Bento grid** — eng muhim tur katta katakda, qolganlari yonida
- **Gorizontal yo'nalishlar tasmasi** — desktopda scroll gorizontal harakatga
  aylanadi; mobil va `prefers-reduced-motion` da oddiy suriluvchi tasma
- **Editorial tipografika** — `clamp()` asosidagi shkala, katta bo'sh joy

Barcha animatsiyalar `MotionConfig reducedMotion="user"` ostida — operatsion
tizimda «harakatni kamaytirish» yoqilgan bo'lsa avtomatik o'chadi.

---

## Admin panel

`/admin` manzilida, faqat o'zbek tilida (menejerlar uchun).

| Bo'lim | Vazifasi |
|---|---|
| Boshqaruv paneli | Bugungi/haftalik arizalar, statuslar, ommabop turlar |
| Arizalar | Filtr, qidiruv, status, bir bosishda qo'ng'iroq/Telegram, **CSV eksport** |
| Turlar | UZ/RU tablar, poster (4:5), narx, sana, "goryashiy" belgisi |
| Yo'nalishlar | SEO landing sahifalari (Turkiya, Dubay...) |
| Blog | Maqolalar (HTML muharrir) |
| Rasmlar | Yuklash, alt matn tahriri |
| Xizmatlar / Fikrlar / FAQ | Oddiy CRUD |
| Foydalanuvchilar | Faqat ADMIN roli uchun |
| Sozlamalar | Telefonlar, linklar, manzil, hero matni — kodga tegmasdan |

### Forma va xabarlar

Barcha yaratish/tahrirlash formalari bir xil ishlaydi:

- **To'liq sahifa**, modal emas — `/admin/tours/new`, `/admin/posts/<id>` va h.k.
- **Birinchi bo'lim doim ochiq** — faqat majburiy maydonlar (`*` bilan).
  Qolgan bo'limlar yig'ilgan, sarlavhasida qisqa holat ko'rinadi
  («7 kun · 4★ · BB», «to'ldirilmagan»)
- Pastda ikkita aniq tugma: **[Qoralama]** va **[Nashr etish]** — status
  tanlaydigan select yo'q
- **Saqlanmagan o'zgarish** bo'lsa sahifadan chiqishda ogohlantirish chiqadi
- Har bir amal **toast xabari** beradi: «Tur nashr etildi», «Saqlandi»,
  «Ariza o'chirildi». O'chirishda sayt uslubidagi tasdiqlash oynasi
  (brauzerning `confirm()` emas)

Yangi model qo'shish uchun `apps/web/src/lib/admin-models.ts` ga
konfiguratsiya yoziladi — ro'yxat va forma sahifalari o'zi shakllanadi.

Kontent nashr etilganda sayt keshi **darhol** yangilanadi (ISR revalidation).

---

## SEO

- `hreflang` juftliklari: `/uz/turlar/x` ↔ `/ru/tury/x` (URL'lar ham tarjima qilingan)
- Har bir sahifada `canonical`
- **JSON-LD:** `TravelAgency`, `Product`+`Offer` (Google natijalarda narx ko'rinadi),
  `BlogPosting`, `BreadcrumbList`, `FAQPage`
- Dinamik `sitemap.xml` — barcha turlar, yo'nalishlar, maqolalar ikki tilda
- `robots.txt` — `/admin` va `/api` yopiq
- OG rasm sifatida turning Instagram posteri ishlatiladi
- Yandex Metrika + Google Analytics (`.env` orqali yoqiladi)

Domen ulangandan keyin:
1. [Yandex.Webmaster](https://webmaster.yandex.uz/) va
   [Google Search Console](https://search.google.com/search-console) ga saytni qo'shing
2. Tasdiqlash kodlarini `.env` ga yozing
   (`NEXT_PUBLIC_YANDEX_VERIFICATION`, `NEXT_PUBLIC_GOOGLE_VERIFICATION`)
3. `https://ayntravel.uz/sitemap.xml` ni ikkala tizimga topshiring

---

## Xavfsizlik

- Parollar `argon2` bilan hash qilinadi
- JWT `httpOnly` + `SameSite=Lax` cookie'da; refresh token bazada hash sifatida
- Ariza formasida uch qatlamli spam himoyasi: honeypot, to'ldirish vaqti,
  IP bo'yicha soatiga 5 ta cheklov (**faqat muvaffaqiyatli** arizalar sanaladi —
  telefonni xato tergan mijoz bloklanmaydi)
- Xom IP manzillar saqlanmaydi, faqat tuzlangan hash
- Har bir admin amali `audit_logs` jadvaliga yoziladi

---

## Zaxira nusxa

```bash
# Baza
pg_dump -U foydalanuvchi ayntravel | gzip > zaxira-$(date +%F).sql.gz

# Menejerlar yuklagan rasmlar
tar -czf rasmlar-$(date +%F).tar.gz ~/ayntravel-api/uploads
```

Haftalik cron tavsiya etiladi. cPanel'da **Backup** bo'limidan avtomatik
zaxirani ham yoqib qo'ying.

> `database.sql` — bu **boshlang'ich** o'rnatish fayli, zaxira emas.
> Ishlab turgan saytning zaxirasi yuqoridagi `pg_dump` orqali olinadi.
