import "server-only";
import { normalizeLocalBackendUrl } from "./localBackendUrl";

export type SecurityCatalogItem = {
  ticker: string;
  securityName: string | null;
  corporationId: string | null;
  corporationName: string | null;
  market: "KOSPI";
  nameVerified: boolean;
  corporationMappingVerified: boolean;
  historicalIdentityVerified: false;
  unavailableReasons: string[];
};
export type SecurityMetadataCatalog = {
  fingerprint: string;
  researchSnapshotSha256: string;
  universe: number;
  verifiedSecurityNames: number;
  linkedCorporations: number;
  historicalBoundaries: number;
  sourceCount: number;
  limitations: string[];
  items: SecurityCatalogItem[];
};
export type SecurityMetadataCatalogResult = {
  data: SecurityMetadataCatalog | null;
  state: "available" | "empty" | "unavailable" | "not_configured";
  error: string | null;
};
const isObject = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
const sha = (v: unknown) => typeof v === "string" && /^[0-9a-f]{64}$/.test(v);
const ticker = (v: unknown): v is string => typeof v === "string" && /^[0-9A-Z]{6}$/.test(v);
const safeText = (v: unknown): v is string => typeof v === "string" && v.length <= 200;
const nullableText = (v: unknown) => v === null || safeText(v);

export function projectSecurityCatalog(value: unknown): SecurityMetadataCatalog | null {
  if (!isObject(value) || !sha(value.fingerprint) || !isObject(value.artifact)) return null;
  const artifact = value.artifact;
  if (artifact.version !== "security_metadata_v1" || !sha(artifact.researchSnapshotSha256)
      || !sha(artifact.legacyStocksFingerprint) || artifact.pitVerified !== false
      || artifact.operationalQualificationChanged !== false
      || !Array.isArray(artifact.securities) || artifact.securities.length > 10000
      || !Array.isArray(artifact.corporations) || artifact.corporations.length > 10000
      || !Array.isArray(artifact.sources) || artifact.sources.length > 500
      || !Array.isArray(artifact.historicalBoundaries) || artifact.historicalBoundaries.length > 5000
      || !Array.isArray(artifact.limitations) || artifact.limitations.length > 100
      || !artifact.limitations.every(safeText)) return null;
  const corporations = new Map<string,string>();
  for (const raw of artifact.corporations) {
    if (!isObject(raw) || typeof raw.corporationId !== "string"
        || !/^DART:[0-9]{8}$/.test(raw.corporationId) || !safeText(raw.koreanName)
        || corporations.has(raw.corporationId)) return null;
    corporations.set(raw.corporationId,raw.koreanName);
  }
  const items: SecurityCatalogItem[] = [];
  const seen = new Set<string>();
  let last = "";
  for (const raw of artifact.securities) {
    if (!isObject(raw) || !ticker(raw.ticker) || raw.ticker <= last || seen.has(raw.ticker)
        || raw.market !== "KOSPI" || raw.temporalScope !== "current_display_metadata_only"
        || raw.historicalIdentityVerified !== false
        || !nullableText(raw.securityName) || !nullableText(raw.securityNameEnglish)
        || !nullableText(raw.corporationId)
        || !["unavailable","verified_in_source_snapshot"].includes(String(raw.nameStatus))
        || !["verified_exact_dart_stock_code","unavailable"].includes(String(raw.corporationRelationship))
        || !Array.isArray(raw.unavailableReasons) || raw.unavailableReasons.length > 30
        || !raw.unavailableReasons.every(safeText)) return null;
    if ((raw.securityName !== null || raw.securityNameEnglish !== null)
          !== (raw.nameStatus === "verified_in_source_snapshot")) return null;
    if ((raw.corporationId !== null) !== (raw.corporationRelationship === "verified_exact_dart_stock_code")) return null;
    if (raw.corporationId !== null && (!/^DART:[0-9]{8}$/.test(raw.corporationId as string)
      || !corporations.has(raw.corporationId as string))) return null;
    last=raw.ticker; seen.add(raw.ticker);
    items.push({
      ticker:raw.ticker,
      securityName:raw.securityName as string|null,
      corporationId:raw.corporationId as string|null,
      corporationName:raw.corporationId === null ? null : corporations.get(raw.corporationId as string) ?? null,
      market:"KOSPI",
      nameVerified:raw.nameStatus === "verified_in_source_snapshot",
      corporationMappingVerified:raw.corporationRelationship === "verified_exact_dart_stock_code",
      historicalIdentityVerified:false,
      unavailableReasons:[...raw.unavailableReasons as string[]],
    });
  }
  return {
    fingerprint:value.fingerprint as string,
    researchSnapshotSha256:artifact.researchSnapshotSha256 as string,
    universe:items.length,
    verifiedSecurityNames:items.filter(item=>item.nameVerified).length,
    linkedCorporations:items.filter(item=>item.corporationMappingVerified).length,
    historicalBoundaries:artifact.historicalBoundaries.length,
    sourceCount:artifact.sources.length,
    limitations:[...artifact.limitations as string[]],
    items,
  };
}

export async function loadSecurityMetadataCatalog(
  baseUrl: string | undefined,
  fetcher: typeof fetch = fetch,
): Promise<SecurityMetadataCatalogResult> {
  const url = normalizeLocalBackendUrl(baseUrl);
  if (!url) return {data:null,state:"not_configured",error:"The backend requires an explicit local loopback HTTP address."};
  try {
    const response=await fetcher(url+"/api/v1/security-metadata",{
      headers:{Accept:"application/json"},cache:"no-store",redirect:"error",
      signal:AbortSignal.timeout(6000),
    });
    if (response.status===503) return {data:null,state:"unavailable",error:"The verified metadata snapshot is not configured on the running backend."};
    if (!response.ok) return {data:null,state:"unavailable",error:"Security metadata API returned HTTP "+response.status};
    const length=response.headers.get("content-length");
    if (length && (!/^\d+$/.test(length) || Number(length)>4*1024*1024))
      return {data:null,state:"unavailable",error:"Security metadata response exceeds the bounded size."};
    const body=await response.text();
    if (body.length>4*1024*1024) return {data:null,state:"unavailable",error:"Security metadata response exceeds the bounded size."};
    const data=projectSecurityCatalog(JSON.parse(body) as unknown);
    if (!data) return {data:null,state:"unavailable",error:"Security metadata response does not match the verified publication contract."};
    return {data,state:data.universe?"available":"empty",error:null};
  } catch {
    return {data:null,state:"unavailable",error:"Security metadata is unreachable or returned malformed JSON."};
  }
}
export async function getSecurityMetadataCatalog(): Promise<SecurityMetadataCatalogResult> {
  if (process.env.MARKET_LENS_DATA_SOURCE!=="http")
    return {data:null,state:"not_configured",error:"The verified metadata catalog requires HTTP mode."};
  return loadSecurityMetadataCatalog(process.env.DONGHAK_API_BASE_URL);
}
