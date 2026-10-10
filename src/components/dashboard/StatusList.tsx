import { getTranslator } from "@/i18n/server";
import { WakStatusBadge } from "@/components/design-system/WakStatusBadge";
import type { ResearchCheckpoint } from "@/domain/project";

interface StatusListProps {
  items: ResearchCheckpoint[];
}

export async function StatusList({ items }: StatusListProps) {
  const t = await getTranslator();
  return (
    <div className="status-list">
      {items.map((item) => (
        <article className="status-row" key={t(item.label)}>
          <div>
            <p className="status-title">{t(item.label)}</p>
            <p className="status-detail">{t(item.detail)}</p>
          </div>
          <WakStatusBadge state={item.state} />
        </article>
      ))}
    </div>
  );
}
