import { PublishedExperiment } from "@/components/research/ResearchLabPublicationViews";
export const dynamic="force-dynamic";
export default async function ResearchExperimentPage({params}:{params:Promise<{study:string;experimentId:string}>}) {
 const {study,experimentId}=await params;
 return <PublishedExperiment studyId={study} id={experimentId}/>;
}
