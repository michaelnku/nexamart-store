import type {
  Category,
  FullProduct,
  TechnicalDetail,
} from "@/lib/types";
import type {
  productSchemaType,
  updateProductSchemaType,
} from "@/lib/zodValidation";

type ProductFormValues = productSchemaType | updateProductSchemaType;
type NormalizedFoodDetails = NonNullable<ProductFormValues["foodDetails"]>;

const DEFAULT_FOOD_DETAILS: NonNullable<productSchemaType["foodDetails"]> = {
  ingredients: [""],
  preparationTimeMinutes: 15,
  portionSize: "",
  spiceLevel: undefined,
  dietaryTags: [],
  isPerishable: false,
  expiresAt: undefined,
};

function createEmptyVariant(isFoodStore: boolean) {
  return {
    color: isFoodStore ? undefined : "",
    size: isFoodStore ? undefined : "",
    priceUSD: 0,
    stock: 0,
    sku: "",
    oldPriceUSD: 0,
    discount: 0,
  };
}

function isTechnicalDetail(value: unknown): value is TechnicalDetail {
  if (typeof value !== "object" || value === null) return false;

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.key === "string" && typeof candidate.value === "string"
  );
}

function normalizeTechnicalDetails(input: unknown): TechnicalDetail[] {
  if (Array.isArray(input)) {
    return input.filter(isTechnicalDetail);
  }

  if (isTechnicalDetail(input)) {
    return [input];
  }

  return [];
}

function normalizeExpiresAt(value: unknown): Date | undefined {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? undefined : value;
  }

  if (typeof value === "string") {
    const parsedDate = new Date(value);
    return Number.isNaN(parsedDate.getTime()) ? undefined : parsedDate;
  }

  return undefined;
}

function normalizeFoodDetails(input: unknown): NormalizedFoodDetails | undefined {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return undefined;
  }

  const data = input as Record<string, unknown>;

  return {
    ingredients: Array.isArray(data.ingredients)
      ? data.ingredients.filter(
          (item): item is string => typeof item === "string",
        )
      : DEFAULT_FOOD_DETAILS.ingredients,
    preparationTimeMinutes:
      typeof data.preparationTimeMinutes === "number"
        ? data.preparationTimeMinutes
        : DEFAULT_FOOD_DETAILS.preparationTimeMinutes,
    portionSize: typeof data.portionSize === "string" ? data.portionSize : "",
    spiceLevel:
      data.spiceLevel === "MILD" ||
      data.spiceLevel === "MEDIUM" ||
      data.spiceLevel === "HOT"
        ? data.spiceLevel
        : undefined,
    dietaryTags: Array.isArray(data.dietaryTags)
      ? data.dietaryTags.filter(
          (item): item is string => typeof item === "string",
        )
      : [],
    isPerishable:
      typeof data.isPerishable === "boolean" ? data.isPerishable : false,
    expiresAt: normalizeExpiresAt(data.expiresAt),
  };
}

function getCategoryLevels(categories: Category[], categoryId?: string | null) {
  if (!categoryId) {
    return { level1: null, level2: null, level3: null };
  }

  const categoryMap = new Map(
    categories.map((category) => [category.id, category]),
  );
  const leaf = categoryMap.get(categoryId);

  if (!leaf) {
    return { level1: null, level2: null, level3: null };
  }

  const parent = leaf.parentId ? categoryMap.get(leaf.parentId) : null;
  const grandParent = parent?.parentId
    ? categoryMap.get(parent.parentId)
    : null;

  return {
    level1: grandParent?.id ?? parent?.id ?? leaf.id,
    level2: parent && grandParent ? parent.id : null,
    level3: parent && grandParent ? leaf.id : null,
  };
}

function getProductFormDefaults(params: {
  isFoodStore: boolean;
  initialData?: FullProduct;
}): ProductFormValues {
  const { isFoodStore, initialData } = params;

  if (!initialData) {
    return {
      name: "",
      description: "",
      brand: "",
      specifications: "",
      technicalDetails: [],
      categoryId: "",
      images: [],
      isFoodProduct: isFoodStore,
      foodDetails: isFoodStore ? DEFAULT_FOOD_DETAILS : undefined,
      variants: [createEmptyVariant(isFoodStore)],
    };
  }

  const normalizedFoodDetails = normalizeFoodDetails(initialData.foodDetails);

  return {
    name: initialData.name,
    description: initialData.description ?? "",
    brand: initialData.brand ?? "",
    specifications: Array.isArray(initialData.specifications)
      ? initialData.specifications.join("\n")
      : "",
    technicalDetails: normalizeTechnicalDetails(initialData.technicalDetails),
    categoryId: initialData.categoryId,
    images: initialData.images.map((image) => ({
      url: image.imageUrl,
      key: image.imageKey,
    })),
    isFoodProduct: isFoodStore,
    foodDetails: isFoodStore
      ? {
          ...DEFAULT_FOOD_DETAILS,
          ...normalizedFoodDetails,
          ingredients: normalizedFoodDetails?.ingredients?.length
            ? normalizedFoodDetails.ingredients
            : DEFAULT_FOOD_DETAILS.ingredients,
        }
      : undefined,
    variants: initialData.variants.length
      ? initialData.variants.map((variant) => ({
          color: isFoodStore ? undefined : (variant.color ?? ""),
          size: isFoodStore ? undefined : (variant.size ?? ""),
          priceUSD: variant.priceUSD,
          stock: variant.stock,
          sku: variant.sku,
          oldPriceUSD: variant.oldPriceUSD ?? 0,
          discount: variant.discount ?? 0,
        }))
      : [createEmptyVariant(isFoodStore)],
  };
}

export {
  DEFAULT_FOOD_DETAILS,
  createEmptyVariant,
  getCategoryLevels,
  getProductFormDefaults,
  normalizeFoodDetails,
  normalizeTechnicalDetails,
};
