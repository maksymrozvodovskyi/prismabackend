import "dotenv/config";

import { app } from "./app";
import { getEnvVar } from "./utils/getEnvVar";
import cron from "node-cron";
import { cleanupExpiredResetCodes } from "./services/cleanup.service";

const PORT = Number(getEnvVar("PORT", 3000));

cron.schedule("0 0 * * 0", async () => {
  try {
    const deletedCount = await cleanupExpiredResetCodes();
  } catch (error) {
    console.error("Error during cleanup of expired reset codes:", error);
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
