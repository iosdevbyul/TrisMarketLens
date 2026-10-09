import { WakStatusBadge } from "@/components/design-system/WakStatusBadge";
import type { ResearchCheckpoint } from "@/domain/project";

interface StatusListProps {
  items: ResearchCheckpoint[];
}

export function StatusList({ items }: StatusListProps) {
  return (
    <div className="status-list">
      {items.map((item) => (
        <article className="status-row" key={item.label}>
          <div>
            <p className="status-title">{item.label}</p>
            <p className="status-detail">{item.detail}</p>
          </div>
          <WakStatusBadge state={item.state} />
        </article>
      ))}
    </div>
  );
}
