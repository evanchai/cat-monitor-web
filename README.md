# Sofa Police 🐱

> 犯我沙发者，虽远必诛

A real-time cat monitoring web dashboard that detects when your cat is on the sofa and sends alerts. Built with React + TypeScript, deployed on Vercel.

## Features

- **Live Camera Feed** — Real-time video stream from an IMX500 camera sensor, refreshed every second
- **AI-Powered Detection** — Uses Gemini to analyze whether the cat is on the sofa
- **Deterrent Sound** — One-click remote sound playback to shoo the cat off the sofa
- **Discord Alerts** — Automatic notifications sent to Discord when a sofa violation is detected
- **Activity Timeline** — Chronological history of all cat detection events with thumbnail previews
- **Daily Summary** — AI-generated daily summary of cat activity and sofa sighting count
- **Detection Pipeline Visualization** — View the status of each processing step (IMX500 Detection → Gemini Analysis → Deterrent Sound → Discord Alert)

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS (CDN)
- **Backend**: Vercel Serverless Functions
- **Database**: Upstash Redis (via REST API)
- **Deployment**: Vercel

## Project Structure

```
cat-monitor-web/
├── src/
│   ├── App.tsx          # Main dashboard UI
│   ├── main.tsx         # React entry point
│   └── vite-env.d.ts   # Vite type declarations
├── api/
│   └── status.ts        # Vercel serverless API (heartbeat, snapshot, events, summary)
├── public/
│   └── xhs.html         # XHS card page
├── xhs-cards/           # XHS social media card templates
├── index.html           # HTML entry point
├── vite.config.ts       # Vite configuration
├── vercel.json          # Vercel deployment config & routing
├── tsconfig.json        # TypeScript configuration
└── package.json
```

## Getting Started

### Prerequisites

- Node.js >= 18
- An Upstash Redis instance

### Installation

```bash
npm install
```

### Environment Variables

Create a `.env.local` file:

```env
KV_REST_API_URL=<your-upstash-redis-rest-url>
KV_REST_API_TOKEN=<your-upstash-redis-rest-token>
ADMIN_TOKEN=<secret-token-for-admin-actions>
VITE_ADMIN_TOKEN=<same-admin-token-for-frontend>
```

### Development

```bash
npm run dev
```

### Build

```bash
npm run build
```

### Deploy

Push to your connected Vercel project, or run:

```bash
npx vercel
```

## API Endpoints

All endpoints are served at `/api/status` with a `type` query parameter:

| Method | Type | Description |
|--------|------|-------------|
| GET | `heartbeat` | Monitor health status and logs |
| GET | `snapshot` | Latest camera frame (base64 JPEG) |
| GET | `events` | Recent cat detection events (up to 20) |
| GET | `summary` | Daily activity summary |
| POST | `play_sound` | Trigger deterrent sound (requires `Authorization: Bearer <ADMIN_TOKEN>`) |

## License

MIT
