# HealthSprint AI Phase 5 Architecture

## Status

Phase 5 architecture authority.

This document defines the approved boundaries for:

- Android application packaging
- Health Connect integration
- Cloudflare-hosted AI capabilities
- Health-data privacy
- AI safety and evidence
- synchronization between local, native, and cloud layers

Phase 5 implementation must not begin outside these boundaries.

## Phase 5 objectives

1. Package HealthSprint AI as an Android application.
2. Integrate Android Health Connect using explicit user permission.
3. Preserve local-first operation when cloud or Health Connect services are unavailable.
4. Add constrained AI coaching through Cloudflare Workers AI.
5. Prevent the AI layer from functioning as a medical device or diagnostic system.
6. Keep health data collection proportional to product requirements.
7. Provide auditable API, permission, and model-operation evidence.

## System layers

### Web application

The existing Next.js application remains the primary user interface.

Responsibilities:

- meal planning
- barcode scanning
- serving confirmation
- local calorie and macro tracking
- hydration, activity, weight, and program progress
- PWA and offline behavior

The web application must not call Health Connect directly.

### Android wrapper

The Android application provides the native bridge.

Responsibilities:

- WebView or native-shell hosting
- Health Connect availability checks
- Health Connect permission requests
- reading approved records
- writing approved records only after explicit user action
- secure communication with the embedded HealthSprint application
- lifecycle and foreground handling

The Android bridge must reject unknown message types and malformed payloads.

### Health Connect

Health Connect is the device-controlled health datastore.

Initially approved read types:

- StepsRecord
- WeightRecord
- ExerciseSessionRecord
- ActiveCaloriesBurnedRecord
- TotalCaloriesBurnedRecord

Initially approved write types:

- WeightRecord
- ExerciseSessionRecord

Nutrition records are excluded from the initial integration.

Additional record types require a separate architecture and privacy review.

### Cloudflare Worker

The existing OpenNext Worker remains the application backend.

Phase 5 responsibilities may include:

- authenticated application APIs
- AI request validation
- prompt construction
- model routing
- response validation
- safety filtering
- request and decision evidence
- rate limiting
- usage controls

Health Connect permission tokens must never be transmitted to Cloudflare.

### Workers AI and AI Gateway

Workers AI provides model inference.

AI Gateway provides:

- analytics
- request logging
- rate limiting
- retries
- model fallback
- spend controls

The browser and Android application must not call a model provider directly.

## Data ownership

### Device-local data

The following remain local by default:

- meal selections
- custom foods
- hydration
- weight
- steps
- workout completion
- scanned-product history
- Health Connect records

### Cloud-bound data

Only the minimum input required for an explicitly requested AI action may be sent to the Worker.

Examples:

- current calorie target
- current calories consumed
- aggregate macros
- aggregate steps
- aggregate hydration
- user-entered coaching question

Raw Health Connect records must not be uploaded by default.

## Health Connect permission principles

- Request permissions only when the user enables Health Connect.
- Explain every requested record type before launching the system permission screen.
- Separate read and write permissions.
- Continue functioning when permission is denied.
- Detect revoked permissions.
- Never repeatedly pressure the user to grant access.
- Provide a clear disconnect action.
- Do not infer permission from prior application state.
- Do not access Health Connect from background execution unless separately approved.

## Health Connect synchronization rules

1. The user selects the synchronization direction.
2. Device records take precedence over cloud-derived assumptions.
3. Duplicate records must be detected using stable source identifiers and timestamps.
4. Imported records must retain source attribution.
5. HealthSprint must not silently overwrite a Health Connect record.
6. Failed synchronization must not erase local state.
7. Synchronization must be idempotent.
8. Conflict resolution must be visible to the user.

## AI feature boundary

Initially approved AI use cases:

- explain daily calorie and macro progress
- summarize the user's logged day
- suggest non-medical meal-planning adjustments
- suggest general activity and hydration reminders
- explain how HealthSprint calculations were derived

Prohibited AI behavior:

- diagnosis
- medication advice
- treatment recommendations
- interpretation of symptoms as a medical condition
- extreme calorie restriction
- punishment-based exercise guidance
- false claims that generated text came from a clinician
- autonomous modification of health records
- automatic Health Connect writes
- hidden personalization using health data

## AI request flow

1. User explicitly requests coaching.
2. Client constructs a minimal structured request.
3. Worker validates schema and size.
4. Worker classifies the request.
5. Medical or unsafe requests are blocked or redirected.
6. Worker builds a constrained system prompt.
7. Worker invokes Workers AI through the AI binding.
8. AI Gateway applies observability and usage controls.
9. Worker validates the model response.
10. Worker returns structured coaching output.
11. The client labels the response as AI-generated guidance.

## AI response contract

Every coaching response must contain:

- summary
- observations
- suggestedActions
- safetyNotice
- modelMetadata

The response must not contain executable actions or direct Health Connect write instructions.

## Authentication boundary

Phase 5A does not introduce user accounts.

Before cloud persistence or cross-device synchronization is added, the project must define:

- user identity provider
- session management
- token lifecycle
- account deletion
- data export
- tenant isolation
- authorization policy

No persistent personal health profile may be stored in Cloudflare without this control plane.

## Cloudflare bindings

Phase 5 may introduce:

- `AI` for Workers AI
- AI Gateway configuration
- rate limiting
- optional D1 only after identity and data-retention design approval

Phase 5A must not create D1 health-data tables.

## Logging and evidence

Logs may include:

- request identifier
- endpoint
- request classification
- policy decision
- model identifier
- latency
- token usage
- response status

Logs must not include:

- raw Health Connect records
- full health-history payloads
- camera frames
- barcodes unless operationally required
- free-text medical disclosures
- secrets or permission tokens

## Android repository structure

The Android wrapper will live under:

```text
android/
  app/
  build.gradle.kts
  settings.gradle.kts
  gradle.properties
  README.md

The existing Next.js application remains at the repository root.

Native bridge contract

Approved message namespaces:

healthConnect.status
healthConnect.permissions
healthConnect.readSummary
healthConnect.writeWeight
healthConnect.writeExercise
app.version
app.openSettings

Each message must contain:

version
requestId
action
payload

Every response must contain:

requestId
status
data or error
Phase gates
Phase 5A
architecture authority
privacy boundary
native bridge contract
Health Connect record scope
AI feature boundary
Cloudflare binding plan
Phase 5B
Android project scaffold
Android WebView or shell
navigation and lifecycle
no Health Connect record access yet
Phase 5C
availability detection
permission UX
read-only aggregate synchronization
no cloud health-data upload
Phase 5D
controlled writes
source attribution
duplicate prevention
conflict handling
Phase 5E
Workers AI binding
AI request schema
policy validation
AI Gateway controls
no autonomous actions
Phase 5F
user-facing coaching
model-response validation
safety evaluation
accessibility and offline fallback
Phase 5G
Android validation
Health Connect Toolbox testing
AI safety testing
Cloudflare preview and production deployment
privacy and release evidence
