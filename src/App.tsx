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
  if (diff < 5) return "just now";
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
  const [now, setNow] = useState(Date.now());

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

  // Update "time ago" every second
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const isOnline = heartbeat && now / 1000 - heartbeat.ts < 180;
  const sofaAlerts = events.filter((e) => e.on_sofa).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
          <span className="text-sm text-gray-500 tracking-wide">Connecting to camera...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-gray-100">
      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-[#0a0a0f]/80 border-b border-white/5">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-lg">🐱</span>
            <h1 className="text-base font-semibold tracking-tight">Cat Monitor</h1>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-2 text-xs text-gray-400 bg-white/5 rounded-full px-3 py-1.5">
              <span className="relative flex h-2 w-2">
                {isOnline && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                )}
                <span className={`relative inline-flex rounded-full h-2 w-2 ${isOnline ? "bg-emerald-400" : "bg-red-400"}`} />
              </span>
              {isOnline ? "Live" : "Offline"}
            </div>
            {heartbeat && (
              <span className="text-[11px] text-gray-500">{timeAgo(heartbeat.ts)}</span>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white/[0.03] rounded-2xl p-4 border border-white/5">
            <div className="text-[11px] uppercase tracking-wider text-gray-500 mb-1">Status</div>
            <div className={`text-lg font-semibold ${isOnline ? "text-emerald-400" : "text-red-400"}`}>
              {isOnline ? "Monitoring" : "Disconnected"}
            </div>
          </div>
          <div className="bg-white/[0.03] rounded-2xl p-4 border border-white/5">
            <div className="text-[11px] uppercase tracking-wider text-gray-500 mb-1">Detections</div>
            <div className="text-lg font-semibold">{events.length}</div>
          </div>
          <div className="bg-white/[0.03] rounded-2xl p-4 border border-white/5">
            <div className="text-[11px] uppercase tracking-wider text-gray-500 mb-1">Sofa Alerts</div>
            <div className={`text-lg font-semibold ${sofaAlerts > 0 ? "text-amber-400" : "text-gray-400"}`}>
              {sofaAlerts}
            </div>
          </div>
        </div>

        {/* Live View */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Live View</h2>
            {snapshot && (
              <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                {formatTime(snapshot.ts)}
              </div>
            )}
          </div>
          {snapshot ? (
            <div className="relative group rounded-2xl overflow-hidden bg-black border border-white/5">
              <img
                src={`data:image/jpeg;base64,${snapshot.image}`}
                alt="Live camera"
                className="w-full block transition-opacity duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          ) : (
            <div className="w-full aspect-video bg-white/[0.02] rounded-2xl border border-white/5 flex flex-col items-center justify-center gap-2">
              <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-600">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
              </div>
              <span className="text-xs text-gray-600">No signal</span>
            </div>
          )}
        </section>

        {/* Detection History */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Detection History</h2>
            {events.length > 0 && (
              <span className="text-[11px] text-gray-600">{events.length} captures</span>
            )}
          </div>
          {events.length === 0 ? (
            <div className="bg-white/[0.02] rounded-2xl border border-white/5 p-8 text-center">
              <div className="text-2xl mb-2">😺</div>
              <p className="text-sm text-gray-500">No cats detected yet</p>
              <p className="text-xs text-gray-600 mt-1">Events will appear here when a cat is spotted</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {events.map((ev, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedEvent(ev)}
                  className="relative group rounded-xl overflow-hidden bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <img
                    src={`data:image/jpeg;base64,${ev.image}`}
                    alt="Detection"
                    className="w-full aspect-[4/3] object-cover"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-2.5 pt-8">
                    <div className="flex items-center gap-1.5">
                      {ev.on_sofa ? (
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-red-500/90 text-white">
                          ON SOFA
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-emerald-500/80 text-white">
                          OK
                        </span>
                      )}
                    </div>
                    <span className="block text-[10px] text-gray-400 mt-1">
                      {formatTime(ev.ts)}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Modal */}
      {selectedEvent && (
        <div
          className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-[fadeIn_150ms_ease-out]"
          onClick={() => setSelectedEvent(null)}
        >
          <div
            className="max-w-2xl w-full bg-[#12121a] rounded-2xl overflow-hidden border border-white/10 shadow-2xl animate-[scaleIn_200ms_ease-out]"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={`data:image/jpeg;base64,${selectedEvent.image}`}
              alt="Detection detail"
              className="w-full"
            />
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {selectedEvent.on_sofa ? (
                  <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-red-500/90 text-white">
                    ON SOFA
                  </span>
                ) : (
                  <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-500/80 text-white">
                    Not on sofa
                  </span>
                )}
                <span className="text-xs text-gray-500">{formatTime(selectedEvent.ts)}</span>
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0 }
          to { opacity: 1 }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95) }
          to { opacity: 1; transform: scale(1) }
        }
      `}</style>
    </div>
  );
}
