# Deploy — Vercel

Ikkita mustaqil Vercel loyihasi, bitta GitHub repodan:

| Loyiha | Root Directory | Framework |
|---|---|---|
| `ayntravel-api` | `backend` | Other |
| `ayntravel-web` | `frontend` | Next.js |

Tartib muhim: **avval backend** deploy qilinadi, uning URL'i frontend env'iga
yoziladi, keyin frontend URL'i backend'ga qaytariladi.

---

## 1. Baza (Neon)

Baza allaqachon Neon'da. Sxema Prisma migratsiyalari bilan qo'llanadi:

```bash
cd backend
npx prisma migrate deploy          # DIRECT_URL orqali ketadi
```

Birinchi admin — seed skript orqali (baza ataylab bo'sh, `database.sql` da
hech qanday INSERT yo'q):

```bash
SEED_ADMIN_EMAIL=siz@example.com \
SEED_ADMIN_PASSWORD='kuchli-parol' npm run db:seed:admin
```

`DATABASE_URL` va `DIRECT_URL` farqi:

- `DATABASE_URL` — hostda `-pooler` bor. Ilova shuni ishlatadi: serverless'da
  har bir funksiya alohida ulanish ochadi va pooler'siz baza limitga uriladi.
  Oxiriga `&pgbouncer=true&connection_limit=1` qo'shing.
- `DIRECT_URL` — hostda `-pooler` YO'Q. Faqat migratsiyalar uchun: pgbouncer
  transaction rejimida DDL va advisory lock ishlamaydi.

---

## 2. Backend

**Vercel → New Project → repo → Root Directory: `backend`, Framework: Other.**

`backend/vercel.json` qolganini o'zi hal qiladi: `npm run build` (prisma
generate + tsc), barcha so'rovlarni `api/index.js` ga yo'naltirish va
kunlik cron.

### Blob store

**Storage → Blob → Create** va shu loyihaga ulang. `BLOB_READ_WRITE_TOKEN`
avtomatik qo'shiladi. Store'ning ochiq bazaviy manzilini yozib oling:
`https://<id>.public.blob.vercel-storage.com`

### Environment Variables

| Var | Qiymat |
|---|---|
| `DATABASE_URL` | Neon pooler URL + `&pgbouncer=true&connection_limit=1` |
| `DIRECT_URL` | Neon pooler'siz URL |
| `JWT_ACCESS_SECRET` | `openssl rand -base64 48` |
| `JWT_REFRESH_SECRET` | boshqa `openssl rand -base64 48` |
| `STORAGE_DRIVER` | `blob` |
| `ASSET_BASE_URL` | `https://<id>.public.blob.vercel-storage.com` |
| `NODE_ENV` | `production` |
| `IP_HASH_SALT` | tasodifiy, ≥8 belgi |
| `REVALIDATE_SECRET` | tasodifiy, ≥16 belgi — frontendda **aynan shu** |
| `CRON_SECRET` | tasodifiy (Vercel cron so'rovini imzolaydi) |
| `CORS_ORIGINS` | frontend URL'i — 4-qadamdan keyin |
| `WEB_URL` | frontend URL'i — 4-qadamdan keyin |
| `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` | ixtiyoriy |

**Qo'ymang:** `PORT`, `UPLOAD_DIR`, `COOKIE_DOMAIN`.

> `COOKIE_DOMAIN` ni bo'sh qoldirish MUHIM. U bo'sh bo'lganda cookie
> `SameSite=None; Secure` bilan chiqadi — frontend va API alohida
> `*.vercel.app` domenlarida bo'lgani uchun boshqacha ishlamaydi.
> O'z domeningizga (`ayntravel.uz` + `api.ayntravel.uz`) o'tganda
> `COOKIE_DOMAIN=.ayntravel.uz` qo'ying: kod o'zi qattiqroq `SameSite=Lax`
> rejimiga qaytadi.

Deploy → API URL: `https://ayntravel-api.vercel.app`

Tekshiring: `curl https://ayntravel-api.vercel.app/health`

---

## 3. Frontend

**Vercel → New Project → repo → Root Directory: `frontend`.** Next.js
avtomatik aniqlanadi, build buyruqlarini o'zgartirmang.

> `npm run sync:shared` ni build'ga ULAMANG — u `../sync-shared.mjs` ni
> chaqiradi, root directory tashqarisi esa Vercel'da mavjud emas.
> `frontend/src/shared/` allaqachon repoda.

| Var | Qiymat |
|---|---|
| `NEXT_PUBLIC_API_URL` | `https://ayntravel-api.vercel.app` |
| `API_INTERNAL_URL` | `https://ayntravel-api.vercel.app` |
| `NEXT_PUBLIC_SITE_URL` | `https://ayntravel-web.vercel.app` |
| `REVALIDATE_SECRET` | backend bilan **bir xil** |

> `API_INTERNAL_URL` ni ham to'liq ochiq manzilga qo'ying. U "shu
> mashinada 127.0.0.1" degani edi — Vercel'da bunday narsa yo'q, va
> qo'yilmasa `localhost:4000` ga tushib, SSR jimgina bo'sh sahifa beradi.

---

## 4. Backendga qaytish

Frontend URL'i ma'lum bo'lgach, backend env'iga qo'ying va **qayta deploy**:

```
CORS_ORIGINS = https://ayntravel-web.vercel.app
WEB_URL      = https://ayntravel-web.vercel.app
```

Preview deploy'lar har safar yangi URL oladi. `CORS_ORIGINS` da kamida
bitta `.vercel.app` manzili bo'lsa, kod barcha `*.vercel.app` subdomenlariga
ruxsat beradi — preview'da ham admin panel ishlaydi.

---

## 5. Tekshirish

1. `curl https://<api>/health` → `{"ok":true}`
2. `curl https://<api>/api/tours` → `{"ok":true,...}` (bo'sh ro'yxat)
3. Bosh sahifa ochiladi (kontent yo'q, lekin xato ham yo'q)
4. `/admin/login` → kirish → **`/admin` da qoladi** (cookie tekshiruvi)
5. Admin → Rasmlar → 5 MB dan katta rasm yuklang → Blob URL bilan ko'rinadi
6. Rasmni o'chiring → Vercel → Storage → Blob'da ham yo'qolgan
7. Admin → Sozlamalar → saqlang → bosh sahifada ko'rinadi (ISR revalidate)
8. Saytdan ariza yuboring → Admin → Arizalar + Telegram xabari

---

## Bilib qo'yish kerak

- **Rate limiting** xotirada ishlaydi (`express-rate-limit`) va serverless
  instansiyalar orasida bo'linmaydi. Login va ariza formasi himoyasi
  bitta serverdagidan zaifroq. To'liq yechim — Upstash Redis store.
- **Cron** Hobby planda kuniga bir marta va aniq vaqti kafolatlanmaydi.
  U faqat muddati o'tgan refresh tokenlarni tozalaydi — kechikishi zararsiz.
- **Katta fayllar** brauzerdan to'g'ridan-to'g'ri Blob'ga ketadi
  (`frontend/src/lib/media-upload.ts`). Vercel funksiyasiga kiruvchi so'rov
  tanasi 4.5 MB bilan cheklangan, shuning uchun eski multipart marshrutlari
  (`/api/admin/media/upload`) faqat lokal ishlash uchun qoldi.
- **cPanel/VPS** yo'li buzilmagan: `BUILD_STANDALONE=1` bilan
  `npm run pack` avvalgidek ishlaydi, backend'da `STORAGE_DRIVER=local`.
