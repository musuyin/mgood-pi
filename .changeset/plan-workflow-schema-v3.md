---
"@mgood-pi/plan-workflow-core": major
"@mgood-pi/plugin-plan-workflow": major
---

Replace the repository-managed workflow with breaking Schema v5 local Plan Workflow. Expose only TUI-only `/mgood:plan`; store mutable local state solely in `tmp/work-plans/<feature>/{PLAN.md,REVIEW.md}`. Remove Work Plans, phases, approvals, supersession, immutable remediation reviews, and all runtime scanning of repository-root `work-plans/`. Internal guidance remains hidden custom session context rather than public prompt commands.
