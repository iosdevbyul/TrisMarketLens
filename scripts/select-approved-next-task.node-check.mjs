import {test} from "node:test";
import assert from "node:assert/strict";
import {selectApprovedNextTask} from "./select-approved-next-task.mjs";
const card=(overrides={})=>({name:"[TrisMarketLens] Add dashboard feature",desc:"Automation-Approved: true\nTask-Repository: iosdevbyul/TrisMarketLens\nTask-Instruction: Implement feature",closed:false,pos:10,url:"https://trello.com/c/ABCDEFGH",...overrides});
test("selects earliest approved web task",()=>{
 assert.equal(selectApprovedNextTask([card({pos:15}),card({pos:5,url:"https://trello.com/c/ZXCVBNMA"})]).url,"https://trello.com/c/ZXCVBNMA");
});
test("rejects unapproved, paused, foreign, or malformed cards",()=>{
 const variants=[
  card({desc:"Task-Repository: iosdevbyul/TrisMarketLens\nTask-Instruction: Anything"}),
  card({desc:"Automation-Approved: false\nTask-Repository: iosdevbyul/TrisMarketLens\nTask-Instruction: Anything"}),
  card({desc:"Automation-Approved: true\nTask-Repository: other/repo\nTask-Instruction: Anything"}),
  card({closed:true}),card({name:"[Coufunch] Different project"}),
  card({url:"http://example.com/c/ABCDEFGH"}),card({pos:"1"}),
 ];
 for(const item of variants)assert.equal(selectApprovedNextTask([item]),null);
});
test("empty Next list safely selects nothing",()=>{
 assert.equal(selectApprovedNextTask([]),null);
 assert.throws(()=>selectApprovedNextTask({}),/array/);
});
