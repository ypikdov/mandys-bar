import { Router } from 'express';
import {
  discardDraft,
  getAdminSiteContent,
  getPublicGalleryItems,
  getPendingDrafts,
  getPublicSiteContent,
  publishDraft,
  saveSiteContent,
} from './site-content.controller.js';
import { authenticate, authorize } from '../../middlewares/auth.js';

const router = Router();

router.get('/public', getPublicSiteContent);
router.get('/gallery', getPublicGalleryItems);
router.get('/admin', authenticate, authorize(['ADMIN', 'MANAGER']), getAdminSiteContent);
router.get('/drafts', authenticate, authorize(['ADMIN', 'MANAGER']), getPendingDrafts);
router.put('/drafts/:id/publish', authenticate, authorize(['ADMIN', 'MANAGER']), publishDraft);
router.delete('/drafts/:id', authenticate, authorize(['ADMIN', 'MANAGER']), discardDraft);
router.put('/', authenticate, authorize(['ADMIN', 'MANAGER']), saveSiteContent);

export default router;
