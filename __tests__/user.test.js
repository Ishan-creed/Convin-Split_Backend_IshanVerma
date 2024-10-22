// tests/user.test.js

import request from 'supertest';
import app from '../app'; // import your Express app
import User from '../models/user.model.js';
import bcrypt from 'bcrypt';

// Mock the User model methods
jest.mock('../models/user.model.js');

describe('User Authentication', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should register a new user', async () => {
    User.findOne.mockResolvedValue(null); // No user exists
    User.prototype.save.mockResolvedValue(true); // Mock save

    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'John Doe',
        email: 'john.doe@example.com',
        password: 'password123',
        confirmPassword: 'password123',
        mobile: '1234567890',
      });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body.message).toBe('Account created successfully');
  });

  test('should fail to register an existing user', async () => {
    User.findOne.mockResolvedValue({}); // Simulate existing user

    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Jane Doe',
        email: 'john.doe@example.com',
        password: 'password123',
        confirmPassword: 'password123',
        mobile: '0987654321',
      });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('success', false);
    expect(res.body.message).toBe('Username Already Taken');
  });

  test('should login user successfully', async () => {
    const hashedPassword = await bcrypt.hash('password123', 10);
    User.findOne.mockResolvedValue({ password: hashedPassword, _id: '1' }); // Mock user with hashed password

    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'john.doe@example.com',
        password: 'password123',
      });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body.message).toBe('User logged in successfully');
  });

  test('should fail to login with incorrect password', async () => {
    User.findOne.mockResolvedValue({ password: 'hashedpassword' }); // Mock user

    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'john.doe@example.com',
        password: 'wrongpassword',
      });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('success', false);
    expect(res.body.message).toBe('Invalid credentials');
  });
});
