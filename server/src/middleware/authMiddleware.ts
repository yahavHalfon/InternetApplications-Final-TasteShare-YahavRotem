import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { getJWTSecret } from "../controllers/authController";

export type AuthRequest = Request & { user?: { _id: string } };

import User from "../model/userModel";

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Unauthorized: Missing or invalid token" });
    }
    const token = authHeader.split(" ")[1];
    if (!token) {
        return res.status(401).json({ error: "Unauthorized: No token provided" });
    }

    try {
        const secret = getJWTSecret();
        const decoded = jwt.verify(token, secret) as { _id: string };

        const user = await User.findById(decoded._id);
        if (!user) {
            return res.status(401).json({ error: "Unauthorized: User not found" });
        }

        req.user = { _id: user._id.toString() };
        next();
    } catch (err) {
        if (err instanceof Error && err.message === "JWT_SECRET is not defined") {
            return res.status(500).json({ error: "Internal Server Error" });
        }
        return res.status(401).json({ error: "Unauthorized: Invalid token" });
    }
};

export default authenticate;