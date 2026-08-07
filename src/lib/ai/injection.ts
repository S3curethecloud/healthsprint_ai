export interface PromptInjectionResult {
  detected: boolean;
  indicators: string[];
}

const PROMPT_INJECTION_PATTERNS: ReadonlyArray<{
  id: string;
  pattern: RegExp;
}> = [
  {
    id: "ignore_instructions",
    pattern:
      /\b(ignore|disregard|forget)\b.{0,40}\b(previous|prior|system|developer|instructions?)\b/i,
  },
  {
    id: "reveal_system_prompt",
    pattern:
      /\b(reveal|show|print|repeat|dump|expose)\b.{0,40}\b(system|developer|hidden)\b.{0,20}\b(prompt|instructions?)\b/i,
  },
  {
    id: "policy_bypass",
    pattern:
      /\b(bypass|override|disable|circumvent)\b.{0,40}\b(policy|guardrails?|safety|restrictions?)\b/i,
  },
  {
    id: "role_override",
    pattern:
      /\b(you are now|act as|pretend to be)\b.{0,50}\b(unrestricted|unfiltered|developer|system|admin)\b/i,
  },
  {
    id: "secret_extraction",
    pattern:
      /\b(reveal|show|print|dump|give me)\b.{0,40}\b(secret|token|credential|api key|binding|environment variable)\b/i,
  },
  {
    id: "health_connect_autonomous_action",
    pattern:
      /\b(automatically|without confirmation|silently)\b.{0,60}\b(write|modify|delete|update)\b.{0,40}\b(health connect|health record|weight|exercise)\b/i,
  },
];

export function detectPromptInjection(
  text: string | undefined,
): PromptInjectionResult {
  if (!text) {
    return {
      detected: false,
      indicators: [],
    };
  }

  const indicators = PROMPT_INJECTION_PATTERNS
    .filter(({ pattern }) => pattern.test(text))
    .map(({ id }) => id);

  return {
    detected: indicators.length > 0,
    indicators,
  };
}
