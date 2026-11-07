"use client";

import {useState} from "react";
import type {HistoricalTickerEvidence} from "@/data/HistoricalPortfolioTickerDataSource";
import {historicalTickerEvidenceCsv} from "@/domain/historicalTickerEvidenceExport";

export function HistoricalTickerEvidenceExport({evidence}:{evidence:HistoricalTickerEvidence}){
 const [message,setMessage]=useState("");
 const download=()=>{
  try{
   const csv=historicalTickerEvidenceCsv(evidence);
   const blob=new Blob([csv],{type:"text/csv;charset=utf-8"});
   const url=URL.createObjectURL(blob);
   const anchor=document.createElement("a");
   anchor.href=url;
   anchor.download="historical-ticker-"+evidence.ticker+"-offset-"+evidence.offset+".csv";
   document.body.appendChild(anchor);
   anchor.click();
   anchor.remove();
   URL.revokeObjectURL(url);
   setMessage("Current-page research evidence CSV prepared. This is not a complete history or a brokerage record.");
  }catch{
   setMessage("Unable to prepare the current-page research evidence CSV.");
  }
 };
 return <div>
  <button type="button" onClick={download}>Export current page research CSV</button>
  <p className="metric-detail" role="status">{message}</p>
 </div>;
}
