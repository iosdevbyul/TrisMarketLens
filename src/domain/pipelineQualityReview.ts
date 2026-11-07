import type {CoveragePipeline} from "./pipelineEvidenceCoverage";
import {serializeSharedRunFilters,type SharedRunFilters} from "./sharedRunFilters";

export type ReviewableEvidence="invalid"|"unavailable";

/** Show every API-returned execution with the selected explicit evidence label (or both issue labels), oldest first. */
export function selectPipelineQualityReview(
 current:SharedRunFilters,pipeline:CoveragePipeline,evidence:ReviewableEvidence|"issues"
):SharedRunFilters{
 return {
  ...current,pipeline,evidence,sort:"oldest",
  query:"",state:"all",from:"",to:"",attention:false,attentionReason:null
 };
}

/** Create a direct review URL without changing the current page or its active filters. */
export function pipelineQualityReviewUrl(
 currentUrl:string,current:SharedRunFilters,pipeline:CoveragePipeline,evidence:ReviewableEvidence|"issues"
):string{
 const url=new URL(currentUrl);
 url.search=serializeSharedRunFilters(url.search,selectPipelineQualityReview(current,pipeline,evidence));
 return url.toString();
}
