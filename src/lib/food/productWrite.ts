import { Prisma } from "@/generated/prisma/client";
import {
  productSchemaType,
  updateProductSchemaType,
} from "@/lib/zodValidation";

type Tx = Prisma.TransactionClient;
type ProductInput = productSchemaType | updateProductSchemaType;

function buildFoodOptionGroupData(
  group: NonNullable<ProductInput["foodOptionGroups"]>[number],
  groupIndex: number,
) {
  return {
    name: group.name.trim(),
    description: group.description?.trim() || null,
    type: group.type,
    isRequired: group.isRequired,
    minSelections: group.minSelections,
    maxSelections: group.maxSelections ?? null,
    displayOrder: group.displayOrder ?? groupIndex,
    isActive: group.isActive,
  };
}

function buildFoodOptionData(
  option: NonNullable<
    NonNullable<ProductInput["foodOptionGroups"]>[number]["options"]
  >[number],
  optionIndex: number,
) {
  return {
    name: option.name.trim(),
    description: option.description?.trim() || null,
    priceDeltaUSD: option.priceDeltaUSD,
    isDefault: option.isDefault,
    isAvailable: option.isAvailable,
    stock: option.stock ?? null,
    displayOrder: option.displayOrder ?? optionIndex,
  };
}

export function serializeFoodDetails(
  foodDetails: ProductInput["foodDetails"],
) {
  if (!foodDetails) {
    return Prisma.JsonNull;
  }

  return {
    ...foodDetails,
    expiresAt: foodDetails.expiresAt?.toISOString(),
  };
}

export async function syncFoodProductRelationsInTx(
  tx: Tx,
  productId: string,
  values: Pick<ProductInput, "foodConfig" | "foodOptionGroups">,
) {
  const foodConfig = values.foodConfig;
  const foodOptionGroups = values.foodOptionGroups ?? [];

  if (!foodConfig) {
    await tx.foodOptionGroup.deleteMany({
      where: { productId },
    });
    await tx.foodProductConfig.deleteMany({
      where: { productId },
    });
    return;
  }

  await tx.foodProductConfig.upsert({
    where: { productId },
    update: {
      itemType: foodConfig.itemType,
      inventoryMode: foodConfig.inventoryMode,
      isAvailable: foodConfig.isAvailable,
      isSoldOut: foodConfig.isSoldOut,
      preparationTimeMinutes: foodConfig.preparationTimeMinutes ?? null,
      dailyOrderLimit: foodConfig.dailyOrderLimit ?? null,
      availableFrom: foodConfig.availableFrom ?? null,
      availableUntil: foodConfig.availableUntil ?? null,
      availableDays: foodConfig.availableDays ?? [],
      allowScheduledOrder: foodConfig.allowScheduledOrder,
      allowSameDayPreorder: foodConfig.allowSameDayPreorder,
    },
    create: {
      productId,
      itemType: foodConfig.itemType,
      inventoryMode: foodConfig.inventoryMode,
      isAvailable: foodConfig.isAvailable,
      isSoldOut: foodConfig.isSoldOut,
      preparationTimeMinutes: foodConfig.preparationTimeMinutes ?? null,
      dailyOrderLimit: foodConfig.dailyOrderLimit ?? null,
      availableFrom: foodConfig.availableFrom ?? null,
      availableUntil: foodConfig.availableUntil ?? null,
      availableDays: foodConfig.availableDays ?? [],
      allowScheduledOrder: foodConfig.allowScheduledOrder,
      allowSameDayPreorder: foodConfig.allowSameDayPreorder,
    },
  });

  const existingGroups = await tx.foodOptionGroup.findMany({
    where: { productId },
    include: {
      options: {
        select: {
          id: true,
        },
      },
    },
  });

  const submittedGroupIds = new Set(
    foodOptionGroups
      .map((group) => group.id)
      .filter((id): id is string => typeof id === "string" && id.length > 0),
  );
  const existingGroupIds = new Set(existingGroups.map((group) => group.id));

  await tx.foodOptionGroup.deleteMany({
    where: {
      productId,
      ...(submittedGroupIds.size > 0
        ? { id: { notIn: [...submittedGroupIds] } }
        : {}),
    },
  });

  for (let groupIndex = 0; groupIndex < foodOptionGroups.length; groupIndex += 1) {
    const group = foodOptionGroups[groupIndex];
    const groupData = buildFoodOptionGroupData(group, groupIndex);

    const groupId =
      group.id && existingGroupIds.has(group.id)
        ? (
            await tx.foodOptionGroup.update({
              where: { id: group.id },
              data: groupData,
              select: { id: true },
            })
          ).id
        : (
            await tx.foodOptionGroup.create({
              data: {
                productId,
                ...groupData,
              },
              select: { id: true },
            })
          ).id;

    const existingGroup = existingGroups.find((item) => item.id === groupId);
    const submittedOptionIds = new Set(
      group.options
        .map((option) => option.id)
        .filter((id): id is string => typeof id === "string" && id.length > 0),
    );

    await tx.foodOption.deleteMany({
      where: {
        groupId,
        ...(submittedOptionIds.size > 0
          ? { id: { notIn: [...submittedOptionIds] } }
          : {}),
      },
    });

    const existingOptionIds = new Set(
      existingGroup?.options.map((existingOption) => existingOption.id) ?? [],
    );
    const newOptionRows: Array<ReturnType<typeof buildFoodOptionData>> = [];

    await Promise.all(
      group.options.map(async (option, optionIndex) => {
        const optionData = buildFoodOptionData(option, optionIndex);

        if (option.id && existingOptionIds.has(option.id)) {
          await tx.foodOption.update({
            where: { id: option.id },
            data: optionData,
          });
          return;
        }

        newOptionRows.push(optionData);
      }),
    );

    if (newOptionRows.length > 0) {
      await tx.foodOption.createMany({
        data: newOptionRows.map((optionData) => ({
          groupId,
          ...optionData,
        })),
      });
    }
  }
}

export async function createFoodProductRelationsInTx(
  tx: Tx,
  productId: string,
  values: Pick<ProductInput, "foodConfig" | "foodOptionGroups">,
) {
  const foodConfig = values.foodConfig;
  const foodOptionGroups = values.foodOptionGroups ?? [];

  if (!foodConfig) {
    return;
  }

  await tx.foodProductConfig.create({
    data: {
      productId,
      itemType: foodConfig.itemType,
      inventoryMode: foodConfig.inventoryMode,
      isAvailable: foodConfig.isAvailable,
      isSoldOut: foodConfig.isSoldOut,
      preparationTimeMinutes: foodConfig.preparationTimeMinutes ?? null,
      dailyOrderLimit: foodConfig.dailyOrderLimit ?? null,
      availableFrom: foodConfig.availableFrom ?? null,
      availableUntil: foodConfig.availableUntil ?? null,
      availableDays: foodConfig.availableDays ?? [],
      allowScheduledOrder: foodConfig.allowScheduledOrder,
      allowSameDayPreorder: foodConfig.allowSameDayPreorder,
    },
  });

  await Promise.all(
    foodOptionGroups.map((group, groupIndex) =>
      tx.foodOptionGroup.create({
        data: {
          productId,
          ...buildFoodOptionGroupData(group, groupIndex),
          options: {
            createMany: {
              data: group.options.map((option, optionIndex) =>
                buildFoodOptionData(option, optionIndex),
              ),
            },
          },
        },
      }),
    ),
  );
}
