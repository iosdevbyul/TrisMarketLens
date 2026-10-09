import type { ProjectState, ResearchCheckpoint } from "@/domain/project";

const stateLabel: Record<ProjectState, string> = {
  verified: "Verified",
  in_progress: "In progress",
  blocked: "Blocked",
  not_started: "Not started",
};

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
          <span className="status-pill" data-state={item.state}>
            {stateLabel[item.state]}
          </span>
        </article>
      ))}
    </div>
  );
}
