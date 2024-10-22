import express from 'express';
import {createExpense, getUserExpenses,getAllExpenses,downloadBalanceSheet} from '../controller/expense.controller.js';
import verifyToken from '../middleware/verifyToken.js';

const router = express.Router();

// Route to create a new expense
router.post('/create',verifyToken, createExpense);

// Route to retrieve individual user expenses
router.get('/userExpense',verifyToken, getUserExpenses);

// Route to retrieve all expenses
router.get('/allExpense', verifyToken , getAllExpenses);

// Route to download balance sheet for a specific user
router.get('/user/balance-sheet', verifyToken , downloadBalanceSheet);

export default router;
