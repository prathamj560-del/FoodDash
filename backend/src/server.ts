import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import dbConnect from './utils/db';
import authRouter from './routes/auth.route';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import shopRouter from './routes/shop.route';
import itemRouter from './routes/item.route';
import userRouter from './routes/user.route';
import orderRouter from './routes/order.route';
import { Server } from "socket.io"
import http from 'http';
import { socketHandler } from './utils/socket';
import redisClient from './utils/redis';
import { rabbitMQ } from './utils/rabbitmq';
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const server = http.createServer(app)

const io = new Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL,
        credentials: true,
        methods: ['POST', 'GET']
    }
})

app.set("io", io)
// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials: true
}))
app.use(express.json());
app.use(cookieParser());

// Basic route
app.get('/', (req, res) => {
    res.json({ message: 'Welcome to FoodDash Backend API' });
});

app.use('/api/auth', authRouter);
app.use('/api/shop', shopRouter);
app.use('/api/item', itemRouter);
app.use('/api/user', userRouter);
app.use('/api/order', orderRouter);


socketHandler(io)

// Start server
const startServer = async () => {
    try {
        await dbConnect();
        await redisClient.connect();
        await rabbitMQ.connect(); // Initialize RabbitMQ connection
        server.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\nShutting down gracefully...');
    await redisClient.disconnect();
    await rabbitMQ.close(); // Close RabbitMQ connection
    process.exit(0);
});