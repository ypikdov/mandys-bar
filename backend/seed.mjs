import 'dotenv/config';
import pg from 'pg';
import bcrypt from 'bcryptjs';

const requireEnv = (name) => {
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

const connectionString = process.env.DATABASE_URL?.replace(/[?&]sslmode=require\b/, '');

const pool = new pg.Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  console.log('Seeder directo con pg...');

  const client = await pool.connect();

  try {
    const existing = await client.query(
      'SELECT id, role FROM users WHERE correo = $1',
      [adminData.correo]
    );

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(adminData.password, salt);

    if (existing.rows.length > 0) {
      await client.query(
        'UPDATE users SET role = $1, password_hash = $2, nombre = $3, telefono = $4 WHERE correo = $5',
        ['ADMIN', password_hash, adminData.nombre, adminData.telefono, adminData.correo]
      );
      console.log('Administrador actualizado con rol ADMIN.');
      return;
    }

    const result = await client.query(
      `INSERT INTO users (id, nombre, correo, telefono, password_hash, role, created_at, updated_at)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, NOW(), NOW()) RETURNING correo, role`,
      [adminData.nombre, adminData.correo, adminData.telefono, password_hash, 'ADMIN']
    );
    console.log(`Administrador creado: ${result.rows[0].correo} (${result.rows[0].role}).`);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error('Error en seed:', error);
  process.exit(1);
});
