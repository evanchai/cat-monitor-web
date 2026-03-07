import type { VercelRequest, VercelResponse } from "@vercel/node";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const type = req.query.type as string;

  if (type === "heartbeat") {
    const data = await redis.get("cat:heartbeat");
    return res.json({ data });
  }

  if (type === "snapshot") {
    const data = await redis.get("cat:snapshot");
    return res.json({ data });
  }

  if (type === "events") {
    const data = await redis.lrange("cat:events", 0, 19);
    return res.json({ data });
  }

  return res.status(400).json({ error: "Invalid type. Use: heartbeat, snapshot, events" });
}
