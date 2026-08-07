import type {
  AiClassification,
  AiCoachingRequest,
} from "./contracts";
import type { PromptInjectionResult } from "./injection";

const MEDICAL_PATTERNS = [
  /\bdiagnos(e|is|ing)\b/i,
  /\bwhat condition do i have\b/i,
  /\bwhat disease do i have\b/i,
  /\bmedication\b/i,
  /\bmedicine\b/i,
  /\bdosage\b/i,
  /\bprescri(be|ption)\b/i,
  /\btreatment\b/i,
  /\bdo these symptoms mean\b/i,
  /\bwhat do my symptoms mean\b/i,
];

const UNSAFE_PATTERNS = [
  /\bstarv(e|ed|ing)\b/i,
  /\bstop eating\b/i,
  /\beat nothing\b/i,
  /\bextreme calorie restriction\b/i,
  /\bpunish(ment)? exercise\b/i,
  /\bexercise until (i|you) collapse\b/i,
  /\bwork out until (i|you) pass out\b/i,
];

function matchesAny(
  value: string,
  patterns: readonly RegExp[],
): boolean {
  return patterns.some((pattern) => pattern.test(value));
}

export function classifyAiRequest(
  request: AiCoachingRequest,
  injection: PromptInjectionResult,
): AiClassification {
  if (injection.detected) {
    return "prompt_injection_detected";
  }

  const question = request.question?.trim() ?? "";

  if (matchesAny(question, MEDICAL_PATTERNS)) {
    return "medical_disallowed";
  }

  if (matchesAny(question, UNSAFE_PATTERNS)) {
    return "unsafe_disallowed";
  }

  return "wellness_allowed";
}
