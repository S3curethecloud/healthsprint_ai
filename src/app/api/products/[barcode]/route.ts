import { NextResponse } from "next/server";

import { lookupOpenFoodFactsProduct } from "@/lib/nutrition/open-food-facts";

type ProductRouteContext = {
  params: Promise<{
    barcode: string;
  }>;
};

export async function GET(
  _request: Request,
  context: ProductRouteContext,
) {
  const { barcode } = await context.params;

  try {
    const result =
      await lookupOpenFoodFactsProduct(barcode);

    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Product lookup failed.";

    const isInvalidBarcode =
      message === "Unsupported barcode format.";

    return NextResponse.json(
      {
        status: "error",
        message: isInvalidBarcode
          ? "Enter a valid 8, 12, 13, or 14 digit barcode."
          : "Nutrition information is temporarily unavailable. You can still enter the food manually.",
      },
      {
        status: isInvalidBarcode ? 400 : 502,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  }
}
