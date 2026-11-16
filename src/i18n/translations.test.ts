import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { translate } from "./translations";

function sourceFiles(root: string): string[] {
  return readdirSync(root,{withFileTypes:true}).flatMap(entry=>{
    const path=join(root,entry.name);
    if(entry.isDirectory())return sourceFiles(path);
    return entry.isFile()&&path.endsWith(".tsx")&&!path.endsWith(".test.tsx")?[path]:[];
  });
}

describe("EN/KO translated UI copy",()=>{
  it("preserves neutral identifiers and unknown data instead of translating private backend fields",()=>{
    expect(translate("ko","005930")).toBe("005930");
    expect(translate("ko","unseen-research-cohort-ref")).toBe("unseen-research-cohort-ref");
    expect(translate("en","Research evidence source")).toBe("Research evidence source");
    expect(translate("ko","Research evidence source")).toBe("연구 근거 출처");
  });
  it("all statically localized server and client text nodes have an explicit Korean entry",()=>{
    const missing=new Set<string>();
    const literalCommands=new Set(["python3 scripts/export-autonomous-research.py","npm run verify:research:workspace"]);
    let total=0;
    for(const path of sourceFiles(join(process.cwd(),"src"))){
      const source=readFileSync(path,"utf8");
      for(const match of source.matchAll(/<(?:Localize|ClientLocalize) text="([^"]+)"\s*\/>/g)){
        const text=match[1];
        total++;
        // Commands are intentionally identical in both languages and must remain copyable.
        if(!literalCommands.has(text) && translate("ko",text)===text)missing.add(path.replace(process.cwd()+"/","")+": "+text);
      }
    }
    expect(total).toBeGreaterThan(250);
    expect([...missing].sort()).toEqual([]);
  });
});
