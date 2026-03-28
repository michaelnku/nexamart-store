import type { Category, FullProduct, TechnicalDetail } from "@/lib/types";
import type {
  productSchemaType,
  updateProductSchemaType,
} from "@/lib/zodValidation";

type ProductFormValues = productSchemaType | updateProductSchemaType;
type NormalizedFoodDetails = NonNullable<ProductFormValues["foodDetails"]>;
type NormalizedFoodConfig = NonNullable<ProductFormValues["foodConfig"]>;
type NormalizedFoodOptionGroups = NonNullable<ProductFormValues["foodOptionGroups"]>;

const DEFAULT_FOOD_DETAILS: NonNullable<productSchemaType["foodDetails"]> = {
  ingredients: [""],
  preparationTimeMinutes: 0,
  portionSize: "",
  spiceLevel: undefined,
  dietaryTags: [],
  isPerishable: false,
  expiresAt: undefined,
};

const DEFAULT_FOOD_CONFIG: NonNullable<productSchemaType["foodConfig"]> = {
  itemType: "PREPARED_MEAL",
  inventoryMode: "AVAILABILITY_ONLY",
  isAvailable: true,
  isSoldOut: false,
  preparationTimeMinutes: 15,
  dailyOrderLimit: null,
  availableFrom: null,
  availableUntil: null,
  availableDays: [],
  allowScheduledOrder: false,
  allowSameDayPreorder: false,
};

function createEmptyFoodOption() {
  return {
    name: "",
    description: "",
    priceDeltaUSD: 0,
    isDefault: false,
    isAvailable: true,
    stock: null,
    displayOrder: 0,
  };
}

function isSizeOptionGroupName(name: string | null | undefined) {
  return name?.trim().toLowerCase() === "size";
}

function createEmptyFoodOptionGroup() {
  return {
    name: "",
    description: "",
    type: "SINGLE_SELECT" as const,
    isRequired: false,
    minSelections: 0,
    maxSelections: 1,
    displayOrder: 0,
    isActive: true,
    options: [createEmptyFoodOption()],
  };
}

function createFoodSizeOptionGroup() {
  return {
    name: "Size",
    description: "",
    type: "SINGLE_SELECT" as const,
    isRequired: true,
    minSelections: 1,
    maxSelections: 1,
    displayOrder: 0,
    isActive: true,
    options: [
      {
        ...createEmptyFoodOption(),
        name: "Small",
        displayOrder: 0,
      },
      {
        ...createEmptyFoodOption(),
        name: "Medium",
        displayOrder: 1,
      },
      {
        ...createEmptyFoodOption(),
        name: "Large",
        displayOrder: 2,
      },
    ],
  };
}

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

function normalizeFoodDetails(
  input: unknown,
): NormalizedFoodDetails | undefined {
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

function normalizeFoodConfig(input: unknown): NormalizedFoodConfig | undefined {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return undefined;
  }

  const data = input as Record<string, unknown>;

  return {
    itemType:
      data.itemType === "PREPARED_MEAL" ||
      data.itemType === "PACKAGED_FOOD" ||
      data.itemType === "FRESH_DRINK" ||
      data.itemType === "BAKED_ITEM"
        ? data.itemType
        : DEFAULT_FOOD_CONFIG.itemType,
    inventoryMode:
      data.inventoryMode === "STOCK_TRACKED" ||
      data.inventoryMode === "AVAILABILITY_ONLY"
        ? data.inventoryMode
        : DEFAULT_FOOD_CONFIG.inventoryMode,
    isAvailable:
      typeof data.isAvailable === "boolean"
        ? data.isAvailable
        : DEFAULT_FOOD_CONFIG.isAvailable,
    isSoldOut:
      typeof data.isSoldOut === "boolean"
        ? data.isSoldOut
        : DEFAULT_FOOD_CONFIG.isSoldOut,
    preparationTimeMinutes:
      typeof data.preparationTimeMinutes === "number"
        ? data.preparationTimeMinutes
        : DEFAULT_FOOD_CONFIG.preparationTimeMinutes,
    dailyOrderLimit:
      typeof data.dailyOrderLimit === "number" ? data.dailyOrderLimit : null,
    availableFrom:
      typeof data.availableFrom === "string" ? data.availableFrom : null,
    availableUntil:
      typeof data.availableUntil === "string" ? data.availableUntil : null,
    availableDays: Array.isArray(data.availableDays)
      ? data.availableDays.filter(
          (
            item,
          ): item is
            | "SUNDAY"
            | "MONDAY"
            | "TUESDAY"
            | "WEDNESDAY"
            | "THURSDAY"
            | "FRIDAY"
            | "SATURDAY" =>
            item === "SUNDAY" ||
            item === "MONDAY" ||
            item === "TUESDAY" ||
            item === "WEDNESDAY" ||
            item === "THURSDAY" ||
            item === "FRIDAY" ||
            item === "SATURDAY",
        )
      : [],
    allowScheduledOrder:
      typeof data.allowScheduledOrder === "boolean"
        ? data.allowScheduledOrder
        : DEFAULT_FOOD_CONFIG.allowScheduledOrder,
    allowSameDayPreorder:
      typeof data.allowSameDayPreorder === "boolean"
        ? data.allowSameDayPreorder
        : DEFAULT_FOOD_CONFIG.allowSameDayPreorder,
  };
}

function normalizeFoodOptionGroups(
  input: unknown,
): NormalizedFoodOptionGroups | undefined {
  if (!Array.isArray(input)) {
    return undefined;
  }

  return input
    .filter(
      (group): group is Record<string, unknown> =>
        typeof group === "object" && group !== null && !Array.isArray(group),
    )
    .map((group, groupIndex) => ({
      id: typeof group.id === "string" ? group.id : undefined,
      name: typeof group.name === "string" ? group.name : "",
      description:
        typeof group.description === "string" ? group.description : "",
      type:
        group.type === "SINGLE_SELECT" || group.type === "MULTI_SELECT"
          ? group.type
          : "SINGLE_SELECT",
      isRequired:
        typeof group.isRequired === "boolean" ? group.isRequired : false,
      minSelections:
        typeof group.minSelections === "number" ? group.minSelections : 0,
      maxSelections:
        typeof group.maxSelections === "number" ? group.maxSelections : null,
      displayOrder:
        typeof group.displayOrder === "number"
          ? group.displayOrder
          : groupIndex,
      isActive: typeof group.isActive === "boolean" ? group.isActive : true,
      options: Array.isArray(group.options)
        ? group.options
            .filter(
              (option): option is Record<string, unknown> =>
                typeof option === "object" &&
                option !== null &&
                !Array.isArray(option),
            )
            .map((option, optionIndex) => ({
              id: typeof option.id === "string" ? option.id : undefined,
              name: typeof option.name === "string" ? option.name : "",
              description:
                typeof option.description === "string"
                  ? option.description
                  : "",
              priceDeltaUSD:
                typeof option.priceDeltaUSD === "number"
                  ? option.priceDeltaUSD
                  : 0,
              isDefault:
                typeof option.isDefault === "boolean" ? option.isDefault : false,
              isAvailable:
                typeof option.isAvailable === "boolean"
                  ? option.isAvailable
                  : true,
              stock: typeof option.stock === "number" ? option.stock : null,
              displayOrder:
                typeof option.displayOrder === "number"
                  ? option.displayOrder
                  : optionIndex,
            }))
        : [createEmptyFoodOption()],
    }));
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
      foodConfig: isFoodStore ? DEFAULT_FOOD_CONFIG : undefined,
      foodOptionGroups: isFoodStore ? [] : [],
      variants: [createEmptyVariant(isFoodStore)],
    };
  }

  const normalizedFoodDetails = normalizeFoodDetails(initialData.foodDetails);
  const normalizedFoodConfig = normalizeFoodConfig(
    initialData.foodProductConfig,
  );
  const normalizedFoodOptionGroups = normalizeFoodOptionGroups(
    initialData.foodOptionGroups,
  );

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
      url: image.fileAsset.url,
      key: image.fileAsset.storageKey,
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
    foodConfig: isFoodStore
      ? {
          ...DEFAULT_FOOD_CONFIG,
          ...normalizedFoodConfig,
        }
      : undefined,
    foodOptionGroups: isFoodStore ? (normalizedFoodOptionGroups ?? []) : [],
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
  DEFAULT_FOOD_CONFIG,
  createEmptyVariant,
  createEmptyFoodOption,
  createEmptyFoodOptionGroup,
  createFoodSizeOptionGroup,
  getCategoryLevels,
  getProductFormDefaults,
  isSizeOptionGroupName,
  normalizeFoodConfig,
  normalizeFoodDetails,
  normalizeFoodOptionGroups,
  normalizeTechnicalDetails,
};
