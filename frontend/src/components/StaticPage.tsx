import { notFound } from 'next/navigation';
import type { Locale } from '@/shared';
import { pick, pickExact } from '@/shared';
import { api, ApiError, isApiUnreachable, isBuildPhase } from '@/lib/api';
import { routing } from '@/i18n/routing';
import { Section } from '@/components/ui/Section';
import { Reveal } from '@/components/motion/Reveal';

/**
 * Statik sahifalar (biz haqimizda, oferta, maxfiylik) uchun umumiy render.
 * Mazmun admin paneldan boshqariladi — huquqiy matnni o'zgartirish uchun
 * dasturchi kerak bo'lmasligi kerak.
 */
export async function StaticPage({ slug, locale }: { slug: string; locale: Locale }) {
  let page;
  try {
    page = await api.page(slug);
  } catch (err) {
    // Sahifa haqiqatan yo'q — 404 to'g'ri javob.
    if (err instanceof ApiError && err.status === 404) notFound();

    /*
     * API'ga yetib bo'lmadi. Build paytida bu bo'lishi mumkin (backend
     * ishlamayotgan bo'lsa) — bunda build to'xtamasligi kerak.
     *
     * 404 QAYTARMAYMIZ: Next bu javobni keshlab qo'yadi va sahifa
     * backend ko'tarilgandan keyin ham «topilmadi» bo'lib qolaveradi.
     * Buning o'rniga bo'sh qobiq chiziladi — sahifa 200 qaytaradi va
     * ISR muddati kelganda yoki admin kontentni nashr qilganda o'zi to'ladi.
     */
    if (isApiUnreachable(err) && isBuildPhase) {
      page = null;
    } else {
      throw err;
    }
  }

  const record = (page ?? {}) as unknown as Record<string, unknown>;
  const body = pick(record, 'body', locale);
  const title = pick(record, 'title', locale);

  return (
    <div className="pt-24 lg:pt-28">
      <Section>
        <div className="mx-auto max-w-3xl">
          <Reveal>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl">{title}</h1>
          </Reveal>
          {body && (
            <Reveal delay={0.1} className="mt-8">
              <div className="prose-tour" dangerouslySetInnerHTML={{ __html: body }} />
            </Reveal>
          )}
        </div>
      </Section>
    </div>
  );
}

/** Statik sahifa uchun metadata quruvchi (har bir route'da takrorlanmasin). */
/**
 * Statik sahifalar uchun `generateStaticParams`.
 *
 * Odatda barcha tillarni qaytaradi. Lekin build paytida API ishlamayotgan
 * bo'lsa BO'SH ro'yxat qaytaradi — shunda sahifa oldindan yig'ilmaydi va
 * «topilmadi» holida keshlanib qolmaydi. API ko'tarilgach birinchi
 * so'rovdayoq to'g'ri kontent bilan chiziladi.
 */
export async function staticPageParams(slug: string) {
  // `generateStaticParams` faqat build paytida chaqiriladi, shuning uchun
  // bu yerda qo'shimcha «build rejimimi?» tekshiruvi kerak emas.
  try {
    await api.page(slug);
  } catch (err) {
    if (isApiUnreachable(err)) return [];
  }
  return routing.locales.map((locale) => ({ locale }));
}

export async function staticPageMetadata(slug: string, locale: Locale, paths: { uz: string; ru: string }) {
  const { buildMetadata } = await import('@/lib/seo');
  try {
    const page = await api.page(slug);
    const record = page as unknown as Record<string, unknown>;
    return buildMetadata({
      title: pickExact(record, 'seoTitle', locale) || pick(record, 'title', locale),
      description: pickExact(record, 'seoDescription', locale),
      locale,
      pathUz: paths.uz,
      pathRu: paths.ru,
    });
  } catch {
    return buildMetadata({
      title: 'AYN TRAVEL',
      description: '',
      locale,
      pathUz: paths.uz,
      pathRu: paths.ru,
      noIndex: true,
    });
  }
}
