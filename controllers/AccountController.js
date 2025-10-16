import Account from "../models/Account.js";
import Card from "../models/Card.js";
import Loan from "../models/Loan.js";
import { generateIban, calculateInterestRate, calculateEmi } from "../utils/accountGenerator.js";
import { getCardNumber, generateCVV, generateExpiryDate } from "../utils/cardGenerator.js";
import Decimal from "decimal.js";
import { toDecimal128 } from "../utils/transformDecimal128.js";

const fetchAccounts = async (userId) => {
    const fetchedAccounts = await Account.find({ userId });
    if (!fetchedAccounts) {
        return res.status(404).json({ message: "No accounts found "});
    }

    const loanAccount = fetchedAccounts.find(a => a.type === "loan");
    let loan = null;
    if (loanAccount) {
        loan = (await Loan.findOne({ accountId: loanAccount._id })).toObject();
    }

    const accounts = await Promise.all(
        fetchedAccounts.map(async (a) => {
            const { userId, createdAt, updatedAt, __v, ...rest } = a.toObject();

            if (loan) {
                const { accountId, createdAt, updatedAt, __v, ...loanDetails } = loan;
                return { ...rest, loanDetails };
            }
                
            return { ...rest };
        })
    );

    return accounts;
};

export const getAccounts = async (req, res) => {
    try {
        const userId = req.user.id;
        const accounts = await fetchAccounts(userId);
        
        res.json(accounts);
    } catch (error) {
        res.status(500).json({ message: "Failed to get accounts", error: error.message });
    }
};

export const createAccount = async (req, res) => {
    const session = await Account.startSession();
    session.startTransaction();

    try {
        const { type, currency, network, nickname, loanDetails } = req.body;
        const countryCode = currency.slice(0, 2);
        const userId = req.user.id;

        const userAccounts = await fetchAccounts(userId);
        const accountTypes = userAccounts.map(a => a.type);
        if (accountTypes.includes(type)) {
            return res.status(400).json({ message: `You already have a ${type} account` });
        }

        const nicknameExists = await Account.exists({ nickname, userId }).session(session);
        if (nicknameExists) {
            return res.status(400).json({ message: "Account nickname already exists" });
        }
        
        let iban, ibanExists;
        do {
           iban = generateIban(countryCode);
           ibanExists = await Account.exists({ iban }).session(session);
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

        const account = await Account.create(baseAccount).session(session);

        if (type === "loan") {
            const principal = new Decimal(loanDetails.loanAmount);
            const loanPeriod = new Decimal(loanDetails.loanPeriod);
            
            const interestRate = calculateInterestRate(principal);
            const emiAmount = calculateEmi(interestRate, loanPeriod, principal);

            loanDetails.accountId = account._id;
            loanDetails.principal = toDecimal128(principal);
            loanDetails.remainingLoan = toDecimal128(emiAmount.mul(loanPeriod).mul(-1));
            loanDetails.interestRate = toDecimal128(interestRate);
            loanDetails.period = loanPeriod;
            loanDetails.status = "active";
            await Loan.create(loanDetails).session(session);
        }

        // TODO: send one time link via email displaying the card number and CVV
        const { cardNumber, hashedCardNumber, cardNumberDisplay } = await getCardNumber();
        const { CVV, hashedCVV } = await generateCVV();
        const expiryDate = generateExpiryDate();

        await Card.create({
            accountId: account._id,
            network,
            number: hashedCardNumber,
            numberDisplay: cardNumberDisplay,
            securityCode: hashedCVV,
            expiryDate
        }).session(session);

        const card = {
            numberDisplay: cardNumberDisplay,
            expiryDate,
            network
        };

        res.status(201).json({ account, card, message: "Created successfully" });
    } catch (error) {
        await session.abortTransaction();
        session.endSession();

        res.status(500).json({ message: "Failed to create account", error: error.message });
    }
};

// TODO: update, delete account
