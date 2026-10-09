# Dependency security policy

## Current advisory

As of 2026-10-09, `npm audit` reports five high-severity findings along one transitive development dependency chain:

`eslint-config-next -> @next/eslint-plugin-next -> fast-glob -> micromatch -> braces`

The underlying advisory is [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) / CVE-2026-93687: stack exhaustion on deeply nested brace patterns. The official advisory currently lists no patched `braces` version.

The package is reached through ESLint tooling, which is a development dependency. This does **not** prove that the application is remotely exploitable. It also does **not** mean the vulnerability is fixed or unimportant: tooling processing untrusted glob patterns could remain at risk.

## Controls and checks

- CI runs `npm audit --omit=dev --audit-level=high`, failing when a production dependency has a high or critical advisory.
- CI still runs lint, TypeScript, tests and the build with the complete dependency tree.
- For a complete development-dependency review, run `npm audit`. Its current nonzero exit status is expected until the upstream advisory is remediated or the dependency graph no longer includes the affected package.
- Avoid `npm audit fix --force`: its proposed ESLint downgrade would break alignment with Next.js 16.
- Do not override `braces` to another unpatched release or suppress findings just to get an all-clear audit.

## Follow-up

Recheck [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) and `eslint-config-next` dependency releases; once a compatible fixed path is available, regenerate the lockfile, rerun the full audit, and validate all CI checks in a separate PR.
