'use client';

import { useRef } from 'react';
import { useTranslations } from 'next-intl';
import { motion, useScroll, useTransform, useReducedMotion } from 'motion/react';
import { ChevronDown, Search, Sparkles } from 'lucide-react';
import type { DestinationDTO, Locale, SiteSettings } from '@/shared';
import { pick } from '@/shared';
import { useRouter } from '@/i18n/routing';
import { CountUp } from '@/components/motion/CountUp';
import { HeroBackground } from '@/components/home/HeroBackground';
import { Button } from '@/components/ui/Button';

interface HeroProps {
  settings: SiteSettings;
  destinations: DestinationDTO[];
  locale: Locale;
}

/**
 * Bosh ekran. Uchta qatlam turli tezlikda siljiydi (parallaks) — bu
 * chuqurlik hissini beradi va foydalanuvchini pastga scroll qilishga undaydi.
 *
 * LCP QAYSI ELEMENT — fon rejimiga bog'liq (admin paneldan tanlanadi):
 *  • gradient  — sarlavha matni; fon CSS gradienti, hech narsa kutmaydi;
 *  • slayd-shou — birinchi slayd rasmi, u `priority` bilan yuklanadi;
 *  • video     — poster rasmi. Video SSR'da umuman yo'q, u gidratatsiyadan
 *    keyin mount bo'ladi, ya'ni LCP'ni hech qachon kechiktira olmaydi.
 *
 * Har uch holatda ham brend gradienti birinchi chiziladi — oq ekran bo'lmaydi.
 */
export function Hero({ settings, destinations, locale }: HeroProps) {
  const t = useTranslations('hero');
  const tStats = useTranslations('stats');
  const router = useRouter();
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start'],
  });

  // Matn fondan tezroq yuqoriga ketadi va asta so'nadi.
  const textY = useTransform(scrollYProgress, [0, 1], ['0%', '55%']);
  const opacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);
  const glowY = useTransform(scrollYProgress, [0, 1], ['0%', '25%']);

  const heroTitle = locale === 'ru' ? settings.heroTitleRu : settings.heroTitleUz;
  const heroSubtitle = locale === 'ru' ? settings.heroSubtitleRu : settings.heroSubtitleUz;

  function handleSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = new FormData(event.currentTarget).get('q');
    const search = typeof value === 'string' ? value.trim() : '';
    router.push({ pathname: '/turlar', query: search ? { search } : {} } as never);
  }

  const stats = [
    { value: settings.stats.toursCount, label: tStats('tours'), suffix: '+' },
    { value: settings.stats.clientsCount, label: tStats('clients'), suffix: '+' },
    { value: settings.stats.followersCount, label: tStats('followers'), suffix: '' },
    { value: settings.stats.yearsCount, label: tStats('years'), suffix: '' },
  ];

  return (
    <section
      ref={ref}
      // Hero — sahifadagi eng katta to'q blok. Oq fon ustida u brend
      // kuchini saqlaydi va posterlardagi navy+oltin tilini takrorlaydi.
      data-tone="dark"
      className="relative flex min-h-[100svh] items-center overflow-hidden pt-20 pb-16"
    >
      {/* Fon: gradient / slayd-shou / video — adminda tanlanadi */}
      <HeroBackground config={settings.heroBackgroundResolved} locale={locale} />

      <motion.div
        style={reduced ? undefined : { y: glowY }}
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
      >
        <div className="absolute top-[-10%] left-[10%] size-[36rem] rounded-full bg-gold-500/8 blur-[120px]" />
        <div className="absolute right-[5%] bottom-[10%] size-[30rem] rounded-full bg-navy-500/25 blur-[100px]" />
      </motion.div>

      {/* Nozik to'r — tekis fonga tekstura beradi */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        aria-hidden="true"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.6) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
        }}
      />

      <motion.div
        style={reduced ? undefined : { y: textY, opacity }}
        className="container-page relative z-10"
      >
        <div className="mx-auto max-w-4xl text-center">
          <motion.span
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-gold-500/30 bg-gold-500/8 px-4 py-2 text-xs font-semibold tracking-wide text-accent uppercase"
          >
            <Sparkles className="size-3.5" aria-hidden="true" />
            {t('badge')}
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.08 }}
            className="type-display"
          >
            <span className="text-gold-gradient">{heroTitle}</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.16 }}
            className="type-lead mx-auto mt-6 max-w-2xl"
          >
            {heroSubtitle}
          </motion.p>

          {/* Qidiruv */}
          <motion.form
            onSubmit={handleSearch}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.24 }}
            className="mx-auto mt-9 flex w-full max-w-2xl flex-col gap-3 sm:flex-row"
            role="search"
          >
            <div className="relative flex-1">
              <Search
                className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-ink-subtle"
                aria-hidden="true"
              />
              <input
                type="search"
                name="q"
                placeholder={t('searchPlaceholder')}
                aria-label={t('searchPlaceholder')}
                className="h-14 w-full rounded-xl border border-line-strong bg-ink/5 pr-4 pl-12 text-ink backdrop-blur-sm placeholder:text-ink-subtle focus:border-gold-500/60 focus:outline-none"
              />
            </div>
            <Button type="submit" size="lg" className="sm:w-auto">
              {t('searchButton')}
            </Button>
          </motion.form>

          {/* Tez yo'nalish linklari */}
          {destinations.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.32 }}
              className="mt-5 flex flex-wrap items-center justify-center gap-2"
            >
              {destinations.slice(0, 6).map((destination) => (
                <button
                  key={destination.id}
                  type="button"
                  onClick={() =>
                    router.push({
                      pathname: '/yonalishlar/[slug]',
                      params: { slug: destination.slug },
                    })
                  }
                  className="rounded-full border border-line-strong px-3.5 py-1.5 text-xs font-medium text-ink/70 transition-colors hover:border-gold-500/50 hover:text-accent"
                >
                  {pick(destination as unknown as Record<string, unknown>, 'name', locale)}
                </button>
              ))}
            </motion.div>
          )}

          {/* Statistika — raqamlar ko'rinishga kirganda sanaladi */}
          <motion.dl
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mx-auto mt-14 grid max-w-3xl grid-cols-2 gap-6 sm:grid-cols-4"
          >
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <dt className="sr-only">{stat.label}</dt>
                <dd>
                  <span className="text-gold-gradient font-display block text-3xl font-black sm:text-4xl">
                    <CountUp value={stat.value} suffix={stat.suffix} />
                  </span>
                  <span className="mt-1 block text-xs text-ink-subtle sm:text-sm">
                    {stat.label}
                  </span>
                </dd>
              </div>
            ))}
          </motion.dl>
        </div>
      </motion.div>

      {/* Pastga suring ishorasi */}
      <motion.div
        style={reduced ? undefined : { opacity }}
        className="absolute inset-x-0 bottom-8 flex justify-center"
        aria-hidden="true"
      >
        <motion.div
          animate={reduced ? undefined : { y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="flex flex-col items-center gap-1.5 text-ink-subtle"
        >
          <span className="text-[11px] tracking-widest uppercase">{t('scrollHint')}</span>
          <ChevronDown className="size-4" />
        </motion.div>
      </motion.div>
    </section>
  );
}
