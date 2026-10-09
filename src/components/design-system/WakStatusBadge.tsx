import type { ProjectState } from "@/domain/project";

const stateLabels: Record<ProjectState, string> = {
  verified: "Verified",
  in_progress: "In progress",
  blocked: "Blocked",
  not_started: "Not started",
};

interface WakStatusBadgeProps {
  state: ProjectState;
  label?: string;
}

export function WakStatusBadge({ state, label }: WakStatusBadgeProps) {
  return (
    <span className="status-pill" data-state={state}>
      {label ?? stateLabels[state]}
    </span>
  );
}
