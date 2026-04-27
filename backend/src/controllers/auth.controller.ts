import { Request, Response } from "express";
import User from "../models/user.model";
import bcrypt from "bcryptjs";
import { genToken } from "../utils/token";
import { rabbitMQ } from "../utils/rabbitmq";

export const signUp = async (req: Request, res: Response) => {
    try {
        const { fullName, email, password, mobile, role } = req.body;
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ message: "User Already exist." });
        }
        if (password.length < 6) {
            return res.status(400).json({ message: "password must be at least 6 characters." });
        }
        if (mobile.length < 10) {
            return res.status(400).json({ message: "mobile no must be at least 10 digits." });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        user = await User.create({
            fullName,
            email,
            role,
            mobile,
            password: hashedPassword
        });

        // Send welcome email asynchronously via RabbitMQ
        await rabbitMQ.publishEmailJob({
            type: 'welcome',
            to: email,
            data: { userName: fullName }
        });

        const token = await genToken(user._id.toString());
        res.cookie("token", token, {
            secure: true,
            sameSite: "none",
            maxAge: 7 * 24 * 60 * 60 * 1000,
            httpOnly: true
        });

        return res.status(201).json({ message: "User created Successfully", user });

    } catch (error) {
        return res.status(500).json({ message: `Sign up error: ${error}` });
    }
};

export const signIn = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "User does not exist." });
        }
        if (!user.password) {
            return res.status(400).json({ message: "Password not set for this user." });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "incorrect Password" });
        }



        const token = await genToken(user._id.toString());
        res.cookie("token", token, {
            secure: true,
            sameSite: "none",
            maxAge: 7 * 24 * 60 * 60 * 1000,
            httpOnly: true
        });

        return res.status(200).json({ user, token });

    } catch (error) {
        return res.status(500).json({ message: `Sign In error: ${error}` });
    }
};

export const signOut = async (req: Request, res: Response) => {
    try {
        res.clearCookie("token");
        return res.status(200).json({ message: "log out successfully" });
    } catch (error) {
        return res.status(500).json({ message: `Sign out error: ${error}` });
    }
};

export const sendOtp = async (req: Request, res: Response) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "User does not exist." });
        }
        const otp = Math.floor(1000 + Math.random() * 9000).toString();
        user.resetOtp = otp;
        user.otpExpires = new Date(Date.now() + 5 * 60 * 1000);
        user.isOtpVerified = false;
        await user.save();

        // Send OTP email asynchronously via RabbitMQ
        await rabbitMQ.publishEmailJob({
            type: 'password-reset-otp',
            to: email,
            data: { otp }
        });

        return res.status(200).json({ message: "otp sent successfully" });
    } catch (error) {
        return res.status(500).json({ message: `Send otp error: ${error}` });
    }
};

export const verifyOtp = async (req: Request, res: Response) => {
    try {
        const { email, otp } = req.body;
        const user = await User.findOne({ email });
        if (!user || user.resetOtp !== otp || !user.otpExpires || user.otpExpires.getTime() < Date.now()) {
            return res.status(400).json({ message: "invalid/expired otp" });
        }
        user.isOtpVerified = true;
        user.resetOtp = undefined;
        user.otpExpires = undefined;
        await user.save();
        return res.status(200).json({ message: "otp verify successfully" });
    } catch (error) {
        return res.status(500).json({ message: `Verify otp error: ${error}` });
    }
};

export const resetPassword = async (req: Request, res: Response) => {
    try {
        const { email, newPassword } = req.body;
        const user = await User.findOne({ email });
        if (!user || !user.isOtpVerified) {
            return res.status(400).json({ message: "otp verification required" });
        }
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        user.isOtpVerified = false;
        await user.save();
        return res.status(200).json({ message: "password reset successfully" });
    } catch (error) {
        return res.status(500).json({ message: `Reset password error: ${error}` });
    }
};

export const googleAuth = async (req: Request, res: Response) => {
    try {
        const { fullName, email, mobile, role } = req.body;
        let user = await User.findOne({ email });
        if (!user) {
            user = await User.create({
                fullName, email, mobile, role
            });
        }

        const token = await genToken(user._id.toString());
        res.cookie("token", token, {
            secure: true,
            sameSite: "none",
            maxAge: 7 * 24 * 60 * 60 * 1000,
            httpOnly: true
        });

        return res.status(200).json({ user, token });

    } catch (error) {
        return res.status(500).json({ message: `GoogleAuth error: ${error}` });
    }
};
