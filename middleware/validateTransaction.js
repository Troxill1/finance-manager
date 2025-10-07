import { body, validationResult } from 'express-validator';

export const transactionValidationRules = [
    body("merchant.name")
        .optional({ nullable: true })
        .isString()
        .withMessage("Merchant name must be a string"),

    body("merchant.location")
        .optional({ nullable: true })
        .isString()
        .withMessage("Merchant location must be a string"),

    body("type")
        .isIn(["transfer", "card_payment", "deposit", "withdrawal"])
        .withMessage("Type must be transfer, card payment, deposit or withdrawal"),
    
    body("amount")
        .isNumeric()
        .withMessage("Amount must be a number")
        .custom((val) => val > 0)
        .withMessage("Amount must be greater than 0"),

    body("currency")
        .optional()
        .isIn(["EUR", "BGN", "USD"])
        .withMessage("Currency must be EUR, BGN or USD"),

    body("category")
        .optional()
        .isString()
        .withMessage("Category must be a string"),

    body("note")
        .optional()
        .isString()
        .withMessage("Note must be a string"),

    body("completedAt")
        .optional()
        .isISO8601()
        .toDate()
        .withMessage("CompletedAt must be a valid ISO date"),
];

export const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ message: "Validation error", errors: errors.array() });
    }

    next();
};
