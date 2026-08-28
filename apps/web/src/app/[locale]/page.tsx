import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ArrowRight } from 'lucide-react';
import type { Locale } from '@ayntravel/shared';
import { api } from '@/lib/api';
import { DEFAULT_SETTINGS } from '@/lib/defaults';
import { buildMetadata, faqJsonLd } from '@/lib/seo';
import { routing, Link } from '@/i18n/routing';
import { Section, SectionHeader } from '@/components/ui/Section';
import { Button } from '@/components/ui/Button';
import { RevealGroup } from '@/components/motion/Reveal';
import { JsonLd } from '@/components/seo/JsonLd';
import { Hero } from '@/components/home/Hero';
import { PriceTicker } from '@/components/home/PriceTicker';
import { BentoTours } from '@/components/home/BentoTours';
import { TourGrid } from '@/components/home/TourGrid';
import { DestinationsRail } from '@/components/home/DestinationsRail';
import { ServicesSection } from '@/components/home/ServicesSection';
import { TestimonialsSection } from '@/components/home/TestimonialsSection';
import { FaqSection } from '@/components/home/FaqSection';
import { BlogPreview } from '@/components/home/BlogPreview';
import { ContactSection } from '@/components/home/ContactSection';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'meta' });

  return buildMetadata({
    title: t('defaultTitle'),
    description: t('defaultDescription'),
    locale: locale as Locale,
    pathUz: '',
    pathRu: '',
  });
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const locale = raw as Locale;
  setRequestLocale(locale);

  const t = await getTranslations('sections');
  const tTour = await getTranslations('tour');

  // Bosh sahifaning barcha bloklari bitta so'rovda keladi —
  // ketma-ket 8 ta so'rov o'rniga bitta, TTFB sezilarli tez.
  let data;
  try {
    data = await api.home();
  } catch {
    data = null;
  }

  const settings = data?.settings ?? DEFAULT_SETTINGS;
  const hotTours = data?.hotTours ?? [];
  const featuredTours = data?.featuredTours ?? [];
  const destinations = data?.destinations ?? [];
  const services = data?.services ?? [];
  const testimonials = data?.testimonials ?? [];
  const faqs = data?.faqs ?? [];
  const posts = data?.posts ?? [];

  // Tasmada goryashiy va tanlangan turlar birga — takrorlanmasin.
  const tickerTours = [...hotTours, ...featuredTours].filter(
    (tour, index, all) => all.findIndex((x) => x.id === tour.id) === index,
  );

  return (
    <>
      <Hero settings={settings} destinations={destinations} locale={locale} />

      {/* Narxlar birinchi ekrandan keyin darhol — «qanchaga?» savoliga javob */}
      <PriceTicker tours={tickerTours} locale={locale} />

      {hotTours.length > 0 && (
        <Section id="hot-tours">
          <SectionHeader
            eyebrow={t('hotTours')}
            title={t('hotToursSubtitle')}
            action={
              <Button asChild variant="outline">
                <Link href={{ pathname: '/turlar', query: { hot: 'true' } } as never}>
                  {tTour('viewAll')}
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </Button>
            }
          />
          <RevealGroup>
            <BentoTours tours={hotTours} locale={locale} />
          </RevealGroup>
        </Section>
      )}

      {destinations.length > 0 && (
        <Section id="destinations" className="bg-surface-sunken" bleed>
          <div className="container-page">
            <SectionHeader
              eyebrow={t('destinations')}
              title={t('destinationsSubtitle')}
            />
          </div>
          {/* Gorizontal tasma — konteynerdan tashqariga chiqadi */}
          <DestinationsRail destinations={destinations} locale={locale} />
        </Section>
      )}

      {featuredTours.length > 0 && (
        <Section id="tours">
          <SectionHeader
            eyebrow={t('featuredTours')}
            title={t('featuredToursSubtitle')}
            action={
              <Button asChild variant="outline">
                <Link href="/turlar">
                  {t('allTours')}
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </Button>
            }
          />
          <RevealGroup>
            <TourGrid tours={featuredTours} locale={locale} />
          </RevealGroup>
        </Section>
      )}

      {services.length > 0 && (
        <Section id="services" className="bg-surface-sunken">
          <SectionHeader
            eyebrow={t('services')}
            title={t('servicesSubtitle')}
            align="center"
          />
          <ServicesSection services={services} locale={locale} />
        </Section>
      )}

      {testimonials.length > 0 && (
        <Section id="testimonials">
          <SectionHeader
            eyebrow={t('testimonials')}
            title={t('testimonialsSubtitle')}
            align="center"
          />
          <TestimonialsSection testimonials={testimonials} locale={locale} />
        </Section>
      )}

      {posts.length > 0 && (
        <Section id="blog" className="bg-surface-sunken">
          <SectionHeader
            eyebrow={t('blog')}
            title={t('blogSubtitle')}
            action={
              <Button asChild variant="outline">
                <Link href="/blog">
                  {tTour('viewAll')}
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </Button>
            }
          />
          <BlogPreview posts={posts} locale={locale} />
        </Section>
      )}

      {faqs.length > 0 && (
        <Section id="faq">
          <SectionHeader eyebrow={t('faq')} title={t('faqSubtitle')} align="center" />
          <FaqSection faqs={faqs} locale={locale} />
          {/* Google natijalarida savollarni ochib ko'rsatishi mumkin */}
          <JsonLd data={faqJsonLd(faqs, locale)} />
        </Section>
      )}

      {/*
        Aloqa bloki to'q — bu sahifadagi asosiy konversiya nuqtasi.
        Oq kontentdan keyin to'q blok diqqatni keskin tortadi va
        pastdagi to'q footerga yumshoq o'tish beradi.
      */}
      <Section id="contact" tone="dark" className="bg-navy-900">
        <SectionHeader eyebrow={t('contact')} title={t('contactSubtitle')} align="center" />
        <ContactSection settings={settings} locale={locale} />
      </Section>
    </>
  );
}
