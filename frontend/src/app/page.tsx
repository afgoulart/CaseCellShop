import { Suspense } from 'react';
import { ProductListClient } from '../views/ProductList';

async function getProducts() {
  // If BACKEND_URL is set, proxy to Express backend.
  // Otherwise use Prisma directly (no HTTP round-trip).
  if (process.env.BACKEND_URL) {
    try {
      const res = await fetch(`${process.env.BACKEND_URL}/api/products`, { cache: 'no-store' });
      const json = await res.json();
      return json.data ?? [];
    } catch {
      return [];
    }
  }

  // Direct Prisma query (server-side only)
  const { prisma } = await import('../lib/prisma');
  return prisma.product.findMany({ orderBy: { id: 'asc' } });
}

export default async function HomePage() {
  const products = await getProducts();
  return (
    <Suspense>
      <ProductListClient initialProducts={products} />
    </Suspense>
  );
}
