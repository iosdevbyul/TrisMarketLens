import { defineConfig } from "vitest/config";

/**
 * Next.js keeps JSX for its compiler; Vitest needs JSX transformed before
 * Vite's import analysis loads React components in unit tests.
 */
export default defineConfig({
  esbuild: {
    jsx: "automatic",
    jsxImportSource: "react",
    tsconfigRaw: {
      compilerOptions: {
        jsx: "react-jsx",
      },
    },
  },
  test: {
    environment: "node",
  },
});
