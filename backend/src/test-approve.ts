import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';
import { approveOrder } from './controllers/ordersController';

const prisma = new PrismaClient();

async function runTest() {
  console.log('Starting integration test for approveOrder...');
  let testOrderId: string | null = null;
  let testUserId: string | null = null;
  let testProductId: string | null = null;

  try {
    // 1. Create a minimal setup: user, product, order
    const user = await prisma.appUser.create({
      data: {
        nombre: 'Test User',
        correo: `test-${Date.now()}@test.com`,
        password: 'password123',
        telefono: '12345678',
        role: 'USER',
      }
    });
    testUserId = user.id;

    const maxConsecutivo = await prisma.order.aggregate({
      _max: { consecutivo_anual: true }
    });
    const nextConsecutivo = (maxConsecutivo._max.consecutivo_anual || 0) + 1;

    const order = await prisma.order.create({
      data: {
        userId: user.id,
        consecutivo_anual: nextConsecutivo,
        subtotal_sin_iva: 1000,
        iva: 130,
        total: 1130,
        estado: 'PENDIENTE_VERIFICACION',
      }
    });
    testOrderId = order.id;

    console.log(`Created test order ${order.id} with status PENDIENTE_VERIFICACION`);

    // 2. Mock Request and Response
    const req = {
      params: { id: order.id },
      user: { id: user.id }
    } as unknown as Request;

    const res = {
      status: (code: number) => ({
        json: (data: any) => {
          if (code >= 400) {
            throw new Error(`API Error ${code}: ${JSON.stringify(data)}`);
          }
          console.log(`Success ${code}:`, data);
          return data;
        }
      })
    } as unknown as Response;

    // 3. Call approveOrder
    console.log('Calling approveOrder...');
    await approveOrder(req, res);

    // 4. Verify Database State
    const updatedOrder = await prisma.order.findUnique({
      where: { id: order.id },
      include: { accounting_logs: true }
    });

    if (!updatedOrder) throw new Error('Order not found after approval');
    
    console.log(`Order status after approval: ${updatedOrder.estado}`);
    if (updatedOrder.estado !== 'PAGADO') {
      throw new Error(`Expected status PAGADO, but got ${updatedOrder.estado}`);
    }

    const logs = updatedOrder.accounting_logs;
    console.log(`Found ${logs.length} accounting logs`);
    if (logs.length !== 1 || logs[0].action !== 'ORDER_PAYMENT_APPROVED') {
      throw new Error('Accounting log not created correctly');
    }

    console.log('✅ Integration test passed!');
  } catch (error) {
    console.error('❌ Integration test failed:', error);
  } finally {
    // Cleanup
    if (testOrderId) {
      await prisma.accountingLog.deleteMany({ where: { entity_id: testOrderId }});
      await prisma.order.delete({ where: { id: testOrderId } });
    }
    if (testUserId) {
      await prisma.appUser.delete({ where: { id: testUserId } });
    }
    await prisma.$disconnect();
  }
}

runTest();
