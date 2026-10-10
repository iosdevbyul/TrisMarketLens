import { getTranslator } from "@/i18n/server";
interface MetricComparisonProps {
  label: string;
  validation: number;
  oos: number;
}

function percentageWidth(value: number) {
  return String(Math.max(0, Math.min(1, value)) * 100) + "%";
}

export async function MetricComparison({
  label,
  validation,
  oos,
}: MetricComparisonProps) {
  const t = await getTranslator();
  return (
    <div className="metric-comparison">
      <div className="metric-comparison-heading">
        <span>{t(label)}</span>
        <span>{t("Validation vs OOS")}</span>
      </div>

      <div className="metric-bar-row">
        <span>{t("Validation")}</span>
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
        <span>{t("OOS")}</span>
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
