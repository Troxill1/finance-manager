import Transaction from "../models/Transaction.js";
import Account from "../models/Account.js";
import Loan from "../models/Loan.js";
import Emi from "../models/Emi.js";
import Decimal from "decimal.js";
import { toDecimal128 } from "../utils/transformDecimal128.js";

const RATES = {  // TODO: use API call for live conversion rate
    USD: { EUR: 0.92, BGN: 1.80 },
    EUR: { USD: 1.09, BGN: 1.96 },
    BGN: { USD: 0.55, EUR: 0.51 }
};

// Here accountType refers to either "source" or "destination"
const getAccount = async (accountId, accountType, session) => {  
    const account = await Account.findById(accountId).session(session);
    if (!account) {
        throw { message: `${accountType} account not found`, code: 400 };
    }

    return account.toObject();
};

export const createTransaction = async (req, res) => {
    const session = await Transaction.startSession();
    session.startTransaction();

    let baseTransaction = {};
    try {
        const amount = new Decimal(req.body.amount);
        const { type, category, note, fromAccountId, toAccountId } = req.body;
        baseTransaction = {
            userId: req.user.id,
            type,
            category,
            note,
        };

        if (fromAccountId === toAccountId) {
            throw { message: "Identical source and destination account", code: 400 };
        }

        let fromAccount, toAccount, fee;
        if (toAccountId) {
            toAccount = await getAccount(toAccountId, "Destination", session);
        }

        if (fromAccountId) {
            fromAccount = await getAccount(fromAccountId, "Source", session);
            let balance = new Decimal(fromAccount.balance);

            fee = new Decimal(amount.mul(0.045));  // TODO: add fee to the bank's account
            if (balance.lessThan(amount.plus(fee))) {
                throw { message: "Insufficient funds", code: 400 };
            }

            let convertedAmount = amount, rate = new Decimal(1.00);
            const fromCurrency = fromAccount.currency;
            baseTransaction.currency = toAccountId ? toAccount.currency : fromCurrency;
            
            const currencyDiffers = baseTransaction.currency !== fromCurrency;
            if (currencyDiffers) {  // for transfers
                baseTransaction.fromCurrency = fromCurrency;
                rate = new Decimal(RATES[fromCurrency][baseTransaction.currency]);
                convertedAmount = convertedAmount.mul(rate);
            }

            baseTransaction.fromAccountId = fromAccountId;
            baseTransaction.convertedAmount = convertedAmount;
            baseTransaction.conversionRate = toDecimal128(rate);
            baseTransaction.fee = toDecimal128(fee);
            
            const amountToRemove = currencyDiffers ? amount : convertedAmount;
            balance = balance.minus(amountToRemove).minus(fee);
            fromAccount.balance = toDecimal128(balance);
            await Account.findByIdAndUpdate(fromAccountId, fromAccount, { new: true }).session(session);
        }

        if (toAccountId) {
            let balance = new Decimal(toAccount.balance);

            if (type === "deposit") {
                fee = new Decimal(amount.mul(0.03));  // TODO: add fee to the bank's account
                balance = balance.plus(amount);

                if (toAccount.type !== "loan") {
                    balance = balance.minus(fee);
                } else {
                    const loan = await Loan.findOne({ accountId: toAccountId }).session(session);
                    if (loan.status !== "active") {
                        throw { message: "Loan is not active", code: 400 };
                    }

                    const emiId = loan.installments.at(-1);
                    const emi = await Emi.findById(emiId).session(session);
                    const emiAmount = new Decimal(emi.amount.toString());
                    const penalty = new Decimal(emi?.penalty.toString() || 0);

                    let newStatus;
                    if (emi.status === "pending") {
                        newStatus = "paid";
                    } else if (emi.status === "overdue") {
                        newStatus = "paid_late";
                    } else {
                        throw { message: "EMI is already paid", code: 400 };
                    }

                    const total = emiAmount.plus(fee).plus(penalty);
                    if (amount.lessThan(total)) {
                        throw { message: "Pay the full EMI including fees and any penalty", code: 400 };
                    }
                    
                    emi.status = newStatus;
                    await emi.save({ session });

                    const remainingLoan = new Decimal(loan.remainingLoan.ToString());
                    remainingLoan = balance.mul(-1);
                    loan.remainingLoan = toDecimal128(remainingLoan);
                    await loan.save({ session });

                    if (remainingLoan.greaterThanOrEqualTo(0)) {
                        loan.status = "closed";
                        await loan.save({ session });
                    }
                }
            } else {  // type === "transfer"
                const { convertedAmount } = baseTransaction;
                // convertedAmount is equal to amount if there is no conversion
                balance = balance.plus(convertedAmount);
                baseTransaction.convertedAmount = toDecimal128(convertedAmount);
            }

            baseTransaction = { ...baseTransaction, toAccountId, fee };
            
            toAccount.balance = toDecimal128(balance);
            await Account.findByIdAndUpdate(toAccountId, toAccount, { new: true }).session(session);
        }

        if (type === "card_payment") {
            const { cardId, merchantName, merchantLocation } = req.body;
            
            if (!cardId) {
                throw { message: "Card ID missing", code: 400 };
            } else if (!merchantName) {
                throw { message: "Merchant name missing", code: 400 };
            }

            baseTransaction.cardId = cardId;
            baseTransaction.merchant = {
                name: merchantName,
                location: merchantLocation,
            };
        }

        baseTransaction.amount = toDecimal128(amount);
        baseTransaction.completedAt = Date.now();
        const [transaction] = await Transaction.create([baseTransaction], { session });

        await session.commitTransaction();
        session.endSession();

        res.status(201).json(transaction);
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        
        // This helps explain why a transaction failed too early
        res.status(500).json({ message: error.message });

        baseTransaction.status = "failed";
        await Transaction.create(baseTransaction);

        if (error?.code) {
            return res.status(error.code).json({ message: error.message });
        }

        res.status(500).json({ message: "Failed to create transaction", error: error.message });
    }
};

export const getTransactions = async (req, res) => {
    try {
        const { accountId } = req.query;
        if (!accountId) {
            return res.status(400).json({ message: "Account ID is required" });
        }

        const transactions = await Transaction.find({
            $or: [
                { fromAccountId: accountId },
                { toAccountId: accountId }
            ]
        }).sort({ createdAt: -1});

        if (transactions.length === 0) {
            return res.status(404).json({ message: "No transactions present" });
        }

        res.json(transactions);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch transactions", error: error.message  });
    }
};

export const reverseTransaction = async (req, res) => {
    const session = await Transaction.startSession();
    session.startTransaction();

    try {
        const { id } = req.params;
        const userId = req.user.id;
        let toReverse = await Transaction.findOne({ _id: id, userId }).session(session);
        toReverse = toReverse.toObject();

        if (!toReverse) {
            throw { message: "Transaction not found", code: 404 };
        }

        if (toReverse.status !== "completed") {
            throw { message: "Cannot reverse a non-completed transaction", code: 400 };
        }

        const hourDifference = (Date.now() - toReverse.completedAt.getTime()) / (1000 * 60 * 60);
        if (hourDifference > 1) {
            throw { message: "Cannot reverse after an hour", code: 400 };
        }

        const { fromAccountId = null, toAccountId = null } = toReverse;
        const amount = new Decimal(toReverse.amount);
        const convertedAmount = new Decimal(toReverse.convertedAmount);

        if (fromAccountId) {
            let fromAccount = await getAccount(fromAccountId, "Source", session);

            let balance = new Decimal(fromAccount.balance);
            balance = balance.plus(amount);
            fromAccount.balance = toDecimal128(balance);
            await Account.findByIdAndUpdate(fromAccountId, fromAccount, { new: true }).session(session);
        }

        if (toAccountId) {
            let toAccount = await getAccount(toAccountId, "Destination", session);
            
            let balance = new Decimal(toAccount.balance);
            if (balance.lessThan(convertedAmount)) {
                throw { message: "Insufficient funds to reverse", code: 400 };
            }

            // convertedAmount is equal to amount if there is no conversion
            balance = balance.minus(convertedAmount);
            toAccount.balance = toDecimal128(balance);
            await Account.findByIdAndUpdate(toAccountId, toAccount, { new: true }).session(session);
        }

        await Transaction.findByIdAndUpdate(id, { status: "reversed" }, { new: true }).session(session);

        await session.commitTransaction();
        session.endSession();

        res.status(200).json({ message: "Transaction reversed" });
    } catch (error) {
        await session.abortTransaction();
        session.endSession();

        if (error?.code) {
            return res.status(error.code).json({ message: error.message });
        }

        res.status(500).json({ message: "Failed to delete transaction", error: error.message });
    }
};
