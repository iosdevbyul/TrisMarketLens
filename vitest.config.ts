import {configDefaults,defineConfig} from "vitest/config";

// Browser tests must run only under Playwright, after its pinned runner and
// Chromium have been installed in the same required GitHub CI checks job.
export default defineConfig({
 test:{
  exclude:[...configDefaults.exclude,"e2e/**"]
 }
});
