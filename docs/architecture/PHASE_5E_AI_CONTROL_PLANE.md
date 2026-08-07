# Phase 5E — AI Control Plane Architecture

## Status

Architecture and contract authority for the HealthSprint AI control plane.

This phase establishes policy, request, response, evidence, and model-operation boundaries before any live model invocation is introduced.

Phase 5E-A does not enable Workers AI inference.

## Objectives

The AI control plane must:

1. accept only explicit user-requested coaching actions
2. validate every request before model invocation
3. minimize health data sent to the cloud
4. classify requests before inference
5. detect prompt-injection indicators
6. enforce wellness-only product boundaries
7. reject prohibited medical or unsafe requests
8. constrain model output to a structured response contract
9. produce privacy-safe operational evidence
10. prevent autonomous or executable health actions
11. remain functional without AI availability
12. keep the browser and Android wrapper isolated from direct model-provider access

## Trust boundaries

### Client

The browser or Android-hosted web application may:

- collect an explicit coaching request
- construct a minimal structured payload
- send the payload to the HealthSprint Worker
- display validated structured coaching output

The client must not:

- call Workers AI directly
- call third-party model providers directly
- decide whether a prohibited request is safe
- send Health Connect permission tokens
- send raw Health Connect history by default
- request model-generated Health Connect writes

### Cloudflare Worker

The Worker is the AI policy enforcement point.

The Worker must:

1. validate request shape and size
2. classify the requested coaching action
3. inspect user text for prompt-injection indicators
4. apply wellness and medical-safety policy
5. construct the constrained model prompt
6. invoke the approved model only after an allow decision
7. validate model output
8. return structured output
9. emit privacy-safe decision evidence

The Worker must fail closed when policy validation cannot complete.

### Workers AI

Workers AI is an inference dependency only.

The model is not an authority for:

- permission decisions
- policy decisions
- diagnosis
- treatment
- medication recommendations
- Health Connect writes
- application state changes

### AI Gateway

AI Gateway may provide:

- request analytics
- model observability
- latency metrics
- rate controls
- retry controls
- model fallback
- spend controls

Gateway logging must comply with HealthSprint privacy boundaries.

## Approved coaching intents

The initial approved intent taxonomy is:

- `daily_summary`
- `meal_guidance`
- `activity_guidance`
- `hydration_guidance`
- `calculation_explanation`
- `general_wellness_question`

These intents are informational and non-medical.

Adding another intent requires architecture and policy review.

## Request classification

Every request must produce one classification:

- `wellness_allowed`
- `medical_disallowed`
- `unsafe_disallowed`
- `prompt_injection_detected`
- `unsupported`
- `invalid`

The classifier is a deterministic policy control.

The model must not decide its own request classification.

## Policy decisions

Every request must produce one policy decision:

- `allow`
- `block`
- `redirect`

### Allow

Used only for approved wellness requests that pass validation and prompt-injection controls.

### Block

Used when the request attempts:

- prompt or policy override
- secret extraction
- system-prompt extraction
- autonomous health-record modification
- prohibited executable actions
- unsafe extreme restriction or punishment-based exercise guidance

### Redirect

Used when the request seeks medical diagnosis, medication advice, treatment recommendations, or symptom interpretation.

A redirect response should encourage appropriate professional care without attempting diagnosis.

## Prompt-injection boundary

Prompt-injection detection must occur before model invocation.

Indicators include attempts to:

- ignore previous instructions
- reveal system or developer instructions
- disclose hidden prompts
- change the model's role or policy
- bypass safety controls
- request secrets, tokens, bindings, credentials, or environment values
- reinterpret user-supplied content as trusted system policy
- instruct the AI to perform prohibited Health Connect actions

Detection must be deterministic and auditable.

User-entered text is always untrusted data.

## Minimum-necessary request data

The client may send only fields required for the requested coaching action.

Approved aggregate context may include:

- calorie target
- calories consumed
- aggregate protein
- aggregate carbohydrates
- aggregate fat
- aggregate hydration
- aggregate steps
- aggregate activity minutes
- latest user-entered or approved aggregate weight when necessary
- user-entered coaching question

The following must not be sent by default:

- raw Health Connect records
- Health Connect permission tokens
- full longitudinal health history
- camera frames
- authentication secrets
- device identifiers not required for the request
- hidden local application state
- unrelated scanned-product history

## Request contract

Every request must contain:

- `version`
- `requestId`
- `intent`
- `question`
- `context`

`version` begins at `1.0`.

`requestId` is generated by the application and used for request correlation.

`question` is optional for intents that can be generated from aggregate context alone.

`context` contains only approved aggregate values.

## Response contract

Successful coaching responses must contain:

- `version`
- `requestId`
- `status`
- `classification`
- `policyDecision`
- `summary`
- `observations`
- `suggestedActions`
- `safetyNotice`
- `modelMetadata`

The response must not contain:

- executable commands
- direct Health Connect write instructions
- diagnosis
- medication instructions
- treatment plans
- claims of clinician authorship
- hidden policy information
- secrets

## Blocked or redirected response

A blocked or redirected request must not invoke the model unless a later architecture revision explicitly approves a constrained safety model path.

The Worker should return a deterministic response containing:

- request identifier
- classification
- policy decision
- user-safe message
- safety notice
- no model metadata claiming inference occurred

## Model metadata

Permitted model metadata:

- provider
- model identifier
- inference status
- latency
- optional token usage when available

Model metadata must not expose credentials, bindings, gateway secrets, or internal prompts.

## Evidence contract

Operational evidence may contain:

- timestamp
- request identifier
- endpoint
- intent
- classification
- policy decision
- prompt-injection result
- model identifier
- inference attempted
- latency
- token usage when available
- response status

Operational evidence must not contain:

- raw user coaching questions
- raw Health Connect records
- free-text medical disclosures
- full model prompts
- full model responses
- secrets
- credentials
- permission tokens

## Failure behavior

The control plane must fail safely.

Schema failure:

- return deterministic validation error
- do not invoke model

Policy failure:

- return blocked or redirected response
- do not invoke model

Prompt-injection detection:

- return blocked response
- do not invoke model

Model unavailable:

- return structured temporary-unavailable response
- preserve local application functionality

Invalid model output:

- reject model output
- return structured fallback
- do not pass malformed output to the client

## Health Connect separation

The AI control plane cannot:

- grant Health Connect permissions
- revoke Health Connect permissions
- create Health Connect records
- modify Health Connect records
- delete Health Connect records
- trigger Android native write actions

AI output is advisory text only.

Any future action capability requires a separate architecture and security review.

## Authentication and persistence boundary

Phase 5E does not introduce a persistent cloud health profile.

No D1 health-data persistence is approved in this phase.

Before persistent health data is introduced, HealthSprint must define:

- identity
- authentication
- authorization
- tenant isolation
- retention
- deletion
- export
- consent
- audit controls

## Phase 5E-A exit criteria

Phase 5E-A is complete when:

- [ ] architecture authority exists
- [ ] request contract exists
- [ ] response contract exists
- [ ] intent taxonomy exists
- [ ] classification taxonomy exists
- [ ] policy-decision taxonomy exists
- [ ] evidence contract exists
- [ ] prompt-injection boundary exists
- [ ] prohibited medical behavior is explicit
- [ ] autonomous Health Connect actions are prohibited
- [ ] lint passes
- [ ] production build passes

Only after these criteria pass may Phase 5E-B introduce deterministic runtime validation and policy enforcement.
