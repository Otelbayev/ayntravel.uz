import { useTranslations } from 'next-intl';
import { ArrowRight, Clock } from 'lucide-react';
import type { Locale, PostDTO } from '@/shared';
import { pick } from '@/shared';
import { Link } from '@/i18n/routing';
import { formatDate } from '@/lib/format';
import { SmartImage } from '@/components/ui/SmartImage';
import { RevealGroup, RevealItem } from '@/components/motion/Reveal';

export function BlogPreview({ posts, locale }: { posts: PostDTO[]; locale: Locale }) {
  const t = useTranslations('blog');

  return (
    <RevealGroup className="grid gap-6 md:grid-cols-3">
      {posts.map((post) => {
        const record = post as unknown as Record<string, unknown>;
        const title = pick(record, 'title', locale);
        return (
          <RevealItem key={post.id}>
            <Link
              href={{ pathname: '/blog/[slug]', params: { slug: post.slug } }}
              className="group flex h-full flex-col overflow-hidden rounded-card border border-line bg-surface-raised transition-colors hover:border-gold-500/30"
            >
              {/* Muqova rasmi ustidagi bej — rasm to'q bo'lishi mumkin */}
              <div data-tone="dark" className="relative aspect-video overflow-hidden bg-navy-950">
                <SmartImage
                  media={post.coverImage}
                  variant="wide"
                  alt={title}
                  locale={locale}
                  className="transition-transform duration-700 group-hover:scale-105"
                  sizes="(max-width: 768px) 92vw, 30vw"
                />
                {post.category && (
                  <span className="absolute top-3 left-3 rounded-full bg-navy-950/80 px-2.5 py-1 text-[11px] font-bold text-accent backdrop-blur-sm">
                    {post.category}
                  </span>
                )}
              </div>

              <div className="flex flex-1 flex-col p-5">
                <div className="mb-2 flex items-center gap-3 text-xs text-ink-subtle">
                  {post.publishedAt && <time dateTime={post.publishedAt}>{formatDate(post.publishedAt, locale, true)}</time>}
                  <span className="flex items-center gap-1">
                    <Clock className="size-3" aria-hidden="true" />
                    {t('readingTime', { count: post.readingTime })}
                  </span>
                </div>

                <h3 className="font-display text-lg leading-snug font-bold text-ink transition-colors group-hover:text-accent">
                  {title}
                </h3>

                <p className="mt-2 line-clamp-2 flex-1 text-sm text-ink-muted">
                  {pick(record, 'excerpt', locale)}
                </p>

                <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-accent">
                  {t('readMore')}
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                </span>
              </div>
            </Link>
          </RevealItem>
        );
      })}
    </RevealGroup>
  );
}
