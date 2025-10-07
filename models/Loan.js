import mongoose from "mongoose";
import transformDoc from "../utils/transformDecimal128.js";

const { Decimal128, ObjectId } = mongoose.Schema.Types;

const loanSchema = new mongoose.Schema({
    accountId: { type: ObjectId, ref: "Account", required: true },
    installments: [{ type: ObjectId, ref: "Emi" }],
    principal: { type: Decimal128, required: true },  // loaned amount
    remainingLoan: { type: Decimal128, required: true },
    interestRate: { type: Decimal128, required: true },
    maturityDate: { type: Date, required: true },
    status: { type: String, enum: ["active", "closed", "defaulted"] },
});

transformDoc(loanSchema);

const Loan = mongoose.model("Loan", loanSchema);
export default Loan;
