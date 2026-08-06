import type {
  NutritionBasis,
  ProductLookupResult,
  ProductNutrition,
  ScannedProduct,
} from "@/types/product";

const OPEN_FOOD_FACTS_BASE_URL =
  "https://world.openfoodfacts.org";

const OPEN_FOOD_FACTS_USER_AGENT =
  "HealthSprintAI/0.1 (https://github.com/S3curethecloud/healthsprint_ai)";

const PRODUCT_FIELDS = [
  "code",
  "product_name",
  "generic_name",
  "brands",
  "serving_size",
  "image_front_small_url",
  "nutriments",
].join(",");

type OpenFoodFactsNutriments = Record<
  string,
  number | string | null | undefined
>;

type OpenFoodFactsProduct = {
  code?: string;
  product_name?: string;
  generic_name?: string;
  brands?: string;
  serving_size?: string;
  image_front_small_url?: string;
  nutriments?: OpenFoodFactsNutriments;
};

type OpenFoodFactsResponse = {
  code?: string;
  status?: number;
  status_verbose?: string;
  product?: OpenFoodFactsProduct;
};

function normalizeBarcode(value: string) {
  return value.replace(/\D/g, "").trim();
}

function isValidBarcode(value: string) {
  return [8, 12, 13, 14].includes(value.length);
}

function readNumber(
  nutriments: OpenFoodFactsNutriments,
  key: string,
) {
  const rawValue = nutriments[key];

  if (typeof rawValue === "number") {
    return Number.isFinite(rawValue) ? rawValue : null;
  }

  if (typeof rawValue === "string" && rawValue.trim()) {
    const parsed = Number(rawValue);

    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function roundNutritionValue(value: number | null) {
  if (value === null) {
    return null;
  }

  return Math.round(value * 10) / 10;
}

function readNutrition(
  nutriments: OpenFoodFactsNutriments,
  basis: NutritionBasis,
): ProductNutrition {
  const suffix = basis === "serving" ? "_serving" : "_100g";

  return {
    calories: roundNutritionValue(
      readNumber(nutriments, `energy-kcal${suffix}`),
    ),
    protein: roundNutritionValue(
      readNumber(nutriments, `proteins${suffix}`),
    ),
    carbohydrates: roundNutritionValue(
      readNumber(nutriments, `carbohydrates${suffix}`),
    ),
    fat: roundNutritionValue(
      readNumber(nutriments, `fat${suffix}`),
    ),
  };
}

function hasAnyNutrition(nutrition: ProductNutrition) {
  return Object.values(nutrition).some(
    (value) => value !== null,
  );
}

function selectNutrition(
  nutriments: OpenFoodFactsNutriments,
): {
  basis: NutritionBasis;
  nutrition: ProductNutrition;
} {
  const servingNutrition = readNutrition(
    nutriments,
    "serving",
  );

  if (hasAnyNutrition(servingNutrition)) {
    return {
      basis: "serving",
      nutrition: servingNutrition,
    };
  }

  return {
    basis: "100g",
    nutrition: readNutrition(nutriments, "100g"),
  };
}

function normalizeProduct(
  requestedBarcode: string,
  product: OpenFoodFactsProduct,
): ScannedProduct {
  const nutriments = product.nutriments ?? {};
  const selectedNutrition = selectNutrition(nutriments);

  const name =
    product.product_name?.trim() ||
    product.generic_name?.trim() ||
    `Product ${requestedBarcode}`;

  return {
    barcode: normalizeBarcode(product.code ?? requestedBarcode),
    name,
    brand: product.brands?.trim() || null,
    servingSize: product.serving_size?.trim() || null,
    imageUrl: product.image_front_small_url?.trim() || null,
    nutritionBasis: selectedNutrition.basis,
    nutrition: selectedNutrition.nutrition,
    source: "open-food-facts",
    sourceUrl:
      `${OPEN_FOOD_FACTS_BASE_URL}/product/${requestedBarcode}`,
  };
}

export async function lookupOpenFoodFactsProduct(
  rawBarcode: string,
): Promise<ProductLookupResult> {
  const barcode = normalizeBarcode(rawBarcode);

  if (!isValidBarcode(barcode)) {
    throw new Error("Unsupported barcode format.");
  }

  const endpoint = new URL(
    `/api/v2/product/${barcode}.json`,
    OPEN_FOOD_FACTS_BASE_URL,
  );

  endpoint.searchParams.set("fields", PRODUCT_FIELDS);

  const response = await fetch(endpoint, {
    headers: {
      Accept: "application/json",
      "User-Agent": OPEN_FOOD_FACTS_USER_AGENT,
    },
    cache: "no-store",
    signal: AbortSignal.timeout(8000),
  });

  if (response.status === 404) {
    return {
      status: "not-found",
      barcode,
      message:
        "This barcode is valid, but the product was not found in the nutrition database.",
    };
  }

  if (!response.ok) {
    throw new Error(
      `Product provider returned HTTP ${response.status}.`,
    );
  }

  const payload =
    (await response.json()) as OpenFoodFactsResponse;

  if (payload.status !== 1 || !payload.product) {
    return {
      status: "not-found",
      barcode,
      message:
        "This barcode is valid, but the product was not found in the nutrition database.",
    };
  }

  return {
    status: "found",
    product: normalizeProduct(barcode, payload.product),
  };
}
