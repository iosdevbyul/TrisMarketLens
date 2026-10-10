import { getTranslator } from "@/i18n/server";
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

export async function WakStatusBadge({ state, label }: WakStatusBadgeProps) {
  const t = await getTranslator();
  return (
    <span className="status-pill" data-state={state}>
      {t(label ?? stateLabels[state])}
    </span>
  );
}
