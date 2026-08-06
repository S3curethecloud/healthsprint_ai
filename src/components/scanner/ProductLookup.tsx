"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

import type { ScannedProduct } from "@/types/product";

interface ProductLookupProps {
  barcode: string;
  onProductResolved: (product: ScannedProduct | null) => void;
}

type LookupState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "found"; product: ScannedProduct }
  | { status: "not-found"; message: string }
  | { status: "error"; message: string };

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null;
}

function isScannedProduct(value: unknown): value is ScannedProduct {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.barcode === "string" &&
    typeof value.name === "string" &&
    isRecord(value.nutrition) &&
    value.source === "open-food-facts"
  );
}

function readMessage(
  payload: unknown,
  fallback: string,
) {
  if (
    isRecord(payload) &&
    typeof payload.message === "string" &&
    payload.message.trim()
  ) {
    return payload.message;
  }

  return fallback;
}

function formatNutritionValue(
  value: number | null,
  unit: "kcal" | "g",
) {
  return value === null ? "Not available" : `${value} ${unit}`;
}

export default function ProductLookup({
  barcode,
  onProductResolved,
}: ProductLookupProps) {
  const [lookupState, setLookupState] =
    useState<LookupState>({ status: "idle" });

  useEffect(() => {
    if (!barcode) {
      return;
    }

    const controller = new AbortController();

    async function lookupProduct() {
      setLookupState({ status: "loading" });
      onProductResolved(null);

      try {
        const response = await fetch(
          `/api/products/${encodeURIComponent(barcode)}`,
          {
            method: "GET",
            headers: {
              Accept: "application/json",
            },
            cache: "no-store",
            signal: controller.signal,
          },
        );

        const payload: unknown = await response.json();

        if (!response.ok) {
          setLookupState({
            status: "error",
            message: readMessage(
              payload,
              "Nutrition information could not be loaded.",
            ),
          });
          return;
        }

        if (
          isRecord(payload) &&
          payload.status === "found" &&
          isScannedProduct(payload.product)
        ) {
          setLookupState({
            status: "found",
            product: payload.product,
          });
          onProductResolved(payload.product);
          return;
        }

        if (
          isRecord(payload) &&
          payload.status === "not-found"
        ) {
          setLookupState({
            status: "not-found",
            message: readMessage(
              payload,
              "This product was not found in the nutrition database.",
            ),
          });
          return;
        }

        setLookupState({
          status: "error",
          message:
            "The nutrition provider returned an unexpected response.",
        });
      } catch (error) {
        if (
          error instanceof DOMException &&
          error.name === "AbortError"
        ) {
          return;
        }

        setLookupState({
          status: "error",
          message:
            "Nutrition information is temporarily unavailable. You can still enter the food manually.",
        });
      }
    }

    void lookupProduct();

    return () => {
      controller.abort();
    };
  }, [barcode, onProductResolved]);

  if (!barcode) {
    return null;
  }

  return (
    <section
      className="product-lookup"
      aria-labelledby="product-lookup-title"
    >
      <div className="product-lookup-heading">
        <div>
          <p className="eyebrow">Nutrition lookup</p>
          <h2 id="product-lookup-title">Product details</h2>
        </div>

        <span className="status-chip">{barcode}</span>
      </div>

      <div aria-live="polite">
        {lookupState.status === "loading" && (
          <div className="lookup-message">
            <span
              className="lookup-spinner"
              aria-hidden="true"
            />
            <p>Looking up nutrition information…</p>
          </div>
        )}

        {lookupState.status === "not-found" && (
          <div className="lookup-message">
            <strong>Product not found</strong>
            <p>{lookupState.message}</p>
            <p>
              Continue with manual food entry using the package
              nutrition label.
            </p>
          </div>
        )}

        {lookupState.status === "error" && (
          <div className="lookup-message lookup-error">
            <strong>Lookup unavailable</strong>
            <p>{lookupState.message}</p>
          </div>
        )}

        {lookupState.status === "found" && (
          <article className="product-result">
            {lookupState.product.imageUrl && (
              <Image
                src={lookupState.product.imageUrl}
                alt=""
                width={112}
                height={112}
                unoptimized
              />
            )}

            <div className="product-result-content">
              <div>
                <p className="product-brand">
                  {lookupState.product.brand ||
                    "Brand not provided"}
                </p>

                <h3>{lookupState.product.name}</h3>

                <p>
                  {lookupState.product.servingSize
                    ? `Serving: ${lookupState.product.servingSize}`
                    : lookupState.product.nutritionBasis ===
                        "100g"
                      ? "Nutrition shown per 100 g"
                      : "Serving size not provided"}
                </p>
              </div>

              <dl className="product-nutrition-grid">
                <div>
                  <dt>Calories</dt>
                  <dd>
                    {formatNutritionValue(
                      lookupState.product.nutrition.calories,
                      "kcal",
                    )}
                  </dd>
                </div>

                <div>
                  <dt>Protein</dt>
                  <dd>
                    {formatNutritionValue(
                      lookupState.product.nutrition.protein,
                      "g",
                    )}
                  </dd>
                </div>

                <div>
                  <dt>Carbohydrates</dt>
                  <dd>
                    {formatNutritionValue(
                      lookupState.product.nutrition
                        .carbohydrates,
                      "g",
                    )}
                  </dd>
                </div>

                <div>
                  <dt>Fat</dt>
                  <dd>
                    {formatNutritionValue(
                      lookupState.product.nutrition.fat,
                      "g",
                    )}
                  </dd>
                </div>
              </dl>

              <p className="product-source">
                Source: Open Food Facts. Verify values against
                the package label before logging.
              </p>
            </div>
          </article>
        )}
      </div>
    </section>
  );
}
