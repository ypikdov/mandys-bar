import { Router } from 'express';
import {
  getPublicProducts,
  getAdminProducts,
  createProduct,
  updateProduct,
  updateProductActive,
  deleteProduct,
} from './products.controller.js';
import { authenticate, authorize } from '../../middlewares/auth.js';

const router = Router();

// Public route to view products (used by the storefront)
router.get('/', getPublicProducts);
router.get('/admin', authenticate, authorize(['ADMIN', 'MANAGER', 'VENTAS']), getAdminProducts);

// Protected routes for management
router.post('/', authenticate, authorize(['ADMIN', 'MANAGER']), createProduct);
router.patch('/:id/active', authenticate, authorize(['ADMIN', 'MANAGER']), updateProductActive);
router.put('/:id', authenticate, authorize(['ADMIN', 'MANAGER']), updateProduct);
router.delete('/:id', authenticate, authorize(['ADMIN']), deleteProduct);

export default router;
