# ADR 0003: Use a focused Plan mode

- **Status:** accepted (supersedes the earlier local Plan Workflow decision)
- **Date:** 2026-09-30

## Context

The previous design maintained a local workflow around Schema v5 `PLAN.md` and `REVIEW.md` pairs. It included discovery, status parsing, menus, updates, implementation continuation, reviews, and deletion. Even after earlier simplification, this treated a temporary implementation plan as project-management state and shifted attention away from the real quality problem: reaching a precise, confirmed brief before planning.

Pi extensions can register a command and inject private guidance into the current agent turn. That is sufficient for a small Plan mode without a parser, reusable core package, or lifecycle engine.

## Decision

Publish one Pi extension as `@mgood-pi/plan` from `plugins/plan`. It registers `/mgood-pi:plan` and injects bundled planning guidance as a hidden custom session message.

The planning protocol requires the current agent to restate the request, actively clarify material ambiguity, confirm the resulting brief, investigate repository evidence, and only then create one new Markdown file directly under `tmp/plans/`.

The plan has no machine-readable schema or frontmatter. It is an implementation-ready document, not persisted workflow state. The extension does not discover, parse, resume, execute, review, update, or delete plans. The former `@mgood-pi/plan-workflow-core`, `@mgood-pi/plugin-plan-workflow`, `/mgood:plan`, and `tmp/work-plans/` contracts are removed without compatibility aliases or migration logic.

The prompt permits no write other than the single new plan. This is behavioral guidance rather than an operating-system sandbox. Existing filenames must not be overwritten, and the plugin does not alter `.gitignore` or Git state.

## Alternatives considered

- **Retain the workflow and simplify its UI:** rejected because discovery, state, review, and execution remain unrelated to producing a better initial plan.
- **Keep a framework-neutral plan package:** rejected because a schema-free Markdown output has no reusable parsing contract.
- **Register a public prompt template only:** rejected because the extension provides command collision handling, no-argument TUI input, non-interactive guidance, and a stable bundled protocol.
- **Add compatibility aliases or migrate old plans:** rejected to keep the contract unambiguous and avoid reviving obsolete workflow semantics.

## Consequences

- Users get one memorable `/mgood-pi:plan` command and one inspectable output file.
- Clarification may take multiple turns before a plan is written; this is intentional.
- Implementation and review happen outside this plugin in later user-directed turns.
- Existing `tmp/work-plans/` data is untouched but unsupported.
- Renaming the npm package and command is a breaking release and requires users to install `@mgood-pi/plan` explicitly.
