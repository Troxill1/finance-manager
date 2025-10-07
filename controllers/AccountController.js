import Account from "../models/Account.js";
import Card from "../models/Card.js";
import Loan from "../models/Loan.js";
import Emi from "../models/Emi.js";
import { generateIban, calculateInterestRate, calculateEMI } from "../utils/accountGenerator.js";
import { getCardNumber, generateCVV, generateExpiryDate } from "../utils/cardGenerator.js";
import Decimal from "decimal.js";
import { toDecimal128 } from "../utils/transformDecimal128.js";

export const getAccounts = async (req, res) => {
    try {
        const userId = req.user.id;
        const fetchedAccounts = await Account.find({ userId });
        if (!fetchedAccounts) {
            return res.status(404).json({ message: "No accounts found "});
        }

        const loanAccounts = fetchedAccounts.filter(a => a.type === "loan").map(a => a._id);
        const loans = (await Loan.find({ accountId: { $in: loanAccounts } })).map(l => l.toObject());

        const accounts = await Promise.all(
            fetchedAccounts.map(async (a) => {
                const { userId, createdAt, updatedAt, __v, ...rest } = a.toObject();
                const loanDetails = loans.find(l => l.accountId.equals(a._id)) || null;
                return { ...rest, loanDetails };
            })
        );
        
        res.json(accounts);
    } catch (error) {
        res.status(500).json({ message: "Failed to get accounts", error: error.message });
    }
};

export const createAccount = async (req, res) => {
    try {
        const { type, currency, network, nickname, loanDetails } = req.body;
        const countryCode = currency.slice(0, 2);
        const userId = req.user.id;

        const nicknameExists = await Account.exists({ nickname, userId });
        if (nicknameExists) {
            return res.status(400).json({ message: "Account nickname already exists" });
        }
        
        let iban, ibanExists;
        do {
           iban = generateIban(countryCode);
           ibanExists = await Account.exists({ iban });
        } while (ibanExists)
        
        const balance = toDecimal128(0.00);
        const baseAccount = {
            userId,
            iban,
            type,
            currency,
            balance,
            nickname,
        };

        if (type === "savings") {
            const interestRate = toDecimal128(0.02);  // TODO: make it dynamic
            baseAccount.savingsDetails = {
                interestRate,
                widthdrawalLimit: 3,
                withdrawalCount: 0,
            };
        }

        const account = await Account.create(baseAccount);

        if (type === "loan") {
            const principal = new Decimal(loanDetails.loanAmount);
            const loanPeriod = new Decimal(loanDetails.loanPeriod);
            
            const interestRate = await calculateInterestRate(principal);
            const EMI = await calculateEMI(interestRate, loanPeriod, principal);
            const oneMonth = 30 * 24 * 60 * 60 * 1000;
            const now = Date.now();

            loanDetails.accountId = account._id;
            loanDetails.principal = toDecimal128(principal);
            loanDetails.remainingLoan = toDecimal128(EMI.mul(loanPeriod).mul(-1));
            loanDetails.interestRate = toDecimal128(interestRate);
            loanDetails.maturityDate = new Date(now + loanPeriod * oneMonth);
            loanDetails.status = "active";
            const loan = await Loan.create(loanDetails);

            const loanId = loan._id;
            const amount = toDecimal128(EMI);
            const dueDate = new Date(now + oneMonth);
            await Emi.create({ loanId, amount, dueDate, status: "pending" });
        }

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
