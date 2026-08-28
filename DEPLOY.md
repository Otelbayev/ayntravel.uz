# AYN TRAVEL — cPanel'ga o'rnatish

Sayt uchta qismdan iborat:

| Qism | Nima | Qayerda ishlaydi |
|---|---|---|
| `database.sql` | Baza: jadvallar + boshlang'ich kontent | PostgreSQL |
| `backend/` | API — arizalar, admin, rasmlar | Node.js ilovasi (port 4000) |
| `frontend/` | Sayt va admin panel | Node.js ilovasi (port 3000) |

---

## ⚠️ Boshlashdan oldin tekshiring

**1. Hostingda PostgreSQL bormi?**

cPanel'ga kiring va **PostgreSQL Databases** bo'limini qidiring.

- ✅ Bor → davom eting
- ❌ Faqat **MySQL Databases** bor → **bu sayt ishlamaydi.** Hosting
  provayderidan PostgreSQL so'rang yoki VPS'ga o'ting. Sayt PostgreSQL'ga
  qurilgan (massiv ustunlari, JSONB, enum turlari), MySQL'ga o'tkazish
  uchun baza qatlamini qayta yozish kerak.

**2. Node.js ilovasi bormi?**

cPanel'da **Setup Node.js App** (yoki **Application Manager**) bo'limi
bo'lishi kerak, Node.js **20 yoki undan yuqori** versiyasi bilan.

**3. Ikkita ilova yaratish mumkinmi?**

Ba'zi arzon tariflar faqat bitta Node ilovasiga ruxsat beradi. Bizga
ikkitasi kerak (backend + frontend). Tarifingizni tekshiring.

> Agar shu uchtasidan biri yo'q bo'lsa — VPS (masalan Ahost, Cloud.uz yoki
> Hetzner) sizga arzonroq va osonroq bo'ladi. So'nggi bo'limga qarang.

---

## 1-qadam: Ma'lumotlar bazasi

### cPanel orqali

1. **PostgreSQL Databases** ni oching
2. **Create New Database**: nom kiriting, masalan `ayntravel`
   → cPanel to'liq nomni `hisobingiz_ayntravel` qilib beradi
3. **Add New User**: foydalanuvchi va kuchli parol yarating
4. **Add User To Database** → foydalanuvchini bazaga biriktiring,
   **ALL PRIVILEGES** belgilang
5. **phpPgAdmin** ni oching → bazangizni tanlang → **SQL** yorlig'i
   → `database.sql` faylini yuklang va ishga tushiring

### Yoki SSH orqali (tezroq)

```bash
psql -U hisobingiz_ayn -d hisobingiz_ayntravel -f database.sql
```

### Tekshirish

phpPgAdmin'da SQL oynasiga yozing:

```sql
SELECT
  (SELECT count(*) FROM tours)        AS turlar,
  (SELECT count(*) FROM destinations) AS yonalishlar,
  (SELECT count(*) FROM services)     AS xizmatlar,
  (SELECT count(*) FROM users)        AS adminlar;
```

Natija **8 | 9 | 6 | 1** bo'lishi kerak.

---

## 2-qadam: Backend (API)

### Fayllarni yuklash

`backend/` papkasini **File Manager** yoki FTP orqali yuklang, masalan:

```
/home/hisobingiz/ayntravel-api/
```

> `public_html` ichiga **qo'ymang** — API to'g'ridan-to'g'ri ochilmasligi kerak.

### Node.js ilovasini yaratish

**Setup Node.js App** → **Create Application**:

| Maydon | Qiymat |
|---|---|
| Node.js version | 20 yoki yuqori |
| Application mode | Production |
| Application root | `ayntravel-api` |
| Application URL | `api.ayntravel.uz` (subdomen) |
| Application startup file | `app.js` |

**Create** bosing.

### Sozlamalarni kiritish

Ilova sahifasidagi **Environment variables** bo'limiga quyidagilarni
qo'shing (`backend/.env.example` da to'liq ro'yxat va izohlar bor):

| O'zgaruvchi | Qiymat |
|---|---|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | `postgresql://foydalanuvchi:parol@127.0.0.1:5432/baza` |
| `JWT_ACCESS_SECRET` | tasodifiy 48+ belgi |
| `JWT_REFRESH_SECRET` | boshqa tasodifiy 48+ belgi |
| `IP_HASH_SALT` | tasodifiy satr |
| `WEB_URL` | `https://ayntravel.uz` |
| `CORS_ORIGINS` | `https://ayntravel.uz,https://www.ayntravel.uz` |
| `ASSET_BASE_URL` | `https://api.ayntravel.uz/uploads` |
| `REVALIDATE_SECRET` | tasodifiy satr |
| `STORAGE_DRIVER` | `local` |
| `UPLOAD_DIR` | `./uploads` |

Tasodifiy kalit yaratish (SSH bor bo'lsa):

```bash
openssl rand -base64 48
```

SSH bo'lmasa — [random.org](https://www.random.org/strings/) yoki parol
generatoridan 48+ belgilik satr oling. **Har bir kalit boshqacha bo'lsin.**

### O'rnatish va ishga tushirish

Ilova sahifasida **Run NPM Install** tugmasini bosing.

> Bu `npm install` va `prisma generate` ni bajaradi. Bir-ikki daqiqa oladi.
> Xotira yetmasa deb xato chiqsa — SSH orqali qiling:
> ```bash
> cd ~/ayntravel-api
> npm install --omit=dev --no-audit --no-fund
> npx prisma generate
> ```

So'ng **Restart** bosing.

### Tekshirish

Brauzerda oching: `https://api.ayntravel.uz/health`

Javob shunday bo'lishi kerak:

```json
{"ok":true,"data":{"status":"up","time":"..."}}
```

Chiqmasa — ilova sahifasidagi log fayliga qarang.

---

## 3-qadam: Frontend (sayt)

### Fayllarni yuklash

`frontend/` papkasini yuklang, masalan:

```
/home/hisobingiz/ayntravel-web/
```

> Bu papka **~59 MB** va ichida `node_modules` bor. FTP bilan yuklash uzoq
> davom etadi — uni ZIP qilib yuklab, File Manager'da ochgan tezroq bo'ladi.

### Node.js ilovasini yaratish

| Maydon | Qiymat |
|---|---|
| Node.js version | 20 yoki yuqori |
| Application mode | Production |
| Application root | `ayntravel-web` |
| Application URL | `ayntravel.uz` (asosiy domen) |
| Application startup file | `app.js` |

### Sozlamalar

| O'zgaruvchi | Qiymat |
|---|---|
| `NODE_ENV` | `production` |
| `API_INTERNAL_URL` | `http://127.0.0.1:4000` |

> `127.0.0.1` — sayt API bilan server ichida gaplashadi: tezroq va
> tashqi tarmoqqa chiqmaydi.

### Ishga tushirish

**NPM Install qilish SHART EMAS** — barcha modullar allaqachon ichida.
Faqat **Restart** bosing.

Saytni oching: `https://ayntravel.uz` — bosh sahifa chiqishi kerak.

---

## 4-qadam: Birinchi sozlash

1. `https://ayntravel.uz/admin` ga kiring:
   - Email: `admin@ayntravel.uz`
   - Parol: `AynTravel2026!`

2. **Parolni darhol o'zgartiring:**
   Foydalanuvchilar → o'zingizni tanlang → yangi parol → Saqlash

3. **Sozlamalar** bo'limida telefonlar, Telegram va Instagram
   havolalarini tekshiring.

4. **Telegram xabarnomasi** (yangi ariza kelganda):
   - [@BotFather](https://t.me/BotFather) da bot yarating
   - Botni menejerlar guruhiga **admin** qilib qo'shing
   - Guruh `chat_id` sini aniqlang (`-100...` bilan boshlanadi)
   - Backend ilovasi sozlamalariga qo'shing:
     `TELEGRAM_BOT_TOKEN` va `TELEGRAM_CHAT_ID` → **Restart**

5. **Sinov arizasi** yuboring va Telegram'ga xabar kelishini tekshiring.

---

## Kontentni yangilash

Kod o'zgarganda saytni qayta yig'ib yuklaysiz:

```bash
# Kompyuteringizda
npm run dev:api          # API ishga tushsin (build unga murojaat qiladi)
npm run deploy:build     # deploy/ papkasi yangilanadi
```

So'ng:

- **Backend o'zgargan bo'lsa:** `backend/dist/` ni yuklang → Restart
- **Frontend o'zgargan bo'lsa:** `frontend/` ni to'liq almashtiring → Restart

> `uploads/` papkasini **almashtirmang** — unda menejerlar yuklagan
> rasmlar bor.

Kontent (turlar, maqolalar, narxlar) admin panel orqali o'zgaradi —
buning uchun hech narsa yuklash kerak emas.

---

## Zaxira nusxa

Haftada bir marta:

```bash
# Baza
pg_dump -U foydalanuvchi baza_nomi > zaxira-$(date +%F).sql

# Rasmlar
tar -czf rasmlar-$(date +%F).tar.gz ~/ayntravel-api/uploads
```

cPanel'ning **Backup** bo'limidan avtomatik zaxirani ham yoqib qo'ying.

---

## Tez-tez uchraydigan muammolar

**Sayt ochiladi, lekin turlar ko'rinmaydi**
API ishlamayapti yoki manzil noto'g'ri. `https://api.ayntravel.uz/health`
ni tekshiring va frontend'dagi `API_INTERNAL_URL` to'g'riligiga ishonch hosil qiling.

**Admin panelga kira olmayapman**
`DATABASE_URL` noto'g'ri yoki `database.sql` import qilinmagan.
phpPgAdmin'da tekshiring: `SELECT email FROM users;`

**Rasm yuklanmayapti**
`uploads/` papkasiga yozish huquqi yo'q. File Manager'da huquqni `755` qiling.
`ASSET_BASE_URL` ham to'g'ri domenni ko'rsatishi kerak.

**Ariza keladi, Telegram'ga xabar kelmaydi**
Ariza baribir bazada saqlanadi (admin panelda ko'rinadi) — bu ataylab
shunday. Tokenni va bot guruhda adminligini tekshiring.

**«Baza allaqachon o'rnatilgan» xatosi**
`database.sql` ikkinchi marta ishga tushirilgan. Bu normal — fayl bir
marta ishlaydi. Bazani tozalab qaytadan o'rnatmoqchi bo'lsangiz:
```sql
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
```

---

## VPS varianti (cPanel imkoni bo'lmasa)

VPS'da o'rnatish osonroq va arzonroq. Ubuntu 22.04+ da:

```bash
# 1. Node.js va PostgreSQL
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs postgresql nginx

# 2. Baza
sudo -u postgres createuser --pwprompt ayn
sudo -u postgres createdb -O ayn ayntravel
sudo -u postgres psql ayntravel < database.sql

# 3. Ilovalar
cd ~/ayntravel-api && npm install --omit=dev && npx prisma generate
# .env faylini to'ldiring

# 4. PM2 — ikkala jarayonni ushlab turadi
sudo npm install -g pm2
pm2 start ~/ayntravel-api/app.js --name ayn-api
pm2 start ~/ayntravel-web/app.js --name ayn-web
pm2 save && pm2 startup

# 5. Nginx + bepul HTTPS
sudo certbot --nginx -d ayntravel.uz -d api.ayntravel.uz
```

Nginx sozlamasi: `ayntravel.uz` → `127.0.0.1:3000`,
`api.ayntravel.uz` → `127.0.0.1:4000`.
