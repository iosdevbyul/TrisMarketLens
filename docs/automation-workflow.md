# Authorized web development automation

This repository accepts **user-directed** web changes only. Each task uses its own branch and PR; no developer pushes directly to `main`.

## One-time setup

1. Create the repository label `auto-merge-approved` in GitHub **Issues → Labels**. This approval label is the explicit per-PR opt-in. Never apply it to unreviewed, third-party or sensitive changes.
2. Configure repository **Settings → Secrets and variables → Actions**:
   - Secrets: `TRELLO_KEY` and `TRELLO_TOKEN` for a Trello account authorized to manage the board.
   - Variables: `TRELLO_IN_PROGRESS_LIST_ID`, `TRELLO_DONE_LIST_ID`, and `TRELLO_BACKLOG_LIST_ID` (Trello short or full REST list IDs, not ARIs).
3. Ensure GitHub Actions has permission to create pull requests and write repository contents as configured by repository and organization policies. Branch protection or rulesets must be respected; do not disable them.
4. Check all Actions workflow and repository token permissions before using auto-merge for the first time.

## Authorized task lifecycle

1. A user explicitly requests a development task. Create branch `auto/<task-slug>` from up-to-date `main`, implement and test, and open a non-draft PR targeting `main`.
2. Include the exact Trello card link in the PR body on its own line:
   `Trello-Card: https://trello.com/c/ABCDEFGH`
3. Apply `auto-merge-approved` to **that PR** only after confirming its scope is what the user directed. Otherwise leave the PR for manual review. The label is an authorization gate; branch naming alone cannot trigger merging.
4. The existing CI workflow runs lint, types, tests and build. When the successful pull-request CI workflow completes, the automation checks the unchanged head commit, exact base/main, same-repo owner-authored PR, non-draft status, approval label and GitHub mergeability before squash-merging.
5. Trello moves the linked card to In Progress while an authorized PR is open and to Done after merge. A closed, unmerged authorized PR moves to Backlog. Unlinked or non-automation PRs are ignored. If Trello credentials are absent, this workflow skips the update and explains why in Actions logs.

## Restrictions and failure behavior

- CI failure, conflicts, mismatched commit, missing label, non-owner or external PR, and draft PRs **never** merge.
- Do not automatically open a new feature task or PR after merging: a user must direct the next task.
- CI is offline/mock-based and does not certify live operational KRX market observations. Manual on-device, live-data, security-sensitive, or production-release checks remain separate.
- No Trello secrets or API tokens belong in Git, PR descriptions or logs.
- A PR merged before this workflow is installed will not be retroactively synchronized.
- The Trello workflow does not determine whether a paused project belongs in Next vs Backlog. Planned tasks go to Next, paused tasks to Backlog, and active work only to In Progress; handle these during planning or with an explicit state change.
