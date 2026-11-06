import type {CoveragePipeline} from "./pipelineEvidenceCoverage";
import type {RecordedEvidence,EvidenceFilter} from "./recordedEvidence";

export interface PipelineEvidenceSelection{
 pipeline:CoveragePipeline|"all";
 evidence:EvidenceFilter;
}

/** Toggle selected pipeline and explicit evidence classification or combined issues filter. */
export function selectPipelineEvidence(
 current:PipelineEvidenceSelection,pipeline:CoveragePipeline,evidence:RecordedEvidence|"issues"
):PipelineEvidenceSelection{
 if(current.pipeline===pipeline&&current.evidence===evidence)return {pipeline:"all",evidence:"all"};
 return {pipeline,evidence};
}
