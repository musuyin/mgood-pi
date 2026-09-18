# mgood-pi Plugin Kit — Agent Instructions

> This is the canonical repository contract. Pi discovers `AGENTS.md` automatically. Do **not** create a competing `agent.md`, `CLAUDE.md`, or nested instruction file unless a package genuinely needs a narrower, documented override.

## 1. Mission and boundaries

Build a composable plugin kit that improves the **Pi coding-agent experience**, approaching the ergonomics of Claude Code and Codex while preserving Pi's extension-first philosophy.

### In scope

- TUI ergonomics: status/footer/widgets, interactive dialogs, editor and command affordances, themes, keyboard workflows, accessibility, and discoverability.
- Skillset lifecycle: discovery, validation, profiles, installation/update flows, dependency and trust visibility.
- MCP integration: connection lifecycle, tool/resource exposure, configuration UX, health checks, and permission boundaries.
- Git workflow: worktree/session awareness, checkpoints, safe review/commit/restore flows, and repository status UI.
- Durable project/user memory: explicit long-term notes, metadata storage, retrieval tools, optional local RAG indexing, import/export, and user control.
- Missing Pi-native UX commands (for example an `/init`-style project bootstrap command) when they can be delivered as extensions or packages.

### Explicitly out of scope

- Context-window compaction, summarization policy, prompt-history pruning, or other context-management plugins.
- Forking/replacing Pi internals or low-level runtime/performance optimization.
- Silently collecting, transmitting, or indexing source code or memory data.

If a proposed feature crosses an out-of-scope boundary, stop and document the interface/assumption rather than implementing it here.

## 2. Platform assumptions

- Pi loads `AGENTS.md` automatically; use it as the project instruction contract.
- Pi extensions are TypeScript modules and are distributable as npm/git Pi packages.
- Project-local extension code executes with user privileges after trust approval. Treat every configuration, MCP server, skill, and memory source as untrusted until explicitly accepted.
- Prefer Pi public APIs, extension events, commands, custom tools, and `@earendil-works/pi-tui`. Do not depend on undocumented internals or patch Pi itself.

## 3. Technology decisions

### Default language: TypeScript

Use **TypeScript (Node.js LTS)** for all extension-facing code, CLIs, package manifests, tests, schemas, and shared libraries.

Rationale: it is Pi's native extension language, supports hot reload without a compile step, has direct access to Pi/TUI APIs, and makes npm package distribution straightforward.

Required baseline:

- ESM (`"type": "module"`), strict TypeScript (`"strict": true`), and explicit public types.
- Use `typebox` (or a single approved equivalent chosen repository-wide) for tool/config schemas; validate all disk, MCP, and user inputs at boundaries.
- Use Node built-ins with `node:` specifiers; minimize runtime dependencies.
- Runtime dependencies belong in `dependencies`, never only `devDependencies`, because Pi package installation uses production installs.
- Use `npm` with workspaces and a committed lockfile. Do not introduce another package manager without an ADR.

### Go exception

Go is allowed only for a separately buildable helper process when TypeScript cannot reasonably meet a requirement (for example, a portable native daemon or a resource-sensitive local indexer). It must:

1. expose a small versioned CLI/JSON-RPC boundary;
2. remain optional and not block basic Pi startup;
3. live in `services/<name>/` with its own `go.mod`, tests, build/release instructions, and security model;
4. be approved in an ADR before creation.

Do not write a Go Pi extension merely to reimplement TypeScript glue.

## 4. Target repository layout

Start as a TypeScript npm-workspace monorepo. Add folders only when their first real package exists.

```text
.
├── AGENTS.md                         # this contract
├── README.md                          # user-facing install/compatibility guide
├── package.json                       # private workspace root
├── package-lock.json
├── tsconfig.base.json
├── packages/
│   ├── core/                          # framework-neutral types, config, utilities
│   ├── ui/                            # shared Pi TUI components and tokens
│   ├── skillset/                      # skill discovery/profile management
│   ├── mcp/                           # MCP client/configuration primitives
│   ├── git/                           # Git workflow primitives
│   └── memory/                        # storage/retrieval abstractions, no implicit capture
├── plugins/
│   ├── init/                          # `/init`-style project bootstrap extension
│   ├── tui/                           # end-user TUI experience package
│   ├── skillset/
│   ├── mcp/
│   ├── git/
│   └── memory/
├── skills/                            # reusable Agent Skills bundled by this kit
├── prompts/                           # optional reusable prompt templates
├── themes/                            # Pi themes
├── services/                          # approved standalone Go/native helpers only
├── examples/                          # minimal installable demonstrations
├── docs/
│   ├── adr/                           # architecture decision records
│   ├── plugin-contracts/              # tool/command/config contracts
│   └── security/                      # threat model and data handling docs
└── scripts/                           # repo automation, not production logic
```

### Package and plugin rules

- `packages/*` may not register Pi extensions directly; they are reusable libraries with no ambient side effects.
- `plugins/*` are thin Pi adapters. Each owns one coherent user capability and exports an extension entrypoint from `src/index.ts`.
- A plugin may depend on `packages/*`; packages must never depend on a plugin.
- Avoid a god-plugin. Prefer independently installable feature packages and a separate optional curated bundle/meta-package.
- Every distributable package declares an explicit `pi` manifest in `package.json` (`extensions`, `skills`, `prompts`, `themes` as applicable), a license, supported Pi/Node versions, changelog, and README.
- User-facing commands use namespaced names until a short name is reserved, e.g. `/mgood:init`, `/mgood:mcp`, `/mgood:memory`. Do not shadow Pi built-ins.
- Extension factories must not start timers, watchers, processes, or network connections. Start session-scoped resources in `session_start` or lazily; close them in an idempotent `session_shutdown` handler.

## 5. When to split into an independent repository

Keep a plugin in this monorepo while it shares release cadence, support policy, types, or coordinated UX with the kit.

Split it only when **two or more** are true:

- it has a distinct audience, branding, maintainers, or release cadence;
- it needs a materially different security or dependency policy;
- it contains a native/Go service with its own release artifacts;
- it is useful without this kit and can publish a stable standalone API;
- its dependency footprint substantially slows installs or increases supply-chain risk for unrelated plugins.

Before splitting: write an ADR, publish versioned contracts, preserve an integration package or compatibility test here, and document migration/installation. Do not split speculative or small plugins.

## 6. Feature-specific contracts

### TUI

- Reuse shared UI tokens/components from `packages/ui`; do not hard-code colors/layout assumptions throughout plugins.
- TUI behavior must degrade safely in `print`, `json`, and `rpc` modes. Guard interactive operations with `ctx.mode`/`ctx.hasUI`.
- Commands need concise descriptions, keyboard-accessible flows, cancellation handling, and useful non-interactive errors.

### Skills and MCP

- Never auto-install, auto-enable, or execute third-party skills/MCP servers without a visible source, version, capability summary, and explicit approval.
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
- Provide inspect, edit, delete, clear, export, and re-index controls. Retrieval must reveal the cited memory IDs/sources to the model/user where practical.
- Never inject retrieved memories into every prompt implicitly. Retrieval must be invoked by a deliberate tool, command, or clearly documented feature setting.

## 7. Engineering and quality rules

- Keep functions focused; isolate filesystem, Git, MCP, subprocess, and storage effects behind interfaces.
- Prefer `async` APIs with `AbortSignal`; pass Pi's `ctx.signal` to nested work during agent turns.
- Use structured, redacted diagnostics. Errors must identify the operation and safe remediation without exposing sensitive values.
- Test core behavior without a live TUI/MCP server/Git remote. Add contract tests for schemas, command behavior, storage migrations, and permission gates.
- Add integration tests for each extension's registration and lifecycle cleanup. Manual TUI test steps belong in the package README.
- Required checks before merge: formatting, linting, type checking, unit/contract tests, and package build/pack validation.
- Use Conventional Commits (`feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`). Keep changes focused; do not mix refactors with feature behavior unless necessary.

## 8. Documentation and decisions

- Record non-trivial choices in `docs/adr/NNNN-title.md`: context, decision, alternatives, consequences, date/status.
- For every plugin, document purpose, install command, permissions/data access, commands/tools, configuration schema, non-interactive behavior, failure/recovery, and uninstall/cleanup steps.
- Update this file when a repository-wide rule changes. If instructions conflict, prioritize user safety, Pi public API documentation, and the narrower package contract.

## 9. Agent execution checklist

Before implementing a feature:

1. Confirm it is in scope and identify its plugin/package boundary.
2. Read the relevant Pi public docs and existing package contracts.
3. Decide whether the change needs an ADR, a security review note, or explicit user confirmation UX.
4. Define schemas, lifecycle ownership, storage/data flow, and non-TUI behavior before coding.
5. Implement the smallest composable slice with tests and documentation.
6. Run required checks and report changed files, compatibility implications, and any remaining manual verification.
