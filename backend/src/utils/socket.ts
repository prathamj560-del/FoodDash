import { Server, Socket } from "socket.io";
import User from "../models/user.model";
import redisClient from "./redis";

// Define interfaces for the event payloads
interface IdentityPayload {
    userId: string;
}

interface LocationPayload {
    latitude: number;
    longitude: number;
    userId: string;
}

// Track last DB update time for each user to avoid excessive writes
const lastDbUpdate = new Map<string, number>();
const DB_UPDATE_INTERVAL = 30000; // Update DB every 30 seconds

export const socketHandler = (io: Server) => {
    io.on('connection', (socket: Socket) => {
        console.log(`User connected: ${socket.id}`);

        // Handle Identity (Mapping userId to socketId)
        socket.on('identity', async ({ userId }: IdentityPayload) => {
            try {
                // Store in Redis for fast lookup and persistence
                await redisClient.setSocketConnection(userId, socket.id);

                // Update MongoDB
                await User.findByIdAndUpdate(userId, {
                    socketId: socket.id,
                    isOnline: true
                }, { new: true });

                console.log(`✅ User ${userId} identified with socket ${socket.id}`);
            } catch (error) {
                console.error("Socket Identity Error:", error);
            }
        });

        // Handle Real-time Location Updates
        socket.on('updateLocation', async ({ latitude, longitude, userId }: LocationPayload) => {
            try {
                const location = {
                    type: 'Point',
                    coordinates: [longitude, latitude] // GeoJSON: [lng, lat]
                };

                // Always cache in Redis (fast, frequent updates)
                await redisClient.cacheLocation(userId, location);
                await redisClient.setSocketConnection(userId, socket.id);

                // Update MongoDB only every 30 seconds to reduce load
                const now = Date.now();
                const lastUpdate = lastDbUpdate.get(userId) || 0;

                if (now - lastUpdate >= DB_UPDATE_INTERVAL) {
                    await User.findByIdAndUpdate(userId, {
                        location,
                        isOnline: true,
                        socketId: socket.id
                    });
                    lastDbUpdate.set(userId, now);
                }

                // Broadcast location to all connected clients (e.g., tracking screens)
                io.emit('updateDeliveryLocation', {
                    deliveryBoyId: userId,
                    latitude,
                    longitude
                });
            } catch (error) {
                console.error('updateDeliveryLocation error:', error);
            }
        });

        // Handle Disconnection
        socket.on('disconnect', async () => {
            try {
                // Find user by socket ID in Redis or DB
                const connections = await redisClient.getAllSocketConnections();
                const userId = Object.keys(connections).find(key => connections[key] === socket.id);

                if (userId) {
                    // Remove from Redis
                    await redisClient.removeSocketConnection(userId);

                    // If location was being updated, save final position to DB
                    const cachedLocation = await redisClient.getLocation(userId);
                    if (cachedLocation) {
                        await User.findByIdAndUpdate(userId, {
                            location: cachedLocation,
                            socketId: null,
                            isOnline: false
                        });
                    } else {
                        await User.findByIdAndUpdate(userId, {
                            socketId: null,
                            isOnline: false
                        });
                    }

                    lastDbUpdate.delete(userId);
                    console.log(`User ${userId} disconnected: ${socket.id}`);
                } else {
                    // Fallback: update by socketId in DB
                    await User.findOneAndUpdate(
                        { socketId: socket.id },
                        {
                            socketId: null,
                            isOnline: false
                        }
                    );
                    console.log(`User disconnected: ${socket.id}`);
                }
            } catch (error) {
                console.error("Socket Disconnect Error:", error);
            }
        });
    });
};