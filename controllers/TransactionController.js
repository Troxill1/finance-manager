import Transaction from "../models/Transaction.js";

export const createTransaction = async (req, res) => {
    try {
        const { type, amount, category, note, date } = req.body;
        const newTransaction = new Transaction({
            userId: req.user.id,
            type,
            amount,
            category,
            note,
            date
        });

        await newTransaction.save();
        res.status(201).json(newTransaction);
    } catch (error) {
        res.status(500).json({ message: "Failed to create transaction", error: error.message });
    }
};

export const getTransaction = async (req, res) => {
    try {
        const transactions = await Transaction.find({ userId: req.user.id }).sort({ date: -1 });
        res.json(transactions);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch transactions", error: error.message  });
    }
};

export const deleteTransaction = async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await Transaction.findOneAndDelete({ _id: id, userId: req.user.id });
        if (!deleted) {
            return res.status(404).json({ message: "Transaction not found" });
        }

        res.status(200).json({ message: "Transaction deleted" });
    } catch (error) {
        res.status(500).json({ message: "Failed to delete transaction", error: error.message });
    }
};