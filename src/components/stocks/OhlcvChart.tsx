import type { OhlcvBar } from "@/domain/ohlcv";
interface Props { ticker: string; bars: OhlcvBar[]; locale: "en" | "ko" }
const W = 960, H = 360, LEFT = 72, RIGHT = 26, TOP = 22, PRICE_BOTTOM = 258, VOL_TOP = 278, VOL_BOTTOM = 326;
export function OhlcvChart({ ticker, bars, locale }: Props) {
  if (!bars.length) return null;
  const visible = bars.slice(-100);
  const highest = Math.max(...visible.map(b => b.high));
  const lowest = Math.min(...visible.map(b => b.low));
  const range = Math.max(highest - lowest, highest * 0.01, 0.001);
  const maxVolume = Math.max(1, ...visible.map(b => b.volume));
  const step = (W - LEFT - RIGHT) / visible.length;
  const bodyWidth = Math.max(1, Math.min(step * 0.6, 11));
  const priceY = (n: number) => TOP + ((highest + range * 0.06 - n) / (range * 1.12)) * (PRICE_BOTTOM - TOP);
  const number = new Intl.NumberFormat(locale === "ko" ? "ko-KR" : "en-US", { maximumFractionDigits: 2 });
  const ticks = Array.from({ length: 5 }, (_, i) => lowest + (range * i / 4));
  return (
    <div className="ohlcv-chart" role="img" aria-label={locale === "ko" ? `${ticker} 일별 캔들 및 거래량 차트, ${visible.length}개 데이터` : `${ticker} daily candlestick and volume chart, ${visible.length} bars`}>
      <svg viewBox={`0 0 ${W} ${H}`} xmlns="http://www.w3.org/2000/svg" className="ohlcv-svg" aria-hidden="true">
        {ticks.map((n,i) => <g key={i}>
          <line x1={LEFT} x2={W-RIGHT} y1={priceY(n)} y2={priceY(n)} stroke="var(--border)" strokeDasharray="3 5" />
          <text x={LEFT - 12} y={priceY(n)+4} textAnchor="end" fontSize="12" fill="var(--muted)">{number.format(n)}</text>
        </g>)}
        {visible.map((b,i) => {
          const x = LEFT + step * (i + 0.5);
          const rising = b.close >= b.open;
          const color = rising ? "var(--accent)" : "var(--danger)";
          const y1 = priceY(Math.max(b.open,b.close));
          const y2 = priceY(Math.min(b.open,b.close));
          const volumeY = VOL_BOTTOM - b.volume / maxVolume * (VOL_BOTTOM - VOL_TOP);
          return <g key={b.date}>
            <line x1={x} y1={priceY(b.high)} x2={x} y2={priceY(b.low)} stroke={color} strokeWidth="1.5" />
            <rect x={x-bodyWidth/2} y={y1} width={bodyWidth} height={Math.max(y2-y1,1.5)} rx="0.5" fill={color} />
            <rect x={x-bodyWidth/2} y={volumeY} width={bodyWidth} height={VOL_BOTTOM-volumeY} fill={color} opacity="0.45" />
          </g>;
        })}
        <line x1={LEFT} x2={W-RIGHT} y1={VOL_BOTTOM} y2={VOL_BOTTOM} stroke="var(--border)" />
        {[0,Math.floor((visible.length-1)/2),visible.length-1].map(i => <text key={i} x={LEFT + step*(i+0.5)} y={H-12} textAnchor="middle" fontSize="12" fill="var(--muted)">{visible[i].date.slice(5)}</text>)}
        <text x={LEFT-12} y={VOL_TOP+8} textAnchor="end" fontSize="11" fill="var(--muted)">{locale === "ko" ? "거래량" : "Volume"}</text>
      </svg>
      <div className="ohlcv-legend"><span className="ohlcv-rise">{locale === "ko" ? "상승" : "Up"}</span><span className="ohlcv-fall">{locale === "ko" ? "하락" : "Down"}</span><span>{locale === "ko" ? "일별 가격 및 거래량" : "Daily price and volume"}</span></div>
    </div>
  );
}
