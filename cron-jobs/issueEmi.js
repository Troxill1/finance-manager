import cron from "node-cron";
import Loan from "../models/Loan.js";
import createEmi from "../utils/createEmi.js";
import { calculateEmi } from "../utils/accountGenerator.js";

// Issues the monthly loan account EMI
// Runs once a month
cron.schedule("0 0 1 * *", async () => {
    try {
        const loans = await Loan.find({ status: "active" });
        loans.map(async (l) => {
            if (l.installments.length === 0) {
                const oneMonth = 30 * 24 * 60 * 60 * 1000;
                l.maturityDate = new Date(Date.now() + l.period * oneMonth);
                await l.save();
            }

            const emiAmount = calculateEmi(l.interestRate, l.period, l.principal);
            const emi = await createEmi(l._id, emiAmount);
            l.installments.push(emi._id);
            await l.save();

            // TODO: notify user in-app
        });
    } catch (error) {
        // TODO: handle correctly (add error to DB and resolve in admin panel)
        console.error("EMI issuing cron job failed: ", error.message);
    }
});
