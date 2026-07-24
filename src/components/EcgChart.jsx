import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';

export default function EcgChart({ data }) {
  return (
    <div className="card ecg-card">
      <h3>Live ECG Waveform</h3>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data}>
          <XAxis dataKey="t" hide />
          <YAxis hide domain={['dataMin - 50', 'dataMax + 50']} />
          <Tooltip
            labelFormatter={() => ''}
            formatter={(value) => [value, 'ECG']}
          />
          <Line
            type="monotone"
            dataKey="v"
            stroke="#e0453e"
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
