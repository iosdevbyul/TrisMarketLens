"use client";
import { useMemo, useState } from "react";
import type { OhlcvBar } from "@/domain/ohlcv";
interface Props { ticker: string; bars: OhlcvBar[]; locale: "en" | "ko" }
export type ChartPeriod = "1M" | "3M" | "6M" | "1Y";
export function filterOhlcvPeriod(bars: OhlcvBar[], period: ChartPeriod): OhlcvBar[] {
  if (!bars.length) return [];
  const latest = new Date(bars[bars.length - 1].date + "T00:00:00Z");
  const months = { "1M": 1, "3M": 3, "6M": 6, "1Y": 12 }[period];
  const boundary = new Date(latest);
  boundary.setUTCMonth(boundary.getUTCMonth() - months);
  const start = boundary.toISOString().slice(0,10);
  return bars.filter(bar => bar.date >= start);
}

const W = 960, H = 360, LEFT = 72, RIGHT = 26, TOP = 22, PRICE_BOTTOM = 258, VOL_TOP = 278, VOL_BOTTOM = 326;
export function OhlcvChart({ ticker, bars, locale }: Props) {
  const [period, setPeriod] = useState<ChartPeriod>("3M");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const visible = useMemo(() => filterOhlcvPeriod(bars, period), [bars, period]);
  const selected = visible.find(bar => bar.date === selectedDate) ?? visible[visible.length - 1];
  if (!visible.length) return null;
  const highest = Math.max(...visible.map(b => b.high));
  const lowest = Math.min(...visible.map(b => b.low));
  const range = Math.max(highest - lowest, highest * 0.01, 0.001);
  const maxVolume = Math.max(1, ...visible.map(b => b.volume));
  const chartWidth = Math.max(W, LEFT + RIGHT + visible.length * 6);
  const step = (chartWidth - LEFT - RIGHT) / visible.length;
  const bodyWidth = Math.max(1, Math.min(step * 0.6, 11));
  const priceY = (n: number) => TOP + ((highest + range * 0.06 - n) / (range * 1.12)) * (PRICE_BOTTOM - TOP);
  const number = new Intl.NumberFormat(locale === "ko" ? "ko-KR" : "en-US", { maximumFractionDigits: 2 });
  const ticks = Array.from({ length: 5 }, (_, i) => lowest + (range * i / 4));
  return (
    <div className="ohlcv-chart">
      <div className="ohlcv-toolbar" aria-label={locale === "ko" ? "차트 기간" : "Chart period"}>
        {(["1M","3M","6M","1Y"] as const).map(item => <button key={item} type="button" aria-pressed={period === item} onClick={() => { setPeriod(item); setSelectedDate(null); }}>{item}</button>)}
      </div>
      <div className="ohlcv-scroll" role="region" aria-label={locale === "ko" ? `${ticker} 가격 및 거래량 차트` : `${ticker} price and volume chart`} tabIndex={0}>
      <svg viewBox={`0 0 ${chartWidth} ${H}`} style={{ minWidth: chartWidth }} xmlns="http://www.w3.org/2000/svg" className="ohlcv-svg" aria-hidden="true">
        {ticks.map((n,i) => <g key={i}>
          <line x1={LEFT} x2={chartWidth-RIGHT} y1={priceY(n)} y2={priceY(n)} stroke="var(--border)" strokeDasharray="3 5" />
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
            <rect x={x-step/2} y={TOP} width={step} height={VOL_BOTTOM-TOP} fill="transparent" role="button" tabIndex={0} aria-label={`${b.date}: O ${b.open}, H ${b.high}, L ${b.low}, C ${b.close}, V ${b.volume}`} onClick={() => setSelectedDate(b.date)} onKeyDown={event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setSelectedDate(b.date); } }} />
          </g>;
        })}
        <line x1={LEFT} x2={chartWidth-RIGHT} y1={VOL_BOTTOM} y2={VOL_BOTTOM} stroke="var(--border)" />
        {[0,Math.floor((visible.length-1)/2),visible.length-1].map(i => <text key={i} x={LEFT + step*(i+0.5)} y={H-12} textAnchor="middle" fontSize="12" fill="var(--muted)">{visible[i].date.slice(5)}</text>)}
        <text x={LEFT-12} y={VOL_TOP+8} textAnchor="end" fontSize="11" fill="var(--muted)">{locale === "ko" ? "거래량" : "Volume"}</text>
      </svg>
      </div>
      <dl className="ohlcv-selected" aria-live="polite">
        {[[locale === "ko" ? "날짜" : "Date", selected.date], [locale === "ko" ? "시가" : "Open", number.format(selected.open)], [locale === "ko" ? "고가" : "High", number.format(selected.high)], [locale === "ko" ? "저가" : "Low", number.format(selected.low)], [locale === "ko" ? "종가" : "Close", number.format(selected.close)], [locale === "ko" ? "거래량" : "Volume", number.format(selected.volume)]].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
      </dl>
      <div className="ohlcv-legend"><span className="ohlcv-rise">{locale === "ko" ? "상승" : "Up"}</span><span className="ohlcv-fall">{locale === "ko" ? "하락" : "Down"}</span><span>{locale === "ko" ? "일별 가격 및 거래량" : "Daily price and volume"}</span></div>
    </div>
  );
}
