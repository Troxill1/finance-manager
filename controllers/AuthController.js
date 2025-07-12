import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'ZqX8V8NpA9dJw4RmT2YpUqGt9X7sAq2F';

export const register = async (req, res) => {
    const { username, email, password } = req.body;
    try {
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: "Email already in use" });
        }

        const hashedPassword = await bcrypt.hash(password, 12);
        const newUser = await User.create({ username, email, password: hashedPassword });

        res.status(201).json({ message: "User registered", user: newUser });

    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Incorrect password" });
        }

        const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '2h' });
        res.json({ message: "Successful login", token, user });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};