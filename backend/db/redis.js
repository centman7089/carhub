// config/redis.js
import { createClient } from "redis";

const client = createClient({
  url: process.env.REDIS_URL || "redis://https://carhub-9pj8.onrender.com:6379",
});

client.on("error", (err) => console.error("Redis Client Error", err));

await client.connect();

export default client;
