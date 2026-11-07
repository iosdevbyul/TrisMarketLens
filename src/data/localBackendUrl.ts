/**
 * Current backend has no authentication. HTTP research transport is supported
 * only through explicit operator-owned loopback IPv4/localhost addresses.
 * Reject URL userinfo, paths, query strings, fragments and remote hosts
 * before making ANY request.
 */
export function normalizeLocalBackendUrl(value: string | undefined): string | null {
  const input = value?.trim();
  if (!input || !/^http:\/\/(localhost|127\.0\.0\.1)(:[0-9]{1,5})?\/?$/.test(input)) return null;
  try {
    const parsed = new URL(input);
    const port = parsed.port ? Number(parsed.port) : 80;
    if (!Number.isSafeInteger(port) || port < 1 || port > 65535) return null;
    if (parsed.username || parsed.password || parsed.search || parsed.hash || parsed.pathname !== "/") return null;
    return parsed.origin;
  } catch {
    return null;
  }
}
export function requireLocalBackendUrl(value: string | undefined): string {
  const normalized = normalizeLocalBackendUrl(value);
  if (!normalized) throw new Error("DonghakStockVision API must use an explicit local HTTP loopback URL (localhost or 127.0.0.1). Remote deployment requires a separate authenticated gateway.");
  return normalized;
}
