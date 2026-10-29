/** Resolve specialized read-only sources without silently substituting demonstration data. */
export function resolveFeatureSourceMode(explicitMode: string | undefined, baseMode: string | undefined): string {
  if (explicitMode !== undefined) return explicitMode;
  return baseMode === "http" ? "http" : "disconnected";
}
