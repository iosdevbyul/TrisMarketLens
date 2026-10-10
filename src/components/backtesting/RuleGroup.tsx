import { getTranslator } from "@/i18n/server";
import { WakPanel } from "@/components/design-system/WakPanel";

import type { BacktestRuleGroup } from "@/domain/backtest";

export async function RuleGroup({ group }: { group: BacktestRuleGroup }) {
  const t = await getTranslator();
  return (
    <WakPanel className="backtest-rule-group">
      <p className="eyebrow">{t("Locked policy")}</p>
      <h2>{t(group.title)}</h2>
      <dl className="metric-list compact-metric-list">
        {group.rules.map((rule) => (
          <div className="backtest-rule-row" key={t(rule.label)}>
            <dt>
              {t(rule.label)}
              <small>{t(rule.detail)}</small>
            </dt>
            <dd>{t(rule.value)}</dd>
          </div>
        ))}
      </dl>
    </WakPanel>
  );
}
