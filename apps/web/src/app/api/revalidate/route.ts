import { revalidatePath, revalidateTag } from 'next/cache';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Admin panelda kontent nashr qilinganda backend shu endpointni chaqiradi.
 * Shu tufayli sayt statik tez qoladi (ISR), lekin menejer turni e'lon
 * qilishi bilanoq u saytda paydo bo'ladi.
 *
 * Ikkita mexanizm birga ishlatiladi va bu majburiy:
 *
 *  • `revalidateTag` — ma'lumot keshini (fetch natijalarini) yangilaydi.
 *    Ro'yxatlar, bosh sahifa, sitemap uchun shu yetarli.
 *
 *  • `revalidatePath` — marshrut keshini yangilaydi. Busiz muhim xato yuz
 *    beradi: agar kimdir (yoki qidiruv roboti) tur manzilini u nashr
 *    etilishidan OLDIN ochsa, Next 404 javobini keshlab qo'yadi. O'sha 404
 *    hech qanday fetch tegiga bog'lanmagan, shuning uchun `revalidateTag`
 *    uni tozalay olmaydi va sahifa nashr etilgandan keyin ham 404 bo'lib
 *    qolaveradi. `revalidatePath` aynan shu holatni hal qiladi.
 */
export async function POST(request: NextRequest) {
  const secret = process.env.REVALIDATE_SECRET;

  // Sir sozlanmagan bo'lsa endpoint umuman ishlamaydi — ochiq qoldirib
  // bo'lmaydi, aks holda har kim keshni tozalab, serverni yuklab tashlashi mumkin.
  if (!secret) {
    return NextResponse.json(
      { ok: false, error: 'REVALIDATE_SECRET sozlanmagan' },
      { status: 503 },
    );
  }

  if (request.headers.get('x-revalidate-secret') !== secret) {
    return NextResponse.json({ ok: false, error: 'Ruxsat yo‘q' }, { status: 401 });
  }

  let tags: string[] = [];
  let paths: string[] = [];

  try {
    const body = (await request.json()) as { tags?: unknown; paths?: unknown };

    if (Array.isArray(body.tags)) {
      tags = body.tags.filter((tag): tag is string => typeof tag === 'string').slice(0, 20);
    }

    if (Array.isArray(body.paths)) {
      paths = body.paths
        .filter((path): path is string => typeof path === 'string')
        // Faqat ichki, mutlaq yo'llar — tashqi manzil yuborib bo'lmasin.
        .filter((path) => path.startsWith('/') && !path.startsWith('//'))
        .slice(0, 20);
    }
  } catch {
    return NextResponse.json({ ok: false, error: 'Noto‘g‘ri JSON' }, { status: 400 });
  }

  // Next 16 da ikkinchi argument majburiy: qaysi cacheLife profilidagi
  // yozuvlar eskirgan deb belgilanishini bildiradi. 'max' — barchasi.
  for (const tag of tags) revalidateTag(tag, 'max');
  for (const path of paths) revalidatePath(path);

  return NextResponse.json({ ok: true, revalidated: { tags, paths }, now: Date.now() });
}
