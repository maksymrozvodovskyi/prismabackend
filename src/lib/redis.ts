import { createClient } from "redis";
import { getEnvVar } from "../utils/getEnvVar";

export const redis = createClient({
  url: getEnvVar("REDIS_URL"),
});

redis.on("error", (err) => {
  console.error("Redis error:", err);
});

redis.on("ready", () => {
  console.log("Redis client ready");
});

redis.on("end", () => {
  console.log("Redis connection ended");
});

export async function connectRedis() {
  try {
    if (!redis.isOpen) {
      await redis.connect();
      console.log("Redis connected successfully");
    }
  } catch (error) {
    console.error("Failed to connect to Redis:", error);
    throw error; 
  }
}

export async function disconnectRedis() {
  try {
    if (redis.isOpen) {
      await redis.quit();
      console.log("Redis disconnected successfully");
    }
  } catch (error) {
    console.error("Error disconnecting Redis:", error);
    redis.disconnect();
  }
}
