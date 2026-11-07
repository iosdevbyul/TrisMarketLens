"use client";

import {useState} from "react";
import type {HistoricalPortfolioComparison} from "@/data/HistoricalPortfolioComparisonDataSource";
import {historicalComparisonCsv} from "@/domain/historicalComparisonExport";

export function HistoricalComparisonExport({comparison}:{comparison:HistoricalPortfolioComparison}){
 const [message,setMessage]=useState("");
 const download=()=>{
  try{
   const csv=historicalComparisonCsv(comparison);
   const blob=new Blob([csv],{type:"text/csv;charset=utf-8"});
   const url=URL.createObjectURL(blob);
   const link=document.createElement("a");
   link.href=url;
   link.download="historical-portfolio-comparison.csv";
   document.body.appendChild(link);
   link.click();
   link.remove();
   URL.revokeObjectURL(url);
   setMessage("Research comparison CSV prepared. Values and limitations come from published backend evidence.");
  }catch{
   setMessage("Unable to export the historical research comparison.");
  }
 };
 return <div>
  <button type="button" onClick={download} aria-label="Export historical portfolio research comparison CSV">
   Export research comparison CSV
  </button>
  <p className="metric-detail" role="status">{message}</p>
 </div>;
}
