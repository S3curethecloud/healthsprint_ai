"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

import DailyAiSummaryPanel from "@/components/ai/DailyAiSummaryPanel";
import MealAiGuidancePanel from "@/components/ai/MealAiGuidancePanel";
import DailyOverview from "@/components/dashboard/DailyOverview";
import HealthConnectConnectionPanel from "@/components/health-connect/HealthConnectConnectionPanel";
import HealthConnectSummaryPanel from "@/components/health-connect/HealthConnectSummaryPanel";
import HealthConnectWritePanel from "@/components/health-connect/HealthConnectWritePanel";
import MobileNavigation from "@/components/navigation/MobileNavigation";
import BarcodeScanner from "@/components/scanner/BarcodeScanner";
import ProductLookup from "@/components/scanner/ProductLookup";
import ServingConfirmation, {
  type ConfirmedScannedMeal,
} from "@/components/scanner/ServingConfirmation";
import ApplicationTopBar from "@/components/shell/ApplicationTopBar";
import DesktopNavigation from "@/components/shell/DesktopNavigation";
import { dayOneMeals, dayOneWorkout } from "@/data/day-one-plan";
import type {
  HealthSprintState,
  MealItem,
  MealType,
} from "@/types/health";
import type { ScannedProduct } from "@/types/product";

const STORAGE_KEY = "healthsprint-ai-state-v1";

const defaultState: HealthSprintState = {
  currentDay: 1,
  calorieTarget: 2100,
  selectedMealIds: [],
  customMeals: [],
  metrics: {
    waterOunces: 0,
    steps: 0,
    weight: 245,
    workoutCompleted: false,
  },
};

const mealTypes: MealType[] = [
  "Breakfast",
  "Lunch",
  "Snack",
  "Dinner",
];

function round(value: number) {
  return Math.round(value * 10) / 10;
}

export default function HealthDashboard() {
  const [state, setState] = useState<HealthSprintState>(defaultState);
  const [isLoaded, setIsLoaded] = useState(false);
  const [collapsedMealTypes, setCollapsedMealTypes] = useState<
    Set<MealType>
  >(new Set());

  const [scannedBarcode, setScannedBarcode] = useState("");
  const [scannedProduct, setScannedProduct] =
    useState<ScannedProduct | null>(null);
  const [scannedMealMessage, setScannedMealMessage] =
    useState("");
  const [customMealName, setCustomMealName] = useState("");
  const [customMealType, setCustomMealType] =
    useState<MealType>("Breakfast");
  const [customMealCalories, setCustomMealCalories] = useState("");
  const [customMealProtein, setCustomMealProtein] = useState("");
  const [customMealCarbs, setCustomMealCarbs] = useState("");
  const [customMealFat, setCustomMealFat] = useState("");

  useEffect(() => {
    const loadSavedState = window.setTimeout(() => {
      try {
        const savedState = window.localStorage.getItem(STORAGE_KEY);

        if (savedState) {
          setState(JSON.parse(savedState) as HealthSprintState);
        }
      } catch {
        window.localStorage.removeItem(STORAGE_KEY);
      } finally {
        setIsLoaded(true);
      }
    }, 0);

    return () => window.clearTimeout(loadSavedState);
  }, []);

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [isLoaded, state]);

  const allMeals = useMemo(
    () => [...dayOneMeals, ...state.customMeals],
    [state.customMeals],
  );

  const selectedMeals = useMemo(
    () =>
      allMeals.filter((meal) =>
        state.selectedMealIds.includes(meal.id),
      ),
    [allMeals, state.selectedMealIds],
  );

  const totals = useMemo(
    () =>
      selectedMeals.reduce(
        (total, meal) => ({
          calories: total.calories + meal.calories,
          protein: total.protein + meal.protein,
          carbohydrates:
            total.carbohydrates + meal.carbohydrates,
          fat: total.fat + meal.fat,
        }),
        {
          calories: 0,
          protein: 0,
          carbohydrates: 0,
          fat: 0,
        },
      ),
    [selectedMeals],
  );

  const caloriesRemaining = state.calorieTarget - totals.calories;
  const calorieProgress = Math.min(
    100,
    Math.max(0, (totals.calories / state.calorieTarget) * 100),
  );
  const programProgress = (state.currentDay / 45) * 100;
  const waterProgress = Math.min(
    100,
    (state.metrics.waterOunces / 96) * 100,
  );
  const stepProgress = Math.min(
    100,
    (state.metrics.steps / dayOneWorkout.stepTarget) * 100,
  );

  function toggleMealGroup(mealType: MealType) {
    setCollapsedMealTypes((current) => {
      const updated = new Set(current);

      if (updated.has(mealType)) {
        updated.delete(mealType);
      } else {
        updated.add(mealType);
      }

      return updated;
    });
  }

  function toggleMeal(mealId: string) {
    setState((current) => {
      const selected = current.selectedMealIds.includes(mealId);

      return {
        ...current,
        selectedMealIds: selected
          ? current.selectedMealIds.filter((id) => id !== mealId)
          : [...current.selectedMealIds, mealId],
      };
    });
  }

  function addScannedProduct(
    confirmedMeal: ConfirmedScannedMeal,
  ) {
    const meal: MealItem = {
      id: `scanned-${confirmedMeal.product.barcode}-${Date.now()}`,
      name:
        confirmedMeal.quantity === 1
          ? confirmedMeal.product.name
          : `${confirmedMeal.product.name} × ${confirmedMeal.quantity}`,
      mealType: confirmedMeal.mealType,
      calories: confirmedMeal.calories,
      protein: confirmedMeal.protein,
      carbohydrates: confirmedMeal.carbohydrates,
      fat: confirmedMeal.fat,
    };

    setState((current) => ({
      ...current,
      customMeals: [...current.customMeals, meal],
      selectedMealIds: [...current.selectedMealIds, meal.id],
    }));

    setScannedMealMessage(
      `${meal.name} was added to ${meal.mealType}.`,
    );
  }

  function addCustomMeal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const calories = Number(customMealCalories);
    const protein = Number(customMealProtein || 0);
    const carbohydrates = Number(customMealCarbs || 0);
    const fat = Number(customMealFat || 0);

    if (
      !customMealName.trim() ||
      !Number.isFinite(calories) ||
      calories <= 0
    ) {
      return;
    }

    const meal: MealItem = {
      id: `custom-${Date.now()}`,
      name: customMealName.trim(),
      mealType: customMealType,
      calories,
      protein,
      carbohydrates,
      fat,
    };

    setState((current) => ({
      ...current,
      customMeals: [...current.customMeals, meal],
      selectedMealIds: [...current.selectedMealIds, meal.id],
    }));

    setCustomMealName("");
    setCustomMealCalories("");
    setCustomMealProtein("");
    setCustomMealCarbs("");
    setCustomMealFat("");
  }

  function resetDay() {
    const confirmed = window.confirm(
      "Reset today's meal selections and activity metrics?",
    );

    if (!confirmed) {
      return;
    }

    setState((current) => ({
      ...defaultState,
      calorieTarget: current.calorieTarget,
      currentDay: current.currentDay,
      metrics: {
        ...defaultState.metrics,
        weight: current.metrics.weight,
      },
    }));
  }

  if (!isLoaded) {
    return (
      <main className="app-shell" id="dashboard">
        <div className="loading-card">Loading HealthSprint AI...</div>
      </main>
    );
  }

  return (
    <div className="platform-shell">
      <DesktopNavigation />

      <div className="platform-workspace">
        <ApplicationTopBar currentDay={state.currentDay} />

        <main className="app-shell" id="dashboard">
          <header className="hero">
        <div>
          <p className="eyebrow">45-Day Nutrition and Fitness Coach</p>
          <h1>HealthSprint AI</h1>
          <p className="hero-copy">
            Track your meals, calories, movement, water, and daily
            commitments without losing sight of the full 45-day goal.
          </p>
        </div>

      </header>

      <section className="mobile-daily-summary" aria-label="Daily calorie summary">
        <div>
          <span>Consumed</span>
          <strong>{round(totals.calories)} kcal</strong>
        </div>

        <div>
          <span>Remaining</span>
          <strong className={caloriesRemaining < 0 ? "danger" : ""}>
            {round(caloriesRemaining)} kcal
          </strong>
        </div>

        <div>
          <span>Day</span>
          <strong>{state.currentDay}/45</strong>
        </div>
      </section>

      <DailyOverview
        currentDay={state.currentDay}
        calorieTarget={state.calorieTarget}
        caloriesConsumed={round(totals.calories)}
        caloriesRemaining={round(caloriesRemaining)}
        calorieProgress={calorieProgress}
        programProgress={programProgress}
        protein={round(totals.protein)}
        carbohydrates={round(totals.carbohydrates)}
        fat={round(totals.fat)}
        onCurrentDayChange={(currentDay) =>
          setState((current) => ({
            ...current,
            currentDay,
          }))
        }
      />

      <DailyAiSummaryPanel
        calorieTarget={state.calorieTarget}
        caloriesConsumed={round(totals.calories)}
        proteinGrams={round(totals.protein)}
        carbohydrateGrams={round(
          totals.carbohydrates,
        )}
        fatGrams={round(totals.fat)}
        hydrationOunces={
          state.metrics.waterOunces
        }
        steps={state.metrics.steps}
        latestWeightPounds={
          state.metrics.weight
        }
      />

      <HealthConnectConnectionPanel />

      <HealthConnectSummaryPanel />

      <HealthConnectWritePanel />

      <div className="workspace-section-heading">
        <div>
          <p className="eyebrow">Daily workspace</p>
          <h2>Log nutrition and movement</h2>
        </div>

        <p>
          Complete today&apos;s meal plan and record activity,
          hydration, steps, and weight.
        </p>
      </div>

      <section className="content-grid">
        <div className="panel meal-panel" id="meals">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Today&apos;s nutrition</p>
              <h2>Day 1 meal plan</h2>
            </div>

            <label className="compact-field">
              Calorie target
              <input
                type="number"
                min="1200"
                max="5000"
                step="50"
                value={state.calorieTarget}
                onChange={(event) =>
                  setState((current) => ({
                    ...current,
                    calorieTarget: Math.max(
                      1200,
                      Number(event.target.value) || 2100,
                    ),
                  }))
                }
              />
            </label>
          </div>

          <p className="panel-description">
            Check each item after eating it. Nutrition values are
            estimates and should be refined using package labels or a
            verified nutrition source.
          </p>

          <MealAiGuidancePanel
            calorieTarget={state.calorieTarget}
            caloriesConsumed={round(totals.calories)}
            proteinGrams={round(totals.protein)}
            carbohydrateGrams={round(
              totals.carbohydrates,
            )}
            fatGrams={round(totals.fat)}
          />

          <div className="meal-groups">
            {mealTypes.map((mealType) => {
              const mealsForType = allMeals.filter(
                (meal) => meal.mealType === mealType,
              );

              const selectedCount = mealsForType.filter((meal) =>
                state.selectedMealIds.includes(meal.id),
              ).length;

              const isCollapsed = collapsedMealTypes.has(mealType);
              const groupId = `meal-group-${mealType.toLowerCase()}`;

              return (
                <section className="meal-group" key={mealType}>
                  <button
                    type="button"
                    className="meal-group-toggle"
                    aria-expanded={!isCollapsed}
                    aria-controls={groupId}
                    onClick={() => toggleMealGroup(mealType)}
                  >
                    <span>
                      <strong>{mealType}</strong>
                      <small>
                        {selectedCount} of {mealsForType.length} logged
                      </small>
                    </span>

                    <span
                      className={`meal-group-chevron ${
                        isCollapsed ? "collapsed" : ""
                      }`}
                      aria-hidden="true"
                    >
                      ⌄
                    </span>
                  </button>

                  <div
                    id={groupId}
                    className={`meal-group-content ${
                      isCollapsed ? "collapsed" : ""
                    }`}
                    hidden={isCollapsed}
                  >
                    {mealsForType.map((meal) => {
                      const selected =
                        state.selectedMealIds.includes(meal.id);

                      return (
                        <label
                          className={`meal-item ${
                            selected ? "selected" : ""
                          }`}
                          key={meal.id}
                        >
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={() => toggleMeal(meal.id)}
                          />

                          <span className="meal-copy">
                            <strong>{meal.name}</strong>
                            <small>
                              {meal.calories} kcal · {meal.protein}g
                              protein · {meal.carbohydrates}g carbs ·{" "}
                              {meal.fat}g fat
                            </small>
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        </div>

        <aside className="side-column" id="activity">
          <section className="panel">
            <p className="eyebrow">Movement</p>
            <h2>{dayOneWorkout.title}</h2>
            <p className="panel-description">
              {dayOneWorkout.description}
            </p>

            <label className="check-card">
              <input
                type="checkbox"
                checked={state.metrics.workoutCompleted}
                onChange={(event) =>
                  setState((current) => ({
                    ...current,
                    metrics: {
                      ...current.metrics,
                      workoutCompleted: event.target.checked,
                    },
                  }))
                }
              />
              <span>
                <strong>Workout completed</strong>
                <small>
                  Mark this only after completing the assigned session.
                </small>
              </span>
            </label>

            <label className="form-field">
              Steps
              <input
                type="number"
                min="0"
                value={state.metrics.steps}
                onChange={(event) =>
                  setState((current) => ({
                    ...current,
                    metrics: {
                      ...current.metrics,
                      steps: Math.max(
                        0,
                        Number(event.target.value) || 0,
                      ),
                    },
                  }))
                }
              />
            </label>

            <div className="progress-label">
              <span>{state.metrics.steps.toLocaleString()} steps</span>
              <span>
                {dayOneWorkout.stepTarget.toLocaleString()} target
              </span>
            </div>

            <div className="progress-track">
              <div
                className="progress-fill"
                style={{ width: `${stepProgress}%` }}
              />
            </div>
          </section>

          <section className="panel">
            <p className="eyebrow">Hydration</p>
            <h2>{state.metrics.waterOunces} oz</h2>

            <div className="progress-track">
              <div
                className="progress-fill"
                style={{ width: `${waterProgress}%` }}
              />
            </div>

            <div className="button-row">
              <button
                type="button"
                className="secondary-button"
                onClick={() =>
                  setState((current) => ({
                    ...current,
                    metrics: {
                      ...current.metrics,
                      waterOunces: Math.max(
                        0,
                        current.metrics.waterOunces - 8,
                      ),
                    },
                  }))
                }
              >
                − 8 oz
              </button>

              <button
                type="button"
                className="primary-button"
                onClick={() =>
                  setState((current) => ({
                    ...current,
                    metrics: {
                      ...current.metrics,
                      waterOunces:
                        current.metrics.waterOunces + 8,
                    },
                  }))
                }
              >
                + 8 oz
              </button>
            </div>
          </section>

          <section className="panel">
            <p className="eyebrow">Body measurement</p>
            <h2>Current weight</h2>

            <label className="form-field">
              Weight in pounds
              <input
                type="number"
                min="80"
                max="700"
                step="0.1"
                value={state.metrics.weight}
                onChange={(event) =>
                  setState((current) => ({
                    ...current,
                    metrics: {
                      ...current.metrics,
                      weight:
                        Number(event.target.value) ||
                        current.metrics.weight,
                    },
                  }))
                }
              />
            </label>
          </section>
        </aside>
      </section>

      <BarcodeScanner
        onBarcodeDetected={(barcode) => {
          setScannedBarcode(barcode);
          setScannedProduct(null);
          setScannedMealMessage("");
          setCustomMealName((current) =>
            current.trim()
              ? current
              : `Scanned product ${barcode}`,
          );
        }}
      />

      {scannedBarcode && (
        <ProductLookup
          barcode={scannedBarcode}
          onProductResolved={setScannedProduct}
        />
      )}

      {scannedProduct && (
        <ServingConfirmation
          key={`${scannedProduct.barcode}-${scannedProduct.nutritionBasis}`}
          product={scannedProduct}
          onConfirm={addScannedProduct}
        />
      )}

      {scannedMealMessage && (
        <p
          className="scanned-meal-success"
          role="status"
          aria-live="polite"
        >
          {scannedMealMessage}
        </p>
      )}

      <section className="panel custom-meal-panel">
        <div>
          <p className="eyebrow">Manual food entry</p>
          <h2>Add another food</h2>
          <p className="panel-description">
            Enter values from the package label or a verified nutrition
            source.
          </p>
        </div>

        <form className="meal-form" onSubmit={addCustomMeal}>
          <label className="form-field wide-field">
            Food name
            <input
              required
              type="text"
              value={customMealName}
              onChange={(event) =>
                setCustomMealName(event.target.value)
              }
              placeholder="Example: Grilled chicken salad"
            />
          </label>

          <label className="form-field">
            Meal
            <select
              value={customMealType}
              onChange={(event) =>
                setCustomMealType(event.target.value as MealType)
              }
            >
              {mealTypes.map((mealType) => (
                <option value={mealType} key={mealType}>
                  {mealType}
                </option>
              ))}
            </select>
          </label>

          <label className="form-field">
            Calories
            <input
              required
              type="number"
              min="1"
              value={customMealCalories}
              onChange={(event) =>
                setCustomMealCalories(event.target.value)
              }
            />
          </label>

          <label className="form-field">
            Protein (g)
            <input
              type="number"
              min="0"
              step="0.1"
              value={customMealProtein}
              onChange={(event) =>
                setCustomMealProtein(event.target.value)
              }
            />
          </label>

          <label className="form-field">
            Carbs (g)
            <input
              type="number"
              min="0"
              step="0.1"
              value={customMealCarbs}
              onChange={(event) =>
                setCustomMealCarbs(event.target.value)
              }
            />
          </label>

          <label className="form-field">
            Fat (g)
            <input
              type="number"
              min="0"
              step="0.1"
              value={customMealFat}
              onChange={(event) =>
                setCustomMealFat(event.target.value)
              }
            />
          </label>

          <button className="primary-button form-button" type="submit">
            Add and log food
          </button>
        </form>
      </section>

      <section className="safety-card">
        <div>
          <p className="eyebrow">Health guardrail</p>
          <h2>Progress over punishment</h2>
          <p>
            HealthSprint AI is a tracking tool, not a medical device.
            Avoid crash dieting or unusually low calorie intake. Speak
            with a qualified clinician before major diet or exercise
            changes, particularly when managing medication or a medical
            condition.
          </p>
        </div>

        <button
          type="button"
          className="secondary-button"
          onClick={resetDay}
        >
          Reset today
        </button>
      </section>

          <MobileNavigation />
        </main>
      </div>
    </div>
  );
}
