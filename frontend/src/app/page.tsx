import { Product } from '../api/client';
import { ProductListClient } from '../views/ProductList';

const BACKEND = process.env.BACKEND_URL ?? 'http://localhost:3001';

async function getProducts(): Promise<Product[]> {
  try {
    const res = await fetch(`${BACKEND}/api/products`, { cache: 'no-store' });
    const json = await res.json();
    return (json.data ?? []) as Product[];
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const products = await getProducts();
  return <ProductListClient initialProducts={products} />;
}
