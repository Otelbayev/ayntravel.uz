import { useTranslations } from 'next-intl';
import { ArrowRight, Clock } from 'lucide-react';
import type { Locale, PostDTO } from '@/shared';
import { pick } from '@/shared';
import { Link } from '@/i18n/routing';
import { formatDate } from '@/lib/format';
import { SmartImage } from '@/components/ui/SmartImage';
import { ScrollScale } from '@/components/motion/Parallax';
import { Reveal } from '@/components/motion/Reveal';
import { Tilt } from '@/components/motion/Tilt';
import { cn } from '@/lib/utils';

interface Props {
  posts: PostDTO[];
  locale: Locale;
}

interface CardProps {
  post: PostDTO;
  locale: Locale;
  /** `lg` — birinchi, «lead» maqola; `sm` — yonidagi kichiklar. */
  size: 'lg' | 'sm';
  readingLabel: string;
  readMore: string;
}

function PostCard({ post, locale, size, readingLabel, readMore }: CardProps) {
  const record = post as unknown as Record<string, unknown>;
  const title = pick(record, 'title', locale);
  const isLead = size === 'lg';

  const cover = (
    <div
      data-tone="dark"
      className={cn(
        'relative overflow-hidden bg-navy-950',
        isLead ? 'aspect-[16/10]' : 'aspect-video',
      )}
    >
      <SmartImage
        media={post.coverImage}
        variant="wide"
        alt={title}
        locale={locale}
        className="transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105"
        sizes={isLead ? '(max-width: 1024px) 92vw, 62vw' : '(max-width: 1024px) 92vw, 30vw'}
      />
      {/* Hoverda muqova quyuqlashadi — kartochka "yaqinlashgandek" bo'ladi */}
      <div className="absolute inset-0 bg-navy-950/0 transition-colors duration-500 group-hover:bg-navy-950/25" />
      {post.category && (
        <span className="animate-shimmer absolute top-3 left-3 rounded-full bg-navy-950/80 bg-[linear-gradient(110deg,transparent_35%,rgba(245,200,66,.25)_50%,transparent_65%)] px-2.5 py-1 text-[11px] font-bold text-accent backdrop-blur-sm">
          {post.category}
        </span>
      )}
    </div>
  );

  return (
    <Tilt className="h-full" max={isLead ? 3 : 5}>
      <Link
        href={{ pathname: '/blog/[slug]', params: { slug: post.slug } }}
        className="group flex h-full flex-col overflow-hidden rounded-card border border-line bg-surface-raised transition-[border-color,box-shadow] duration-300 hover:border-gold-500/40 hover:shadow-card-hover"
      >
        {/* Katta muqovada scroll bo'yicha yengil kattalashuv */}
        {isLead ? <ScrollScale className="overflow-hidden">{cover}</ScrollScale> : cover}

        <div className={cn('flex flex-1 flex-col', isLead ? 'p-6 sm:p-7' : 'p-5')}>
          <div className="mb-2 flex items-center gap-3 text-xs text-ink-subtle">
            {post.publishedAt && (
              <time dateTime={post.publishedAt}>{formatDate(post.publishedAt, locale, true)}</time>
            )}
            <span className="flex items-center gap-1">
              <Clock className="size-3" aria-hidden="true" />
              {readingLabel}
            </span>
          </div>

          <h3
            className={cn(
              'font-display leading-snug font-bold text-ink transition-colors group-hover:text-accent',
              isLead ? 'text-2xl sm:text-3xl' : 'text-lg',
            )}
          >
            {title}
          </h3>

          <p
            className={cn(
              'mt-2 flex-1 text-sm text-ink-muted',
              isLead ? 'line-clamp-3 sm:text-base' : 'line-clamp-2',
            )}
          >
            {pick(record, 'excerpt', locale)}
          </p>

          <span className="mt-4 inline-flex w-fit flex-col gap-1 text-sm font-semibold text-accent">
            <span className="inline-flex items-center gap-1.5">
              {readMore}
              <ArrowRight
                className="size-4 transition-transform group-hover:translate-x-1"
                aria-hidden="true"
              />
            </span>
            {/* Oltin chiziq chapdan o'ngga chiziladi */}
            <span
              aria-hidden="true"
              className="h-px w-full origin-left scale-x-0 bg-gradient-to-r from-gold-500 to-transparent transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-x-100"
            />
          </span>
        </div>
      </Link>
    </Tilt>
  );
}

/**
 * Bosh sahifadagi blog bloki.
 *
 * Maket ataylab assimetrik: birinchi maqola katta «lead» kartochka, qolgani
 * kichik. Teng uch ustun jurnalga emas, ro'yxatga o'xshaydi — bu yerda esa
 * eng yangi maqolaga urg'u berish kerak.
 */
export function BlogPreview({ posts, locale }: Props) {
  const t = useTranslations('blog');
  if (posts.length === 0) return null;

  const [lead, ...rest] = posts;

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Reveal className="lg:col-span-2 lg:row-span-2" blur>
        <PostCard
          post={lead!}
          locale={locale}
          size="lg"
          readingLabel={t('readingTime', { count: lead!.readingTime })}
          readMore={t('readMore')}
        />
      </Reveal>

      {rest.map((post, index) => (
        <Reveal key={post.id} delay={0.08 * (index + 1)} blur>
          <PostCard
            post={post}
            locale={locale}
            size="sm"
            readingLabel={t('readingTime', { count: post.readingTime })}
            readMore={t('readMore')}
          />
        </Reveal>
      ))}
    </div>
  );
}
