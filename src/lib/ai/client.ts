import {
  AI_CONTRACT_VERSION,
  type AiCoachingRequest,
  type AiCoachingResponse,
} from "./contracts";

export interface DailySummaryInput {
  calorieTarget: number;
  caloriesConsumed: number;
  proteinGrams: number;
  carbohydrateGrams: number;
  fatGrams: number;
  hydrationOunces: number;
  steps: number;
  latestWeightPounds?: number;
}

export async function requestDailyAiSummary(
  input: DailySummaryInput,
): Promise<AiCoachingResponse> {
  const request: AiCoachingRequest = {
    version: AI_CONTRACT_VERSION,
    requestId: crypto.randomUUID(),
    intent: "daily_summary",
    context: {
      calorieTarget: input.calorieTarget,
      caloriesConsumed: input.caloriesConsumed,
      proteinGrams: input.proteinGrams,
      carbohydrateGrams:
        input.carbohydrateGrams,
      fatGrams: input.fatGrams,
      hydrationOunces:
        input.hydrationOunces,
      steps: input.steps,
      ...(input.latestWeightPounds !== undefined
        ? {
            latestWeightPounds:
              input.latestWeightPounds,
          }
        : {}),
    },
  };

  const response = await fetch(
    "/api/ai/coaching",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
      body: JSON.stringify(request),
    },
  );

  const payload =
    (await response.json()) as AiCoachingResponse;

  return payload;
}

export interface MealGuidanceInput {
  calorieTarget: number;
  caloriesConsumed: number;
  proteinGrams: number;
  carbohydrateGrams: number;
  fatGrams: number;
}

export async function requestMealAiGuidance(
  input: MealGuidanceInput,
): Promise<AiCoachingResponse> {
  const request: AiCoachingRequest = {
    version: AI_CONTRACT_VERSION,
    requestId: crypto.randomUUID(),
    intent: "meal_guidance",
    context: {
      calorieTarget: input.calorieTarget,
      caloriesConsumed: input.caloriesConsumed,
      proteinGrams: input.proteinGrams,
      carbohydrateGrams:
        input.carbohydrateGrams,
      fatGrams: input.fatGrams,
    },
  };

  const response = await fetch(
    "/api/ai/coaching",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
      body: JSON.stringify(request),
    },
  );

  return (await response.json()) as AiCoachingResponse;
}

export interface ActivityGuidanceInput {
  steps: number;
  activityMinutes?: number;
}

export async function requestActivityAiGuidance(
  input: ActivityGuidanceInput,
): Promise<AiCoachingResponse> {
  const request: AiCoachingRequest = {
    version: AI_CONTRACT_VERSION,
    requestId: crypto.randomUUID(),
    intent: "activity_guidance",
    context: {
      steps: input.steps,
      ...(input.activityMinutes !== undefined
        ? {
            activityMinutes:
              input.activityMinutes,
          }
        : {}),
    },
  };

  const response = await fetch(
    "/api/ai/coaching",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
      body: JSON.stringify(request),
    },
  );

  return (await response.json()) as AiCoachingResponse;
}

export interface HydrationGuidanceInput {
  hydrationOunces: number;
}

export async function requestHydrationAiGuidance(
  input: HydrationGuidanceInput,
): Promise<AiCoachingResponse> {
  const request: AiCoachingRequest = {
    version: AI_CONTRACT_VERSION,
    requestId: crypto.randomUUID(),
    intent: "hydration_guidance",
    context: {
      hydrationOunces:
        input.hydrationOunces,
    },
  };

  const response = await fetch(
    "/api/ai/coaching",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
      body: JSON.stringify(request),
    },
  );

  return (await response.json()) as AiCoachingResponse;
}

export interface CalculationExplanationInput {
  calorieTarget: number;
  caloriesConsumed: number;
  proteinGrams: number;
  carbohydrateGrams: number;
  fatGrams: number;
}

export async function requestCalculationAiExplanation(
  input: CalculationExplanationInput,
): Promise<AiCoachingResponse> {
  const request: AiCoachingRequest = {
    version: AI_CONTRACT_VERSION,
    requestId: crypto.randomUUID(),
    intent: "calculation_explanation",
    context: {
      calorieTarget: input.calorieTarget,
      caloriesConsumed: input.caloriesConsumed,
      proteinGrams: input.proteinGrams,
      carbohydrateGrams:
        input.carbohydrateGrams,
      fatGrams: input.fatGrams,
    },
  };

  const response = await fetch(
    "/api/ai/coaching",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
      body: JSON.stringify(request),
    },
  );

  return (await response.json()) as AiCoachingResponse;
}
