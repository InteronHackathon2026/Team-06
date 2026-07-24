# CardiacIQ — Frontend Starter

This is the **frontend only**. It gives you working auth (Firebase), a
real-time dashboard shell, an ECG waveform chart, and clearly marked
connection points for the two pieces you still need to build: the Arduino
bridge server and the AI analysis backend (PyTorch model + Gemini).

## Quick start

```bash
npm install
cp .env.example .env   # then fill in your Firebase config
npm run dev
```

Runs at `http://localhost:5173`.

## Architecture — how the pieces fit together

```
┌─────────────┐   serial (USB)   ┌──────────────┐   WebSocket   ┌───────────────┐
│   Arduino   │ ───────────────> │ Bridge server │ ────────────> │   Frontend    │
│  ECG + GSR  │                  │ (you build)   │                │ (this repo)   │
└─────────────┘                  └──────────────┘                └───────┬───────┘
                                                                          │ POST
                                                                          v
                                                                  ┌───────────────┐
                                                                  │ Analysis API  │
                                                                  │ (you build):  │
                                                                  │ PyTorch model │
                                                                  │  + Gemini     │
                                                                  └───────────────┘

┌─────────────┐
│  Firebase   │ <──── Auth (login/signup) + Firestore (user profiles, history)
│  (you set   │       already wired up in this repo
│  up project)│
└─────────────┘
```

## What's already built

- **Firebase Auth** — email/password login and signup (`src/firebase/`).
  Just create a Firebase project, enable Email/Password sign-in under
  Authentication, and paste your config into `.env`.
- **Firestore** — a `users/{uid}` doc is created on signup for storing
  profile info and (later) a `deviceId` to link the account to a specific
  Arduino unit.
- **Dashboard shell** — live ECG chart, vitals card, AI status card, all
  driven by two hooks/utils you'll connect to your own backend:
  - `src/hooks/useSensorStream.js` — WebSocket client expecting JSON like
    `{ ecg, gsr, heartRate, timestamp }` per message.
  - `src/utils/aiAnalysis.js` — POSTs a window of readings to
    `/api/analyze` and expects back
    `{ status, abnormalities, stressLevel, summary, recommendSeekCare }`.

## What you still need to build

### 1. Arduino bridge server
Your Arduino (or ESP32) samples ECG + GSR and writes readings over serial
(or WiFi if ESP32). Write a small Python (`pyserial` + `websockets`) or
Node (`serialport` + `ws`) server that:
1. Reads each line from serial
2. Parses it into `{ ecg, gsr, heartRate, timestamp }`
3. Broadcasts it to connected WebSocket clients (this frontend)

Point `VITE_SENSOR_WS_URL` in `.env` at wherever this runs.

### 2. Analysis backend (PyTorch + Gemini)
A server endpoint (`/api/analyze`, proxied in `vite.config.js` to
`localhost:5000` in dev) that:
1. Receives the ECG window + GSR + heart rate from the frontend
2. Runs your PyTorch model → `Normal` / `Warning` / `High Risk` +
   detected abnormalities
3. **Optionally** sends that result to Gemini to generate a
   plain-language summary for `summary` in the response
4. Returns the combined JSON

**Keep your Gemini API key server-side only** — `aiAnalysis.js` is
written specifically so the browser never touches that key.

## Folder structure

```
src/
  firebase/       Firebase config, auth functions, auth context
  hooks/          useSensorStream — Arduino WebSocket connection
  utils/          aiAnalysis — calls your backend's /api/analyze
  components/     EcgChart, VitalsCard, HealthStatusCard, ProtectedRoute
  pages/          Login, Dashboard
```
