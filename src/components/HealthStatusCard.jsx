const STATUS_STYLES = {
  Normal: { color: '#1a9e5c', bg: '#e6f7ef' },
  Warning: { color: '#b8860b', bg: '#fdf3d9' },
  'High Risk': { color: '#c0392b', bg: '#fbe4e1' },
};

export default function HealthStatusCard({ assessment, loading }) {
  const style = assessment ? STATUS_STYLES[assessment.status] : null;

  return (
    <div className="card status-card">
      <h3>AI Health Assessment</h3>

      {loading && <p className="muted">Analyzing latest readings…</p>}

      {!loading && !assessment && (
        <p className="muted">No assessment yet — waiting on sensor data.</p>
      )}

      {!loading && assessment && (
        <>
          <div
            className="status-pill"
            style={{ color: style.color, background: style.bg }}
          >
            {assessment.status}
          </div>

          <p className="status-summary">{assessment.summary}</p>

          {assessment.abnormalities?.length > 0 && (
            <div className="abnormalities">
              <strong>Detected patterns:</strong>
              <ul>
                {assessment.abnormalities.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {assessment.recommendSeekCare && (
            <p className="care-recommendation">
              ⚠ This pattern suggests you should consult a medical professional.
            </p>
          )}

          <p className="disclaimer">
            This is not a medical diagnosis. Consult a healthcare provider for
            any health concerns.
          </p>
        </>
      )}
    </div>
  );
}
