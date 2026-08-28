import { Router } from 'express';
import { toursRouter } from './tours.js';
import { contentRouter } from './content.js';
import { leadsRouter } from './leads.js';

export const publicRouter: Router = Router();

publicRouter.use('/tours', toursRouter);
publicRouter.use('/leads', leadsRouter);
publicRouter.use('/', contentRouter);
