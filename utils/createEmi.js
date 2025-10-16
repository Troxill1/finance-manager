import Emi from "../models/Emi.js";
import { toDecimal128 } from "./transformDecimal128.js";

const createEmi = async (loanId, emiAmount, now = Date.now(), session = null) => {
    const amount = toDecimal128(emiAmount);
    const oneMonth = 30 * 24 * 60 * 60 * 1000;
    const dueDate = new Date(now + oneMonth);
    const emi = await Emi.create({ loanId, amount, dueDate, status: "pending" }).session(session);  // TODO: test (maybe session won't work)
    return emi;
};

export default createEmi;
