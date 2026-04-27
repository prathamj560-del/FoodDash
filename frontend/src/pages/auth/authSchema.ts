export interface User {
    _id: string;
    fullName: string;
    email: string;
    mobile: string;
    role: 'deliveryBoy' | 'user' | 'owner'; // Adjust based on your actual roles
    isOtpVerified?: boolean;
    createdAt?: string;
    updatedAt?: string;
}

export interface AuthResponse {
    message: string;
    user: User;
}

// POST /signup
export interface SignUpRequest {
    fullName: string;
    email: string;
    password: string;
    mobile: string;
    role: string;
}

// POST /signin
export interface SignInRequest {
    email: string;
    password?: string; // Optional for cases where password isn't set
}

// POST /google-auth
export interface GoogleAuthRequest {
    fullName: string;
    email: string;
    mobile?: string;
    role: string;
}


// POST /send-otp
export interface SendOtpRequest {
    email: string;
}

// POST /verify-otp
export interface VerifyOtpRequest {
    email: string;
    otp: string;
}

// POST /reset-password
export interface ResetPasswordRequest {
    email: string;
    newPassword: string;
}

// Generic Message Response (for OTP, Reset, Signout)
export interface MessageResponse {
    message: string;
}