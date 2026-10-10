import { getTranslator } from "@/i18n/server";
interface ChartPlaceholderProps {
  ticker: string;
  availableFrom: string;
  latestDataDate: string;
}

export async function ChartPlaceholder({
  ticker,
  availableFrom,
  latestDataDate,
}: ChartPlaceholderProps) {
  const t = await getTranslator();
  return (
    <div className="chart-placeholder" aria-label={`OHLC chart placeholder for ${ticker}`}>
      <div className="chart-placeholder-grid" aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
        <span />
      </div>
      <div className="chart-placeholder-copy">
        <p className="eyebrow">{t("OHLC history")}</p>
        <h2>{t("Price chart waiting for API data")}</h2>
        <p>
          {t("The frontend already has a dedicated chart surface. Real bars will be rendered\n          only after the HTTP data contract is connected.")}
        </p>
        <span>{availableFrom} → {latestDataDate}</span>
      </div>
    </div>
  );
}
