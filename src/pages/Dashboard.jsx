import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../firebase/AuthContext';
import { logOut } from '../firebase/auth';
import { useSensorStream } from '../hooks/useSensorStream';
import { requestHealthAssessment } from '../utils/aiAnalysis';
import EcgChart from '../components/EcgChart';
import VitalsCard from '../components/VitalsCard';
import HealthStatusCard from '../components/HealthStatusCard';

const ANALYSIS_INTERVAL_MS = 15000; // how often to ask the backend for a fresh assessment

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { connected, latest, ecgWaveform } = useSensorStream();

  const [assessment, setAssessment] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const intervalRef = useRef(null);

  const runAssessment = useCallback(async () => {
    if (!latest) return;
    setAnalyzing(true);
    try {
      const result = await requestHealthAssessment({
        ecgWindow: ecgWaveform.map((p) => p.v),
        gsr: latest.gsr,
        heartRate: latest.heartRate,
      });
      setAssessment(result);
    } catch (err) {
      console.error('Assessment failed:', err);
    } finally {
      setAnalyzing(false);
    }
  }, [latest, ecgWaveform]);

  useEffect(() => {
    if (!connected) return;
    runAssessment(); // run once immediately on connect
    intervalRef.current = setInterval(runAssessment, ANALYSIS_INTERVAL_MS);
    return () => clearInterval(intervalRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connected]);

  async function handleLogOut() {
    await logOut();
    navigate('/login');
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>CardiacIQ</h1>
        <div className="header-right">
          <span>{user?.email}</span>
          <button onClick={handleLogOut}>Log Out</button>
        </div>
      </header>

      <main className="dashboard-grid">
        <EcgChart data={ecgWaveform} />
        <VitalsCard latest={latest} connected={connected} />
        <HealthStatusCard assessment={assessment} loading={analyzing} />
      </main>
    </div>
  );
}
