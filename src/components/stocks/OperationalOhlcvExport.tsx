"use client";
import type {OhlcvBar} from "@/domain/ohlcv";
import {operationalOhlcvCsv} from "@/domain/operationalOhlcvCsv";

export function OperationalOhlcvExport({ticker,bars,locale}:{ticker:string;bars:OhlcvBar[];locale:"ko"|"en"}){
 if(bars.length===0)return null;
 function download(){
  const csv=operationalOhlcvCsv(ticker,bars);
  const url=URL.createObjectURL(new Blob(["\uFEFF",csv],{type:"text/csv;charset=utf-8"}));
  try{
   const link=document.createElement("a");
   link.href=url;
   link.download="operational-krx-"+ticker+".csv";
   document.body.appendChild(link);
   link.click();
   link.remove();
  }finally{URL.revokeObjectURL(url);}
 }
 return <button type="button" onClick={download}>
  {locale==="ko"?"수집 데이터 CSV 내보내기":"Export collected OHLCV as CSV"}
 </button>;
}
