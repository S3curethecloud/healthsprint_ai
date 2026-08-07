import assert from "node:assert/strict";
import test from "node:test";

import {
  validateStructuredAiOutput,
} from "./structured-output";

function validOutput() {
  return {
    summary:
      "You are making steady progress today.",
    observations: [
      "Hydration is below your daily target.",
      "Activity is progressing normally.",
    ],
    suggestedActions: [
      "Drink another glass of water.",
      "Continue with your planned activity.",
    ],
    safetyNotice:
      "HealthSprint provides general wellness guidance, not medical advice.",
  };
}

test(
  "accepts valid structured coaching output",
  () => {
    const result =
      validateStructuredAiOutput(validOutput());

    assert.equal(result.valid, true);
    assert.deepEqual(
      result.output,
      validOutput(),
    );
  },
);

test(
  "rejects non-object model output",
  () => {
    const result =
      validateStructuredAiOutput(
        "unstructured response",
      );

    assert.equal(result.valid, false);
  },
);

test(
  "rejects missing required fields",
  () => {
    const output = validOutput();

    const incomplete = {
      summary: output.summary,
      observations: output.observations,
      suggestedActions: output.suggestedActions,
    };

    const result =
      validateStructuredAiOutput(incomplete);

    assert.equal(result.valid, false);
  },
);

test(
  "rejects unknown output fields",
  () => {
    const result =
      validateStructuredAiOutput({
        ...validOutput(),
        diagnosis: "not permitted",
      });

    assert.equal(result.valid, false);
    assert.equal(
      result.reasons.some(
        (reason) =>
          reason.includes(
            "unsupported model output field",
          ),
      ),
      true,
    );
  },
);

test(
  "rejects excessive suggested actions",
  () => {
    const result =
      validateStructuredAiOutput({
        ...validOutput(),
        suggestedActions: [
          "one",
          "two",
          "three",
          "four",
          "five",
          "six",
        ],
      });

    assert.equal(result.valid, false);
  },
);

test(
  "rejects empty text values",
  () => {
    const result =
      validateStructuredAiOutput({
        ...validOutput(),
        summary: "   ",
      });

    assert.equal(result.valid, false);
  },
);
