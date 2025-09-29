import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

import authRoutes from './routes/auth.js';
import accountRoutes from './routes/account.js';
import transactionRoutes from './routes/transactions.js';

dotenv.config();

const app = express();
app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/account", accountRoutes);
app.use("/api/transactions", transactionRoutes);

mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {
        app.listen(process.env.PORT || 5000, () =>
            console.log("Server running on port 5000")
        );
    })
    .catch((err) => console.error("MongoDB connection failed:", err));
