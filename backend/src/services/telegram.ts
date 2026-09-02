import { formatUzPhone, LEAD_STATUS_LABELS } from '../shared/index.js';
import { env } from '../env.js';
import { logger } from '../logger.js';

const API_BASE = 'https://api.telegram.org';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export interface LeadNotification {
  id: string;
  name: string;
  phone: string;
  message?: string | null;
  source: string;
  locale: string;
  tourTitle?: string | null;
  tourSlug?: string | null;
  utm?: Record<string, unknown> | null;
  createdAt: Date;
}

const SOURCE_LABELS: Record<string, string> = {
  hero: 'Bosh sahifa (hero)',
  tour_page: 'Tur sahifasi',
  destination_page: 'Yo‘nalish sahifasi',
  contact_page: 'Aloqa sahifasi',
  floating_cta: 'Suzuvchi tugma',
  blog: 'Blog',
  other: 'Boshqa',
};

function buildMessage(lead: LeadNotification): string {
  const lines: string[] = [];
  lines.push('🔔 <b>YANGI ARIZA</b>');
  lines.push('');
  lines.push(`👤 <b>Ism:</b> ${escapeHtml(lead.name)}`);
  lines.push(`📞 <b>Telefon:</b> <a href="tel:${lead.phone}">${formatUzPhone(lead.phone)}</a>`);

  if (lead.tourTitle) {
    const tourLink = lead.tourSlug ? `${env.WEB_URL}/uz/turlar/${lead.tourSlug}` : null;
    lines.push(
      `🧳 <b>Tur:</b> ${tourLink ? `<a href="${tourLink}">${escapeHtml(lead.tourTitle)}</a>` : escapeHtml(lead.tourTitle)}`,
    );
  }

  if (lead.message?.trim()) {
    lines.push(`💬 <b>Izoh:</b> ${escapeHtml(lead.message.trim())}`);
  }

  lines.push(`📍 <b>Manba:</b> ${escapeHtml(SOURCE_LABELS[lead.source] ?? lead.source)}`);
  lines.push(`🌐 <b>Til:</b> ${lead.locale === 'ru' ? 'Ruscha' : 'O‘zbekcha'}`);

  const utmSource = lead.utm?.source;
  if (typeof utmSource === 'string' && utmSource) {
    const campaign = typeof lead.utm?.campaign === 'string' ? ` / ${lead.utm.campaign}` : '';
    lines.push(`📣 <b>Reklama:</b> ${escapeHtml(utmSource + campaign)}`);
  }

  const time = lead.createdAt.toLocaleString('ru-RU', { timeZone: 'Asia/Tashkent' });
  lines.push(`🕒 ${escapeHtml(time)} (Toshkent)`);
  lines.push('');
  lines.push(`<a href="${env.WEB_URL}/admin/leads/${lead.id}">Admin panelda ochish →</a>`);

  return lines.join('\n');
}

async function callTelegram(method: string, payload: unknown): Promise<boolean> {
  if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) {
    logger.warn('Telegram sozlanmagan (TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID) — xabar yuborilmadi');
    return false;
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(`${API_BASE}/bot${env.TELEGRAM_BOT_TOKEN}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    if (!res.ok) {
      logger.error({ status: res.status, body: await res.text() }, 'Telegram API xatosi');
      return false;
    }
    return true;
  } catch (err) {
    logger.error({ err }, 'Telegram so‘rovi muvaffaqiyatsiz');
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Yangi lid haqida menejerlar guruhiga xabar yuboradi.
 *
 * MUHIM: bu funksiya hech qachon `throw` qilmaydi va hech qachon lidni
 * saqlashni to'xtatmaydi. Telegram ishlamay qolsa ham ariza bazada qoladi va
 * admin panelda ko'rinadi — biznes uchun eng muhimi shu.
 */
export async function notifyNewLead(lead: LeadNotification): Promise<boolean> {
  const text = buildMessage(lead);

  // Ikki urinish: tarmoq uzilishi ko'p uchraydigan holat.
  for (let attempt = 1; attempt <= 2; attempt++) {
    const sent = await callTelegram('sendMessage', {
      chat_id: env.TELEGRAM_CHAT_ID,
      text,
      parse_mode: 'HTML',
      disable_web_page_preview: true,
    });
    if (sent) return true;
    if (attempt === 1) await new Promise((r) => setTimeout(r, 1500));
  }

  logger.error({ leadId: lead.id }, 'Lid haqida Telegram xabari yuborilmadi');
  return false;
}

/** Lid statusi o'zgarganda ixtiyoriy xabar (masalan "sotildi"). */
export async function notifyLeadStatus(
  lead: { id: string; name: string; phone: string },
  status: keyof typeof LEAD_STATUS_LABELS,
  byName: string,
): Promise<void> {
  if (status !== 'BOOKED') return; // faqat muhim o'zgarishlar
  await callTelegram('sendMessage', {
    chat_id: env.TELEGRAM_CHAT_ID,
    text:
      `✅ <b>Band qilindi!</b>\n\n` +
      `👤 ${escapeHtml(lead.name)} — ${formatUzPhone(lead.phone)}\n` +
      `👔 Menejer: ${escapeHtml(byName)}`,
    parse_mode: 'HTML',
    disable_web_page_preview: true,
  });
}
