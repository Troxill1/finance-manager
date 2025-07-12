import { body, validationResult } from 'express-validator';

export const transactionValidationRules = [
    body("type")
        .isIn(["income", "expense"])
        .withMessage("Type must be either income or expense"),
    
    body("amount")
        .isNumeric()
        .withMessage("Amount must be a number")
        .custom((val) => val > 0)
        .withMessage("Amount must be greater than 0"),

    body("category")
        .optional()
        .isString()
        .withMessage("Category must be a string"),

    body("note")
        .optional()
        .isString()
        .withMessage("Note must be a string"),

    body("date")
        .optional()
        .isISO8601()
        .toDate()
        .withMessage("Date must be a valid ISO date")
];

export const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ message: "Validation error", errors: errors.array() });
    }

    next();
}