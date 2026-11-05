import type {CoveragePipeline} from "./pipelineEvidenceCoverage";
import type {SharedRunFilters} from "./sharedRunFilters";

export type ReviewableEvidence="invalid"|"unavailable";

/** Show every API-returned execution with the selected explicit evidence label, oldest first. */
export function selectPipelineQualityReview(
 current:SharedRunFilters,pipeline:CoveragePipeline,evidence:ReviewableEvidence
):SharedRunFilters{
 return {
  ...current,pipeline,evidence,sort:"oldest",
  query:"",state:"all",from:"",to:"",attention:false,attentionReason:null
 };
}
