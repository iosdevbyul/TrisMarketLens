import type {CoveragePipeline} from "./pipelineEvidenceCoverage";
import type {EvidenceFilter} from "./recordedEvidence";
export interface PipelineMissingEvidenceSelection {
 pipeline:CoveragePipeline|"all";
 evidence:EvidenceFilter;
}
/** Toggle just the pipeline and evidence dimensions, preserving unrelated filters. */
export function selectMissingPipelineEvidence(
 current:PipelineMissingEvidenceSelection,
 pipeline:CoveragePipeline
):PipelineMissingEvidenceSelection{
 if(current.pipeline===pipeline&&current.evidence==="not-recorded")return {pipeline:"all",evidence:"all"};
 return {pipeline,evidence:"not-recorded"};
}
