/**
 * Vercel serverless kirish nuqtasi.
 *
 * Ataylab `.js` va `dist/` dan import: loyiha NodeNext ESM'da yozilgan va
 * barcha importlarda `.js` kengaytmasi bor. Vercel'ning TypeScript
 * bundleri (esbuild) `./app.js` ni `app.ts` ga hal qila olmaydi, shuning
 * uchun kompilyatsiyani `npm run build` (tsc) bajaradi va bu fayl faqat
 * tayyor natijani ulaydi.
 *
 * `server.ts` bu yerda ishlatilmaydi: unda `app.listen()` va `setInterval`
 * bor, ikkalasi ham serverless'da o'rinsiz. Express ilovasining o'zi
 * `(req, res)` funksiyasi — Vercel uni to'g'ridan-to'g'ri chaqiradi.
 *
 * ── Nega vercel.json build'dan keyin tsconfig.json ni o'chiradi ──
 *
 * @vercel/node loyihada tsconfig.json ko'rsa, `npm run build` allaqachon
 * muvaffaqiyatli kompilyatsiya qilgan `src/**` ni O'Z sozlamalari bilan
 * qayta tekshiradi. U yerda NodeNext hal qilinishi qo'llanmaydi va
 * ESM-nativ tiplar bilan keladigan dual paketlarning default importi
 * modul namespace'iga aylanib qoladi:
 *
 *   src/app.ts(28,5): error TS2349: This expression is not callable.
 *   Type 'typeof import(".../helmet/index")' has no call signatures.
 *
 * Bu helmet'ga xos emas — `express-rate-limit`, `pino`, `sharp` ham
 * shunday paketlar (`@types/express` esa `export =` uslubida bo'lgani
 * uchun `express()` o'tib ketadi). Har birini alohida cast bilan
 * tuzatish o'rniga sababni olib tashlaymiz: tsconfig.json faqat
 * bizning build'imizga kerak, undan keyin uni qoldirishning ma'nosi
 * yo'q. Funksiya baribir tayyor `dist/` ni ishlatadi.
 */
import { createApp } from '../dist/app.js';

export default createApp();
