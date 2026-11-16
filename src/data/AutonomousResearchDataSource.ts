import "server-only";
import { lstat, readFile } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import {
  isAutonomousResearchPublication,
  type AutonomousResearchPublication,
} from "../domain/autonomousResearchPublication";

export type AutonomousResearchLoad = {
  state: "available" | "not_published" | "invalid" | "disabled";
  publication: AutonomousResearchPublication | null;
  message: string;
};

const outputPath = path.join(
  os.homedir(),
  "Library", "Application Support", "TrisMarketLens",
  "autonomous-research-publication.json",
);

export async function getAutonomousResearchPublication(): Promise<AutonomousResearchLoad> {
  if (process.env.MARKET_LENS_AUTONOMOUS_RESEARCH_SOURCE !== "local_snapshot") {
    return { state: "disabled", publication: null,
      message: "Autonomous research local publication is opt-in and has not been enabled." };
  }
  try {
    const info = await lstat(outputPath);
    if (!info.isFile() || info.isSymbolicLink() || info.size > 2 * 1024 * 1024
      || (info.mode & 0o077) !== 0) {
      return { state: "invalid", publication: null,
        message: "Autonomous research publication has unsupported permissions, size, or file type." };
    }
    const text = await readFile(outputPath, "utf8");
    const parsed: unknown = JSON.parse(text);
    if (!isAutonomousResearchPublication(parsed)) {
      return { state: "invalid", publication: null,
        message: "Autonomous research publication did not satisfy its strict redacted contract." };
    }
    return { state: "available", publication: parsed,
      message: "Operator-generated redacted research publication loaded. This is not a live study or API." };
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT") {
      return { state: "not_published", publication: null,
        message: "No local autonomous research publication exists. Run the read-only operator export first." };
    }
    return { state: "invalid", publication: null,
      message: "The local autonomous research publication could not be safely read." };
  }
}
