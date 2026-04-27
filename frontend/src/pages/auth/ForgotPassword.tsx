import { useState } from 'react';
import axios, { AxiosError } from 'axios';
import { IoIosArrowRoundBack } from "react-icons/io";
import { useNavigate } from 'react-router-dom';
import { ClipLoader } from 'react-spinners';
import toast from 'react-hot-toast';
import { SERVER_URI } from '../../App';

// 1. Define Types
interface AuthResponse {
    message: string;
}

const COLORS = {
    primary: "#ff4d2d",
    hover: "#e64323",
    bg: "#fff9f6",
    border: "#ddd"
};

function ForgotPassword() {
    const navigate = useNavigate();

    // State
    const [step, setStep] = useState<number>(1);
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);

    // Helper to handle back navigation
    const handleBack = () => {
        if (step > 1) setStep(step - 1);
        else navigate("/signin");
    };

    const handleSendOtp = async () => {
        if (!email) return toast.error("Please enter your email");

        const tid = toast.loading("Sending OTP...");
        setLoading(true);
        try {
            await axios.post<AuthResponse>(`${SERVER_URI}/api/auth/send-otp`, { email }, { withCredentials: true });
            toast.success("OTP sent to your email", { id: tid });
            setStep(2);
        } catch (error) {
            const err = error as AxiosError<{ message: string }>;
            toast.error(err.response?.data?.message || "Failed to send OTP", { id: tid });
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async () => {
        if (!otp) return toast.error("Please enter the OTP");

        const tid = toast.loading("Verifying...");
        setLoading(true);
        try {
            await axios.post<AuthResponse>(`${SERVER_URI}/api/auth/verify-otp`, { email, otp }, { withCredentials: true });
            toast.success("OTP Verified", { id: tid });
            setStep(3);
        } catch (error) {
            const err = error as AxiosError<{ message: string }>;
            toast.error(err.response?.data?.message || "Invalid OTP", { id: tid });
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async () => {
        if (newPassword !== confirmPassword) {
            return toast.error("Passwords do not match");
        }
        if (newPassword.length < 6) {
            return toast.error("Password must be at least 6 characters");
        }

        const tid = toast.loading("Resetting password...");
        setLoading(true);
        try {
            await axios.post<AuthResponse>(`${SERVER_URI}/api/auth/reset-password`, { email, newPassword }, { withCredentials: true });
            toast.success("Password reset successful!", { id: tid });
            navigate("/signin");
        } catch (error) {
            const err = error as AxiosError<{ message: string }>;
            toast.error(err.response?.data?.message || "Reset failed", { id: tid });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className='flex w-full items-center justify-center min-h-screen p-4' style={{ backgroundColor: COLORS.bg }}>
            <div className='bg-white rounded-xl shadow-lg w-full max-w-md p-8 border' style={{ borderColor: COLORS.border }}>

                <div className='flex items-center gap-4 mb-2'>
                    <button
                        onClick={handleBack}
                        className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <IoIosArrowRoundBack size={32} style={{ color: COLORS.primary }} />
                    </button>
                    <div>
                        <h1 className='text-2xl font-bold' style={{ color: COLORS.primary }}>Forgot Password</h1>
                        <p className='text-xs text-gray-400 font-medium uppercase tracking-wider'>Step {step} of 3</p>
                    </div>
                </div>

                <p className='text-gray-600 mb-8 mt-2'>
                    {step === 1 && "Enter your email to receive a verification code."}
                    {step === 2 && `We've sent a code to ${email}`}
                    {step === 3 && "Create a strong new password for your account."}
                </p>

                {/* STEP 1: Email Input */}
                {step === 1 && (
                    <div className="space-y-6">
                        <div>
                            <label className='block text-gray-700 font-medium mb-1'>Email Address</label>
                            <input
                                type="email"
                                className='w-full border rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-[#ff4d2d]/20 focus:outline-none'
                                style={{ borderColor: COLORS.border }}
                                placeholder='name@example.com'
                                onChange={(e) => setEmail(e.target.value)}
                                value={email}
                            />
                        </div>
                        <button
                            className='w-full font-semibold py-3 rounded-lg transition-colors text-white disabled:opacity-70'
                            style={{ backgroundColor: COLORS.primary }}
                            onClick={handleSendOtp}
                            disabled={loading}
                        >
                            {loading ? <ClipLoader size={20} color='white' /> : "Send OTP"}
                        </button>
                    </div>
                )}

                {/* STEP 2: OTP Input */}
                {step === 2 && (
                    <div className="space-y-6">
                        <div>
                            <label className='block text-gray-700 font-medium mb-1'>Verification Code</label>
                            <input
                                type="text"
                                className='w-full border rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-[#ff4d2d]/20 focus:outline-none text-center text-2xl tracking-[1rem] font-bold'
                                style={{ borderColor: COLORS.border }}
                                placeholder='000000'
                                maxLength={6}
                                onChange={(e) => setOtp(e.target.value)}
                                value={otp}
                            />
                        </div>
                        <button
                            className='w-full font-semibold py-3 rounded-lg transition-colors text-white disabled:opacity-70'
                            style={{ backgroundColor: COLORS.primary }}
                            onClick={handleVerifyOtp}
                            disabled={loading}
                        >
                            {loading ? <ClipLoader size={20} color='white' /> : "Verify Code"}
                        </button>
                        <p className='text-center text-sm text-gray-500'>
                            Didn't get the code? <span className='text-[#ff4d2d] cursor-pointer font-medium' onClick={handleSendOtp}>Resend</span>
                        </p>
                    </div>
                )}

                {/* STEP 3: Reset Password */}
                {step === 3 && (
                    <div className="space-y-4">
                        <div>
                            <label className='block text-gray-700 font-medium mb-1'>New Password</label>
                            <input
                                type="password"
                                className='w-full border rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-[#ff4d2d]/20 focus:outline-none'
                                style={{ borderColor: COLORS.border }}
                                placeholder='••••••••'
                                onChange={(e) => setNewPassword(e.target.value)}
                                value={newPassword}
                            />
                        </div>
                        <div>
                            <label className='block text-gray-700 font-medium mb-1'>Confirm Password</label>
                            <input
                                type="password"
                                className='w-full border rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-[#ff4d2d]/20 focus:outline-none'
                                style={{ borderColor: COLORS.border }}
                                placeholder='••••••••'
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                value={confirmPassword}
                            />
                        </div>
                        <button
                            className='w-full font-semibold py-3 rounded-lg transition-colors text-white mt-4 disabled:opacity-70'
                            style={{ backgroundColor: COLORS.primary }}
                            onClick={handleResetPassword}
                            disabled={loading}
                        >
                            {loading ? <ClipLoader size={20} color='white' /> : "Reset Password"}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default ForgotPassword;