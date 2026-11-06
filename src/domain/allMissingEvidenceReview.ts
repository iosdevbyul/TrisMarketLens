import type {SharedRunFilters} from "./sharedRunFilters";

/** Reveal all API-returned missing-evidence records without unrelated filter exclusions. */
export function selectAllMissingEvidenceReview(current:SharedRunFilters):SharedRunFilters{
 return {
  ...current,
  pipeline:"all",
  evidence:"not-recorded",
  sort:"oldest",
  query:"",
  state:"all",
  from:"",
  to:"",
  attention:false,
  attentionReason:null
 };
}
