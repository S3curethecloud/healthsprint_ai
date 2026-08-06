"use client";

import { FormEvent, useMemo, useState } from "react";

import type { MealType } from "@/types/health";
import type { ScannedProduct } from "@/types/product";

export type ConfirmedScannedMeal = {
  product: ScannedProduct;
  mealType: MealType;
  quantity: number;
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
};

interface ServingConfirmationProps {
  product: ScannedProduct;
  onConfirm: (meal: ConfirmedScannedMeal) => void;
}

const MEAL_TYPES: MealType[] = [
  "Breakfast",
  "Lunch",
  "Snack",
  "Dinner",
];

function round(value: number) {
  return Math.round(value * 10) / 10;
}

function numericValue(value: number | null) {
  return value ?? 0;
}

export default function ServingConfirmation({
  product,
  onConfirm,
}: ServingConfirmationProps) {
  const [quantity, setQuantity] = useState("1");
  const [mealType, setMealType] =
    useState<MealType>("Breakfast");
  const [error, setError] = useState("");

  const calculatedNutrition = useMemo(() => {
    const multiplier = Number(quantity);

    if (!Number.isFinite(multiplier) || multiplier <= 0) {
      return null;
    }

    return {
      calories: round(
        numericValue(product.nutrition.calories) * multiplier,
      ),
      protein: round(
        numericValue(product.nutrition.protein) * multiplier,
      ),
      carbohydrates: round(
        numericValue(product.nutrition.carbohydrates) *
          multiplier,
      ),
      fat: round(
        numericValue(product.nutrition.fat) * multiplier,
      ),
    };
  }, [product, quantity]);

  function confirmServing(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const parsedQuantity = Number(quantity);

    if (
      !calculatedNutrition ||
      !Number.isFinite(parsedQuantity) ||
      parsedQuantity <= 0
    ) {
      setError("Enter a serving quantity greater than zero.");
      return;
    }

    if (calculatedNutrition.calories <= 0) {
      setError(
        "Calories are unavailable for this product. Use manual food entry and verify the package label.",
      );
      return;
    }

    setError("");

    onConfirm({
      product,
      mealType,
      quantity: parsedQuantity,
      ...calculatedNutrition,
    });
  }

  const basisLabel =
    product.nutritionBasis === "serving"
      ? product.servingSize
        ? `serving (${product.servingSize})`
        : "serving"
      : "100 g portion";

  return (
    <section
      className="serving-confirmation"
      aria-labelledby="serving-confirmation-title"
    >
      <div className="serving-confirmation-heading">
        <div>
          <p className="eyebrow">Serving confirmation</p>
          <h2 id="serving-confirmation-title">
            Confirm before logging
          </h2>
          <p className="panel-description">
            Review the nutrition basis and choose where this
            product should be logged.
          </p>
        </div>

        <span className="status-chip">
          Review required
        </span>
      </div>

      <form
        className="serving-confirmation-form"
        onSubmit={confirmServing}
      >
        <div className="serving-confirmation-fields">
          <label className="form-field">
            Number of {basisLabel}s
            <input
              type="number"
              min="0.1"
              max="20"
              step="0.1"
              value={quantity}
              onChange={(event) =>
                setQuantity(event.target.value)
              }
            />
          </label>

          <label className="form-field">
            Add to meal
            <select
              value={mealType}
              onChange={(event) =>
                setMealType(event.target.value as MealType)
              }
            >
              {MEAL_TYPES.map((type) => (
                <option value={type} key={type}>
                  {type}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="serving-preview">
          <div>
            <span>Calories</span>
            <strong>
              {calculatedNutrition
                ? `${calculatedNutrition.calories} kcal`
                : "—"}
            </strong>
          </div>

          <div>
            <span>Protein</span>
            <strong>
              {calculatedNutrition
                ? `${calculatedNutrition.protein} g`
                : "—"}
            </strong>
          </div>

          <div>
            <span>Carbohydrates</span>
            <strong>
              {calculatedNutrition
                ? `${calculatedNutrition.carbohydrates} g`
                : "—"}
            </strong>
          </div>

          <div>
            <span>Fat</span>
            <strong>
              {calculatedNutrition
                ? `${calculatedNutrition.fat} g`
                : "—"}
            </strong>
          </div>
        </div>

        <p className="serving-basis-note">
          Nutrition basis: <strong>{basisLabel}</strong>.
          Verify the package label before logging.
        </p>

        {error && (
          <p className="scanner-error" role="alert">
            {error}
          </p>
        )}

        <button type="submit" className="primary-button">
          Add product to {mealType}
        </button>
      </form>
    </section>
  );
}
