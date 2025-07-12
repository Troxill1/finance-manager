import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'ZqX8V8NpA9dJw4RmT2YpUqGt9X7sAq2F';

const requireAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;  // contains { id: user._id }
        next();
    } catch (err) {
        res.status(401).json({ message: "Invalid token" });
    }
};

export default requireAuth;
