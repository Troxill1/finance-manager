import express from 'express';
import { createTransaction, getTransaction, deleteTransaction } from '../controllers/TransactionController.js';
import requireAuth from '../middleware/authMiddleware.js';
import { transactionValidationRules, validate } from '../middleware/validateTransaction.js';

const router = express.Router();

router.use(requireAuth);

router.post("/", transactionValidationRules, validate, createTransaction);
router.get("/", getTransaction);
router.delete("/:id", deleteTransaction);

export default router;