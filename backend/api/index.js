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
 */
import { createApp } from '../dist/app.js';

export default createApp();
