interface MetricComparisonProps {
  label: string;
  validation: number;
  oos: number;
}

function percentageWidth(value: number) {
  return String(Math.max(0, Math.min(1, value)) * 100) + "%";
}

export function MetricComparison({
  label,
  validation,
  oos,
}: MetricComparisonProps) {
  return (
    <div className="metric-comparison">
      <div className="metric-comparison-heading">
        <span>{label}</span>
        <span>Validation vs OOS</span>
      </div>

      <div className="metric-bar-row">
        <span>Validation</span>
        <div className="metric-bar-track">
          <div
            aria-hidden="true"
            className="metric-bar-fill"
            style={{ width: percentageWidth(validation) }}
          />
        </div>
        <strong>{validation.toFixed(6)}</strong>
      </div>

      <div className="metric-bar-row">
        <span>OOS</span>
        <div className="metric-bar-track">
          <div
            aria-hidden="true"
            className="metric-bar-fill"
            style={{ width: percentageWidth(oos) }}
          />
        </div>
        <strong>{oos.toFixed(6)}</strong>
      </div>
    </div>
  );
}
