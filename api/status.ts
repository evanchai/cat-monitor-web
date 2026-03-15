import type { VercelRequest, VercelResponse } from "@vercel/node";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY!;

const headers = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
};

async function getState(key: string) {
  const resp = await fetch(
    `${SUPABASE_URL}/rest/v1/cat_state?key=eq.${key}&select=value`,
    { headers }
  );
  const rows = await resp.json();
  return rows?.[0]?.value ?? null;
}

async function upsertState(key: string, value: unknown) {
  const resp = await fetch(`${SUPABASE_URL}/rest/v1/cat_state`, {
    method: "POST",
    headers: {
      ...headers,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates",
    },
    body: JSON.stringify({ key, value }),
  });
  return resp.ok;
}

async function deleteState(key: string) {
  await fetch(`${SUPABASE_URL}/rest/v1/cat_state?key=eq.${key}`, {
    method: "DELETE",
    headers,
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const type = req.query.type as string;

    // POST: trigger actions (auth required)
    if (req.method === "POST") {
      const auth = req.headers.authorization;
      if (!auth || !auth.startsWith("Bearer ") || auth.slice(7) !== process.env.ADMIN_TOKEN) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      if (type === "play_sound") {
        await upsertState("play_sound", { triggered: true, ts: Date.now() / 1000 });
        return res.json({ ok: true });
      }
      return res.status(400).json({ error: "Invalid POST type" });
    }

    if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

    if (type === "heartbeat") {
      const data = await getState("heartbeat");
      return res.json({ data });
    }

    if (type === "events") {
      const data = await getState("events");
      return res.json({ data: data || [] });
    }

    if (type === "summary") {
      const data = await getState("summary");
      return res.json({ data });
    }

    return res.status(400).json({ error: "Invalid type. Use: heartbeat, snapshot, events, summary" });
  } catch (err) {
    console.error("API error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
