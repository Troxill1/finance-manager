import mongoose from "mongoose";
import Decimal128ToString from "../utils/transformDecimal128.js";

const accountDetailsSchema = new mongoose.Schema({
    interestRate: mongoose.Schema.Types.Decimal128,  // savings, loan
    loanAmount: mongoose.Schema.Types.Decimal128,  // loan
    remainingBalance: mongoose.Schema.Types.Decimal128,  // loan
    monthlyPayment: mongoose.Schema.Types.Decimal128,  // loan
    dueDate: Date,  // loan
    withdrawalLimit: Number,  // savings
    withdrawalCount: Number  // savings, TODO: reset monthly
}, { _id: false });

const accountSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    iban: { type: String, required: true, unique: true },
    type: { type: String, enum: ["current", "business", "savings", "loan"], required: true },
    currency: { type: String, enum: ["EUR", "BGN", "USD"], required: true },
    balance: { type: mongoose.Schema.Types.Decimal128 },
    nickname: { type: String },
    details: { type: accountDetailsSchema },
}, { timestamps: true });

// Used when returning an object to the front-end (for display)
accountSchema.set("toJSON", {
    transform: (doc, ret) => Decimal128ToString(ret)
});

// Used when returning an object to the back-end (for arithmetic)
accountSchema.set("toObject", {
    transform: (doc, ret) => Decimal128ToString(ret)
});

const Account = mongoose.model("Account", accountSchema);
export default Account;
