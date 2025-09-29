import express from 'express';
import { createTransaction, getTransactions, reverseTransaction } from '../controllers/TransactionController.js';
import requireAuth from '../middleware/authMiddleware.js';
import { transactionValidationRules, validate } from '../middleware/validateTransaction.js';

const router = express.Router();

router.use(requireAuth);

router.post("/", transactionValidationRules, validate, createTransaction);
router.get("/", getTransactions);
router.delete("/:id", reverseTransaction);

export default router;
