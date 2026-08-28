import type { FieldDef } from '@/components/admin/crud-types';

/**
 * Oddiy modellar uchun maydon ta'riflari.
 *
 * Nega bitta joyda: ro'yxat sahifasi ham, forma sahifasi ham aynan shu
 * konfiguratsiyani o'qiydi. Maydon qo'shilsa, u ikkala joyda ham darhol
 * paydo bo'ladi va ular bir-biridan uzilib qolmaydi.
 */

export interface ModelConfig {
  /** Sahifa sarlavhasi — ko'plik shaklda. */
  title: string;
  /** Bitta yozuv nomi — «Yangi xizmat» kabi sarlavhalar uchun. */
  singular: string;
  /** Admin panel yo'li: /admin/<path> */
  path: string;
  endpoint: string;
  /** Ro'yxatda nom sifatida ko'rsatiladigan maydon. */
  titleField: string;
  emptyHint?: string;
  /** Server sahifalab qaytaradimi. */
  paginated?: boolean;
  sections: {
    title: string;
    hint?: string;
    /** Birinchi bo'lim doim ochiq — majburiy maydonlar shu yerda. */
    locked?: boolean;
    fields: FieldDef[];
  }[];
}

const STATUS_FIELD: FieldDef = {
  name: 'status',
  label: 'Holat',
  type: 'select',
  defaultValue: 'DRAFT',
  options: [
    { value: 'DRAFT', label: 'Qoralama' },
    { value: 'PUBLISHED', label: 'Nashr etilgan' },
  ],
};

const SEO_FIELDS: FieldDef[] = [
  {
    name: 'seoTitle',
    label: 'SEO sarlavha',
    type: 'text',
    bilingual: true,
    hint: 'Bo‘sh qoldirsangiz oddiy sarlavha ishlatiladi',
  },
  { name: 'seoDescription', label: 'SEO tavsif', type: 'textarea', bilingual: true },
];

export const MODELS: Record<string, ModelConfig> = {
  destinations: {
    title: 'Yo‘nalishlar',
    singular: 'yo‘nalish',
    path: 'destinations',
    endpoint: '/api/admin/destinations',
    titleField: 'nameUz',
    emptyHint:
      'Yo‘nalish — bu mamlakat yoki mintaqa (Turkiya, Dubay). Har biri alohida SEO sahifasiga ega bo‘ladi.',
    sections: [
      {
        title: 'Asosiy ma’lumot',
        hint: 'Shu maydonlar to‘ldirilsa yo‘nalish saytda ko‘rinadi.',
        locked: true,
        fields: [
          {
            name: 'name',
            label: 'Nomi',
            type: 'text',
            bilingual: true,
            required: true,
            placeholder: 'Turkiya',
          },
          { name: 'heroImageId', label: 'Asosiy rasm', type: 'media' },
          { name: 'description', label: 'Tavsif', type: 'textarea', bilingual: true },
          {
            name: 'isActive',
            label: 'Faol (saytda ko‘rinadi)',
            type: 'checkbox',
            defaultValue: true,
          },
        ],
      },
      {
        title: 'Qo‘shimcha',
        fields: [
          {
            name: 'countryCode',
            label: 'Mamlakat kodi',
            type: 'text',
            hint: 'ISO 2 harf: TR, AE, VN',
            placeholder: 'TR',
          },
          {
            name: 'sortOrder',
            label: 'Tartib raqami',
            type: 'number',
            defaultValue: 0,
            hint: 'Kichik raqam oldinroq turadi',
          },
        ],
      },
      {
        title: 'SEO va manzil',
        hint: 'Qidiruv tizimlarida qanday ko‘rinishini boshqaradi.',
        fields: [
          {
            name: 'slug',
            label: 'Sahifa manzili',
            type: 'slug',
            required: true,
            slugFrom: 'nameUz',
            hint: '/uz/yonalishlar/turkiya',
          },
          ...SEO_FIELDS,
        ],
      },
    ],
  },

  posts: {
    title: 'Blog',
    singular: 'maqola',
    path: 'posts',
    endpoint: '/api/admin/posts',
    titleField: 'titleUz',
    paginated: true,
    emptyHint:
      'Maqolalar qidiruvdan trafik olib keladi: viza, bagaj, yo‘nalishlar haqida yozing.',
    sections: [
      {
        title: 'Asosiy ma’lumot',
        hint: 'Sarlavha va matn — qolgani ixtiyoriy.',
        locked: true,
        fields: [
          { name: 'title', label: 'Sarlavha', type: 'text', bilingual: true, required: true },
          { name: 'coverImageId', label: 'Muqova rasmi', type: 'media' },
          {
            name: 'excerpt',
            label: 'Qisqa tavsif',
            type: 'textarea',
            bilingual: true,
            hint: 'Ro‘yxatda va Google natijalarida ko‘rinadi',
          },
          {
            name: 'body',
            label: 'Matn',
            type: 'html',
            bilingual: true,
            hint: 'HTML: <h2>, <p>, <ul>, <li>, <strong>, <a href="...">',
          },
          STATUS_FIELD,
        ],
      },
      {
        title: 'Qo‘shimcha',
        fields: [
          {
            name: 'category',
            label: 'Kategoriya',
            type: 'text',
            placeholder: 'Foydali',
            inTable: true,
          },
        ],
      },
      {
        title: 'SEO va manzil',
        fields: [
          {
            name: 'slug',
            label: 'Sahifa manzili',
            type: 'slug',
            required: true,
            slugFrom: 'titleUz',
            hint: '/uz/blog/vizasiz-davlatlar',
          },
          ...SEO_FIELDS,
        ],
      },
    ],
  },

  services: {
    title: 'Xizmatlar',
    singular: 'xizmat',
    path: 'services',
    endpoint: '/api/admin/services',
    titleField: 'titleUz',
    paginated: true,
    sections: [
      {
        title: 'Xizmat haqida',
        locked: true,
        fields: [
          { name: 'title', label: 'Nomi', type: 'text', bilingual: true, required: true },
          {
            name: 'icon',
            label: 'Belgi (ikonka)',
            type: 'select',
            options: [
              { value: 'plane', label: '✈️ Samolyot' },
              { value: 'ticket', label: '🎫 Chipta' },
              { value: 'hotel', label: '🏨 Mehmonxona' },
              { value: 'passport', label: '📘 Pasport / viza' },
              { value: 'bus', label: '🚐 Transport' },
              { value: 'briefcase', label: '💼 Biznes' },
            ],
          },
          { name: 'description', label: 'Tavsif', type: 'textarea', bilingual: true },
          { name: 'isActive', label: 'Faol', type: 'checkbox', defaultValue: true },
        ],
      },
      {
        title: 'Qo‘shimcha',
        fields: [
          { name: 'slug', label: 'Slug', type: 'slug', required: true, slugFrom: 'titleUz' },
          { name: 'sortOrder', label: 'Tartib raqami', type: 'number', defaultValue: 0 },
        ],
      },
    ],
  },

  faq: {
    title: 'Savol-javob',
    singular: 'savol',
    path: 'faq',
    endpoint: '/api/admin/faq',
    titleField: 'questionUz',
    paginated: true,
    emptyHint:
      'Bu savollar saytda akkordeon sifatida va Google uchun strukturalangan ma’lumot sifatida chiqadi.',
    sections: [
      {
        title: 'Savol va javob',
        locked: true,
        fields: [
          { name: 'question', label: 'Savol', type: 'text', bilingual: true, required: true },
          { name: 'answer', label: 'Javob', type: 'textarea', bilingual: true, required: true },
          { name: 'isActive', label: 'Faol', type: 'checkbox', defaultValue: true },
          { name: 'sortOrder', label: 'Tartib raqami', type: 'number', defaultValue: 0 },
        ],
      },
    ],
  },

  testimonials: {
    title: 'Mijoz fikrlari',
    singular: 'fikr',
    path: 'testimonials',
    endpoint: '/api/admin/testimonials',
    titleField: 'clientName',
    paginated: true,
    sections: [
      {
        title: 'Fikr',
        locked: true,
        fields: [
          { name: 'clientName', label: 'Mijoz ismi', type: 'text', required: true },
          { name: 'text', label: 'Fikr matni', type: 'textarea', bilingual: true, required: true },
          {
            name: 'rating',
            label: 'Baho',
            type: 'select',
            defaultValue: '5',
            options: [5, 4, 3, 2, 1].map((n) => ({ value: String(n), label: '★'.repeat(n) })),
          },
          { name: 'photoId', label: 'Mijoz rasmi', type: 'media' },
          {
            name: 'isPublished',
            label: 'Saytda ko‘rsatish',
            type: 'checkbox',
            defaultValue: true,
          },
        ],
      },
      {
        title: 'Qo‘shimcha',
        fields: [{ name: 'sortOrder', label: 'Tartib raqami', type: 'number', defaultValue: 0 }],
      },
    ],
  },

  users: {
    title: 'Foydalanuvchilar',
    singular: 'foydalanuvchi',
    path: 'users',
    endpoint: '/api/admin/users',
    titleField: 'name',
    emptyHint:
      'Menejerlar arizalarni ko‘radi va kontent qo‘shadi; administrator qo‘shimcha ravishda foydalanuvchilarni boshqaradi.',
    sections: [
      {
        title: 'Hisob ma’lumotlari',
        locked: true,
        fields: [
          { name: 'name', label: 'Ism', type: 'text', required: true },
          { name: 'email', label: 'Email', type: 'text', required: true, inTable: true },
          {
            name: 'password',
            label: 'Parol',
            type: 'password',
            hint: 'Tahrirlashda bo‘sh qoldirsangiz parol o‘zgarmaydi. Kamida 8 belgi.',
          },
          {
            name: 'role',
            label: 'Rol',
            type: 'select',
            defaultValue: 'MANAGER',
            options: [
              { value: 'MANAGER', label: 'Menejer' },
              { value: 'ADMIN', label: 'Administrator' },
            ],
            inTable: true,
          },
          { name: 'isActive', label: 'Faol', type: 'checkbox', defaultValue: true },
        ],
      },
    ],
  },
};

/** Bo'limlardagi barcha maydonlarni bitta ro'yxatga yig'adi. */
export function allFields(config: ModelConfig): FieldDef[] {
  return config.sections.flatMap((section) => section.fields);
}
