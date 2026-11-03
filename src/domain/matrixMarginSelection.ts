import type {AnalysisRunState} from "./operations";
import type {RecordedEvidence} from "./recordedEvidence";
export interface MatrixSelection{
 state:"all"|AnalysisRunState;
 evidence:"all"|RecordedEvidence;
}
/** Margin selection clears the opposite matrix dimension, not unrelated UI filters. */
export function selectMatrixRow(current:MatrixSelection,status:AnalysisRunState):MatrixSelection{
 return current.state===status&&current.evidence==="all"
  ?{state:"all",evidence:"all"}
  :{state:status,evidence:"all"};
}
export function selectMatrixColumn(current:MatrixSelection,evidence:RecordedEvidence):MatrixSelection{
 return current.evidence===evidence&&current.state==="all"
  ?{state:"all",evidence:"all"}
  :{state:"all",evidence};
}
