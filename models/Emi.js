import mongoose from "mongoose";
import transformDoc from "../utils/transformDecimal128.js";

const { Decimal128, ObjectId } = mongoose.Schema.Types;

const emiSchema = new mongoose.Schema({
    loanId: { type: ObjectId, ref: "Loan", required: true },
    amount: { type: Decimal128, required: true },
    penalty: Decimal128,  // for overdue EMIs
    dueDate: Date,
    paidDate: Date,
    status: { type: String, enum: ["pending", "paid", "overdue", "paid_late"] },
}, { timestamps: true });

transformDoc(emiSchema);

const Emi = mongoose.model("Emi", emiSchema);
export default Emi;
