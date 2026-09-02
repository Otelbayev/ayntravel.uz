import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Clock } from 'lucide-react';
import type { Locale } from '@/shared';
import { pick, pickExact } from '@/shared';
import { api, ApiError, isApiUnreachable, isBuildPhase, safeApi } from '@/lib/api';
import { formatDate } from '@/lib/format';
import { blogPostingJsonLd, breadcrumbJsonLd, buildMetadata, SITE_URL } from '@/lib/seo';
import { routing } from '@/i18n/routing';
import { Section, SectionHeader } from '@/components/ui/Section';
import { SmartImage } from '@/components/ui/SmartImage';
import { Reveal } from '@/components/motion/Reveal';
import { BlogPreview } from '@/components/home/BlogPreview';
import { JsonLd } from '@/components/seo/JsonLd';

export async function generateStaticParams() {
  const data = await safeApi.sitemapData();
  return routing.locales.flatMap((locale) =>
    data.posts.map((post) => ({ locale, slug: post.slug })),
  );
}

export const dynamicParams = true;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: raw, slug } = await params;
  const locale = raw as Locale;

  try {
    const { post } = await api.post(slug);
    const record = post as unknown as Record<string, unknown>;

    return buildMetadata({
      title: pickExact(record, 'seoTitle', locale) || pick(record, 'title', locale),
      description: pickExact(record, 'seoDescription', locale) || pick(record, 'excerpt', locale),
      locale,
      pathUz: `/blog/${slug}`,
      pathRu: `/blog/${slug}`,
      image: post.coverImage,
      type: 'article',
      publishedTime: post.publishedAt,
    });
  } catch {
    return buildMetadata({
      title: 'Blog',
      description: '',
      locale,
      pathUz: `/blog/${slug}`,
      pathRu: `/blog/${slug}`,
      noIndex: true,
    });
  }
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: raw, slug } = await params;
  const locale = raw as Locale;
  setRequestLocale(locale);

  let data;
  try {
    data = await api.post(slug);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();

    /*
     * API'ga umuman yetib bo'lmadi (server o'chiq, tarmoq nosozligi).
     *
     * Build paytida bu OQIBATSIZ bo'lishi kerak: frontend'ni yig'ish uchun
     * backend ishlab turishi shart emas. Aks holda `npm run build` butunlay
     * to'xtaydi. Sahifa 404 sifatida yig'iladi va API ko'tarilgach ISR
     * uni o'zi qayta chizadi.
     *
     * Ishlash paytida esa xato yashirilmaydi — haqiqiy nosozlikni ko'rish kerak.
     */
    if (isApiUnreachable(err) && isBuildPhase) notFound();

    throw err;
  }

  const { post, related } = data;
  const record = post as unknown as Record<string, unknown>;

  const t = await getTranslations('blog');
  const tSections = await getTranslations('sections');

  const title = pick(record, 'title', locale);
  const body = pick(record, 'body', locale);
  const excerpt = pick(record, 'excerpt', locale);

  const breadcrumbs = breadcrumbJsonLd([
    { name: 'AYN TRAVEL', url: `${SITE_URL}/${locale}` },
    { name: tSections('blog'), url: `${SITE_URL}/${locale}/blog` },
    { name: title, url: `${SITE_URL}/${locale}/blog/${slug}` },
  ]);

  return (
    <>
      <article className="pt-24 lg:pt-28">
        <div className="container-page py-10">
          <div className="mx-auto max-w-3xl">
            <Reveal>
              <div className="mb-4 flex flex-wrap items-center gap-3 text-sm text-ink-subtle">
                {post.category && (
                  <span className="rounded-full bg-gold-500/10 px-3 py-1 text-xs font-bold text-accent">
                    {post.category}
                  </span>
                )}
                {post.publishedAt && (
                  <time dateTime={post.publishedAt}>
                    {formatDate(post.publishedAt, locale, true)}
                  </time>
                )}
                <span className="flex items-center gap-1">
                  <Clock className="size-3.5" aria-hidden="true" />
                  {t('readingTime', { count: post.readingTime })}
                </span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl">{title}</h1>

              {excerpt && <p className="mt-4 text-lg text-ink-muted">{excerpt}</p>}
            </Reveal>

            {post.coverImage && (
              <Reveal delay={0.1} className="mt-8">
                <div className="relative aspect-[16/9] overflow-hidden rounded-card border border-line">
                  <SmartImage
                    media={post.coverImage}
                    variant="wide"
                    alt={title}
                    locale={locale}
                    priority
                    sizes="(max-width: 1024px) 92vw, 768px"
                  />
                </div>
              </Reveal>
            )}

            {body && (
              <Reveal delay={0.1} className="mt-8">
                {/* Kontent admin paneldan, ishonchli manbadan keladi */}
                <div className="prose-tour" dangerouslySetInnerHTML={{ __html: body }} />
              </Reveal>
            )}

            {post.tags.length > 0 && (
              <div className="mt-10 flex flex-wrap gap-2 border-t border-line pt-6">
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-line-strong px-3 py-1 text-xs text-ink-muted"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </article>

      {related.length > 0 && (
        <Section className="bg-surface-sunken">
          <SectionHeader title={tSections('relatedPosts')} />
          <BlogPreview posts={related} locale={locale} />
        </Section>
      )}

      <JsonLd data={[blogPostingJsonLd(post, locale), breadcrumbs]} />
    </>
  );
}
