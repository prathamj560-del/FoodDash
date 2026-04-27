import amqp from 'amqplib';
import dotenv from 'dotenv';

dotenv.config();

// Queue names as constants
export const QUEUES = {
    EMAIL: 'email-queue',
    ORDER_PROCESSING: 'order-processing-queue',
    DELIVERY_ASSIGNMENT: 'delivery-assignment-queue',
    ANALYTICS: 'analytics-queue'
} as const;

// Email job types
export interface EmailJob {
    type: 'password-reset-otp' | 'delivery-otp' | 'order-confirmation' | 'welcome';
    to: string;
    data: {
        otp?: string;
        userName?: string;
        orderId?: string;
        [key: string]: any;
    };
}

// Order processing job types
export interface OrderJob {
    type: 'order-placed' | 'payment-verified';
    orderId: string;
    userId: string;
    shopIds: string[];
    paymentMethod: string;
    totalAmount: number;
}

// Delivery assignment job types
export interface DeliveryAssignmentJob {
    type: 'assign-delivery';
    orderId: string;
    shopOrderId: string;
    shopLocation: {
        lat: number;
        lng: number;
    };
    deliveryAddress: string;
}

// Analytics job types
export interface AnalyticsJob {
    type: 'order-placed' | 'order-delivered' | 'user-registered' | 'delivery-completed';
    timestamp: Date;
    data: Record<string, any>;
}

class RabbitMQService {
    private connection: any = null;
    private channel: any = null;
    private isConnected: boolean = false;
    private reconnectAttempts: number = 0;
    private maxReconnectAttempts: number = 5;

    /**
     * Connect to RabbitMQ server
     */
    async connect(): Promise<void> {
        try {
            const rabbitMQUrl = process.env.RABBITMQ_URL || 'amqp://localhost:5672';

            console.log('🐰 Connecting to RabbitMQ...');
            this.connection = await amqp.connect(rabbitMQUrl);
            this.channel = await this.connection.createChannel();

            // Handle connection errors
            this.connection.on('error', (err: any) => {
                console.error('❌ RabbitMQ connection error:', err);
                this.isConnected = false;
            });

            this.connection.on('close', () => {
                console.log('⚠️  RabbitMQ connection closed. Attempting to reconnect...');
                this.isConnected = false;
                this.reconnect();
            });

            // Assert all queues (create if they don't exist)
            await this.assertQueues();

            this.isConnected = true;
            this.reconnectAttempts = 0;
            console.log('✅ RabbitMQ connected successfully!');
        } catch (error) {
            console.error('❌ Failed to connect to RabbitMQ:', error);
            this.reconnect();
        }
    }

    /**
     * Reconnect to RabbitMQ with exponential backoff
     */
    private async reconnect(): Promise<void> {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
            console.log(`🔄 Reconnecting to RabbitMQ in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);

            setTimeout(() => {
                this.connect();
            }, delay);
        } else {
            console.error('❌ Max reconnection attempts reached. Please check RabbitMQ server.');
        }
    }

    /**
     * Assert all queues (create them if they don't exist)
     */
    private async assertQueues(): Promise<void> {
        if (!this.channel) {
            throw new Error('Channel not initialized');
        }

        const queueOptions = {
            durable: true, // Survive broker restarts
        };

        // Assert all queues
        for (const queueName of Object.values(QUEUES)) {
            await this.channel.assertQueue(queueName, queueOptions);
            console.log(`📬 Queue asserted: ${queueName}`);
        }
    }

    /**
     * Publish a message to a queue
     */
    private async publishToQueue(queueName: string, message: any): Promise<boolean> {
        if (!this.isConnected || !this.channel) {
            console.error('❌ RabbitMQ not connected. Cannot publish message.');
            return false;
        }

        try {
            const messageBuffer = Buffer.from(JSON.stringify(message));
            const sent = this.channel.sendToQueue(queueName, messageBuffer, {
                persistent: true, // Survive broker restarts
                contentType: 'application/json',
                timestamp: Date.now()
            });

            if (sent) {
                console.log(`📤 Message published to ${queueName}`);
                return true;
            } else {
                console.warn(`⚠️  Failed to publish message to ${queueName} - Queue buffer full`);
                return false;
            }
        } catch (error) {
            console.error(`❌ Error publishing to ${queueName}:`, error);
            return false;
        }
    }

    /**
     * Publish email job to queue
     */
    async publishEmailJob(job: EmailJob): Promise<boolean> {
        return this.publishToQueue(QUEUES.EMAIL, job);
    }

    /**
     * Publish order processing job to queue
     */
    async publishOrderJob(job: OrderJob): Promise<boolean> {
        return this.publishToQueue(QUEUES.ORDER_PROCESSING, job);
    }

    /**
     * Publish delivery assignment job to queue
     */
    async publishDeliveryAssignmentJob(job: DeliveryAssignmentJob): Promise<boolean> {
        return this.publishToQueue(QUEUES.DELIVERY_ASSIGNMENT, job);
    }

    /**
     * Publish analytics job to queue
     */
    async publishAnalyticsJob(job: AnalyticsJob): Promise<boolean> {
        return this.publishToQueue(QUEUES.ANALYTICS, job);
    }

    /**
     * Consume messages from a queue
     */
    async consumeQueue(
        queueName: string,
        onMessage: (message: any) => Promise<void>,
        options: { prefetch?: number } = {}
    ): Promise<void> {
        if (!this.channel) {
            throw new Error('Channel not initialized');
        }

        // Set prefetch count (number of messages to process concurrently)
        const prefetchCount = options.prefetch || 1;
        await this.channel.prefetch(prefetchCount);

        console.log(`👂 Listening for messages on ${queueName} (prefetch: ${prefetchCount})...`);

        this.channel.consume(queueName, async (msg: any) => {
            if (!msg) {
                return;
            }

            try {
                const content = JSON.parse(msg.content.toString());
                console.log(`📨 Received message from ${queueName}:`, content.type || 'unknown');

                // Process the message
                await onMessage(content);

                // Acknowledge the message (remove from queue)
                this.channel?.ack(msg);
                console.log(`✅ Message processed and acknowledged from ${queueName}`);
            } catch (error) {
                console.error(`❌ Error processing message from ${queueName}:`, error);

                // Reject and requeue the message (will be retried)
                // In production, you might want to implement a dead letter queue
                this.channel?.nack(msg, false, true);
                console.log(`🔁 Message requeued for retry`);
            }
        }, {
            noAck: false // Manual acknowledgment
        });
    }

    /**
     * Close RabbitMQ connection
     */
    async close(): Promise<void> {
        try {
            if (this.channel) {
                await this.channel.close();
            }
            if (this.connection) {
                await this.connection.close();
            }
            this.isConnected = false;
            console.log('👋 RabbitMQ connection closed');
        } catch (error) {
            console.error('❌ Error closing RabbitMQ connection:', error);
        }
    }

    /**
     * Get connection status
     */
    getStatus(): { connected: boolean; reconnectAttempts: number } {
        return {
            connected: this.isConnected,
            reconnectAttempts: this.reconnectAttempts
        };
    }
}

// Export singleton instance
export const rabbitMQ = new RabbitMQService();
