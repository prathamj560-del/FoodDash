# 🐰 RabbitMQ Integration Guide

This document explains how RabbitMQ is integrated into the FoodDash application and how to use it.

## 📋 Table of Contents
- [Overview](#overview)
- [Setup](#setup)
- [Architecture](#architecture)
- [Usage](#usage)
- [Running the Workers](#running-the-workers)
- [Monitoring](#monitoring)
- [Production Deployment](#production-deployment)

## 🌟 Overview

RabbitMQ has been integrated to handle **asynchronous background tasks** in the FoodDash application. This improves:

- ⚡ **API Response Times** - Emails are sent in the background
- 🔄 **Reliability** - Automatic retries for failed tasks
- 📈 **Scalability** - Handle thousands of emails/tasks concurrently
- 🛡️ **Fault Tolerance** - Tasks won't be lost if service crashes

### Current Implementations

1. **Email Queue** - All OTP and notification emails
   - Password reset OTP emails
   - Delivery OTP emails
   - Order confirmation emails
   - Welcome emails for new users

## 🚀 Setup

### 1. Install RabbitMQ

#### **Option A: Local Installation (Recommended for Development)**

**Windows:**
```powershell
# Using Chocolatey
choco install rabbitmq

# Or download from https://www.rabbitmq.com/download.html
```

**macOS:**
```bash
brew install rabbitmq

# Start RabbitMQ
brew services start rabbitmq
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt-get update
sudo apt-get install rabbitmq-server

# Start RabbitMQ
sudo systemctl start rabbitmq-server
sudo systemctl enable rabbitmq-server
```

#### **Option B: Docker (Easiest)**
```bash
docker run -d --name rabbitmq \
  -p 5672:5672 \
  -p 15672:15672 \
  rabbitmq:3-management
```

#### **Option C: Cloud RabbitMQ (Production)**
- [CloudAMQP](https://www.cloudamqp.com/) - Free tier available
- [Amazon MQ](https://aws.amazon.com/amazon-mq/)
- [RabbitMQ as a Service on Heroku](https://elements.heroku.com/addons/cloudamqp)

### 2. Verify Installation

Access RabbitMQ Management UI:
- URL: `http://localhost:15672`
- Default credentials:
  - Username: `guest`
  - Password: `guest`

### 3. Configure Environment Variable

Update `.env` file:
```env
# Local RabbitMQ
RABBITMQ_URL=amqp://localhost:5672

# Or CloudAMQP (example)
# RABBITMQ_URL=amqps://your-username:your-password@your-instance.cloudamqp.com/your-vhost
```

### 4. Dependencies

Already installed via `pnpm add amqplib @types/amqplib`

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Express Backend API                     │
│  (Controllers publish jobs to queues - non-blocking)        │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌────────────────────────────────────────────────────────────┐
│                      RabbitMQ Broker                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Email Queue  │  │ Order Queue  │  │Analytics Queue│     │
│  │  (durable)   │  │  (durable)   │  │  (durable)   │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌────────────────────────────────────────────────────────────┐
│                    Background Workers                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │Email Worker  │  │Order Worker  │  │Analytics Wrkr│     │
│  │(Concurrent:5)│  │(Future)      │  │(Future)      │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└────────────────────────────────────────────────────────────┘
```

## 🎯 Usage

### Publishing Jobs from Controllers

#### **Email Jobs** (Already Implemented)

```typescript
import { rabbitMQ } from '../utils/rabbitmq';

// Password Reset OTP
await rabbitMQ.publishEmailJob({
    type: 'password-reset-otp',
    to: 'user@example.com',
    data: { otp: '1234' }
});

// Delivery OTP
await rabbitMQ.publishEmailJob({
    type: 'delivery-otp',
    to: 'customer@example.com',
    data: { 
        otp: '5678',
        userName: 'John Doe'
    }
});

// Order Confirmation
await rabbitMQ.publishEmailJob({
    type: 'order-confirmation',
    to: 'customer@example.com',
    data: {
        userName: 'John Doe',
        orderId: '12345',
        totalAmount: '599',
        paymentMethod: 'Cash on Delivery'
    }
});

// Welcome Email
await rabbitMQ.publishEmailJob({
    type: 'welcome',
    to: 'newuser@example.com',
    data: { userName: 'Jane Smith' }
});
```

### Adding New Email Templates

Edit `src/workers/email.worker.ts`:

```typescript
const emailTemplates = {
    'your-new-template': (data: any) => ({
        subject: 'Your Subject',
        html: `<p>Your HTML content with ${data.someField}</p>`
    }),
    // ... existing templates
};
```

## 🏃 Running the Workers

### Development Mode

**Terminal 1 - Main Backend:**
```bash
cd backend
pnpm dev
```

**Terminal 2 - Email Worker:**
```bash
cd backend
pnpm worker:email
```

### Production Mode

Use a process manager like **PM2**:

```bash
# Install PM2 globally
npm install -g pm2

# Start backend
pm2 start npm --name "FoodDash-api" -- run start

# Start email worker
pm2 start npm --name "email-worker" -- run worker:email

# Monitor
pm2 monit

# Save configuration
pm2 save
pm2 startup
```

### Using Docker Compose

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  rabbitmq:
    image: rabbitmq:3-management
    ports:
      - "5672:5672"
      - "15672:15672"
    environment:
      RABBITMQ_DEFAULT_USER: admin
      RABBITMQ_DEFAULT_PASS: password

  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      RABBITMQ_URL: amqp://rabbitmq:5672
    depends_on:
      - rabbitmq

  email-worker:
    build: ./backend
    command: npm run worker:email
    environment:
      RABBITMQ_URL: amqp://rabbitmq:5672
    depends_on:
      - rabbitmq
```

## 📊 Monitoring

### RabbitMQ Management UI

Access: `http://localhost:15672`

**Key Metrics to Monitor:**
- **Queue Depth** - Number of pending messages
- **Message Rate** - Messages/second being processed
- **Consumer Count** - Number of active workers
- **Memory Usage** - RabbitMQ memory consumption

### Application Logs

The workers and RabbitMQ service log important events:

```bash
# Watch logs
tail -f logs/email-worker.log  # If using file logging

# Or with PM2
pm2 logs email-worker
```

**Log Messages:**
- `📤 Message published to email-queue` - Job queued successfully
- `📨 Received message from email-queue` - Worker picked up job
- `✅ Email sent successfully` - Job completed
- `❌ Failed to send email` - Job failed (will retry)
- `🔁 Message requeued for retry` - Job failed, retrying

## 🚀 Production Deployment

### CloudAMQP Setup (Recommended)

1. **Sign up** at [cloudamqp.com](https://www.cloudamqp.com/)
2. **Create instance** (Free tier: Little Lemur)
3. **Get connection URL** from dashboard
4. **Update `.env`:**
   ```env
   RABBITMQ_URL=amqps://username:password@instance.cloudamqp.com/vhost
   ```

### Amazon MQ Setup

1. Create RabbitMQ broker in AWS Console
2. Get connection endpoint
3. Update environment variable

### Best Practices

#### 1. **Error Handling & Dead Letter Queues**

For production, implement a dead letter queue for failed messages:

```typescript
const queueOptions = {
    durable: true,
    arguments: {
        'x-dead-letter-exchange': 'dlx-exchange',
        'x-message-ttl': 86400000 // 24 hours
    }
};
```

#### 2. **Monitoring & Alerts**

Set up alerts for:
- Queue depth > 1000 messages
- Consumer count = 0
- Message processing time > 30 seconds

#### 3. **Scaling Workers**

```bash
# Scale horizontally - run multiple worker instances
pm2 start npm --name "email-worker-1" -- run worker:email
pm2 start npm --name "email-worker-2" -- run worker:email
pm2 start npm --name "email-worker-3" -- run worker:email
```

#### 4. **Environment-Specific Configuration**

```typescript
// Production: More aggressive retry
const maxReconnectAttempts = process.env.NODE_ENV === 'production' ? 10 : 5;

// Production: Higher prefetch for better throughput
const prefetch = process.env.NODE_ENV === 'production' ? 10 : 5;
```

## 🐛 Troubleshooting

### Common Issues

#### RabbitMQ Connection Failed
```
Error: Failed to connect to RabbitMQ
```
**Solutions:**
1. Verify RabbitMQ is running: `sudo systemctl status rabbitmq-server`
2. Check RABBITMQ_URL in `.env`
3. Ensure firewall allows port 5672

#### Messages Not Being Processed
**Solutions:**
1. Verify worker is running: `pnpm worker:email`
2. Check RabbitMQ UI for consumer count
3. Check worker logs for errors

#### Email Worker Crashes
**Solutions:**
1. Check email credentials in `.env`
2. Ensure Gmail "App Passwords" are used (not regular password)
3. Check for memory leaks

## 📝 Future Enhancements

Planned queue implementations:

1. **Order Processing Queue**
   - Complex order validations
   - Inventory updates
   - Invoice generation

2. **Delivery Assignment Queue**
   - Geospatial calculations
   - Assignment notifications
   - Route optimization

3. **Analytics Queue**
   - Event tracking
   - Report generation
   - Data aggregation

4. **Notification Queue**
   - Push notifications
   - SMS alerts
   - In-app notifications

---

## 📚 Additional Resources

- [RabbitMQ Documentation](https://www.rabbitmq.com/documentation.html)
- [amqplib GitHub](https://github.com/amqp-node/amqplib)
- [CloudAMQP Guides](https://www.cloudamqp.com/docs/index.html)

---

**Need Help?** Open an issue on GitHub or contact the development team.
