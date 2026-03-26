import { OrderStatus, Prisma } from "@/generated/prisma/client";

const FOOD_TIME_ZONE = "Africa/Lagos";

export type FoodSelectionInput = {
  optionGroupId: string;
  optionId: string;
};

export type FoodSelectionSnapshot = {
  optionGroupId: string;
  optionId: string;
  optionGroupName: string;
  optionName: string;
  priceDeltaUSD: number;
};

type FoodProductWithOptions = {
  id: string;
  name: string;
  isFoodProduct: boolean;
  foodProductConfig: {
    inventoryMode: "STOCK_TRACKED" | "AVAILABILITY_ONLY";
    isAvailable: boolean;
    isSoldOut: boolean;
    dailyOrderLimit: number | null;
    availableFrom: string | null;
    availableUntil: string | null;
    availableDays: string[];
  } | null;
  foodOptionGroups: Array<{
    id: string;
    name: string;
    type: "SINGLE_SELECT" | "MULTI_SELECT";
    isRequired: boolean;
    minSelections: number;
    maxSelections: number | null;
    isActive: boolean;
    options: Array<{
      id: string;
      name: string;
      priceDeltaUSD: number;
      isAvailable: boolean;
      stock: number | null;
    }>;
  }>;
};

type OrderDb = Pick<Prisma.TransactionClient, "orderItem">;

function getLagosNow(now = new Date()) {
  const dateFormatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: FOOD_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const timeFormatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: FOOD_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const weekdayFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone: FOOD_TIME_ZONE,
    weekday: "long",
  });

  const dateKey = dateFormatter.format(now);
  const dayStartUtc = new Date(`${dateKey}T00:00:00+01:00`);
  return {
    dateKey,
    currentTime: timeFormatter.format(now),
    weekday: weekdayFormatter.format(now).toUpperCase(),
    dayStartUtc,
    nextDayStartUtc: new Date(dayStartUtc.getTime() + 24 * 60 * 60 * 1000),
  };
}

function isWithinConfiguredWindow(
  currentTime: string,
  from: string | null,
  until: string | null,
) {
  if (!from && !until) {
    return true;
  }

  if (!from || !until) {
    return false;
  }

  if (from <= until) {
    return currentTime >= from && currentTime <= until;
  }

  return currentTime >= from || currentTime <= until;
}

export function buildFoodSelectionFingerprint(
  selections: FoodSelectionInput[] | FoodSelectionSnapshot[],
) {
  return selections
    .map((selection) => `${selection.optionGroupId}:${selection.optionId}`)
    .sort((a, b) => a.localeCompare(b))
    .join("|");
}

export async function assertAvailabilityOnlyFoodCanBeOrdered(
  db: OrderDb,
  product: FoodProductWithOptions,
  requestedQuantity: number,
) {
  const config = product.foodProductConfig;
  if (!config || config.inventoryMode !== "AVAILABILITY_ONLY") {
    return;
  }

  if (!config.isAvailable) {
    throw new Error(`${product.name} is not accepting orders right now.`);
  }

  if (config.isSoldOut) {
    throw new Error(`${product.name} is currently sold out.`);
  }

  const nowInfo = getLagosNow();

  if (
    config.availableDays.length > 0 &&
    !config.availableDays.includes(nowInfo.weekday)
  ) {
    throw new Error(`${product.name} is not available today.`);
  }

  if (
    !isWithinConfiguredWindow(
      nowInfo.currentTime,
      config.availableFrom,
      config.availableUntil,
    )
  ) {
    throw new Error(`${product.name} is outside its ordering window.`);
  }

  if (config.dailyOrderLimit != null) {
    const orderedToday = await db.orderItem.aggregate({
      where: {
        productId: product.id,
        order: {
          createdAt: {
            gte: nowInfo.dayStartUtc,
            lt: nowInfo.nextDayStartUtc,
          },
          status: {
            notIn: [OrderStatus.CANCELLED, OrderStatus.REFUNDED],
          },
        },
      },
      _sum: {
        quantity: true,
      },
    });

    const orderedQuantity = orderedToday._sum.quantity ?? 0;

    if (orderedQuantity + requestedQuantity > config.dailyOrderLimit) {
      throw new Error(`${product.name} has reached its daily order limit.`);
    }
  }
}

export function validateFoodSelections(params: {
  product: FoodProductWithOptions;
  selections: FoodSelectionInput[];
  quantity: number;
}) {
  const { product, selections, quantity } = params;

  if (!product.isFoodProduct) {
    return {
      snapshots: [] as FoodSelectionSnapshot[],
      optionsPriceUSD: 0,
      selectionFingerprint: "",
    };
  }

  const activeGroups = product.foodOptionGroups.filter((group) => group.isActive);
  const groupMap = new Map(activeGroups.map((group) => [group.id, group]));
  const groupedSelections = new Map<string, FoodSelectionSnapshot[]>();
  const seenOptionIds = new Set<string>();

  for (const selection of selections) {
    const group = groupMap.get(selection.optionGroupId);
    if (!group) {
      throw new Error("One or more selected food options are no longer valid.");
    }

    const option = group.options.find((item) => item.id === selection.optionId);
    if (!option || !option.isAvailable) {
      throw new Error("One or more selected food options are unavailable.");
    }

    if (seenOptionIds.has(option.id)) {
      throw new Error("Duplicate food option selections are not allowed.");
    }
    seenOptionIds.add(option.id);

    if (option.stock != null && option.stock < quantity) {
      throw new Error(`${option.name} is no longer available in that quantity.`);
    }

    const nextSelections = groupedSelections.get(group.id) ?? [];
    nextSelections.push({
      optionGroupId: group.id,
      optionId: option.id,
      optionGroupName: group.name,
      optionName: option.name,
      priceDeltaUSD: option.priceDeltaUSD,
    });
    groupedSelections.set(group.id, nextSelections);
  }

  for (const group of activeGroups) {
    const groupSelections = groupedSelections.get(group.id) ?? [];
    const effectiveMin = Math.max(group.minSelections, group.isRequired ? 1 : 0);
    const effectiveMax =
      group.maxSelections ?? (group.type === "SINGLE_SELECT" ? 1 : Number.POSITIVE_INFINITY);

    if (groupSelections.length < effectiveMin) {
      throw new Error(`${group.name} requires more selections.`);
    }

    if (groupSelections.length > effectiveMax) {
      throw new Error(`${group.name} allows fewer selections.`);
    }
  }

  const snapshots = [...groupedSelections.values()].flat();
  const optionsPriceUSD = snapshots.reduce(
    (sum, selection) => sum + selection.priceDeltaUSD,
    0,
  );

  return {
    snapshots,
    optionsPriceUSD,
    selectionFingerprint: buildFoodSelectionFingerprint(snapshots),
  };
}

export function shouldReserveInventoryForProduct(product: FoodProductWithOptions) {
  if (!product.isFoodProduct) {
    return true;
  }

  return product.foodProductConfig?.inventoryMode !== "AVAILABILITY_ONLY";
}
