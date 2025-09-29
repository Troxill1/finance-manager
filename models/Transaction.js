import mongoose from "mongoose";
import Decimal128ToString from "../utils/transformDecimal128.js";

const merchantInfoSchema = new mongoose.Schema({
    name: { type: String, required: true },
    location: { type: String },
}, { _id: false });

const transactionSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    fromAccountId: { type: mongoose.Schema.Types.ObjectId, ref: "Account" },
    toAccountId: { type: mongoose.Schema.Types.ObjectId, ref: "Account" },  // for internal transfers
    cardId: { type: mongoose.Schema.Types.ObjectId, ref: "Card" },  // for external transfers

    merchant: { type: merchantInfoSchema },
    type: { type: String, enum: ["transfer", "card_payment", "deposit", "withdrawal"], required: true },
    status: { type: String, enum: ["completed", "failed", "reversed"], default: "completed" },
    completedAt: { type: Date },

    amount: { type: mongoose.Schema.Types.Decimal128, required: true },
    convertedAmount: { type: mongoose.Schema.Types.Decimal128 },
    currency: { type: String, enum: ["EUR", "BGN", "USD"] },
    fromCurrency: { type: String, enum: ["EUR", "BGN", "USD"] },
    conversionRate: { type: mongoose.Schema.Types.Decimal128 },
    fee: { type: mongoose.Schema.Types.Decimal128 },

    category: { type: String },
    note: { type: String },
}, { timestamps: true });

// Used when returning an object to the front-end (for display)
transactionSchema.set("toJSON", {
    transform: (doc, ret) => Decimal128ToString(ret)
});

// Used when returning an object to the back-end (for arithmetic)
transactionSchema.set("toObject", {
    transform: (doc, ret) => Decimal128ToString(ret)
});


const Transaction = mongoose.model("Transaction", transactionSchema);
export default Transaction;
