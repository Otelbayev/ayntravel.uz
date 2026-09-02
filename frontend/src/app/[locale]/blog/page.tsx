import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { Locale } from '@/shared';
import { api } from '@/lib/api';
import { buildMetadata } from '@/lib/seo';
import { routing } from '@/i18n/routing';
import { Section, SectionHeader } from '@/components/ui/Section';
import { BlogPreview } from '@/components/home/BlogPreview';
import { Pagination } from '@/components/ui/Pagination';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'meta' });
  return buildMetadata({
    title: t('blogTitle'),
    description: t('blogDescription'),
    locale: locale as Locale,
    pathUz: '/blog',
    pathRu: '/blog',
  });
}

export default async function BlogPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale: raw } = await params;
  const locale = raw as Locale;
  setRequestLocale(locale);

  const sp = await searchParams;
  const pageParam = Array.isArray(sp.page) ? sp.page[0] : sp.page;
  const page = Number(pageParam ?? 1) || 1;

  const t = await getTranslations('sections');
  const tBlog = await getTranslations('blog');

  const result = await api
    .posts(page)
    .catch(() => ({ items: [], page: 1, pageSize: 12, total: 0, totalPages: 1 }));

  return (
    <div className="pt-24 lg:pt-28">
      <Section>
        <SectionHeader title={t('blog')} subtitle={t('blogSubtitle')} />

        {result.items.length > 0 ? (
          <>
            <BlogPreview posts={result.items} locale={locale} />
            <Pagination page={result.page} totalPages={result.totalPages} className="mt-12" />
          </>
        ) : (
          <p className="py-12 text-center text-ink-muted">{tBlog('empty')}</p>
        )}
      </Section>
    </div>
  );
}
