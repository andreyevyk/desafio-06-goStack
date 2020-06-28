import { getCustomRepository, getRepository } from 'typeorm';
import AppError from '../errors/AppError';

import Transaction from '../models/Transaction';
import TransactionsRepository from '../repositories/TransactionsRepository';
import Category from '../models/Category';

interface Request {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

class CreateTransactionService {
  public async execute({
    title,
    value,
    type,
    category,
  }: Request): Promise<Transaction> {
    if (!['income', 'outcome'].includes(type)) {
      throw new AppError('Transaction type is invalid');
    }
    const transactionRepository = getCustomRepository(TransactionsRepository);

    const { total } = await transactionRepository.getBalance();
    if (type === 'outcome' && total < value) {
      throw new AppError('You don not have enough balance');
    }

    const categoryRepository = getRepository(Category);

    let categoryFinded = await categoryRepository.findOne({
      where: { title: category },
    });
    if (!categoryFinded) {
      categoryFinded = categoryRepository.create({
        title: category,
      });
      await categoryRepository.save(categoryFinded);
    }

    const transaction = transactionRepository.create({
      category: categoryFinded,
      value,
      title,
      type,
    });

    await transactionRepository.save(transaction);

    delete transaction.category_id;

    return transaction;
  }
}

export default CreateTransactionService;
