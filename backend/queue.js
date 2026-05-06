const { Queue, QueueEvents } = require('bullmq');
const IORedis = require('ioredis');
const dotenv = require('dotenv');

dotenv.config();

const connection = new IORedis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: null,
});

connection.on('connect', () => console.log('Redis connected successfully'));
connection.on('error', (err) => console.error('Redis connection error:', err));

const submissionQueue = new Queue('submission-queue', { connection });
const submissionEvents = new QueueEvents('submission-queue', { connection });

module.exports = { submissionQueue, connection, submissionEvents };
