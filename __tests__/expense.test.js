// tests/expense.test.js

import request from 'supertest';
import app from '../app.js'; // import your Express app
import User from '../models/user.model.js';
import Expense from '../models/expense.model.js';

jest.mock('../models/user.model.js');
jest.mock('../models/expense.model.js');

describe('Expense Management', () => {

  let token;

  beforeAll(async () => {
    // Mock user creation and token generation
    User.findOne.mockResolvedValue({ _id: 'userId' });
    token = 'your_jwt_token'; // Mock token
  });

  test('should create a new expense', async () => {
    const newExpense = {
      description: 'Dinner',
      amount: 100,
      participants: [{ email: 'john.doe@example.com' }, { email: 'jane.doe@example.com' }],
      splitMethod: 'equal',
    };

    Expense.prototype.save.mockResolvedValue(true); // Mock save

    const res = await request(app)
      .post('/api/expenses')
      .set('Authorization', `Bearer ${token}`)
      .send(newExpense);

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('message', 'Expense created successfully');
  });

  test('should return user expenses', async () => {
    Expense.find.mockResolvedValue([{ description: 'Dinner', amount: 100 }]); // Mock expenses

    const res = await request(app)
      .get('/api/expenses/user')
      .set('Authorization', `Bearer ${token}`)
      .send({ email: 'john.doe@example.com' });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('message', 'User expenses retrieved successfully');
    expect(res.body.expenses.length).toBe(1);
  });

  test('should fail to create expense with missing fields', async () => {
    const newExpense = {
      description: '',
      amount: 100,
      participants: [],
      splitMethod: 'equal',
    };

    const res = await request(app)
      .post('/api/expenses')
      .set('Authorization', `Bearer ${token}`)
      .send(newExpense);

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('message', 'Missing required fields or participants is not an array');
  });
});
