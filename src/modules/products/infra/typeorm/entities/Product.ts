import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToMany,
} from 'typeorm';

import OrdersProducts from '@modules/orders/infra/typeorm/entities/OrdersProducts';
import Order from '@modules/orders/infra/typeorm/entities/Order';

@Entity('products')
class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  price: number;

  @Column()
  quantity: number;

  @OneToMany(() => OrdersProducts, ordersProducts => ordersProducts.product)
  order_products: OrdersProducts[];

  @ManyToMany(() => Order, order => order.products)
  orders: Order[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}

export default Product;
