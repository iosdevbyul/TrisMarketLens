import { PublishedReports } from "@/components/research/ResearchLabPublicationViews";
export const dynamic="force-dynamic";
export default async function ResearchReportsPage({searchParams}:{searchParams:Promise<{offset?:string}>}) {
 const q=await searchParams;const offset=q.offset&&/^\d{1,5}$/.test(q.offset)?Math.min(10000,Number(q.offset)):0;
 return <PublishedReports offset={offset}/>;
}
