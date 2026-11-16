import { PublishedReport } from "@/components/research/ResearchLabPublicationViews";
export const dynamic="force-dynamic";
export default async function ResearchReportPage({params}:{params:Promise<{reportId:string}>}) {
 const {reportId}=await params;
 return <PublishedReport id={reportId}/>;
}
