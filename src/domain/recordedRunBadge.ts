import type {AnalysisRunState} from "./operations";
/** A recorded execution state never supplies semantic validation evidence. */
export type RecordedRunBadgeTone="recorded"|"in_progress"|"blocked";
export function recordedRunBadgeTone(state:AnalysisRunState):RecordedRunBadgeTone{
 if(state==="failed"||state==="blocked")return "blocked";
 if(state==="queued"||state==="running")return "in_progress";
 return "recorded";
}
