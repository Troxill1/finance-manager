import cron from "node-cron";
import Loan from "../models/Loan.js";
import Emi from "../models/Emi.js";
import Account from "../models/Account.js";
import User from "../models/User.js";
import Decimal from "decimal.js";
import { toDecimal128 } from "../utils/transformDecimal128.js";
import email from "../utils/mailer.js";

// Checks if "pending" EMIs are overdue and if so applies a penalty and notifies the user
// Runs once every day
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
            emi.status = "overdue";  // TODO: notify user in app

            await emi.save();

            const loan = await Loan.findById(emi.loanId);
            const account = await Account.findById(loan.accountId).lean();
            const user = await User.findById(account.userId);

            await email({
                to: user.email,
                subject: "EMI Payment Overdue",
                text: `Your EMI of ${emi.amount} was due on ${emi.dueDate}. 
                    Please pay immediately to avoid further penalties.`,
                html: `
                    <h3>EMI Overdue Notice</h3>
                    <p>Amount: <b>${emi.amount}</b></p>
                    <p>Due Date: <b>${emi.dueDate.toDateString()}</b></p>
                    <p>Status: <span style="color:red">Overdue</span></p>
                `
            });

            const overdueCount = await Emi.countDocuments({
                loanId: loan._id,
                status: "overdue"
            });

            if (overdueCount >= 3) {
                loan.status = "defaulted";  // TODO: notify user in app
                await loan.save();

                await email({
                    to: user.email,
                    subject: "Loan account defaulting",
                    text: `You have accumulated ${overdueCount} overdue EMIs.
                           Your loan account is being defaulted.`,
                    html: ""
                });
            }
        }
    } catch (error) {
        // TODO: handle correctly (add error to DB and resolve in admin panel)
        console.error("EMI status checker cron job failed: ", error.message);
    }
});
