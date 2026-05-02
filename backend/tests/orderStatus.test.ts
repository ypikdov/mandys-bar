import test from 'node:test';
import assert from 'node:assert/strict';
import { canTransitionOrderStatus } from '../src/modules/orders/orderStatus.js';

test('permite transiciones validas de pedidos', () => {
  assert.equal(canTransitionOrderStatus('PENDIENTE_VERIFICACION', 'PAGADO'), true);
  assert.equal(canTransitionOrderStatus('PAGADO', 'EN_PREPARACION'), true);
  assert.equal(canTransitionOrderStatus('EN_PREPARACION', 'COMPLETADO'), true);
});

test('rechaza transiciones invalidas o terminales', () => {
  assert.equal(canTransitionOrderStatus('COMPLETADO', 'PAGADO'), false);
  assert.equal(canTransitionOrderStatus('CANCELADO', 'PAGADO'), false);
  assert.equal(canTransitionOrderStatus('PENDIENTE', 'COMPLETADO'), false);
});
