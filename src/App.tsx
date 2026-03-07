import { useState, useEffect, useCallback } from "react";

interface Heartbeat {
  ts: number;
  status: string;
}

interface Snapshot {
  ts: number;
  image: string;
}

interface CatEvent {
  ts: number;
  on_sofa: boolean;
  image: string;
}

function timeAgo(ts: number): string {
  const diff = Math.floor(Date.now() / 1000 - ts);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function formatTime(ts: number): string {
  return new Date(ts * 1000).toLocaleString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export default function App() {
  const [heartbeat, setHeartbeat] = useState<Heartbeat | null>(null);
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [events, setEvents] = useState<CatEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<CatEvent | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    try {
      const [hbRes, snapRes, evRes] = await Promise.all([
        fetch("/api/status?type=heartbeat"),
        fetch("/api/status?type=snapshot"),
        fetch("/api/status?type=events"),
      ]);
      const hb = await hbRes.json();
      const snap = await snapRes.json();
      const ev = await evRes.json();

      setHeartbeat(hb.data ? (typeof hb.data === "string" ? JSON.parse(hb.data) : hb.data) : null);
      setSnapshot(snap.data ? (typeof snap.data === "string" ? JSON.parse(snap.data) : snap.data) : null);

      const parsed = (ev.data || []).map((e: string | CatEvent) =>
        typeof e === "string" ? JSON.parse(e) : e
      );
      setEvents(parsed);
    } catch (e) {
      console.error("Fetch error:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    const timer = setInterval(fetchAll, 5000);
    return () => clearInterval(timer);
  }, [fetchAll]);

  const isOnline = heartbeat && Date.now() / 1000 - heartbeat.ts < 180;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-gray-400 text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-4 md:p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-3">
        Cat Monitor
        <span
          className={`inline-block w-3 h-3 rounded-full ${isOnline ? "bg-green-500 animate-pulse" : "bg-red-500"}`}
        />
        <span className="text-sm font-normal text-gray-400">
          {isOnline ? "Online" : "Offline"}
          {heartbeat && ` · ${timeAgo(heartbeat.ts)}`}
        </span>
      </h1>

      {/* Live Snapshot */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3 text-gray-300">Live View</h2>
        {snapshot ? (
          <div className="relative">
            <img
              src={`data:image/jpeg;base64,${snapshot.image}`}
              alt="Live camera"
              className="w-full rounded-xl border border-gray-800"
            />
            <span className="absolute bottom-3 right-3 bg-black/70 text-xs text-gray-300 px-2 py-1 rounded">
              {formatTime(snapshot.ts)}
            </span>
          </div>
        ) : (
          <div className="w-full h-64 bg-gray-900 rounded-xl border border-gray-800 flex items-center justify-center text-gray-500">
            No snapshot available
          </div>
        )}
      </section>

      {/* Detection Events */}
      <section>
        <h2 className="text-lg font-semibold mb-3 text-gray-300">
          Detection History
          <span className="text-sm font-normal text-gray-500 ml-2">
            ({events.length} events)
          </span>
        </h2>
        {events.length === 0 ? (
          <p className="text-gray-500">No detections yet.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {events.map((ev, i) => (
              <button
                key={i}
                onClick={() => setSelectedEvent(ev)}
                className="relative group rounded-lg overflow-hidden border border-gray-800 hover:border-gray-600 transition-colors"
              >
                <img
                  src={`data:image/jpeg;base64,${ev.image}`}
                  alt="Detection"
                  className="w-full aspect-square object-cover"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                  <span
                    className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                      ev.on_sofa
                        ? "bg-red-500/80 text-white"
                        : "bg-green-600/80 text-white"
                    }`}
                  >
                    {ev.on_sofa ? "ON SOFA" : "Not on sofa"}
                  </span>
                  <span className="block text-xs text-gray-300 mt-1">
                    {formatTime(ev.ts)}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Modal */}
      {selectedEvent && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedEvent(null)}
        >
          <div
            className="max-w-2xl w-full bg-gray-900 rounded-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={`data:image/jpeg;base64,${selectedEvent.image}`}
              alt="Detection detail"
              className="w-full"
            />
            <div className="p-4 flex items-center justify-between">
              <div>
                <span
                  className={`text-sm font-medium px-2 py-1 rounded ${
                    selectedEvent.on_sofa
                      ? "bg-red-500/80 text-white"
                      : "bg-green-600/80 text-white"
                  }`}
                >
                  {selectedEvent.on_sofa ? "ON SOFA" : "Not on sofa"}
                </span>
                <span className="text-sm text-gray-400 ml-3">
                  {formatTime(selectedEvent.ts)}
                </span>
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                className="text-gray-400 hover:text-white text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
