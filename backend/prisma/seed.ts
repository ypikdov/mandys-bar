import { PrismaClient } from '../src/generated/client/client.js';
import bcrypt from 'bcryptjs';
import 'dotenv/config';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const requireEnv = (name: string) => {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Falta ${name}. Define las credenciales iniciales del administrador en el entorno.`);
  }
  return value;
};

const adminData = {
  nombre: process.env.SEED_ADMIN_NAME?.trim() || 'Administrador Mandy',
  correo: requireEnv('SEED_ADMIN_EMAIL').toLowerCase(),
  password: requireEnv('SEED_ADMIN_PASSWORD'),
  telefono: process.env.SEED_ADMIN_PHONE?.trim() || 'N/A',
};

const connectionString = process.env.DATABASE_URL?.replace('?sslmode=require', '');
const pool = new pg.Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Iniciando seeder de administrador...');

  const existingAdmin = await prisma.user.findUnique({
    where: { correo: adminData.correo }
  });

  const salt = await bcrypt.genSalt(10);
  const password_hash = await bcrypt.hash(adminData.password, salt);

  if (existingAdmin) {
    await prisma.user.update({
      where: { correo: adminData.correo },
      data: { role: 'ADMIN', password_hash, nombre: adminData.nombre, telefono: adminData.telefono }
    });
    console.log('Administrador actualizado con rol ADMIN.');
    return;
  }

  const adminUser = await prisma.user.create({
    data: {
      nombre: adminData.nombre,
      correo: adminData.correo,
      telefono: adminData.telefono,
      password_hash,
      role: 'ADMIN'
    }
  });

  console.log(`Administrador creado: ${adminUser.correo} (${adminUser.role}).`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
    await pool.end();
  })
  .catch(async (error) => {
    console.error('Error en seed:', error);
    await prisma.$disconnect();
    await pool.end();
    process.exit(1);
  });
