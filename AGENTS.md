# mgood-pi Plugin Kit — Agent Instructions

> **Canonical contract:** Pi discovers this English `AGENTS.md` automatically. `AGENTS_CN.md` is its required Chinese synchronization. Do **not** create a competing `agent.md`, `CLAUDE.md`, or nested instruction file unless a package genuinely needs a narrower, documented override.
>
> **Synchronization rule:** Any change to this file must update `AGENTS_CN.md` in the same commit, with equivalent meaning. If translation is ambiguous, preserve the English rule and resolve the ambiguity before merging.

## 1. Mission and boundaries

Build a composable, independently installable plugin kit that improves the **Pi coding-agent experience**, approaching the ergonomics of Claude Code and Codex while preserving Pi's extension-first philosophy.

### In scope

- TUI ergonomics: status/footer/widgets, interactive dialogs, editor and command affordances, themes, keyboard workflows, accessibility, and discoverability.
- A curated Plugin Market: discover approved `mgood-pi` packages, expose source/version/capabilities, and invoke Pi's supported installer only after explicit confirmation.
- Skillset lifecycle: discovery, validation, profiles, installation/update flows, dependency and trust visibility.
- MCP integration: connection lifecycle, tool/resource exposure, configuration UX, health checks, and permission boundaries.
- Git workflow: worktree/session awareness, checkpoints, safe review/commit/restore flows, and repository status UI.
- Durable project/user memory: explicit long-term notes, metadata storage, retrieval tools, optional local RAG indexing, import/export, and user control.
- Reusable prompt workflows, including Plan Workflow's TUI-only `/mgood:plan` experience for local plan, implementation, and review actions.

### Explicitly out of scope

- Context-window compaction, summarization policy, prompt-history pruning, or other context-management plugins.
- Forking/replacing Pi internals or low-level runtime/performance optimization.
- Silently collecting, transmitting, or indexing source code or memory data.
- Installing arbitrary third-party packages, skills, MCP servers, or plugins without visible provenance and explicit user approval.

If a proposed feature crosses an out-of-scope boundary, stop and document the interface/assumption rather than implementing it here.

## 2. Platform assumptions

- Pi loads `AGENTS.md` automatically; use it as the repository instruction contract.
- Pi extensions are TypeScript modules and are distributable as npm/git Pi packages.
- Pi packages execute with the local user's privileges. Treat every configuration, MCP server, skill, memory source, and installable package as untrusted until explicitly accepted.
- Prefer Pi public APIs, extension events, commands, custom tools, package manifests, and `@earendil-works/pi-tui`. Do not depend on undocumented internals or patch Pi itself.
- Pi package installation is a CLI capability (`pi install`, optionally `-l` for project scope), not an in-process extension API. An extension may invoke the CLI only with direct argument arrays, never a shell command.

## 3. Technology decisions

### Default language: TypeScript

Use **TypeScript (Node.js LTS)** for all extension-facing code, CLIs, package manifests, tests, schemas, and shared libraries.

Required baseline:

- ESM (`"type": "module"`), strict TypeScript (`"strict": true`), and explicit public types.
- Use `typebox` (or one repository-approved equivalent) for tool/config schemas; validate disk, MCP, and user inputs at boundaries.
- Use Node built-ins with `node:` specifiers; minimize runtime dependencies.
- Runtime dependencies belong in `dependencies`, never only `devDependencies`, because Pi package installation uses production installs.
- Use npm workspaces and commit `package-lock.json`. Do not introduce another package manager without an ADR.

### Go exception

Go is allowed only for a separately buildable helper process when TypeScript cannot reasonably meet a requirement. It must expose a small versioned CLI/JSON-RPC boundary, remain optional, live in `services/<name>/` with its own module/tests/release/security documentation, and be approved in an ADR before creation.

Do not write a Go Pi extension merely to reimplement TypeScript glue.

## 4. Current repository architecture

This is a TypeScript npm-workspaces monorepo. Keep the current layout accurate in user-facing documentation whenever it changes.

```text
.
├── AGENTS.md                         # canonical English agent contract
├── AGENTS_CN.md                      # required synchronized Chinese contract
├── README.md                          # user-facing install and compatibility guide
├── package.json / package-lock.json   # private workspace root and lockfile
├── packages/
│   ├── core/                          # shared framework-neutral contracts
│   └── plan-workflow/                 # Schema v5 local PLAN/REVIEW discovery
├── plugins/
│   ├── market/                        # /mgood:market and /mgood:init
│   └── plan-workflow/                 # /mgood:plan; private bundled local-plan guidance
├── docs/
│   ├── adr/                           # architecture decision records
│   ├── features/                      # maintained implementation documentation
│   └── releasing.md                   # independent npm release process
├── tmp/work-plans/                    # user-managed local Schema v5 PLAN/REVIEW temporary data
├── .changeset/                        # independent package release intents
└── .github/workflows/release.yml      # validation, Version Packages PR, publishing
```

Plan Workflow discovers local workflow data only from `tmp/work-plans/`. Do not add a branded alias, configurable root, recursive search, or compatibility scan of repository-root `work-plans/`.

Add folders only when their first real package or documented responsibility exists. Future `packages/ui`, `packages/skillset`, `packages/mcp`, `packages/git`, `packages/memory`, matching plugins, `skills/`, `prompts/`, `themes/`, `services/`, `examples/`, and `scripts/` follow these same boundaries.

### Package and plugin rules

- `packages/*` are reusable libraries: no Pi extension registration and no ambient side effects.
- `plugins/*` are thin Pi adapters. Each owns one coherent user capability and exports an extension entrypoint from `src/index.ts`.
- A plugin may depend on `packages/*`; packages must never depend on a plugin.
- Avoid a god-plugin. Prefer independently installable feature packages and optional curated bundle/meta-packages.
- Every distributable package needs an explicit `pi` manifest as applicable, license, supported Pi/Node versions, README, changelog, package file allowlist, and public npm metadata.
- Use namespaced commands unless a short name is intentionally reserved. Current commands include `/mgood:init`, `/mgood:market`, and `/mgood:plan`. Do not shadow Pi built-ins.
- Extension factories must not start timers, watchers, processes, or network connections. Start session-scoped resources in `session_start` or lazily; close them in an idempotent `session_shutdown` handler.

### Plugin Market contract

- `plugins/market` publishes as `@mgood-pi/plugin-market`. Directory names and npm package names may differ when necessary, but align them by default for discoverability.
- `/mgood:market` uses a curated, version-pinned catalog maintained in code. Do not fetch or install arbitrary package specifications by default.
- Before installation, display the exact package source, requested scope, capabilities, and resulting `pi install` command. Require an explicit confirmation.
- Offer only Pi-supported global and project-local scopes. Project scope uses `pi install -l`.
- Invoke `pi` with `spawn`/equivalent direct arguments; never interpolate user input into a shell command.
- In non-interactive modes, print catalog entries and copyable commands only; never install automatically.
- `/mgood:init` remains a read-only bootstrap preview. It must not write files unless a future separately designed and explicitly confirmed write flow is implemented.

## 5. Independent publishing and repository splits

This repository is one monorepo with independently versioned/published packages. Each publishable workspace has its own npm version, changelog entries, and release lifecycle managed by Changesets.

- Add a changeset for every publishable-package change, selecting all affected packages and an appropriate semver bump.
- Do not manually change ordinary package versions; Changesets calculates versions and internal dependency ranges.
- Run `npm run check` and `npm pack --workspace <package> --dry-run` for every changed publishable package.
- Follow `docs/releasing.md` for Version Packages PRs, npm automation credentials, and manual-release fallback.
- Publish shared dependencies before dependent plugins; use bundled dependencies only where Pi package isolation requires them.

Keep a plugin here while it shares release cadence, support policy, types, or coordinated UX with the kit. Split it into an independent repository only when at least two of these are true: distinct audience/branding/maintainers/release cadence; different security/dependency policy; native/Go release artifacts; stable standalone API and value; or disproportionate install/supply-chain cost. Before splitting, write an ADR, publish versioned contracts, preserve an integration/compatibility test, and document migration.

## 6. Feature-specific contracts

### TUI

- Reuse shared UI tokens/components when `packages/ui` exists; do not hard-code colors/layout assumptions throughout plugins.
- TUI behavior must degrade safely in `print`, `json`, and `rpc` modes. Guard interactive operations with `ctx.mode` and `ctx.hasUI`.
- Commands need concise descriptions, keyboard-accessible flows, cancellation handling, and useful non-interactive output/errors.

### Skills and MCP

- Never auto-install, auto-enable, or execute third-party skills/MCP servers without visible source, version, capability summary, and explicit approval.
- Store configuration separately from secrets. Read credentials from environment variables/keychains where possible; redact secrets from logs, session entries, diagnostics, and exports.
- Give MCP connections lifecycle states (configured, connecting, ready, failed, stopped), bounded retries/timeouts, and a clear disable path.

### Git

- Default to read-only inspection. Any write action (checkout, reset, commit, stash, worktree removal, push) requires explicit confirmation and a preview of affected paths/refs.
- Never rewrite history, force-push, or delete branches/worktrees by default.
- Ensure every mutating operation is cancellation-aware and reports a recoverable checkpoint where possible.

### Memory, metadata, and RAG

- Memory is opt-in and user-owned. Define scope explicitly (`project`, `workspace`, or `user`) and make storage location visible.
- Begin with a versioned local KV/metadata abstraction. Add vector/RAG retrieval behind a provider interface; no hosted vector database is a baseline requirement.
- Attach schema version, source/provenance, timestamps, scope, and retention information to each record.
- Provide inspect, edit, delete, clear, export, and re-index controls. Retrieval must reveal cited memory IDs/sources where practical.
- Never inject retrieved memories into every prompt implicitly. Retrieval requires a deliberate tool, command, or documented feature setting.

## 7. Engineering and quality rules

- Keep functions focused; isolate filesystem, Git, MCP, subprocess, and storage effects behind interfaces.
- Prefer `async` APIs with `AbortSignal`; pass Pi's `ctx.signal` to nested work during agent turns.
- Use structured, redacted diagnostics. Errors must identify the operation and safe remediation without exposing sensitive values.
- Test core behavior without a live TUI/MCP server/Git remote. Add contract tests for schemas, command behavior, storage migrations, and permission gates.
- Add integration tests for each extension's registration and lifecycle cleanup. Put manual TUI verification steps in the package README.
- Required checks before merge: formatting, linting, type checking, unit/contract tests, workspace build, Changeset status where applicable, and package pack validation.
- Use Conventional Commits (`feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`). Keep changes focused; do not mix unrelated refactors with feature behavior.

## 8. Documentation and architecture decision rules

**Documentation is part of the architecture, not follow-up work.** Every architecture-affecting change must update the relevant documentation in the same pull request/commit. Do not mark the implementation complete while its contract documentation is stale or deferred.

An architecture-affecting change includes: workspace/package boundaries; public npm package names; commands, prompts, tools, or configuration contracts; persistence/data flow; security/permission model; external process/network behavior; dependency/release model; lifecycle ownership; supported compatibility; or repository-wide conventions.

For each such change, update all applicable artifacts in the same change:

1. `AGENTS.md` and `AGENTS_CN.md` for repository-wide rules, architecture, or workflow changes. They must stay semantically synchronized.
2. `README.md` for user-facing capabilities, install commands, compatibility, layout, and security statements.
3. The affected package README and `package.json` for install source, manifest, capabilities, configuration, permissions/data access, non-interactive behavior, failure/recovery, and uninstall/cleanup.
4. `docs/features/<feature>/` for implemented feature architecture, operations, and package contracts.
5. `docs/releasing.md`, `.changeset/`, package changelogs, and CI workflow documentation when publishing/versioning changes.
6. `docs/adr/NNNN-title.md` for non-trivial, durable decisions: include context, decision, alternatives, consequences, date, and status.
7. `docs/security/` or `docs/plugin-contracts/` when a security boundary or public tool/command/config contract changes.

If no existing document fits, create the smallest appropriate document in `docs/` and link it from the relevant README. Planned/backlog documents are not substitutes for implementation documentation. Keep unimplemented designs clearly separated from shipped behavior.

If instructions conflict, prioritize user safety, Pi public API documentation, and the narrower documented package contract.

## 9. Agent execution checklist

Before implementing a feature:

1. Confirm it is in scope and identify its plugin/package boundary.
2. Read relevant Pi public docs and existing package/feature contracts.
3. Decide whether it needs an ADR, security review note, explicit approval UX, or release changeset.
4. Define schemas, lifecycle ownership, storage/data flow, non-TUI behavior, and documentation updates before coding.
5. Implement the smallest composable slice with tests and all required documentation synchronized.
6. Run required checks and pack validation; report changed files, compatibility/release implications, manual verification, and intentionally deferred work.
