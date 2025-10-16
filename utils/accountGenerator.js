import Decimal from "decimal.js";

export const generateIban = (countrycode = "BG") => {
    const randomDigits = Array.from({ length: 14 }, () => Math.floor(Math.random() * 10)).join("");
    const iban = `${countrycode}${Math.floor(10 + Math.random() * 89)}BANK${randomDigits}`;
    return iban;  // TODO: replace BANK with actual bank name
};

export const calculateInterestRate = (amount) => {
    if (amount.lessThanOrEqualTo(10000)) {
        return new Decimal(0.05);
    } else if (amount.lessThanOrEqualTo(50000)) {
        return new Decimal(0.075);
    } else {
        return new Decimal(0.10);
    }
};

export const calculateEmi = (rate, period, amount) => {  // Based on the Reducing Balance Method
    const monthlyRate = rate / 12;
    const variable = (1 + monthlyRate) ** period;
    const emi = amount * monthlyRate * variable / (variable - 1);
    return new Decimal(emi.toFixed(2));
};
