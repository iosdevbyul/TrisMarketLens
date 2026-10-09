import type { ProjectStatus } from "@/domain/project";

export interface DataSource {
  getProjectStatus(): Promise<ProjectStatus>;
}
