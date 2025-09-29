import Account from "../models/Account.js";
import Card from "../models/Card.js";
import { generateIban, calculateInterestRate, calculateEMI } from "../utils/accountGenerator.js";
import { getCardNumber, generateCVV, generateExpiryDate } from "../utils/cardGenerator.js";
import Decimal from "decimal.js";
import { toDecimal128 } from "../utils/transformDecimal128.js";

export const getAccounts = async (req, res) => {
    try {
        const userId = req.user.id;
        const accounts = await Account.find({ userId });
        if (!accounts) {
            return res.status(404).json({ message: "No accounts found "});
        }
        
        res.json(accounts);
    } catch (error) {
        res.status(500).json({ message: "Failed to get accounts", error: error.message });
    }
};

export const createAccount = async (req, res) => {
    try {
        const { type, currency, network, nickname, details } = req.body;
        const countryCode = currency.slice(0, 2);
        
        const iban = generateIban(countryCode);
        const balance = toDecimal128(0.00);
        const userId = req.user.id;

        const baseAccount = {
            userId,
            iban,
            type,
            currency,
            balance,
            nickname,
        };

        if (type === "savings") {
            baseAccount.details.interestRate = toDecimal128(0.02);  // TODO: make it dynamic
            baseAccount.details = {
                widthdrawalLimit: 3,
                withdrawalCount: 0,
            };
        } else if (type === "loan") {
            const loanAmount = new Decimal(details.loanAmount);
            const loanPeriod = new Decimal(details.loanPeriod);
            
            const interestRate = await calculateInterestRate(loanAmount);
            const EMI = await calculateEMI(interestRate, loanPeriod, loanAmount);

            details.interestRate = toDecimal128(interestRate);
            details.loanAmount = toDecimal128(loanAmount);
            details.remainingBalance = toDecimal128(EMI.mul(loanPeriod));
            details.monthlyPayment = toDecimal128(EMI);
            details.dueDate = new Date(Date.now() + loanPeriod * 30 * 24 * 60 * 60 * 1000);

            baseAccount.balance = toDecimal128(loanAmount.mul(-1));
            baseAccount.details = details;
        }

        const account = await Account.create(baseAccount);

        // TODO: send card number and CVV to email
        const { cardNumber, hashedCardNumber, cardNumberDisplay } = await getCardNumber();
        const { CVV, hashedCVV } = await generateCVV();
        const expiryDate = await generateExpiryDate();

        await Card.create({
            accountId: account._id,
            network,
            number: hashedCardNumber,
            numberDisplay: cardNumberDisplay,
            securityCode: hashedCVV,
            expiryDate
        });

        const card = {
            numberDisplay: cardNumberDisplay,
            expiryDate,
            network
        };

        res.status(201).json({ account, card, message: "Created successfully" });
    } catch (error) {
        res.status(500).json({ message: "Failed to create account", error: error.message });
    }
};

// TODO: update, delete account
