import cron from "node-cron";
import Loan from "../models/Loan.js";
import Emi from "../models/Emi.js";
import Decimal from "decimal.js";
import { toDecimal128 } from "../utils/transformDecimal128.js";

cron.schedule("0 0 * * *", async () => {
    try {
        const today = new Date();
        const overdueEmis = await Emi.find({ 
            status: "pending", 
            dueDate: { $lt: today } 
        });

        for (const emi of overdueEmis) {
            const penalty = new Decimal(0.05);
            const amount = new Decimal(emi.amount.toString());

            emi.penalty = toDecimal128(penalty.mul(amount));
            emi.status = "overdue";  // TODO: notify user

            await emi.save();

            const loan = await Loan.findById(emi.loanId);
            const overdueCount = await Emi.countDocuments({
                loanId: loan._id,
                status: "overdue"
            });

            if (overdueCount >= 3) {
                loan.status = "defaulted";  // TODO: notify user
                await loan.save();
            }
        }
    } catch (error) {
        // TODO: handle correctly (add error to DB and resolve in admin panel)
        console.error("EMI cron job failed: ", error.message);
    }
});