import mongoose from "mongoose";

const cardSchema = new mongoose.Schema({
    accountId: { type: mongoose.Schema.ObjectId, ref: "Account", required: true },
    network: { type: String, enum: ["Visa", "Mastercard"], required: true },
    number: { type: String, required: true },
    numberDisplay: { type: String, required: true },  // last 4 digits of number
    securityCode: { type: String, required: true },
    expiryDate: { type: String, required: true },
}, { timestamps: true });

const Card = mongoose.model("Card", cardSchema);
export default Card;
