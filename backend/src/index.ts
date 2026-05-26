import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { setupBot } from './bot';
import { setupRoutes } from './api/routes';
import { startCronJobs } from './jobs/cron';

dotenv.config();

export const prisma = new PrismaClient();
const app = express();
const port = process.env.PORT || 3001;

const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
  : true; // allow all in dev
app.use(cors({ origin: allowedOrigins }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Setup Telegram Bot
const bot = setupBot();

// Setup API Routes
setupRoutes(app, bot);

// Start Cron Jobs
startCronJobs(bot);

app.listen(port, () => {
  console.log(`Auto-Tasker Backend running on http://localhost:${port}`);
  if (process.env.TELEGRAM_BOT_TOKEN !== 'mock_token_for_now') {
    bot.launch();
    console.log('Telegram Bot launched!');
  } else {
    console.log('Using mock Telegram bot token. Bot not launched.');
  }
});
