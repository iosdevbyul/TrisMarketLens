import type { BacktestRuleGroup } from "@/domain/backtest";

export function RuleGroup({ group }: { group: BacktestRuleGroup }) {
  return (
    <article className="panel backtest-rule-group">
      <p className="eyebrow">Locked policy</p>
      <h2>{group.title}</h2>
      <dl className="metric-list compact-metric-list">
        {group.rules.map((rule) => (
          <div className="backtest-rule-row" key={rule.label}>
            <dt>
              {rule.label}
              <small>{rule.detail}</small>
            </dt>
            <dd>{rule.value}</dd>
          </div>
        ))}
      </dl>
    </article>
  );
}
