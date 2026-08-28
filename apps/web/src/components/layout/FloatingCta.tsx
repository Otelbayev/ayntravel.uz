'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Phone, Send, X, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface FloatingCtaProps {
  phone: string;
  telegram: string;
}

/**
 * Mobil qurilmada eng muhim element: ekranning pastida doim turadigan
 * qo'ng'iroq va Telegram tugmalari. O'zbekistonda mijozlarning katta qismi
 * arizani forma orqali emas, to'g'ridan-to'g'ri qo'ng'iroq orqali qoldiradi.
 *
 * Hero'dan o'tgandan keyingina chiqadi — birinchi ekranni to'sib qo'ymaydi.
 */
export function FloatingCta({ phone, telegram }: FloatingCtaProps) {
  const t = useTranslations('contact');
  const [visible, setVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 600);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          transition={{ duration: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
          className="fixed right-4 bottom-4 z-40 flex flex-col items-end gap-3 sm:right-6 sm:bottom-6"
        >
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.9 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col gap-2.5"
              >
                <a
                  href={`tel:${phone}`}
                  className="flex items-center gap-2.5 rounded-full bg-gold-500 py-3 pr-5 pl-4 font-bold text-navy-950 shadow-xl transition-transform hover:scale-105"
                >
                  <Phone className="size-5" aria-hidden="true" />
                  {t('callUs')}
                </a>
                <a
                  href={telegram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 rounded-full bg-[#2AABEE] py-3 pr-5 pl-4 font-bold text-ink shadow-xl transition-transform hover:scale-105"
                >
                  <Send className="size-5" aria-hidden="true" />
                  {t('writeUs')}
                </a>
              </motion.div>
            )}
          </AnimatePresence>

          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            aria-label={expanded ? 'Yopish' : t('callUs')}
            className="animate-pulse-gold flex size-14 items-center justify-center rounded-full bg-gradient-to-br from-gold-300 to-gold-500 text-navy-950 shadow-2xl transition-transform hover:scale-105 active:scale-95"
          >
            {expanded ? <X className="size-6" /> : <MessageCircle className="size-6" />}
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
