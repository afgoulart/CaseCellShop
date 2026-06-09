import { prisma } from './prisma';

const products = [
  { name: 'Capinha Silicone Premium', description: 'Silicone antichoque com acabamento fosco', price: 49.9, stock: 15 },
  { name: 'Capinha Couro Legítimo', description: 'Couro genuíno com compartimento para cartão', price: 129.9, stock: 8 },
  { name: 'Capinha Clear Ultra', description: 'Transparente com bordas reforçadas', price: 39.9, stock: 25 },
  { name: 'Capinha MagSafe Carbono', description: 'Fibra de carbono compatível com MagSafe', price: 89.9, stock: 12 },
  { name: 'Capinha Biodegradável', description: 'Eco-friendly certificada, 100% reciclável', price: 59.9, stock: 20 },
];

async function seed() {
  const count = await prisma.product.count();
  if (count > 0) { console.log(`[seed] ${count} produtos já existem, pulando.`); return; }
  await prisma.product.createMany({ data: products });
  console.log(`[seed] ${products.length} produtos inseridos.`);
}

seed().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
