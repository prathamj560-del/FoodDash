import { createClient, RedisClientType } from 'redis';

class RedisClient {
    private client: RedisClientType | null = null;
    private isConnected: boolean = false;

    async connect() {
        try {
            const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
            
            this.client = createClient({
                url: redisUrl,
                socket: {
                    reconnectStrategy: (retries) => {
                        if (retries > 10) {
                            console.error('Redis: Max reconnection attempts reached');
                            return new Error('Max reconnection attempts reached');
                        }
                        return Math.min(retries * 100, 3000);
                    }
                }
            });

            this.client.on('error', (err) => {
                console.error('Redis Client Error:', err);
                this.isConnected = false;
            });

            this.client.on('connect', () => {
                console.log('🔌 Redis: Connecting...');
            });

            this.client.on('ready', () => {
                console.log('✅ Redis: Connected and ready');
                this.isConnected = true;
            });

            this.client.on('reconnecting', () => {
                console.log('🔄 Redis: Reconnecting...');
            });

            this.client.on('end', () => {
                console.log('❌ Redis: Connection closed');
                this.isConnected = false;
            });

            await this.client.connect();
            return this.client;
        } catch (error) {
            console.error('Failed to connect to Redis:', error);
            this.isConnected = false;
            throw error;
        }
    }

    getClient(): RedisClientType {
        if (!this.client || !this.isConnected) {
            throw new Error('Redis client is not connected');
        }
        return this.client;
    }

    async disconnect() {
        if (this.client) {
            await this.client.quit();
            this.isConnected = false;
        }
    }

    // Socket Connection Management
    async setSocketConnection(userId: string, socketId: string): Promise<void> {
        try {
            const client = this.getClient();
            await client.hSet('socket:connections', userId, socketId);
            // Set expiry for the entire hash (24 hours)
            await client.expire('socket:connections', 86400);
        } catch (error) {
            console.error('Redis: Error setting socket connection:', error);
        }
    }

    async getSocketId(userId: string): Promise<string | null> {
        try {
            const client = this.getClient();
            return await client.hGet('socket:connections', userId);
        } catch (error) {
            console.error('Redis: Error getting socket ID:', error);
            return null;
        }
    }

    async removeSocketConnection(userId: string): Promise<void> {
        try {
            const client = this.getClient();
            await client.hDel('socket:connections', userId);
        } catch (error) {
            console.error('Redis: Error removing socket connection:', error);
        }
    }

    async getAllSocketConnections(): Promise<Record<string, string>> {
        try {
            const client = this.getClient();
            return await client.hGetAll('socket:connections');
        } catch (error) {
            console.error('Redis: Error getting all socket connections:', error);
            return {};
        }
    }

    // Location Caching
    async cacheLocation(userId: string, location: { type: string; coordinates: number[] }): Promise<void> {
        try {
            const client = this.getClient();
            const key = `location:${userId}`;
            await client.set(key, JSON.stringify(location), {
                EX: 300 // 5 minutes expiry
            });
        } catch (error) {
            console.error('Redis: Error caching location:', error);
        }
    }

    async getLocation(userId: string): Promise<{ type: string; coordinates: number[] } | null> {
        try {
            const client = this.getClient();
            const data = await client.get(`location:${userId}`);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Redis: Error getting location:', error);
            return null;
        }
    }

    // Generic Caching
    async set(key: string, value: any, expirySeconds?: number): Promise<void> {
        try {
            const client = this.getClient();
            const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
            
            if (expirySeconds) {
                await client.set(key, stringValue, { EX: expirySeconds });
            } else {
                await client.set(key, stringValue);
            }
        } catch (error) {
            console.error('Redis: Error setting value:', error);
        }
    }

    async get(key: string): Promise<any | null> {
        try {
            const client = this.getClient();
            const data = await client.get(key);
            if (!data) return null;
            
            try {
                return JSON.parse(data);
            } catch {
                return data;
            }
        } catch (error) {
            console.error('Redis: Error getting value:', error);
            return null;
        }
    }

    async del(key: string): Promise<void> {
        try {
            const client = this.getClient();
            await client.del(key);
        } catch (error) {
            console.error('Redis: Error deleting key:', error);
        }
    }

    async delPattern(pattern: string): Promise<void> {
        try {
            const client = this.getClient();
            const keys = await client.keys(pattern);
            if (keys.length > 0) {
                await client.del(keys);
            }
        } catch (error) {
            console.error('Redis: Error deleting pattern:', error);
        }
    }

    // OTP Management
    async setOTP(identifier: string, otp: string, expiryMinutes: number = 10): Promise<void> {
        try {
            const client = this.getClient();
            const key = `otp:${identifier}`;
            await client.set(key, otp, { EX: expiryMinutes * 60 });
        } catch (error) {
            console.error('Redis: Error setting OTP:', error);
        }
    }

    async getOTP(identifier: string): Promise<string | null> {
        try {
            const client = this.getClient();
            return await client.get(`otp:${identifier}`);
        } catch (error) {
            console.error('Redis: Error getting OTP:', error);
            return null;
        }
    }

    async deleteOTP(identifier: string): Promise<void> {
        try {
            const client = this.getClient();
            await client.del(`otp:${identifier}`);
        } catch (error) {
            console.error('Redis: Error deleting OTP:', error);
        }
    }

    // Rate Limiting
    async checkRateLimit(identifier: string, maxAttempts: number, windowSeconds: number): Promise<{ allowed: boolean; remaining: number }> {
        try {
            const client = this.getClient();
            const key = `ratelimit:${identifier}`;
            
            const current = await client.incr(key);
            
            if (current === 1) {
                await client.expire(key, windowSeconds);
            }
            
            const allowed = current <= maxAttempts;
            const remaining = Math.max(0, maxAttempts - current);
            
            return { allowed, remaining };
        } catch (error) {
            console.error('Redis: Error checking rate limit:', error);
            return { allowed: true, remaining: maxAttempts };
        }
    }
}

// Singleton instance
const redisClient = new RedisClient();

export default redisClient;
