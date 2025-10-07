import mongoose from "mongoose";
import transformDoc from "../utils/transformDecimal128.js";

const { Decimal128, ObjectId } = mongoose.Schema.Types;

const merchantInfoSchema = new mongoose.Schema({
    name: { type: String, required: true },
    location: String,
}, { _id: false });

const transactionSchema = new mongoose.Schema({
    userId: { type: ObjectId, ref: "User", required: true },
    fromAccountId: { type: ObjectId, ref: "Account" },
    toAccountId: { type: ObjectId, ref: "Account" },  // for internal transfers
    cardId: { type: ObjectId, ref: "Card" },  // for external transfers

    merchant: merchantInfoSchema,
    type: { type: String, enum: ["transfer", "card_payment", "deposit", "withdrawal"], required: true },
    status: { type: String, enum: ["completed", "failed", "reversed"], default: "completed" },
    completedAt: Date,

    amount: { type: Decimal128, required: true },
    convertedAmount: Decimal128,
    conversionRate: Decimal128,
    fee: Decimal128,
    currency: { type: String, enum: ["EUR", "BGN", "USD"] },
    fromCurrency: { type: String, enum: ["EUR", "BGN", "USD"] },

    category: String,
    note: String,
}, { timestamps: true });

transformDoc(transactionSchema);

const Transaction = mongoose.model("Transaction", transactionSchema);
export default Transaction;
