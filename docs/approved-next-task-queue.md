# Approved Next-task queue inspection

This is a **read-only discovery gate**, not an autonomous developer. After an approved auto-merge workflow completes successfully, or by manual dispatch, the workflow inspects the existing Trello **Next** list. It does not start Codex, change cards, create issues, commit code, or create PRs.

## One-time configuration

Use the existing `TRELLO_KEY` and `TRELLO_TOKEN` GitHub Actions secrets. Add the Actions repository variable `TRELLO_NEXT_LIST_ID=6ad671a7f71bd17df340a597`. If these values are absent, the workflow performs no action.

## Explicit approval contract

A proposed web task in Trello **Next** must have a name including `[TrisMarketLens]` or `[Donghak Vision Web]` and contain all three lines below in its description:

```text
Automation-Approved: true
Task-Repository: iosdevbyul/TrisMarketLens
Task-Instruction: <a concrete user-authorized feature specification>
```

Only the earliest matching Next card is reported in Actions logs. This is a selection marker, **not an authorization to let untrusted Trello content execute commands**. Card contents are untrusted instructions until reviewed within the separately authorized development workflow.

## Limits

The pipeline is deliberately **not a coding agent**: automatic task development requires a separate, authenticated, appropriately sandboxed agent runner with explicit user-approved scope and spend limits. Until one is connected, eligible tasks remain in **Next**. An actually started task moves to **In Progress**, and only a completed merged task moves to **Done**. Deferred tasks go to **Backlog**.

To inspect manually, open Actions → Inspect next approved web task → Run workflow.
