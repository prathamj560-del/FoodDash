import { rabbitMQ, QUEUES, EmailJob } from '../utils/rabbitmq';
import { sendOtpMail, sendDeliveryOtpMail } from '../utils/mail';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Email templates
const emailTemplates = {
    'password-reset-otp': (data: any) => ({
        subject: 'Reset Your Password - FoodDash',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #2563eb;">Password Reset Request</h2>
                <p>Hello,</p>
                <p>You have requested to reset your password. Please use the following OTP:</p>
                <div style="background-color: #f3f4f6; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
                    ${data.otp}
                </div>
                <p style="color: #ef4444;">⚠️ This OTP will expire in 5 minutes.</p>
                <p>If you didn't request this password reset, please ignore this email.</p>
                <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;" />
                <p style="color: #6b7280; font-size: 12px;">
                    This is an automated email from FoodDash Food Delivery. Please do not reply.
                </p>
            </div>
        `
    }),

    'delivery-otp': (data: any) => ({
        subject: 'Delivery OTP - FoodDash',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #10b981;">Delivery Verification</h2>
                <p>Hello ${data.userName || 'Customer'},</p>
                <p>Your order is about to be delivered! Please share this OTP with the delivery person:</p>
                <div style="background-color: #f0fdf4; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; margin: 20px 0; border: 2px dashed #10b981;">
                    ${data.otp}
                </div>
                <p style="color: #ef4444;">⚠️ This OTP will expire in 5 minutes.</p>
                <p>Do not share this OTP until you receive your order.</p>
                <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;" />
                <p style="color: #6b7280; font-size: 12px;">
                    This is an automated email from FoodDash Food Delivery. Please do not reply.
                </p>
            </div>
        `
    }),

    'order-confirmation': (data: any) => ({
        subject: 'Order Confirmed - FoodDash',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #10b981;">🎉 Order Confirmed!</h2>
                <p>Hello ${data.userName || 'Customer'},</p>
                <p>Thank you for your order! Your order has been confirmed and is being prepared.</p>
                <div style="background-color: #f3f4f6; padding: 20px; margin: 20px 0; border-radius: 8px;">
                    <p style="margin: 5px 0;"><strong>Order ID:</strong> ${data.orderId}</p>
                    <p style="margin: 5px 0;"><strong>Total Amount:</strong> ₹${data.totalAmount}</p>
                    <p style="margin: 5px 0;"><strong>Payment Method:</strong> ${data.paymentMethod}</p>
                </div>
                <p>You can track your order status in the app.</p>
                <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;" />
                <p style="color: #6b7280; font-size: 12px;">
                    This is an automated email from FoodDash Food Delivery. Please do not reply.
                </p>
            </div>
        `
    }),

    'welcome': (data: any) => ({
        subject: 'Welcome to FoodDash! 🍔',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #2563eb;">Welcome to FoodDash! 🎉</h2>
                <p>Hello ${data.userName},</p>
                <p>Thank you for joining FoodDash - your favorite food delivery platform!</p>
                <p>We're excited to have you on board. You can now:</p>
                <ul style="line-height: 2;">
                    <li>🍕 Browse delicious food from local restaurants</li>
                    <li>🛒 Order with ease and track in real-time</li>
                    <li>💳 Pay securely online or cash on delivery</li>
                    <li>📍 Get your food delivered right to your doorstep</li>
                </ul>
                <p>Happy ordering!</p>
                <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;" />
                <p style="color: #6b7280; font-size: 12px;">
                    This is an automated email from FoodDash Food Delivery. Please do not reply.
                </p>
            </div>
        `
    })
};

// Email transporter (reuse from mail.ts but allow retry logic)
const transporter = nodemailer.createTransport({
    service: "Gmail",
    port: 465,
    secure: true,
    auth: {
        user: process.env.EMAIL,
        pass: process.env.PASS,
    },
});

/**
 * Process email jobs from the queue
 */
async function processEmailJob(job: EmailJob): Promise<void> {
    try {
        console.log(`📧 Processing email job: ${job.type} to ${job.to}`);

        let emailContent;

        // Get email template based on type
        if (emailTemplates[job.type]) {
            emailContent = emailTemplates[job.type](job.data);
        } else {
            throw new Error(`Unknown email type: ${job.type}`);
        }

        // Send email
        await transporter.sendMail({
            from: `FoodDash Food Delivery <${process.env.EMAIL}>`,
            to: job.to,
            subject: emailContent.subject,
            html: emailContent.html
        });

        console.log(`✅ Email sent successfully: ${job.type} to ${job.to}`);
    } catch (error) {
        console.error(`❌ Failed to send email (${job.type}):`, error);
        throw error; // Re-throw to trigger retry via nack
    }
}

/**
 * Start the email worker
 */
export async function startEmailWorker(): Promise<void> {
    try {
        console.log('🚀 Starting Email Worker...');

        // Connect to RabbitMQ
        await rabbitMQ.connect();

        // Start consuming messages from email queue
        await rabbitMQ.consumeQueue(
            QUEUES.EMAIL,
            processEmailJob,
            { prefetch: 5 } // Process up to 5 emails concurrently
        );

        console.log('✅ Email Worker started successfully!');
        console.log('👂 Listening for email jobs...');

    } catch (error) {
        console.error('❌ Failed to start Email Worker:', error);
        process.exit(1);
    }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n⚠️  Shutting down Email Worker...');
    await rabbitMQ.close();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('\n⚠️  Shutting down Email Worker...');
    await rabbitMQ.close();
    process.exit(0);
});

// Start the worker if this file is run directly
if (require.main === module) {
    startEmailWorker();
}
