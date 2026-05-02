import { prisma } from './src/lib/prisma.js';

async function main() {
  try {
    console.log('Testing connection...');
    const items = await prisma.product.findMany({ take: 1 });
    console.log('Connection successful! Found items:', items.length);
    process.exit(0);
  } catch (err) {
    console.error('Connection failed:', err);
    process.exit(1);
  }
}

main();
