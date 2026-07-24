export default function VitalsCard({ latest, connected }) {
  return (
    <div className="card vitals-card">
      <div className="vitals-header">
        <h3>Current Vitals</h3>
        <span className={`status-dot ${connected ? 'online' : 'offline'}`} />
      </div>

      {!connected && <p className="muted">Waiting for device connection…</p>}

      {connected && latest && (
        <div className="vitals-grid">
          <div className="vital">
            <span className="vital-label">Heart Rate</span>
            <span className="vital-value">{latest.heartRate ?? '—'} <small>bpm</small></span>
          </div>
          <div className="vital">
            <span className="vital-label">GSR (Stress Signal)</span>
            <span className="vital-value">{latest.gsr ?? '—'} <small>µS</small></span>
          </div>
        </div>
      )}
    </div>
  );
}
