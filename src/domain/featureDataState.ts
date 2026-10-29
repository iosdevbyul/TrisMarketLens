export type FeatureDataState = "disconnected" | "demo" | "error" | "empty" | "available";
export function getFeatureDataState(source: string, error: string | null, count: number): FeatureDataState {
  if (error) return "error";
  if (source === "disconnected") return "disconnected";
  if (source === "mock") return "demo";
  return count === 0 ? "empty" : "available";
}
