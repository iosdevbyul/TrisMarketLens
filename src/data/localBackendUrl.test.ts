import {describe,expect,it} from "vitest";
import {normalizeLocalBackendUrl,requireLocalBackendUrl} from "./localBackendUrl";

describe("local operator backend URL policy",()=>{
 it("accepts only root-scoped HTTP loopback base URLs",()=>{
  expect(normalizeLocalBackendUrl(" http://127.0.0.1:8000/ ")).toBe("http://127.0.0.1:8000");
  expect(normalizeLocalBackendUrl("http://localhost:8000")).toBe("http://localhost:8000");
  expect(normalizeLocalBackendUrl("http://localhost")).toBe("http://localhost");
 });
 it("rejects external fetch, SSRF-style URL, fragments and secrets",()=>{
  for(const url of [
   "https://localhost:8000","http://example.org","http://127.0.0.2:8000",
   "http://localhost.evil.org:8000","http://127.1:8000",
   "http://0.0.0.0:8000","http://[::1]:8000",
   "http://user:pass@127.0.0.1:8000","http://localhost:8000/api",
   "http://localhost:8000?token=topsecret","http://localhost:8000/#fragment",
   "http://localhost:0","http://localhost:65536","http://localhost:8000\\@other.org",
   "file:///etc/passwd","",undefined
  ]){
   expect(normalizeLocalBackendUrl(url)).toBeNull();
   expect(()=>requireLocalBackendUrl(url)).toThrow("local HTTP loopback");
  }
 });
});
