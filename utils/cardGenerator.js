import bcrypt from "bcryptjs";

const generateCardNumber = (network = "Visa") => {
    // Visa or Mastercard
    let prefix = network === "Visa" ? "4" : String(51 + Math.floor(Math.random() * 5));
    const numberTemp = prefix + Array.from({ length: 14 }, () => Math.floor(Math.random() * 10)).join("");
    let number = numberTemp.split("").map(x => parseInt(x));

    // Luhn checksum
    let sum = 0;
    for (let i = number.length - 1; i >= 0; i--) {
        let digit = number[i];
        if ((number.length - i) % 2 === 1) {
            digit *= 2;
            if (digit > 9) digit -= 9;
        } 
        sum += digit;
    }
    let checkDigit = (10 - (sum % 10)) % 10;
    number.push(checkDigit);

    return number.join("");
};

export const getCardNumber = async () => {
    const cardNumber = generateCardNumber();
    const cardNumberDisplay = cardNumber.slice(-4);
    const hashedCardNumber = await bcrypt.hash(cardNumber, 10);
    return { cardNumber, cardNumberDisplay, hashedCardNumber };
}

export const generateCVV = async () => {
    const CVV = Math.floor(100 + Math.random() * 900).toString();
    const hashedCVV = await bcrypt.hash(CVV, 10);
    return { CVV, hashedCVV }
};

export const generateExpiryDate = () => {
    const now = new Date();
    const month = (now.getMonth() + 1).toString().padStart(2, "0");
    const year = (now.getFullYear() + 5).toString().slice(-2);
    return `${month}/${year}`;
};
