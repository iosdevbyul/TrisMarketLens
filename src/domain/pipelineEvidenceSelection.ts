import type {CoveragePipeline} from "./pipelineEvidenceCoverage";
import type {RecordedEvidence,EvidenceFilter} from "./recordedEvidence";

export interface PipelineEvidenceSelection{
 pipeline:CoveragePipeline|"all";
 evidence:EvidenceFilter;
}

/** Toggle just the selected pipeline and explicit evidence classification. */
export function selectPipelineEvidence(
 current:PipelineEvidenceSelection,pipeline:CoveragePipeline,evidence:RecordedEvidence
):PipelineEvidenceSelection{
 if(current.pipeline===pipeline&&current.evidence===evidence)return {pipeline:"all",evidence:"all"};
 return {pipeline,evidence};
}
