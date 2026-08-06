# HealthSprint AI Coaching Contract

## Request

```json
{
  "version": "1.0",
  "requestId": "uuid",
  "intent": "daily-summary",
  "question": "How am I doing today?",
  "context": {
    "calorieTarget": 2100,
    "caloriesConsumed": 1650,
    "proteinGrams": 120,
    "carbohydrateGrams": 170,
    "fatGrams": 55,
    "waterOunces": 64,
    "steps": 7200
  }
}
Approved intents
daily-summary
meal-planning
activity-summary
hydration-summary
calculation-explanation
Response
{
  "version": "1.0",
  "requestId": "uuid",
  "status": "success",
  "result": {
    "summary": "You are within your planned range.",
    "observations": [],
    "suggestedActions": [],
    "safetyNotice": "General wellness guidance only.",
    "modelMetadata": {
      "provider": "cloudflare-workers-ai",
      "model": "configured-server-side",
      "generatedAt": "ISO-8601 timestamp"
    }
  }
}
Request restrictions
Maximum question length: 1000 characters
No raw medical documents
No images
No medication list
No diagnosis field
No unrestricted Health Connect history
No hidden client-supplied system prompt
No client-selected model
Safety classifications
allowed-wellness
medical-advice
self-harm
eating-disorder-risk
prompt-injection
unsupported-request

Only allowed-wellness proceeds to model inference.

Response restrictions

The model response must:

remain within general wellness
avoid certainty about health outcomes
avoid medical diagnosis
avoid medication recommendations
avoid extreme restriction
avoid punitive exercise
encourage professional care when appropriate
disclose that the content is AI-generated
