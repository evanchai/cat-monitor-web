import type { VercelRequest, VercelResponse } from "@vercel/node";

const REDIS_URL = process.env.KV_REST_API_URL!;
const REDIS_TOKEN = process.env.KV_REST_API_TOKEN!;

async function redisGet(key: string) {
  const resp = await fetch(`${REDIS_URL}/GET/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${REDIS_TOKEN}` },
  });
  const json = await resp.json();
  return json.result;
}

async function redisLrange(key: string, start: number, stop: number) {
  const resp = await fetch(`${REDIS_URL}/LRANGE/${encodeURIComponent(key)}/${start}/${stop}`, {
    headers: { Authorization: `Bearer ${REDIS_TOKEN}` },
  });
  const json = await resp.json();
  return json.result;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  try {
    const type = req.query.type as string;

    if (type === "heartbeat") {
      const data = await redisGet("cat:heartbeat");
      return res.json({ data: data ? JSON.parse(data) : null });
    }

    if (type === "snapshot") {
      const data = await redisGet("cat:snapshot");
      return res.json({ data: data ? JSON.parse(data) : null });
    }

    if (type === "events") {
      const data = await redisLrange("cat:events", 0, 19);
      return res.json({ data: (data || []).map((e: string) => JSON.parse(e)) });
    }

    return res.status(400).json({ error: "Invalid type. Use: heartbeat, snapshot, events" });
  } catch (err) {
    console.error("API error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
