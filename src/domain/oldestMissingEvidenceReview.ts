import type {CoveragePipeline} from "./pipelineEvidenceCoverage";
import type {SharedRunFilters} from "./sharedRunFilters";

/** Open an unmasked, oldest-first view of API-returned missing-evidence executions. */
export function selectOldestMissingEvidenceReview(
 current:SharedRunFilters,pipeline:CoveragePipeline
):SharedRunFilters{
 return {
  ...current,
  pipeline,
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
