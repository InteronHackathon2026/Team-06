import { useEffect, useRef, useState } from 'react';

/**
 * Connects to a WebSocket bridge that relays live sensor data from your
 * Arduino/ESP32. The Arduino itself typically can't hold a browser
 * WebSocket connection reliably while also sampling sensors, so the usual
 * hackathon pattern is:
 *
 *   Arduino (ECG + GSR sensors, sampling over serial)
 *     --> USB serial --> small bridge server (Python/Node) on your laptop
 *         reads serial, pushes each reading over WebSocket
 *     --> this hook (browser) subscribes and renders it live
 *
 * If your Arduino is a network-capable board (ESP32/ESP8266) you can skip
 * the bridge and have the board push directly to a WebSocket server, or
 * have this hook connect straight to the board's own WS server — same
 * shape either way, just change WS_URL.
 *
 * Bridge server responsibilities (not included here — build separately,
 * e.g. with pyserial + websockets in Python, or serialport + ws in Node):
 *   1. Open the serial port the Arduino is connected to
 *   2. Parse each line (e.g. "ecg,gsr,timestamp" CSV over serial)
 *   3. Broadcast as JSON over WebSocket: { ecg, gsr, heartRate, timestamp }
 *   4. Optionally also POST each reading to Firestore for history logging
 *
 * Expected incoming JSON per message:
 *   { ecg: number, gsr: number, heartRate: number, timestamp: number }
 */

const WS_URL = import.meta.env.VITE_SENSOR_WS_URL || 'ws://localhost:5000/stream';
const MAX_POINTS = 300; // rolling window for the ECG waveform chart
const RECONNECT_DELAY_MS = 2000;

export function useSensorStream() {
  const [connected, setConnected] = useState(false);
  const [latest, setLatest] = useState(null);
  const [ecgWaveform, setEcgWaveform] = useState([]);
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    function connect() {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        if (cancelled) return;
        setConnected(true);
      };

      ws.onmessage = (event) => {
        if (cancelled) return;
        try {
          const reading = JSON.parse(event.data);
          setLatest(reading);
          setEcgWaveform((prev) => {
            const next = [...prev, { t: reading.timestamp, v: reading.ecg }];
            return next.length > MAX_POINTS ? next.slice(next.length - MAX_POINTS) : next;
          });
        } catch (err) {
          console.error('Malformed sensor payload:', err);
        }
      };

      ws.onclose = () => {
        if (cancelled) return;
        setConnected(false);
        // Auto-retry — the Arduino bridge may restart or USB may reconnect.
        reconnectTimeoutRef.current = setTimeout(connect, RECONNECT_DELAY_MS);
      };

      ws.onerror = () => {
        ws.close();
      };
    }

    connect();

    return () => {
      cancelled = true;
      clearTimeout(reconnectTimeoutRef.current);
      wsRef.current?.close();
    };
  }, []);

  return { connected, latest, ecgWaveform };
}
