import { IProductRepository } from './IProductRepository';
import { IOrderRepository } from './IOrderRepository';

export interface Repositories {
  products: IProductRepository;
  orders: IOrderRepository;
}

let instance: Repositories | null = null;

export function getRepositories(): Repositories {
  if (instance) return instance;

  const provider = process.env.DATABASE_PROVIDER ?? 'sqlite';

  if (provider === 'postgresql') {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PrismaProductRepository } = require('./prisma/ProductRepository');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PrismaOrderRepository } = require('./prisma/OrderRepository');
    instance = {
      products: new PrismaProductRepository() as IProductRepository,
      orders: new PrismaOrderRepository() as IOrderRepository,
    };
  } else {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { SqliteProductRepository } = require('./sqlite/ProductRepository');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { SqliteOrderRepository } = require('./sqlite/OrderRepository');
    instance = {
      products: new SqliteProductRepository() as IProductRepository,
      orders: new SqliteOrderRepository() as IOrderRepository,
    };
  }

  return instance;
}

/** Call once at app startup to warm up the repository singleton. */
export function initRepositories(): Repositories {
  return getRepositories();
}

/** Only needed in tests to swap implementations between test cases. */
export function resetRepositories(): void {
  instance = null;
}
