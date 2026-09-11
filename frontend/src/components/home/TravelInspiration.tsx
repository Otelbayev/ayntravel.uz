import Image from 'next/image';
import { ArrowUpRight } from 'lucide-react';
import type { Locale } from '@/shared';
import { Link } from '@/i18n/routing';
import { Tilt } from '@/components/motion/Tilt';
import { RevealGroup, RevealItem } from '@/components/motion/Reveal';

/** Editorial destinations carry no invented inventory, prices or availability. */
export function TravelInspiration({ locale }: { locale: Locale }) {
  const ru = locale === 'ru';
  const places = [
    { image: 'maldives', name: ru ? 'Мальдивы' : 'Maldiv orollari', label: ru ? 'Океан. Тишина. Вы.' : 'Okean. Sokinlik. Siz.', note: ru ? 'Островной отдых' : 'Orollar bag‘rida dam' },
    { image: 'cappadocia', name: ru ? 'Каппадокия' : 'Kappadokiya', label: ru ? 'Чуть ближе к небу.' : 'Osmonga bir qadam yaqin.', note: ru ? 'Новые впечатления' : 'Yangi taassurotlar' },
    { image: 'istanbul', name: ru ? 'Стамбул' : 'Istanbul', label: ru ? 'На встрече двух миров.' : 'Ikki dunyo uchrashgan joy.', note: ru ? 'Ритм большого города' : 'Shahar nafasi' },
  ];
  return <RevealGroup className="grid gap-5 md:grid-cols-3">
    {places.map((place, i) => <RevealItem key={place.image}>
      <Tilt max={4} className="h-full">
        <Link href={{ pathname: '/aloqa', query: { destination: place.name } }} className="group relative block aspect-[4/5] overflow-hidden rounded-2xl" data-tone="dark">
          <Image src={`/media/${place.image}.webp`} alt={place.name} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover object-bottom transition-transform duration-700 group-hover:scale-105" />
          <div className="absolute inset-0 bg-gradient-to-t from-navy-950/95 via-navy-950/5 to-navy-950/15" />
          <div className="absolute top-5 right-5 left-5 flex justify-between text-sm"><span className="rounded-full border border-white/25 bg-navy-950/20 px-3 py-1.5 backdrop-blur-md">{place.note}</span><span className="py-1.5">0{i + 1}</span></div>
          <div className="absolute right-6 bottom-6 left-6"><p className="mb-3 text-sm text-white/80">{place.label}</p><h3 className="text-3xl lg:text-4xl">{place.name}</h3><div className="mt-6 flex items-center justify-between border-t border-white/25 pt-4 text-sm"><span>{ru ? 'Подобрать путешествие' : 'Sayohatni rejalashtirish'}</span><ArrowUpRight className="size-5" /></div></div>
        </Link>
      </Tilt>
    </RevealItem>)}
  </RevealGroup>;
}
