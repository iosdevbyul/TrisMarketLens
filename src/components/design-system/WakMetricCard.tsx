interface WakMetricCardProps {
  label: string;
  value: string;
  detail: string;
}

/** Reusable, read-only metric surface for dashboard summaries. */
export function WakMetricCard({ label, value, detail }: WakMetricCardProps) {
  return (
    <article className="metric-card">
      <p className="metric-label">{label}</p>
      <p className="metric-value">{value}</p>
      <p className="metric-detail">{detail}</p>
    </article>
  );
}
