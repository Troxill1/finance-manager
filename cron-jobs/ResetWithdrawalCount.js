import cron from "node-cron";
import Account from "../models/Account.js";
import User from "../models/User.js";

// Resets the withdrawal count on savings accounts
// Runs once a month
cron.schedule("0 0 1 * *", async () => {  // TODO: test to see if it works
    try {
        const accounts = await Account.find({ type: "savings" });
        accounts.forEach(async (a) => {
            if (a.savingsDetails.withdrawalCount > 0) {
                const user = await User.findById(a.userId);

                await email({
                    to: user.email,
                    subject: "Withdrawal count reset on savings account",
                    text: `Monthly withdrawal count for your savings account
                           is reset.`,
                    html: ""
                });
            }

            a.savingsDetails.withdrawalCount = 0;
            await a.save();
        });

        // TODO: notify user in-app
    } catch (error) {
        // TODO: handle correctly (add error to DB and resolve in admin panel)
        console.error("Savings withdrawal count reset cron job failed: ", error.message);
    }
});
