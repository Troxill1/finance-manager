import mongoose from "mongoose";
import transformDoc from "../utils/transformDecimal128.js";

const { Schema } = mongoose;
const { Decimal128, ObjectId } = Schema.Types;

const savingsSchema = new Schema({
    interestRate: Decimal128,
    withdrawalLimit: Number,
    withdrawalCount: Number,
}, { _id: false });

const accountSchema = new Schema({
    userId: { type: ObjectId, ref: "User", required: true },
    iban: { type: String, required: true, unique: true },
    type: { type: String, enum: ["current", "business", "savings", "loan"], required: true },
    currency: { type: String, enum: ["EUR", "BGN", "USD"], required: true },
    balance: Decimal128,
    nickname: String,
    savingsDetails: savingsSchema,
}, { timestamps: true });

transformDoc(accountSchema);

const Account = mongoose.model("Account", accountSchema);
export default Account;
