'use client';

import { useRef, useState, type FormEvent } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { motion, useScroll, useTransform, useReducedMotion } from 'motion/react';
import { ArrowDown, ArrowUpRight, CalendarDays, Compass, MapPin, Pause, Play, Search, ShieldCheck } from 'lucide-react';
import type { DestinationDTO, Locale, SiteSettings } from '@/shared';
import { pick } from '@/shared';
import { Link, useRouter } from '@/i18n/routing';
import { HeroBackground } from './HeroBackground';
import { TravelFilm } from './TravelFilm';
import { Tilt } from '@/components/motion/Tilt';

export function Hero({ settings, destinations, locale }: { settings: SiteSettings; destinations: DestinationDTO[]; locale: Locale }) {
  const t = useTranslations('hero');
  const ru = locale === 'ru';
  const router = useRouter();
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const [paused, setPaused] = useState(false);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], [0, 180]);
  const cardY = useTransform(scrollYProgress, [0, 1], [0, -110]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.12]);
  const title = ru ? settings.heroTitleRu : settings.heroTitleUz;

  function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const destination = String(form.get('destination') ?? '');
    const nights = String(form.get('nights') ?? '');
    router.push({ pathname: '/turlar', query: { ...(destination && { destination }), ...(nights && { nights }) } });
  }

  return (
    <section ref={ref} data-tone="dark" className="travel-hero relative isolate overflow-hidden">
      <motion.div className="absolute inset-0 -z-10" style={reduced ? undefined : { scale }}>
        <HeroBackground config={settings.heroBackgroundResolved} locale={locale} paused={paused} />
      </motion.div>
      <div className="hero-shade absolute inset-0 -z-10" aria-hidden="true" />
      <div className="container-page relative pt-32 pb-10 lg:pt-44">
        <div className="grid items-center gap-12 lg:grid-cols-[1.5fr_1fr]">
          <motion.div style={reduced ? undefined : { y }} className="relative z-10 max-w-3xl">
            <div className="mb-7 flex items-center gap-3 text-sm font-medium tracking-[0.15em] uppercase">
              <span className="h-px w-9 bg-gold-400" />
              {ru ? 'Весь мир начинается с вас' : 'Butun dunyo sizdan boshlanadi'}
            </div>
            <h1 className="hero-title">{title}</h1>
            <p className="mt-7 max-w-lg text-base leading-relaxed text-white/80 sm:text-lg">
              {ru ? settings.heroSubtitleRu : settings.heroSubtitleUz}
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-5">
              <Link href="/turlar" className="travel-button">
                {ru ? 'Выбрать путешествие' : 'Sayohatni tanlash'} <ArrowUpRight className="size-5" />
              </Link>
              <TravelFilm locale={locale} />
            </div>
            <p className="mt-9 flex items-center gap-2.5 text-sm text-white/75">
              <ShieldCheck className="size-4 text-gold-300" aria-hidden="true" />
              {ru ? 'Персональный подбор · Поддержка на каждом этапе' : 'Individual tanlov · Har bir bosqichda yordam'}
            </p>
          </motion.div>

          <motion.div style={reduced ? undefined : { y: cardY }} className="relative hidden justify-self-end lg:block">
            <Tilt max={7} className="w-[300px] xl:w-[330px]">
              <Link href={{ pathname: '/turlar', query: { search: ru ? 'Турция' : 'Turkiya' } }} className="hero-postcard group block">
                <div className="relative aspect-[4/5] overflow-hidden rounded-[18px]">
                  <Image src="/media/cappadocia.webp" alt={ru ? 'Воздушные шары над Каппадокией' : 'Kappadokiya uzra havo sharlari'} fill sizes="330px" className="object-cover transition-transform duration-700 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-navy-950/80 via-transparent to-transparent" />
                  <span className="absolute top-4 left-4 flex items-center gap-2 rounded-full bg-white/15 px-3 py-2 text-sm backdrop-blur-md"><Compass className="size-4" /> {ru ? 'Место для мечты' : 'Orzular manzili'}</span>
                  <div className="absolute right-5 bottom-5 left-5 flex items-end justify-between">
                    <div><p className="mb-2 text-sm text-white/75">{ru ? 'Турция' : 'Turkiya'}</p><h2 className="text-3xl">{ru ? 'Каппадокия' : 'Kappadokiya'}</h2></div>
                    <span className="flex size-10 items-center justify-center rounded-full border border-white/40"><ArrowUpRight className="size-5" /></span>
                  </div>
                </div>
                <div className="flex items-center justify-between px-2 pt-4 pb-2 text-sm"><span>{ru ? 'Новые впечатления ждут' : 'Yangi taassurotlar kutmoqda'}</span><span className="text-gold-300">01 / 03</span></div>
              </Link>
            </Tilt>
            <div className="absolute -bottom-6 -left-14 flex items-center gap-3 rounded-2xl border border-white/20 bg-navy-900/70 px-5 py-4 shadow-xl backdrop-blur-xl">
              <span className="flex size-11 items-center justify-center rounded-full bg-gold-400 text-navy-950"><MapPin className="size-5" /></span>
              <div><p className="text-xs text-white/60">{ru ? 'Отправная точка' : 'Boshlanish nuqtasi'}</p><p className="mt-1 font-semibold">{ru ? 'Ташкент → Весь мир' : 'Toshkent → Butun dunyo'}</p></div>
            </div>
          </motion.div>
        </div>

        <form onSubmit={search} role="search" aria-label={t('searchPlaceholder')} data-tone="light" className="hero-search relative z-20 mt-16 grid gap-4 rounded-2xl bg-white p-5 text-navy-900 sm:grid-cols-[1fr_1fr_auto] lg:mt-20 lg:p-6">
          <label className="flex items-center gap-4 sm:border-r sm:border-navy-900/10 sm:pr-5">
            <MapPin className="size-5 shrink-0 text-gold-ink" aria-hidden="true" />
            <span className="block min-w-0 flex-1"><span className="mb-1 block text-sm font-semibold">{ru ? 'Куда отправимся?' : 'Qayerga boramiz?'}</span>
              <select name="destination" className="w-full bg-transparent py-1 text-base text-navy-900/70" aria-label={ru ? 'Направление' : 'Yo‘nalish'}>
                <option value="">{ru ? 'Все направления' : 'Barcha yo‘nalishlar'}</option>
                {destinations.map((d) => <option key={d.id} value={d.slug}>{pick(d as unknown as Record<string, unknown>, 'name', locale)}</option>)}
              </select>
            </span>
          </label>
          <label className="flex items-center gap-4">
            <CalendarDays className="size-5 shrink-0 text-gold-ink" aria-hidden="true" />
            <span className="block flex-1"><span className="mb-1 block text-sm font-semibold">{ru ? 'Продолжительность' : 'Sayohat davomiyligi'}</span>
              <select name="nights" className="w-full bg-transparent py-1 text-base text-navy-900/70" aria-label={ru ? 'Количество ночей' : 'Tunlar soni'}>
                <option value="">{ru ? 'Любая' : 'Istalgan muddat'}</option>
                {[3, 5, 7, 10, 14].map((n) => <option value={n} key={n}>{n} {ru ? 'ночей' : 'kecha'}</option>)}
              </select>
            </span>
          </label>
          <button type="submit" className="travel-button justify-center"><Search className="size-5" />{t('searchButton')}</button>
        </form>
        <div className="mt-7 flex items-center justify-between gap-3 text-xs text-white/65 sm:text-sm">
          <a href="#explore" className="flex min-h-11 items-center gap-3 hover:text-white"><ArrowDown className="size-4" />{ru ? 'Листайте. Открывайте. Путешествуйте.' : 'Varaqlang. Kashf eting. Sayohat qiling.'}</a>
          <button type="button" onClick={() => setPaused(!paused)} className="flex min-h-11 items-center gap-2 hover:text-white" aria-pressed={paused} aria-label={paused ? (ru ? 'Продолжить фон' : 'Fonni davom ettirish') : (ru ? 'Остановить фон' : 'Fonni to‘xtatish')}>
            {paused ? <Play className="size-4" /> : <Pause className="size-4" />}<span className="hidden sm:inline">{ru ? 'Атмосфера путешествий' : 'Sayohat muhiti'}</span>
          </button>
        </div>
      </div>
    </section>
  );
}
