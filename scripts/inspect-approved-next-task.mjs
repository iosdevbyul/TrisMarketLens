// Inspect Trello Next for explicitly approved TrisMarketLens tasks.
// No code generation, card moves, issue creation or secret output.
const key=process.env.TRELLO_KEY;
const token=process.env.TRELLO_TOKEN;
const list=process.env.TRELLO_NEXT_LIST_ID;
if (!key || !token || !list) {
  console.error("Trello Next queue NOT configured. Add TRELLO_KEY and TRELLO_TOKEN repository secrets and TRELLO_NEXT_LIST_ID repository variable.");
  process.exitCode=1;
  throw new Error("Approved Next task inspection cannot run without Trello configuration.");
}
const url=new URL("https://api.trello.com/1/lists/"+encodeURIComponent(list)+"/cards");
url.searchParams.set("key",key);
url.searchParams.set("token",token);
url.searchParams.set("fields","id,name,desc,url,closed,pos");
url.searchParams.set("limit","1000");
const response=await fetch(url,{headers:{Accept:"application/json"},signal:AbortSignal.timeout(10000)});
if(!response.ok)throw Error("Trello Next lookup failed: HTTP "+response.status);
const cards=await response.json();
if(!Array.isArray(cards))throw Error("Trello Next response was not an array");
const eligible=cards.filter(card=>
 card && !card.closed &&
 typeof card.name==="string" &&
 /\[(?:Donghak Vision Web|TrisMarketLens)\]/i.test(card.name) &&
 typeof card.desc==="string" &&
 /^Automation-Approved:\s*true\s*$/im.test(card.desc) &&
 /^Task-Repository:\s*iosdevbyul\/TrisMarketLens\s*$/im.test(card.desc) &&
 /^Task-Instruction:\s*\S+/im.test(card.desc)
).sort((a,b)=>a.pos-b.pos);
if(eligible.length===0){
 console.log("No explicitly approved TrisMarketLens work in Trello Next. Nothing to dispatch.");
 process.exit(0);
}
const card=eligible[0];
console.log("Next approved task:",card.name);
console.log("Trello card URL:",card.url);
console.log("Task remains in Next until an actual development agent explicitly accepts it.");
console.log("No autonomous code execution or PR was started.");
