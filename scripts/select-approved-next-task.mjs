// Pure task selection. Trello input is untrusted; selection never executes instructions.
export function selectApprovedNextTask(cards) {
 if(!Array.isArray(cards)) throw Error("Expected an array of Next cards");
 return cards.filter(card =>
   card && card.closed === false &&
   typeof card.name === "string" &&
   /^\[(?:Donghak Vision Web|TrisMarketLens)\]/i.test(card.name) &&
   typeof card.desc === "string" &&
   /^Automation-Approved:\s*true\s*$/im.test(card.desc) &&
   /^Task-Repository:\s*iosdevbyul\/TrisMarketLens\s*$/im.test(card.desc) &&
   /^Task-Instruction:\s*\S+/im.test(card.desc) &&
   Number.isFinite(card.pos) &&
   typeof card.url === "string" &&
   /^https:\/\/trello\.com\/c\/[a-zA-Z0-9]{8}(?:\/[^\s]*)?$/.test(card.url)
 ).sort((a,b)=>a.pos-b.pos)[0] ?? null;
}
