# Phase 5E — AI Gateway Controls

## Status

HealthSprint AI Gateway control-plane configuration for Phase 5E.

Gateway ID:

- `healthsprint-ai`

## Purpose

The AI Gateway provides centralized controls around approved Workers AI inference after deterministic HealthSprint policy enforcement.

The Gateway is not a policy authority.

HealthSprint application policy remains authoritative for:

- request validation
- wellness-only classification
- prompt-injection detection
- medical and unsafe request blocking
- inference authorization
- structured model-output validation

## Gateway configuration

### Request routing

Approved inference is routed through:

- Gateway ID: `healthsprint-ai`
- provider: Cloudflare Workers AI
- application binding: `AI`
- response cache bypass: enabled per request

### Rate control

Configured Gateway rate limit:

- maximum requests: 10
- window: 1 minute
- technique: sliding
- scope: gateway-wide

This is a control-plane safeguard against excessive request volume and uncontrolled inference usage.

### Spend control

Configured Gateway spend limit:

- cost limit: USD 1.00
- window: 1 day
- technique: sliding
- scope: gateway-wide
- provider dimension: unrestricted
- model dimension: unrestricted
- metadata dimension: unrestricted

The spend limit is intentionally conservative for Phase 5 validation.

## Privacy controls

### Gateway payload logging

Gateway request and response payload collection is disabled.

HealthSprint must not persist Gateway payloads containing:

- user coaching questions
- model prompts
- model responses
- raw Health Connect records
- free-text medical disclosures
- credentials
- permission tokens

### Application evidence

Privacy-safe application evidence may contain:

- timestamp
- request ID
- endpoint
- intent
- classification
- policy decision
- prompt-injection result
- inference attempted
- Gateway ID
- model identifier
- latency
- token usage when available
- response status

Application evidence must not contain:

- raw user questions
- raw Health Connect records
- full prompts
- full model responses
- secrets
- credentials
- permission tokens

## Reliability controls

For Phase 5 validation:

- Gateway response cache remains disabled
- automatic Gateway retries remain disabled
- model fallback is not enabled
- Gateway authentication remains enabled
- Workers AI binding requests are authenticated through the Worker environment

These settings preserve deterministic failure behavior during validation.

## Failure behavior

Gateway or Workers AI failures must return a controlled HealthSprint temporary-unavailable response.

Rate-limit or spend-limit enforcement must not bypass HealthSprint policy.

Blocked, redirected, unsupported, invalid, unsafe, or prompt-injection requests must not invoke Workers AI.

## Change control

Any change to the following requires architecture and security review:

- Gateway ID
- rate-limit threshold
- rate-limit window or technique
- spend-limit amount
- spend-limit window
- Gateway payload logging
- cache behavior
- retry behavior
- model fallback
- provider routing
- authentication requirements
