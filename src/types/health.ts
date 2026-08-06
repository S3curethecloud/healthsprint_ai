export type MealType = "Breakfast" | "Lunch" | "Snack" | "Dinner";

export type MealItem = {
  id: string;
  name: string;
  mealType: MealType;
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
};

export type DailyMetrics = {
  waterOunces: number;
  steps: number;
  weight: number;
  workoutCompleted: boolean;
};

export type HealthSprintState = {
  currentDay: number;
  calorieTarget: number;
  selectedMealIds: string[];
  customMeals: MealItem[];
  metrics: DailyMetrics;
};
