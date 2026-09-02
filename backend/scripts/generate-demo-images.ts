/**
 * Har bir yo'nalish va tur uchun demo poster yaratadi.
 *
 * Nega kerak: sayt o'rnatilgan zahoti to'liq ko'rinishi kerak. Rasmsiz
 * kartochkalar «sayt buzuq» degan taassurot beradi, ayniqsa mijozga
 * ko'rsatilayotganda.
 *
 * Rasmlar SVG'dan generatsiya qilinadi — tashqi fayl yuklanmaydi, litsenziya
 * muammosi yo'q, va ular AYN TRAVEL brend ranglarida (navy + oltin), Instagram
 * 4:5 formatida bo'ladi. Admin panel orqali haqiqiy posterlarga almashtirish
 * odatdagidek ishlaydi.
 *
 * Ishga tushirish:  npm run demo:images
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { processImage } from '../src/services/images.js';
import sharp from 'sharp';

const prisma = new PrismaClient();

/** Yo'nalishga qarab fon rangi — kartochkalar bir xil ko'rinmasligi uchun. */
const PALETTES: Record<string, [string, string]> = {
  turkiya: ['#0b1e3a', '#7a1220'],
  ozarbayjon: ['#071630', '#0e4d3f'],
  gruziya: ['#0b1e3a', '#1b3660'],
  vyetnam: ['#071630', '#0a4a56'],
  dubay: ['#0b1e3a', '#6b4a12'],
  xitoy: ['#0b1e3a', '#6b1220'],
  misr: ['#071630', '#6b5012'],
  tailand: ['#0b1e3a', '#0e4d3f'],
  maldiv: ['#071630', '#0a4a66'],
};

const DEFAULT_PALETTE: [string, string] = ['#071630', '#12294b'];

/** XML uchun xavfli belgilarni ekranlaydi. */
function esc(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Uzun sarlavhani ikki qatorga bo'ladi. */
function wrap(text: string, maxChars = 16): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    if ((current + ' ' + word).trim().length <= maxChars) {
      current = (current + ' ' + word).trim();
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines.slice(0, 2);
}

interface PosterOptions {
  title: string;
  subtitle?: string;
  price?: string;
  paletteKey?: string;
}

/**
 * 1080×1350 (4:5) poster SVG'sini yasaydi.
 *
 * Kompozitsiya AYN TRAVEL posterlaridan olingan: to'q gradient fon,
 * yuqorida brend, markazda katta sarlavha, pastda oltin narx bloki.
 */
function posterSvg({ title, subtitle, price, paletteKey }: PosterOptions): string {
  const [from, to] = PALETTES[paletteKey ?? ''] ?? DEFAULT_PALETTE;
  const lines = wrap(title.toUpperCase());
  const titleSize = lines.length > 1 ? 96 : 116;
  const startY = 620 - (lines.length - 1) * (titleSize * 0.5);

  const titleTspans = lines
    .map((line, i) => `<tspan x="540" dy="${i === 0 ? 0 : titleSize * 1.05}">${esc(line)}</tspan>`)
    .join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${from}"/>
      <stop offset="100%" stop-color="${to}"/>
    </linearGradient>
    <linearGradient id="gold" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#f7d97a"/>
      <stop offset="45%" stop-color="#d4af37"/>
      <stop offset="100%" stop-color="#f5c842"/>
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="30%" r="60%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.10"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <rect width="1080" height="1350" fill="url(#bg)"/>
  <rect width="1080" height="1350" fill="url(#glow)"/>

  <!-- Oltin ramka — posterlardagi uslub -->
  <rect x="40" y="40" width="1000" height="1270" fill="none"
        stroke="url(#gold)" stroke-width="3" opacity="0.55" rx="24"/>

  <!-- Brend -->
  <text x="540" y="180" text-anchor="middle" font-family="Helvetica, Arial, sans-serif"
        font-size="46" font-weight="800" letter-spacing="14" fill="url(#gold)">AYN TRAVEL</text>
  <line x1="420" y1="220" x2="660" y2="220" stroke="url(#gold)" stroke-width="2" opacity="0.6"/>

  <!-- Sarlavha -->
  <text x="540" y="${startY}" text-anchor="middle" font-family="Helvetica, Arial, sans-serif"
        font-size="${titleSize}" font-weight="900" letter-spacing="-2" fill="#ffffff">${titleTspans}</text>

  ${
    subtitle
      ? `<text x="540" y="${startY + titleSize * (lines.length - 1) * 1.05 + 90}"
             text-anchor="middle" font-family="Helvetica, Arial, sans-serif"
             font-size="40" font-weight="500" letter-spacing="3"
             fill="#ffffff" opacity="0.75">${esc(subtitle.toUpperCase())}</text>`
      : ''
  }

  ${
    price
      ? `<g>
           <rect x="340" y="1010" width="400" height="150" rx="18"
                 fill="none" stroke="url(#gold)" stroke-width="3"/>
           <text x="540" y="1068" text-anchor="middle" font-family="Helvetica, Arial, sans-serif"
                 font-size="26" font-weight="700" letter-spacing="6"
                 fill="url(#gold)">NARX</text>
           <text x="540" y="1132" text-anchor="middle" font-family="Helvetica, Arial, sans-serif"
                 font-size="72" font-weight="900" fill="url(#gold)">${esc(price)}</text>
         </g>`
      : ''
  }

  <text x="540" y="1250" text-anchor="middle" font-family="Helvetica, Arial, sans-serif"
        font-size="28" font-weight="500" letter-spacing="4"
        fill="#ffffff" opacity="0.45">ayntravel.uz</text>
</svg>`;
}

/** SVG'dan PNG bufer yasaydi — `processImage` shuni kutadi. */
async function renderPoster(options: PosterOptions): Promise<Buffer> {
  return sharp(Buffer.from(posterSvg(options))).png().toBuffer();
}

/** Rasmni qayta ishlab, `media` yozuvini yaratadi va id qaytaradi. */
async function createMedia(options: PosterOptions, filename: string, altUz: string) {
  const png = await renderPoster(options);
  const processed = await processImage(png, filename);

  const media = await prisma.media.create({
    data: {
      filename: processed.filename,
      originalName: `${filename}.png`,
      mimeType: 'image/png',
      width: processed.width,
      height: processed.height,
      sizeBytes: processed.sizeBytes,
      variants: processed.variants as never,
      blurDataUrl: processed.blurDataUrl,
      altUz,
    },
  });

  return media.id;
}

async function main() {
  console.log('🎨 Demo posterlar yaratilmoqda...\n');

  // ── Yo'nalishlar ──────────────────────────────────────────
  const destinations = await prisma.destination.findMany({
    where: { heroImageId: null },
    orderBy: { sortOrder: 'asc' },
  });

  for (const d of destinations) {
    const mediaId = await createMedia(
      { title: d.nameUz, subtitle: 'Yo‘nalish', paletteKey: d.slug },
      `demo-${d.slug}`,
      `${d.nameUz} — AYN TRAVEL yo‘nalishi`,
    );
    await prisma.destination.update({ where: { id: d.id }, data: { heroImageId: mediaId } });
    console.log(`  🌍 ${d.nameUz}`);
  }

  // ── Turlar ────────────────────────────────────────────────
  const tours = await prisma.tour.findMany({
    where: { posterImageId: null },
    include: { destination: { select: { slug: true } } },
    orderBy: { departureDate: 'asc' },
  });

  for (const t of tours) {
    const price = `${Math.round(Number(t.priceFrom))}$`;
    const nights = t.durationNights ? `${t.durationDays} kun / ${t.durationNights} kecha` : undefined;

    const mediaId = await createMedia(
      {
        title: t.titleUz,
        subtitle: nights,
        price,
        paletteKey: t.destination?.slug,
      },
      `demo-tour-${t.slug}`,
      `${t.titleUz} — ${price} dan`,
    );
    await prisma.tour.update({ where: { id: t.id }, data: { posterImageId: mediaId } });
    console.log(`  🧳 ${t.titleUz} — ${price}`);
  }

  const total = await prisma.media.count();
  console.log(`\n✅ Tayyor. Bazada ${total} ta rasm.`);
  console.log('   Admin panel orqali haqiqiy posterlarga almashtirishingiz mumkin.\n');
}

main()
  .catch((err) => {
    console.error('❌ Xato:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
