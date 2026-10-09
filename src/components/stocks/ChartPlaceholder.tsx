interface ChartPlaceholderProps {
  ticker: string;
  availableFrom: string;
  latestDataDate: string;
}

export function ChartPlaceholder({
  ticker,
  availableFrom,
  latestDataDate,
}: ChartPlaceholderProps) {
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
        <p className="eyebrow">OHLC history</p>
        <h2>Price chart waiting for API data</h2>
        <p>
          The frontend already has a dedicated chart surface. Real bars will be rendered
          only after the HTTP data contract is connected.
        </p>
        <span>{availableFrom} → {latestDataDate}</span>
      </div>
    </div>
  );
}
