/**
 * Reklama manbasini birinchi tashrifda saqlaymiz.
 *
 * Nega sessionStorage: foydalanuvchi Instagram'dagi linkdan kirib, bir necha
 * sahifa aylanib, keyin ariza qoldiradi. UTM faqat birinchi URL'da bo'ladi —
 * saqlamasak, lid manbasi "noma'lum" bo'lib qoladi va reklama samarasini
 * o'lchab bo'lmaydi.
 */

const KEY = 'ayn_utm';

export interface UtmData {
  source?: string;
  medium?: string;
  campaign?: string;
  content?: string;
  term?: string;
  referrer?: string;
  landingPage?: string;
}

export function captureUtm(): void {
  if (typeof window === 'undefined') return;

  try {
    // Allaqachon saqlangan bo'lsa ustiga yozmaymiz — birinchi manba muhimroq.
    if (sessionStorage.getItem(KEY)) return;

    const params = new URLSearchParams(window.location.search);
    const data: UtmData = {
      source: params.get('utm_source') ?? undefined,
      medium: params.get('utm_medium') ?? undefined,
      campaign: params.get('utm_campaign') ?? undefined,
      content: params.get('utm_content') ?? undefined,
      term: params.get('utm_term') ?? undefined,
      referrer: document.referrer || undefined,
      landingPage: window.location.pathname,
    };

    // UTM ham, referrer ham bo'lmasa saqlashning ma'nosi yo'q.
    const hasSignal = Object.entries(data).some(
      ([key, value]) => value && key !== 'landingPage',
    );
    if (!hasSignal) return;

    sessionStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    // Private rejimda sessionStorage taqiqlangan bo'lishi mumkin — muhim emas.
  }
}

export function getUtm(): UtmData | undefined {
  if (typeof window === 'undefined') return undefined;
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as UtmData) : undefined;
  } catch {
    return undefined;
  }
}
