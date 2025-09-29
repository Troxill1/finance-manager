import express from 'express';
import { register, login } from '../controllers/AuthController.js';
import requireAuth from '../middleware/authMiddleware.js';

const router = express.Router();

router.get("/me", requireAuth, (req, res) => {
    res.json({ user: req.user });
});

router.post("/register", register);
router.post("/login", login);

export default router;
