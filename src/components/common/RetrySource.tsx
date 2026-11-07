"use client";
import {useRouter} from "next/navigation";
import {useTransition} from "react";

/** A retry re-requests server-owned data. It never replaces HTTP errors with demo records. */
export function RetrySource({locale,description}:{locale:"en"|"ko";description?:string}){
 const router=useRouter();
 const [retrying,startTransition]=useTransition();
 function retry(){
  startTransition(() => router.refresh());
 }
 return <div className="source-retry">
  {description?<p className="metric-detail">{description}</p>:null}
  <button type="button" className="source-retry-button" onClick={retry} disabled={retrying}
   aria-label={locale==="ko"?"소스 데이터를 다시 요청" : "Retry loading source data"}>
   {retrying?(locale==="ko"?"다시 요청 중…" : "Requesting source…"):
    (locale==="ko"?"다시 시도" : "Retry source")}
  </button>
 </div>;
}
