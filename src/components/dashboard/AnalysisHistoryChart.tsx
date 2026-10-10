"use client";

import { useMemo, useState } from "react";
import type { DailyAnalysisSummary } from "@/domain/analysisHistory";
import { translate, type Locale } from "@/i18n/translations";

export function AnalysisHistoryChart({ entries, locale }: { entries: DailyAnalysisSummary[]; locale: Locale }) {
  const t = (s: string) => translate(locale, s);
  const [metric, setMetric] = useState<"records" | "securities">("records");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const dates = useMemo(() => entries.slice(-30), [entries]);
  if (!dates.length) return <p className="section-copy">{t("No recorded analysis history yet.")}</p>;
  const max = Math.max(1, ...dates.map(item => item[metric]));
  const selected = dates.find(item => item.date === selectedDate) ?? dates[dates.length - 1];

  return <div className="analysis-history-widget">
    <div className="analysis-history-controls" role="group" aria-label={t("History metric")}>
      {(["records", "securities"] as const).map(item => <button type="button" key={item} aria-pressed={metric === item}
        onClick={() => setMetric(item)}>{t(item === "records" ? "Analysis records" : "Analyzed securities")}</button>)}
    </div>
    <div className="analysis-history-scroll" role="region" tabIndex={0} aria-label={t("Analysis activity by date")}>
      <div className="analysis-history-bars">
        {dates.map(item => <button key={item.date} type="button" className="analysis-history-day"
          aria-pressed={selected.date === item.date} onClick={() => setSelectedDate(item.date)}
          aria-label={`${item.date}: ${item[metric]} ${t(metric === "records" ? "Analysis records" : "Analyzed securities")}`}>
          <span className="analysis-history-bar-track"><span style={{height:`${item[metric] / max * 100}%`}} /></span>
          <span>{item.date.slice(5)}</span>
        </button>)}
      </div>
    </div>
    <div className="analysis-history-selected" aria-live="polite">
      <strong>{selected.date}</strong>
      <div className="analysis-history-stats">
        {([
          ["Analysis records",selected.records],["Analyzed securities",selected.securities],
          ["Up",selected.up],["Down",selected.down],["Neutral",selected.neutral],
          ["Verified",selected.verified],["Pending",selected.pending],["Blocked",selected.blocked],
        ] as const).map(([key,value]) => <div key={key}><span>{t(key)}</span><strong>{value}</strong></div>)}
      </div>
      <p className="metric-detail">{t("Latest analysis time")}: {selected.latestAnalyzedAt}</p>
    </div>
    <p className="metric-detail">{t("Dates without observations are omitted, not counted as zero activity.")}</p>
  </div>;
}
