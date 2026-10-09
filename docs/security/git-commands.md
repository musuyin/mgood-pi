# Security Review: Safe Git Commands (v8 in progress)

> This review covers Work Plan 008. Automated tests and release-candidate checks do not close the real Pi TUI and disposable-repository evidence gap. Keep the work blocked until that evidence exists; mocks are not a substitute.

## Assets and trust boundaries

| Asset                  | Protection or limitation                                                                                                                                                                 |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Current Agent session  | Commit injects one hidden `mgood-git-commit` custom context message only in an idle interactive TUI; it does not create another provider/planner or directly write Git state             |
| Current worktree       | Prompts limit behavior to the invocation worktree, require staged/mixed checks, and stop when exact whole-path safety cannot be established; this is not a technical permission boundary |
| User authorization     | Slash invocation authorizes one commit workflow; push-capable commands require one confirmation and do not authorize rewrites or out-of-scope content                                    |
| Commit history         | Prompts stop and honestly report partial state after hooks, drift, cancellation, or failure; they do not roll back, retry, or replan automatically                                       |
| Remote and credentials | Push-capable commands prohibit protected destinations; the standalone configured-upstream core retains exact refspec, URL redaction, and raw remote identity fingerprinting              |

Constraints, filenames, status, diffs, history, hooks, Git output, and Agent output are untrusted. Constraints remain text and never become shell or Git argv. `display: false` only suppresses TUI rendering; custom message content still enters the LLM context and may remain in local Pi session data or exports. The Git core provides a deterministic safety boundary only for its standalone push operation, not for Agent-driven commit planning or index mutation.

## Threats and mitigations

- **Prompt injection, model deviation, or broad tool permissions:** Prompts constrain authorization, current worktree, exact paths, and destructive Git. Commit never pushes; push-capable commands reject protected destinations and stop when evidence is insufficient. Pi tools, shells, hooks, and external processes still have local-user privileges, so this must not be described as a sandbox.
- **Accidental inclusion, mixed index, or cross-worktree writes:** Best-effort grouping is allowed only with a clean index and unstaged/untracked whole-file candidates. Staged or mixed state, unclear scope, submodules/nested repositories, obvious secrets/private keys, and unsafe/generated content stop mutation. Files requiring hunk splitting remain uncommitted rather than blocking unrelated safe groups.
- **Argument, argv, or path injection:** Handlers do not execute constraints; they insert them only into a clearly delimited prompt location. The standalone push core uses direct argv and validated configured upstream/refspec values.
- **TOCTOU:** Prompts require drift and staged-membership checks before every mutation. This is behavioral rather than a lock. The standalone push core revalidates repository, HEAD, branch, upstream, remote identity, and refspec fingerprints after preview.
- **Secrets, private keys, generated files, and unsafe repository state:** The Agent must identify risk rather than blindly read or commit it, and must stop when evidence is insufficient. Conventional project PNG files are evaluated by exact path, name, repository role, and feature relationship rather than rejected solely because they are binary.
- **Hooks and interruption:** Hooks run normally. Failure, cancellation, or partial work stops the workflow, preserves completed commits, and reports status without automatic repair. A disrupted push can have an unknown remote result and requires manual inspection.
- **One-command risk:** Normal success reports only SHAs/messages, not a plan or path list. The prompt requires quiet inspection, exact-path staging, and safe preservation of ambiguous paths. Real acceptance must prove that the Agent did not show a plan first, require an extra confirmation, use broad commands, or absorb existing staged/mixed content.
- **Hidden-message visibility:** `display: false` is not secrecy, deletion, encryption, or export exclusion. The handler does not copy prompt text, constraints, Git data, or credentials into details, notifications, or logs.
- **Non-interactive bypass:** All three workflows fail closed in non-TUI, missing-UI, busy-Agent, prompt-read-failure, or send-failure cases. Push-capable commands additionally require confirmation. There is no approval token, timer, watcher, or model-callable write tool.
- **Push escalation or credential exposure:** Push prompts prohibit protected destinations, force, configuration changes, ref/tag deletion, and automatic retries. The standalone core maintains configured-upstream, non-force, no-retry, protected-destination rejection, terminal-prompt disabling, and redacted public URL/errors. Credential helpers, SSH, transport, and server policy cannot be sandboxed by this plugin.

## Outstanding verification

Unit tests cover command registration, idle/non-TUI/read/send gates, front matter and constraint injection, exact custom-message shapes, confirmation boundaries, prompt safety clauses, and local-bare drift-safe standalone pushes. Release-candidate checks cover TypeScript, lint, workspace builds, and tarball file lists.

A real Pi TUI in an authorized disposable repository must still record semantic multi-commit behavior, quiet success, no-change, staged/mixed safe stops, drift, hook partial success, narrow terminals, commit without automatic push, confirmed feature-branch commit-push, confirmed commit-push-PR, and standalone local-bare push behavior. Never test against the development checkout or a live remote. If the TTY/model is unavailable or any Agent behavior violates the prompt, keep the work blocked.
