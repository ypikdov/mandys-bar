import { Router } from 'express';
import {
  approveOrder,
  createOrder,
  deleteOrder,
  getAllOrders,
  getMyOrders,
  updateOrderStatus,
} from './orders.controller.js';
import { authenticate, authorize } from '../../middlewares/auth.js';

const router = Router();

// Protected route to create an order (requires authentication)
router.post('/', authenticate, createOrder);

// User route: only fetch orders belonging to the authenticated user (BOLA prevention)
router.get('/me', authenticate, getMyOrders);

// Admin / Manager / Ventas route to view all orders
router.get('/all', authenticate, authorize(['ADMIN', 'MANAGER', 'VENTAS']), getAllOrders);

// Protected route to update status (SINPE verified -> Kitchen -> Completed)
router.put('/status/:id', authenticate, authorize(['ADMIN', 'MANAGER', 'VENTAS']), updateOrderStatus);

// Protected route to approve (verify payment) an order
router.put('/approve/:id', authenticate, authorize(['ADMIN', 'MANAGER', 'VENTAS']), approveOrder);

// Protected route to delete (soft delete) an order
router.delete('/:id', authenticate, authorize(['ADMIN', 'MANAGER', 'VENTAS']), deleteOrder);

export default router;
