# @mgood-pi/git

Framework-neutral configured-upstream push safety core for `@mgood-pi/plugin-git`. Requires Node.js 22+ and Git on `PATH`; normal users install the plugin, not this package.

The package preserves only the independent push contract: inspect the invocation worktree, derive the current attached branch's configured upstream and exact fully-qualified refspec, reject protected destination branches named `main`, `master`, `dev`, or `develop` (case-insensitive), create a redacted preview/fingerprint, revalidate immediately before direct-argv execution, and report safe remediation on failure. It does not publish commit planning, batching, commit-message validation, or commit execution APIs. `/mgood:git-commit` is deliberately an Agent-driven workflow owned by the plugin's private Prompt, not a core guarantee.

All Git processes use direct argv, explicit cwd, `GIT_TERMINAL_PROMPT=0`, output/time limits, optional `AbortSignal`, and redacted user-facing diagnostics. The library does not sandbox hooks, credential helpers, transports, external processes, or server policy.

Development:

```bash
npm test --workspace @mgood-pi/git
npm run build --workspace @mgood-pi/git
```

See the root README and [`docs/plugin-contracts/git-commands.md`](../../docs/plugin-contracts/git-commands.md).
