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

async function redisPost(...args: (string | number)[]) {
  const resp = await fetch(REDIS_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${REDIS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(args.map(String)),
  });
  const json = await resp.json();
  return json.result;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const type = req.query.type as string;

    // POST: trigger actions
    if (req.method === "POST") {
      if (type === "play_sound") {
        await redisPost("SET", "cat:play_sound", "1");
        await redisPost("EXPIRE", "cat:play_sound", "10");
        return res.json({ ok: true });
      }
      return res.status(400).json({ error: "Invalid POST type" });
    }

    if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

    if (type === "heartbeat") {
      const data = await redisGet("cat:heartbeat");
      return res.json({ data: data ? JSON.parse(data) : null });
    }

    if (type === "snapshot") {
      const data = await redisGet("cat:snapshot");
      return res.json({ data: data ? JSON.parse(data) : null });
    }

    if (type === "events") {
      const resp = await fetch(`${REDIS_URL}/LRANGE/cat:events/0/19`, {
        headers: { Authorization: `Bearer ${REDIS_TOKEN}` },
      });
      const json = await resp.json();
      const data = json.result || [];
      return res.json({ data: data.map((e: string) => JSON.parse(e)) });
    }

    if (type === "summary") {
      const data = await redisGet("cat:summary");
      return res.json({ data: data ? JSON.parse(data) : null });
    }

    return res.status(400).json({ error: "Invalid type. Use: heartbeat, snapshot, events, summary" });
  } catch (err) {
    console.error("API error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
