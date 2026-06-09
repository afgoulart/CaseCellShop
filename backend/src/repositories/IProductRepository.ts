import { Product, StockResult } from '../domain/types';

export interface IProductRepository {
  findAll(): Promise<Product[]>;
  findById(id: number): Promise<Product | null>;
  reserveStock(productId: number, quantity: number): Promise<StockResult>;
  releaseStock(productId: number, quantity: number): Promise<void>;
}
