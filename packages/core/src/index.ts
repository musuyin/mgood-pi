export const KIT_NAME = "mgood-pi";

export const INIT_COMMAND = "mgood:init";

export interface InitFile {
  readonly path: string;
  readonly purpose: string;
}

export const INITIAL_PROJECT_FILES: readonly InitFile[] = [
  {
    path: "AGENTS.md",
    purpose: "Project instructions discovered automatically by Pi.",
  },
  {
    path: ".pi/extensions/",
    purpose: "Project-local Pi extensions.",
  },
  {
    path: ".pi/skills/",
    purpose: "Project-local reusable Agent Skills.",
  },
] as const;

export function createInitSummary(cwd: string): string {
  const files = INITIAL_PROJECT_FILES.map((file) => `- ${file.path}: ${file.purpose}`).join("\n");

  return [`${KIT_NAME} project bootstrap is ready for ${cwd}.`, "", "Planned files:", files].join(
    "\n",
  );
}
