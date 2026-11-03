export function recordedStartDay(value:string|null):string|null{
 if(!value)return null;
 const millis=Date.parse(value);
 if(!Number.isFinite(millis))return null;
 return new Date(millis).toISOString().slice(0,10);
}
export function formatRecordedTime(value:string|null,locale:"ko"|"en"):string{
 if(!value)return "—";
 const millis=Date.parse(value);
 if(!Number.isFinite(millis))return "Unavailable";
 return new Intl.DateTimeFormat(locale==="ko"?"ko-KR":"en-US",{
  dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Seoul"
 }).format(new Date(millis));
}
