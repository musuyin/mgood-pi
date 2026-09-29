import { createHash } from "node:crypto";

import { GitError } from "./contracts.js";

const REF_COMPONENT = /^[A-Za-z0-9][A-Za-z0-9._/-]*$/u;

function isControlCharacter(value: string): boolean {
  return [...value].some((character) => {
    const codePoint = character.codePointAt(0) ?? 0;
    return codePoint <= 0x1f || codePoint === 0x7f;
  });
}

export function validateCommitMessage(message: string): string {
  if (message.includes("\0") || message.trim().length === 0) {
    throw new GitError(
      "invalid-input",
      "A non-empty commit message is required.",
      "Run /mgood:git-commit <message> with a non-blank message.",
    );
  }

  return message;
}

export function validateRef(value: string, label: string): string {
  if (
    value.length === 0 ||
    value.startsWith("-") ||
    isControlCharacter(value) ||
    !REF_COMPONENT.test(value) ||
    value.includes("..") ||
    value.endsWith(".") ||
    value.endsWith("/") ||
    value.includes("//")
  ) {
    throw new GitError(
      "policy-rejected",
      `The ${label} is not a safe Git ref value.`,
      "Correct the branch upstream configuration and run the command again.",
    );
  }

  return value;
}

export function makeFingerprint(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

export function escapeForPreview(value: string): string {
  return [...value]
    .map((character) => {
      const codePoint = character.codePointAt(0) ?? 0;
      return codePoint <= 0x1f || codePoint === 0x7f
        ? `\\u${codePoint.toString(16).padStart(4, "0")}`
        : character;
    })
    .join("");
}

export function redact(value: string): string {
  return value
    .replace(/([a-z][a-z0-9+.-]*:\/\/)([^\s/@:]+):([^\s/@]+)@/giu, "$1***:***@")
    .replace(/(https?:\/\/)(?!\*\*\*:)[^\s/@]+@/giu, "$1***@");
}
