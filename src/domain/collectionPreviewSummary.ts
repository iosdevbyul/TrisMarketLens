import type {OperationalCatalog} from "@/data/OperationalMarketDataSource";

export interface CollectionPreviewSummary {
  observedCount:number;
  previewCount:number;
  newestDate:string|null;
  oldestDate:string|null;
  matchingNewest:number;
  distinctDates:number;
  isPartial:boolean;
}

// Dates are computed only from returned catalog items, never inferred for the full universe.
export function summarizeCollectionPreview(catalog:OperationalCatalog):CollectionPreviewSummary{
 const dates=catalog.items.map(item=>item.latestDataDate);
 const ordered=[...dates].sort();
 const newestDate=ordered.at(-1)??null;
 return {
  observedCount:catalog.total,
  previewCount:dates.length,
  newestDate,
  oldestDate:ordered[0]??null,
  matchingNewest:newestDate===null?0:dates.filter(date=>date===newestDate).length,
  distinctDates:new Set(dates).size,
  isPartial:catalog.offset!==0||catalog.total>dates.length,
 };
}
