import "dotenv/config";

import { app } from "./app";
import { getEnvVar } from "./utils/getEnvVar";
import cron from "node-cron";
import { cleanupExpiredResetCodes } from "./services/cleanup.service";
import { prisma } from "./prisma";
import { connectRedis, disconnectRedis } from "./lib/redis";

const PORT = Number(getEnvVar("PORT", 3000));

async function bootstrap() {
  try {
    await connectRedis();

    cron.schedule("0 0 * * 0", async () => {
      try {
        await cleanupExpiredResetCodes();
      } catch (error) {
        console.error("Error during cleanup of expired reset codes:", error);
      }
    });

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });

  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

bootstrap();

process.on('SIGINT', async () => {
  console.log('Received SIGINT, shutting down gracefully...');
  await disconnectRedis();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Received SIGTERM, shutting down gracefully...');
  await disconnectRedis();
  process.exit(0);
});