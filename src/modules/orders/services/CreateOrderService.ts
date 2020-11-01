import { inject, injectable } from 'tsyringe';

import AppError from '@shared/errors/AppError';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICustomersRepository from '@modules/customers/repositories/ICustomersRepository';
import Order from '../infra/typeorm/entities/Order';
import IOrdersRepository from '../repositories/IOrdersRepository';

interface IProduct {
  id: string;
  quantity: number;
}

interface IRequest {
  customer_id: string;
  orderProducts: IProduct[];
}

@injectable()
class CreateOrderService {
  constructor(
    @inject('OrdersRepository')
    private ordersRepository: IOrdersRepository,
    @inject('ProductsRepository')
    private productsRepository: IProductsRepository,
    @inject('CustomersRepository')
    private customersRepository: ICustomersRepository,
  ) { }

  public async execute({
    customer_id,
    orderProducts,
  }: IRequest): Promise<Order> {
    const customer = await this.customersRepository.findById(customer_id);

    if (!customer) {
      throw new AppError('Customer does not exists');
    }

    const orderProductsIds = orderProducts.map(product => {
      return {
        id: product.id,
      };
    });

    const findProducts = await this.productsRepository.findAllById(
      orderProductsIds,
    );

    let orderProductsAux = orderProducts.reduce<IProduct[]>(
      (newProducts, currentProduct) => {
        const found = newProducts.find(
          product => product.id === currentProduct.id,
        );

        if (!found) {
          newProducts.push(currentProduct);
        } else {
          found.quantity += currentProduct.quantity;
        }

        return newProducts;
      },
      [],
    );

    const products = orderProductsAux.map(product => {
      const foundProduct = findProducts.find(
        findProduct => findProduct.id === product.id,
      );

      if (!foundProduct) {
        throw new AppError('Product does not exists');
      }

      return {
        product_id: product.id,
        quantity: product.quantity,
        price: foundProduct.price,
      };
    });

    findProducts.forEach(product => {
      const orderProduct = orderProductsAux.find(
        findProduct => findProduct.id === product.id,
      );

      if (!orderProduct) {
        throw new AppError('Product does not exists');
      }

      product.quantity -= orderProduct.quantity;

      orderProductsAux = orderProductsAux.filter(
        orderProductToDelete => orderProductToDelete.id !== product.id,
      );
    });

    if (findProducts.filter(product => product.quantity < 0).length) {
      throw new AppError('Product quantity is bigger than quantity left');
    }

    const order = await this.ordersRepository.create({
      customer,
      products,
    });

    const productsToBeUpdated = findProducts.map(product => {
      return {
        id: product.id,
        quantity: product.quantity,
      };
    });

    await this.productsRepository.updateQuantity(productsToBeUpdated);

    return order;
  }
}

export default CreateOrderService;
