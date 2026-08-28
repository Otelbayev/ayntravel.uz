import { notFound } from 'next/navigation';
import type { Locale } from '@ayntravel/shared';
import { pick, pickExact } from '@ayntravel/shared';
import { api, ApiError } from '@/lib/api';
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
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  }

  const record = page as unknown as Record<string, unknown>;
  const body = pick(record, 'body', locale);

  return (
    <div className="pt-24 lg:pt-28">
      <Section>
        <div className="mx-auto max-w-3xl">
          <Reveal>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl">{pick(record, 'title', locale)}</h1>
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
