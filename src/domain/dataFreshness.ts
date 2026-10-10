export type FreshnessState = "current" | "delayed" | "unknown";
export interface FreshnessReport {
  calendarId: string;
  expectedSession: string | null;
  validatedThrough: string | null;
  assessedAt: string;
  state: FreshnessState;
  reason: string | null;
}
const validDay=(v:unknown):v is string=>typeof v==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(v)&&!Number.isNaN(Date.parse(v));
const validTime=(v:unknown):v is string=>typeof v==="string"&&/(Z|[+-]\d{2}:\d{2})$/.test(v)&&!Number.isNaN(Date.parse(v));
/** The backend owns the exchange calendar and expected trading session. */
export function validateFreshnessReport(v:unknown):v is FreshnessReport{
 if(!v||typeof v!=="object")return false;
 const r=v as Record<string,unknown>;
 if(typeof r.calendarId!=="string"||!r.calendarId.trim()||!validTime(r.assessedAt))return false;
 if(r.expectedSession!==null&&!validDay(r.expectedSession))return false;
 if(r.validatedThrough!==null&&!validDay(r.validatedThrough))return false;
 if(!["current","delayed","unknown"].includes(String(r.state)))return false;
 if(r.reason!==null&&typeof r.reason!=="string")return false;
 if(r.state==="current"&&(r.expectedSession===null||r.validatedThrough===null||r.expectedSession!==r.validatedThrough))return false;
 if(r.state==="delayed"&&(r.expectedSession===null||r.validatedThrough===null||r.validatedThrough>=r.expectedSession))return false;
 return true;
}
