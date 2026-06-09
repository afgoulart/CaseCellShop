import { Order } from '../domain/types';

export interface IOrderRepository {
  findByIdempotencyKey(key: string): Promise<Order | null>;
  findById(id: string): Promise<Order | null>;
  findAll(): Promise<Order[]>;
  create(id: string, productId: number, quantity: number, idempotencyKey: string): Promise<void>;
  confirm(id: string, invoice: string): Promise<Order>;
  fail(id: string, errorMessage: string): Promise<Order>;
}
