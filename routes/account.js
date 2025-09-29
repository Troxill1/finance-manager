import express from "express";
import requireAuth from "../middleware/authMiddleware.js";
import { getAccounts, createAccount } from "../controllers/AccountController.js";

const router = express.Router();

router.use(requireAuth);

router.get("/", getAccounts);
router.post("/", createAccount);

export default router;
