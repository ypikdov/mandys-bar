import { Router } from 'express';
import { getAllUsers, getAllStaff, createClient, createStaff, changeUserRole } from './users.controller.js';
import { authenticate, authorize } from '../../middlewares/auth.js';

const router = Router();

// Clientes (role=USER)
router.get('/', authenticate, authorize(['ADMIN', 'MANAGER', 'VENTAS']), getAllUsers);
router.post('/', authenticate, authorize(['ADMIN']), createClient);

// Personal (role!=USER)
router.get('/staff', authenticate, authorize(['ADMIN', 'MANAGER']), getAllStaff);
router.post('/staff', authenticate, authorize(['ADMIN']), createStaff);
router.put('/:id/role', authenticate, authorize(['ADMIN']), changeUserRole);

export default router;
