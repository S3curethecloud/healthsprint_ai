export type NutritionBasis = "serving" | "100g";

export type ProductNutrition = {
  calories: number | null;
  protein: number | null;
  carbohydrates: number | null;
  fat: number | null;
};

export type ScannedProduct = {
  barcode: string;
  name: string;
  brand: string | null;
  servingSize: string | null;
  imageUrl: string | null;
  nutritionBasis: NutritionBasis;
  nutrition: ProductNutrition;
  source: "open-food-facts";
  sourceUrl: string;
};

export type ProductLookupResult =
  | {
      status: "found";
      product: ScannedProduct;
    }
  | {
      status: "not-found";
      barcode: string;
      message: string;
    };
