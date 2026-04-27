import { useState } from 'react';
import { FaRegEye, FaRegEyeSlash } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";
import { useNavigate } from 'react-router-dom';
import axios, { AxiosError } from "axios";
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { ClipLoader } from "react-spinners";
import { useDispatch } from 'react-redux';
import type { User } from '../schema';
import { SERVER_URI } from '../../App';
import { setUserData } from '../../redux/userSlice';
import { auth } from '../../utils/firebase';
import toast from 'react-hot-toast';

// 1. Define Types
type UserRole = "user" | "owner" | "deliveryBoy";

interface SignUpResponse {
    user: User
    token?: string;
    message?: string;
}

const COLORS = {
    primary: "#ff4d2d",
    hover: "#e64323",
    bg: "#fff9f6",
    border: "#ddd"
};

function SignUp() {
    const navigate = useNavigate();
    const dispatch = useDispatch();

    // Form State
    const [role, setRole] = useState<UserRole>("user");
    const [showPassword, setShowPassword] = useState(false);
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [mobile, setMobile] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSignUp = async () => {
        if (!mobile || !fullName || !email || !password) {
            return toast.error("Please fill in all fields");
        }

        const loadingToast = toast.loading("Creating your account...");
        setLoading(true);
        try {
            const result = await axios.post<SignUpResponse>(`${SERVER_URI}/api/auth/signup`, {
                fullName, email, password, mobile, role
            }, { withCredentials: true });

            dispatch(setUserData(result.data.user));
            toast.success("Account created successfully!", { id: loadingToast });
            navigate('/');
        } catch (error) {
            const axiosError = error as AxiosError<{ message: string }>;
            const message = axiosError.response?.data?.message || "Registration failed";
            toast.error(message, { id: loadingToast });
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleAuth = async () => {
        if (!mobile) {
            return toast.error("Mobile number is required for registration");
        }

        try {
            const provider = new GoogleAuthProvider();
            const result = await signInWithPopup(auth, provider);

            // Using toast.promise for a cleaner look
            await toast.promise(
                axios.post<SignUpResponse>(`${SERVER_URI}/api/auth/google-auth`, {
                    fullName: result.user.displayName,
                    email: result.user.email,
                    role,
                    mobile
                }, { withCredentials: true }),
                {
                    loading: 'Syncing Google account...',
                    success: (res) => {
                        dispatch(setUserData(res.data.user));
                        navigate('/');
                        return "Welcome to FoodDash!";
                    },
                    error: "Google Sign-up failed"
                }
            );
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className='min-h-screen w-full flex items-center justify-center p-4' style={{ backgroundColor: COLORS.bg }}>
            <div className='bg-white rounded-xl shadow-lg w-full max-w-md p-8 border' style={{ borderColor: COLORS.border }}>
                <h1 className='text-3xl font-bold mb-2' style={{ color: COLORS.primary }}>FoodDash</h1>
                <p className='text-gray-600 mb-6'>Create your account to get started with delicious food deliveries.</p>

                {/* Role Selection - Segmented Control */}
                <div className='mb-6'>
                    <label className='block text-gray-700 font-medium mb-2'>Register as:</label>
                    <div className="flex bg-gray-100 p-1 rounded-lg">
                        {(["user", "owner", "deliveryBoy"] as UserRole[]).map((r) => (
                            <button
                                key={r}
                                className={`flex-1 py-2 text-xs font-semibold rounded-md transition-all capitalize ${role === r ? 'bg-white shadow-sm text-[#ff4d2d]' : 'text-gray-500 hover:text-gray-700'
                                    }`}
                                onClick={() => setRole(r)}
                            >
                                {r === 'deliveryBoy' ? 'Delivery' : r}
                            </button>
                        ))}
                    </div>
                </div>

                <div className='space-y-4 mb-6'>
                    <div>
                        <label className='block text-gray-700 font-medium mb-1'>Full Name</label>
                        <input
                            type="text"
                            className='w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#ff4d2d]/20 focus:outline-none'
                            style={{ borderColor: COLORS.border }}
                            placeholder='John Doe'
                            onChange={(e) => setFullName(e.target.value)}
                            value={fullName}
                        />
                    </div>

                    <div>
                        <label className='block text-gray-700 font-medium mb-1'>Email</label>
                        <input
                            type="email"
                            className='w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#ff4d2d]/20 focus:outline-none'
                            style={{ borderColor: COLORS.border }}
                            placeholder='example@mail.com'
                            onChange={(e) => setEmail(e.target.value)}
                            value={email}
                        />
                    </div>

                    <div>
                        <label className='block text-gray-700 font-medium mb-1'>Mobile</label>
                        <input
                            type="tel"
                            className='w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#ff4d2d]/20 focus:outline-none'
                            style={{ borderColor: COLORS.border }}
                            placeholder='Enter mobile number'
                            onChange={(e) => setMobile(e.target.value)}
                            value={mobile}
                        />
                    </div>

                    <div>
                        <label className='block text-gray-700 font-medium mb-1'>Password</label>
                        <div className='relative'>
                            <input
                                type={showPassword ? "text" : "password"}
                                className='w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#ff4d2d]/20 focus:outline-none pr-10'
                                style={{ borderColor: COLORS.border }}
                                placeholder='••••••••'
                                onChange={(e) => setPassword(e.target.value)}
                                value={password}
                            />
                            <button
                                className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700'
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? <FaRegEyeSlash /> : <FaRegEye />}
                            </button>
                        </div>
                    </div>
                </div>

                <button
                    className='w-full font-semibold py-2.5 rounded-lg transition-colors text-white disabled:opacity-70'
                    style={{ backgroundColor: COLORS.primary }}
                    onClick={handleSignUp}
                    disabled={loading}
                >
                    {loading ? <ClipLoader size={20} color='white' /> : "Sign Up"}
                </button>

                <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-gray-300"></span></div>
                    <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-gray-500">Or sign up with</span></div>
                </div>

                <button
                    className='w-full flex items-center justify-center gap-2 border rounded-lg px-4 py-2 hover:bg-gray-50 transition-colors border-gray-400'
                    onClick={handleGoogleAuth}
                >
                    <FcGoogle size={20} />
                    <span className="font-medium">Google</span>
                </button>

                <p className='text-center mt-8 text-gray-600'>
                    Already have an account?
                    <span className='text-[#ff4d2d] ml-1 font-medium cursor-pointer' onClick={() => navigate("/signin")}>Sign In</span>
                </p>
            </div>
        </div>
    );
}

export default SignUp;