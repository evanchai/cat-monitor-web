import { useState, useEffect, useCallback } from "react";

interface Heartbeat { ts: number; status: string }
interface Snapshot { ts: number; image: string }
interface Step { name: string; status: string; detail: string }
interface CatEvent { ts: number; on_sofa?: boolean; image: string; steps?: Step[] }

function timeAgo(ts: number): string {
  const diff = Math.floor(Date.now() / 1000 - ts);
  if (diff < 5) return "just now";
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

function formatTime(ts: number): string {
  return new Date(ts * 1000).toLocaleTimeString("zh-CN", {
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  });
}

function formatDate(ts: number): string {
  return new Date(ts * 1000).toLocaleDateString("zh-CN", {
    month: "short", day: "numeric",
  });
}

export default function App() {
  const [heartbeat, setHeartbeat] = useState<Heartbeat | null>(null);
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [events, setEvents] = useState<CatEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<CatEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [, setTick] = useState(0);

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
      setEvents((ev.data || []).map((e: string | CatEvent) => typeof e === "string" ? JSON.parse(e) : e));
    } catch (e) {
      console.error("Fetch error:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    const t1 = setInterval(fetchAll, 5000);
    const t2 = setInterval(() => setTick(t => t + 1), 1000);
    return () => { clearInterval(t1); clearInterval(t2); };
  }, [fetchAll]);

  const isOnline = heartbeat && Date.now() / 1000 - heartbeat.ts < 180;
  const isOnSofa = (ev: CatEvent) => {
    if (ev.steps) {
      const gemini = ev.steps.find(s => s.name === "gemini");
      return gemini?.status === "done";
    }
    return ev.on_sofa ?? false;
  };
  const sofaCount = events.filter(isOnSofa).length;

  if (loading) {
    return (
      <div style={styles.loadingWrap}>
        <div style={styles.spinner} />
        <span style={styles.loadingText}>Connecting...</span>
      </div>
    );
  }

  return (
    <div style={styles.root}>
      {/* ── Header ── */}
      <header style={styles.header}>
        <div style={styles.headerInner}>
          <div style={styles.headerLeft}>
            <div style={styles.logoCircle}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5c-1-3.5-5-3.5-7-1s-2 7 1 9l6 5 6-5c3-2 3-6.5 1-9s-6-2.5-7 1z"/>
              </svg>
            </div>
            <div>
              <h1 style={styles.title}>Cat Monitor</h1>
              <p style={styles.subtitle}>Living Room Camera</p>
            </div>
          </div>
          <div style={styles.statusBadge}>
            <span style={{ ...styles.statusDot, backgroundColor: isOnline ? "#34d399" : "#f87171" }} />
            <span style={{ color: isOnline ? "#34d399" : "#f87171", fontSize: 12, fontWeight: 500 }}>
              {isOnline ? "Live" : "Offline"}
            </span>
            {heartbeat && <span style={styles.timeAgo}>{timeAgo(heartbeat.ts)}</span>}
          </div>
        </div>
      </header>

      <main style={styles.main}>
        {/* ── Live View Card ── */}
        <section style={styles.liveCard}>
          {snapshot ? (
            <div style={styles.liveImageWrap}>
              <img
                src={`data:image/jpeg;base64,${snapshot.image}`}
                alt="Live"
                style={styles.liveImage}
              />
              {/* Overlay controls */}
              <div style={styles.liveOverlayTop}>
                <div style={styles.liveBadge}>
                  <span style={styles.recDot} />
                  LIVE
                </div>
                <span style={styles.liveTime}>{formatTime(snapshot.ts)}</span>
              </div>
            </div>
          ) : (
            <div style={styles.noSignal}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                <circle cx="12" cy="13" r="4"/>
              </svg>
              <span style={{ color: "#444", fontSize: 13 }}>No Signal</span>
            </div>
          )}
        </section>

        {/* ── Stats ── */}
        <div style={styles.statsRow}>
          <div style={styles.statCard}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={isOnline ? "#34d399" : "#666"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
            </svg>
            <div>
              <div style={styles.statValue}>{isOnline ? "Active" : "Down"}</div>
              <div style={styles.statLabel}>Monitor</div>
            </div>
          </div>
          <div style={styles.statCard}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8b8b8b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <div>
              <div style={styles.statValue}>{events.length}</div>
              <div style={styles.statLabel}>Detections</div>
            </div>
          </div>
          <div style={styles.statCard}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={sofaCount > 0 ? "#fb923c" : "#666"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <div>
              <div style={{ ...styles.statValue, color: sofaCount > 0 ? "#fb923c" : "#e5e5e5" }}>{sofaCount}</div>
              <div style={styles.statLabel}>Alerts</div>
            </div>
          </div>
        </div>

        {/* ── Timeline ── */}
        <section>
          <h2 style={styles.sectionTitle}>Activity</h2>
          {events.length === 0 ? (
            <div style={styles.emptyState}>
              <p style={{ color: "#555", fontSize: 14 }}>No activity yet</p>
              <p style={{ color: "#333", fontSize: 12, marginTop: 4 }}>
                Events appear here when a cat is detected
              </p>
            </div>
          ) : (
            <div style={styles.timeline}>
              {events.map((ev, i) => {
                const showDate = i === 0 || formatDate(ev.ts) !== formatDate(events[i - 1].ts);
                return (
                  <div key={i}>
                    {showDate && <div style={styles.timelineDate}>{formatDate(ev.ts)}</div>}
                    <button
                      style={styles.timelineItem}
                      onClick={() => setSelectedEvent(ev)}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(255,255,255,0.04)"; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = "transparent"; }}
                    >
                      <img
                        src={`data:image/jpeg;base64,${ev.image}`}
                        alt=""
                        style={styles.timelineThumb}
                      />
                      <div style={styles.timelineContent}>
                        <div style={styles.timelineTop}>
                          <span style={{ color: "#e5e5e5", fontSize: 14, fontWeight: 500 }}>
                            Cat detected
                          </span>
                          <span style={{ color: "#555", fontSize: 12 }}>{formatTime(ev.ts)}</span>
                        </div>
                        <div style={styles.timelineBottom}>
                          {isOnSofa(ev) ? (
                            <span style={styles.alertTag}>On Sofa</span>
                          ) : (
                            <span style={styles.okTag}>Clear</span>
                          )}
                          {ev.steps && (
                            <span style={styles.stepDots}>
                              {ev.steps.map((s, j) => (
                                <span key={j} style={{
                                  ...styles.stepDotInline,
                                  backgroundColor: s.status === "done" ? "#34d399" : s.status === "error" ? "#f87171" : "#333",
                                }} title={`${s.name}: ${s.detail}`} />
                              ))}
                            </span>
                          )}
                          <span style={{ color: "#444", fontSize: 11 }}>{timeAgo(ev.ts)} ago</span>
                        </div>
                      </div>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                        <path d="m9 18 6-6-6-6"/>
                      </svg>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {/* ── Modal ── */}
      {selectedEvent && (
        <div style={styles.modalBackdrop} onClick={() => setSelectedEvent(null)}>
          <div style={styles.modalCard} onClick={e => e.stopPropagation()}>
            <img
              src={`data:image/jpeg;base64,${selectedEvent.image}`}
              alt="Detail"
              style={styles.modalImage}
            />
            <div style={styles.modalFooter}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {isOnSofa(selectedEvent) ? (
                  <span style={styles.alertTag}>On Sofa</span>
                ) : (
                  <span style={styles.okTag}>Clear</span>
                )}
                <span style={{ color: "#666", fontSize: 13 }}>
                  {formatDate(selectedEvent.ts)} {formatTime(selectedEvent.ts)}
                </span>
              </div>
              <button
                style={styles.modalClose}
                onClick={() => setSelectedEvent(null)}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>
            {/* Pipeline Steps */}
            {selectedEvent.steps && (
              <div style={styles.stepsWrap}>
                {selectedEvent.steps.map((step, i) => (
                  <div key={i} style={styles.stepRow}>
                    <div style={{
                      ...styles.stepIcon,
                      backgroundColor: step.status === "done" ? "rgba(52,211,153,0.15)" : step.status === "error" ? "rgba(248,113,113,0.15)" : "rgba(255,255,255,0.04)",
                      color: step.status === "done" ? "#34d399" : step.status === "error" ? "#f87171" : "#555",
                    }}>
                      {step.status === "done" ? (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
                      ) : step.status === "error" ? (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
                      ) : (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14"/></svg>
                      )}
                    </div>
                    {i < (selectedEvent.steps?.length ?? 0) - 1 && <div style={styles.stepLine} />}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 500, color: "#ccc", textTransform: "capitalize" as const }}>
                        {STEP_LABELS[step.name] || step.name}
                      </div>
                      <div style={{ fontSize: 11, color: "#555", marginTop: 1 }}>{step.detail}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const STEP_LABELS: Record<string, string> = {
  detect: "IMX500 Detection",
  gemini: "Gemini Analysis",
  sound: "Deterrent Sound",
  discord: "Discord Alert",
};

/* ── Inline Styles (Apple Home + Linear) ── */
const styles: Record<string, React.CSSProperties> = {
  root: {
    minHeight: "100vh",
    background: "#09090b",
    color: "#e5e5e5",
    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", system-ui, sans-serif',
    WebkitFontSmoothing: "antialiased",
  },

  // Loading
  loadingWrap: {
    minHeight: "100vh", background: "#09090b",
    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16,
  },
  spinner: {
    width: 24, height: 24, border: "2px solid #222", borderTopColor: "#666",
    borderRadius: "50%", animation: "spin 0.8s linear infinite",
  },
  loadingText: { color: "#444", fontSize: 13, letterSpacing: 0.5 },

  // Header
  header: {
    position: "sticky", top: 0, zIndex: 40,
    backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
    background: "rgba(9,9,11,0.85)",
    borderBottom: "1px solid rgba(255,255,255,0.04)",
  },
  headerInner: {
    maxWidth: 600, margin: "0 auto", padding: "14px 20px",
    display: "flex", alignItems: "center", justifyContent: "space-between",
  },
  headerLeft: { display: "flex", alignItems: "center", gap: 12 },
  logoCircle: {
    width: 36, height: 36, borderRadius: 10,
    background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.06)",
    display: "flex", alignItems: "center", justifyContent: "center", color: "#888",
  },
  title: { fontSize: 15, fontWeight: 600, margin: 0, letterSpacing: -0.3 },
  subtitle: { fontSize: 11, color: "#555", margin: 0, marginTop: 1 },

  statusBadge: { display: "flex", alignItems: "center", gap: 6 },
  statusDot: { width: 7, height: 7, borderRadius: "50%", flexShrink: 0 },
  timeAgo: { color: "#444", fontSize: 11, marginLeft: 2 },

  // Main
  main: { maxWidth: 600, margin: "0 auto", padding: "20px 20px 40px" },

  // Live Card
  liveCard: {
    borderRadius: 16, overflow: "hidden",
    background: "#111", border: "1px solid rgba(255,255,255,0.06)",
    marginBottom: 16,
  },
  liveImageWrap: { position: "relative" },
  liveImage: { display: "block", width: "100%", height: "auto" },
  liveOverlayTop: {
    position: "absolute", top: 0, left: 0, right: 0,
    padding: "10px 12px", display: "flex", justifyContent: "space-between", alignItems: "center",
    background: "linear-gradient(to bottom, rgba(0,0,0,0.5), transparent)",
  },
  liveBadge: {
    display: "flex", alignItems: "center", gap: 5,
    fontSize: 10, fontWeight: 600, letterSpacing: 1, color: "#fff",
    background: "rgba(0,0,0,0.5)", borderRadius: 6, padding: "3px 8px",
  },
  recDot: {
    width: 6, height: 6, borderRadius: "50%", backgroundColor: "#ef4444",
    animation: "pulse 2s ease-in-out infinite",
  },
  liveTime: { fontSize: 11, color: "rgba(255,255,255,0.7)", fontVariantNumeric: "tabular-nums" },
  noSignal: {
    aspectRatio: "16/9", display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center", gap: 8,
  },

  // Stats
  statsRow: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 24 },
  statCard: {
    display: "flex", alignItems: "center", gap: 10,
    padding: "14px 12px", borderRadius: 14,
    background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)",
  },
  statValue: { fontSize: 16, fontWeight: 600, color: "#e5e5e5", lineHeight: 1.2 },
  statLabel: { fontSize: 11, color: "#555", marginTop: 1 },

  // Section
  sectionTitle: {
    fontSize: 13, fontWeight: 600, color: "#666", letterSpacing: 0.5,
    textTransform: "uppercase" as const, marginBottom: 12, marginTop: 0,
  },

  // Empty
  emptyState: {
    padding: "40px 20px", textAlign: "center" as const,
    borderRadius: 14, border: "1px solid rgba(255,255,255,0.04)",
    background: "rgba(255,255,255,0.01)",
  },

  // Timeline
  timeline: { display: "flex", flexDirection: "column" as const },
  timelineDate: {
    fontSize: 11, fontWeight: 600, color: "#555", letterSpacing: 0.5,
    padding: "8px 0", textTransform: "uppercase" as const,
    borderBottom: "1px solid rgba(255,255,255,0.04)",
  },
  timelineItem: {
    display: "flex", alignItems: "center", gap: 12,
    padding: "10px 4px", width: "100%",
    background: "transparent", border: "none", cursor: "pointer",
    borderBottom: "1px solid rgba(255,255,255,0.03)",
    transition: "background 0.15s", textAlign: "left" as const,
  },
  timelineThumb: {
    width: 52, height: 52, borderRadius: 10, objectFit: "cover" as const,
    border: "1px solid rgba(255,255,255,0.06)", flexShrink: 0,
  },
  timelineContent: { flex: 1, minWidth: 0 },
  timelineTop: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  timelineBottom: { display: "flex", alignItems: "center", gap: 8 },

  alertTag: {
    fontSize: 10, fontWeight: 600, letterSpacing: 0.3,
    padding: "2px 7px", borderRadius: 5,
    background: "rgba(239,68,68,0.15)", color: "#f87171",
  },
  okTag: {
    fontSize: 10, fontWeight: 600, letterSpacing: 0.3,
    padding: "2px 7px", borderRadius: 5,
    background: "rgba(52,211,153,0.1)", color: "#34d399",
  },

  // Modal
  modalBackdrop: {
    position: "fixed" as const, inset: 0, zIndex: 50,
    background: "rgba(0,0,0,0.92)", backdropFilter: "blur(8px)",
    display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
    animation: "fadeIn 0.15s ease-out",
  },
  modalCard: {
    maxWidth: 560, width: "100%",
    background: "#111", borderRadius: 16,
    overflow: "hidden", border: "1px solid rgba(255,255,255,0.08)",
    boxShadow: "0 25px 50px rgba(0,0,0,0.5)",
    animation: "scaleIn 0.2s ease-out",
  },
  modalImage: { display: "block", width: "100%" },
  modalFooter: {
    padding: "12px 16px", display: "flex",
    alignItems: "center", justifyContent: "space-between",
  },
  modalClose: {
    width: 32, height: 32, borderRadius: "50%",
    background: "rgba(255,255,255,0.05)", border: "none",
    display: "flex", alignItems: "center", justifyContent: "center",
    color: "#888", cursor: "pointer",
  },

  // Steps in modal
  stepsWrap: {
    padding: "0 16px 16px", display: "flex", flexDirection: "column" as const, gap: 0,
  },
  stepRow: {
    display: "flex", alignItems: "center", gap: 10,
    padding: "8px 0", position: "relative" as const,
  },
  stepIcon: {
    width: 24, height: 24, borderRadius: 8, flexShrink: 0,
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  stepLine: {
    position: "absolute" as const, left: 11.5, top: 32, width: 1, height: 8,
    background: "rgba(255,255,255,0.06)",
  },

  // Step dots in timeline
  stepDots: { display: "flex", alignItems: "center", gap: 3 },
  stepDotInline: {
    width: 5, height: 5, borderRadius: "50%", display: "inline-block",
  },
};

// Global keyframes
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes spin { to { transform: rotate(360deg) } }
  @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
  @keyframes scaleIn { from { opacity: 0; transform: scale(0.96) } to { opacity: 1; transform: scale(1) } }
  @keyframes pulse { 0%, 100% { opacity: 1 } 50% { opacity: 0.4 } }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { margin: 0; background: #09090b; }
  button:focus-visible { outline: 1px solid rgba(255,255,255,0.2); outline-offset: 2px; }
`;
document.head.appendChild(styleSheet);
