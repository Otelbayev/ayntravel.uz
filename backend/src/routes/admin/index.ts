import { Router } from 'express';
import { faqSchema, pageSchema, serviceSchema, testimonialSchema } from '../../shared/index.js';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { createCrudRouter } from './crud.js';
import { adminToursRouter } from './tours.js';
import { adminPostsRouter } from './posts.js';
import { adminDestinationsRouter } from './destinations.js';
import { adminLeadsRouter } from './leads.js';
import { adminMediaRouter } from './media.js';
import { adminDashboardRouter } from './dashboard.js';
import { adminSettingsRouter } from './settings.js';
import { adminUsersRouter } from './users.js';
import { toFaq, toPage, toService, toTestimonial, testimonialInclude } from '../../services/dto.js';
import { CacheTags } from '../../services/revalidate.js';

export const adminRouter: Router = Router();

// Butun /api/admin daraxti avtorizatsiya ortida.
adminRouter.use(requireAuth);

adminRouter.use('/dashboard', adminDashboardRouter);
adminRouter.use('/leads', adminLeadsRouter);
adminRouter.use('/tours', adminToursRouter);
adminRouter.use('/posts', adminPostsRouter);
adminRouter.use('/destinations', adminDestinationsRouter);
adminRouter.use('/media', adminMediaRouter);
adminRouter.use('/settings', adminSettingsRouter);

// Foydalanuvchilarni faqat ADMIN boshqaradi.
adminRouter.use('/users', requireRole('ADMIN'), adminUsersRouter);

// Oddiy modellar — umumiy CRUD fabrikasi orqali.
adminRouter.use(
  '/services',
  createCrudRouter({
    model: 'service',
    schema: serviceSchema,
    orderBy: [{ sortOrder: 'asc' }],
    toDto: toService,
    cacheTags: [CacheTags.services],
    cachePaths: ['/uz/xizmatlar', '/ru/uslugi'],
  }),
);

adminRouter.use(
  '/faq',
  createCrudRouter({
    model: 'faq',
    schema: faqSchema,
    orderBy: [{ sortOrder: 'asc' }],
    toDto: toFaq,
    cacheTags: [CacheTags.faq],
  }),
);

adminRouter.use(
  '/testimonials',
  createCrudRouter({
    model: 'testimonial',
    schema: testimonialSchema,
    include: testimonialInclude,
    orderBy: [{ sortOrder: 'asc' }],
    toDto: toTestimonial,
    cacheTags: [CacheTags.testimonials],
  }),
);

adminRouter.use(
  '/pages',
  createCrudRouter({
    model: 'page',
    schema: pageSchema,
    orderBy: [{ slug: 'asc' }],
    toDto: toPage,
    cacheTags: [CacheTags.pages, CacheTags.sitemap],
    cachePaths: [
      '/uz/biz-haqimizda', '/ru/o-nas',
      '/uz/ommaviy-oferta', '/ru/oferta',
      '/uz/maxfiylik-siyosati', '/ru/konfidencialnost',
      '/sitemap.xml',
    ],
  }),
);
