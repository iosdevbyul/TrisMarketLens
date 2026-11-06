import type {SharedRunFilters} from "./sharedRunFilters";
import type {ReviewableEvidence} from "./pipelineQualityReview";

/** Review one or both explicit evidence issue categories across all API-returned pipelines. */
export function selectAllEvidenceIssueReview(
 current:SharedRunFilters,evidence:ReviewableEvidence|"issues"
):SharedRunFilters{
 return {
  ...current,
  pipeline:"all",
  evidence,
  sort:"oldest",
  query:"",
  state:"all",
  from:"",
  to:"",
  attention:false,
  attentionReason:null
 };
}
