import express from 'express';
import { register, login, getMe } from '../controllers/AuthController.js';
import requireAuth from '../middleware/authMiddleware.js';

const router = express.Router();

router.get("/me", requireAuth, getMe);
router.post("/register", register);
router.post("/login", login);

export default router;
