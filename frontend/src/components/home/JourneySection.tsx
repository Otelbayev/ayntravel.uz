'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform, useReducedMotion } from 'motion/react';
import { ArrowUpRight, Globe2 } from 'lucide-react';
import type { Locale } from '@/shared';
import { Link } from '@/i18n/routing';
import { TravelGlobe } from './TravelGlobe';

export function JourneySection({ locale }: { locale: Locale }) {
  const ru = locale === 'ru';
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], [50, -50]);
  const steps = ru ? [
    ['Расскажите о мечте', 'Выберите направление, удобные даты и бюджет. Мы поможем определиться с форматом отдыха.'],
    ['Получите свой маршрут', 'Подберём перелёт, отель и трансфер. Согласуем состав тура и итоговую стоимость до бронирования.'],
    ['Отправляйтесь навстречу миру', 'Подготовим документы и останемся на связи по вопросам вашего путешествия.'],
  ] : [
    ['Orzuingizni ayting', 'Yo‘nalish, qulay sana va byudjetingizni belgilang. Dam olish turini tanlashga yordam beramiz.'],
    ['Sizga mos sayohatni tanlang', 'Parvoz, mehmonxona va transferni birga tanlaymiz. Tarkib va yakuniy narxni bron qilishdan oldin kelishamiz.'],
    ['Dunyo sari yo‘l oling', 'Hujjatlarni tayyorlashga yordam beramiz va sayohatingiz bo‘yicha savollarda aloqada bo‘lamiz.'],
  ];
  return <section ref={ref} data-tone="dark" className="journey-section py-20 lg:py-28">
    <div className="container-page grid items-start gap-8 lg:grid-cols-2 lg:gap-20">
      <div className="lg:sticky lg:top-24">
        <p className="eyebrow mb-5 flex items-center gap-2"><Globe2 className="size-4" /> AYN TRAVEL</p>
        <h2 className="type-h2 max-w-xl">{ru ? 'От первой мечты — до новых воспоминаний.' : 'Ilk orzudan — unutilmas xotiralargacha.'}</h2>
        <motion.div style={reduced ? undefined : { y }} className="mx-auto -my-5 max-w-[520px] lg:-mx-6"><TravelGlobe progress={scrollYProgress} /></motion.div>
        <p className="text-center text-sm text-ink-muted">{ru ? 'Ташкент. Ваша точка отправления.' : 'Toshkent. Sizning boshlanish nuqtangiz.'}</p>
      </div>
      <div className="lg:pt-10">
        {steps.map(([title, description], i) => <motion.article key={title} initial={false} whileInView={{ opacity: 1 }} className="journey-step">
          <span className="mb-5 block font-display text-sm text-gold-300">0{i + 1} <span className="ml-3 text-ink-muted">/ 03</span></span>
          <h3 className="text-2xl font-semibold lg:text-3xl">{title}</h3><p className="mt-4 max-w-md text-base leading-7 text-ink-muted">{description}</p>
        </motion.article>)}
        <Link href="/aloqa" className="travel-button mt-8">{ru ? 'Обсудить путешествие' : 'Sayohatni rejalashtirish'}<ArrowUpRight className="size-5" /></Link>
      </div>
    </div>
  </section>;
}
