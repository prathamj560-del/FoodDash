import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";

// Extend Request interface to include userId and cookies
declare global {
    namespace Express {
        interface Request {
            userId?: string;
            cookies: {
                token?: string;
                [key: string]: any;
            };
        }
    }
}

export const isAuth = (req: Request, res: Response, next: NextFunction) => {
    try {
        const token = req.cookies.token;
        if (!token) {
            return res.status(400).json({ message: "token not found" });
        }
        const decodeToken = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload & { userId: string };
        if (!decodeToken || !decodeToken.userId) {
            return res.status(400).json({ message: "token not verify" });
        }
        req.userId = decodeToken.userId;
        next();
    } catch (error) {
        return res.status(500).json({ message: "isAuth error" });
    }
};