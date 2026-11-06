import type {SharedRunFilters} from "./sharedRunFilters";
import type {ReviewableEvidence} from "./pipelineQualityReview";

/** Review one explicit evidence issue category across all API-returned pipelines. */
export function selectAllEvidenceIssueReview(
 current:SharedRunFilters,evidence:ReviewableEvidence
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
