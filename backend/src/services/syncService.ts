import { exec } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import prisma from '../lib/prisma.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Sincroniza los datos operativos con las tablas Shadow para analíticas en tiempo real.
 * @param orderId ID del pedido recién creado o actualizado.
 */
export const triggerShadowSync = async (orderId: string) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { 
        items: { include: { product: true } },
        user: true
      }
    });

    if (!order) {
      console.error(`[SyncService] No se encontró el pedido ${orderId} para sincronizar.`);
      return;
    }

    // Determinar datos del cliente (Priorizar datos de usuario registrado si existen)
    const clienteNombre = order.user?.nombre || order.cliente_nombre || 'Cliente Final';
    const clienteCorreo = order.user?.correo || null;
    const clienteTelefono = order.user?.telefono || order.cliente_telefono || null;

    // 1. Crear o actualizar ShadowSale
    await prisma.shadowSale.upsert({
      where: { order_id: orderId },
      update: {
        total_consolidado: order.total,
        cliente_nombre: clienteNombre,
        cliente_correo: clienteCorreo,
        cliente_telefono: clienteTelefono,
        items_json: JSON.stringify(order.items.map(i => ({
          nombre: i.product.nombre,
          cantidad: i.cantidad,
          total: i.total_linea
        })))
      },
      create: {
        order_id: orderId,
        total_consolidado: order.total,
        cliente_nombre: clienteNombre,
        cliente_correo: clienteCorreo,
        cliente_telefono: clienteTelefono,
        items_json: JSON.stringify(order.items.map(i => ({
          nombre: i.product.nombre,
          cantidad: i.cantidad,
          total: i.total_linea
        })))
      }
    });

    // 2. Actualizar ShadowDailyRevenue
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dailyTotal = await prisma.order.aggregate({
      where: {
        fecha: {
          gte: today,
          lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
        },
        deleted_at: null
      },
      _sum: {
        total: true
      }
    });

    await prisma.shadowDailyRevenue.upsert({
      where: { fecha_dia: today },
      update: {
        total_venta: dailyTotal._sum.total || 0
      },
      create: {
        fecha_dia: today,
        total_venta: dailyTotal._sum.total || 0
      }
    });

    // 3. Ejecutar el motor de analítica en Python de forma asíncrona
    // Asumimos que la estructura de carpetas es /backend/src/services/ -> /scripts/
    const scriptPath = path.join(__dirname, '..', '..', '..', 'scripts', 'analytics_engine.py');
    exec(`python "${scriptPath}"`, (error, stdout, stderr) => {
      if (error) {
        console.error(`[SyncService] Error ejecutando analytics_engine.py: ${error.message}`);
        return;
      }
      if (stderr) console.warn(`[SyncService] Analytics Engine Warning: ${stderr}`);
      console.log(`[SyncService] Analytics Engine ejecutado con éxito: ${stdout}`);
    });

    console.log(`[SyncService] Sincronización exitosa para pedido ${order.consecutivo_anual}`);

  } catch (error) {
    console.error(`[SyncService] Error crítico en la sincronización:`, error);
  }
};
