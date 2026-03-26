import { Prisma } from "@/generated/prisma/client";
import {
  productSchemaType,
  updateProductSchemaType,
} from "@/lib/zodValidation";

type Tx = Prisma.TransactionClient;
type ProductInput = productSchemaType | updateProductSchemaType;

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

  if (submittedGroupIds.size === 0 && existingGroups.length > 0 && foodOptionGroups.length === 0) {
    await tx.foodOptionGroup.deleteMany({
      where: { productId },
    });
  }

  for (let groupIndex = 0; groupIndex < foodOptionGroups.length; groupIndex += 1) {
    const group = foodOptionGroups[groupIndex];
    const groupData = {
      name: group.name.trim(),
      type: group.type,
      isRequired: group.isRequired,
      minSelections: group.minSelections,
      maxSelections: group.maxSelections ?? null,
      displayOrder: group.displayOrder ?? groupIndex,
      isActive: group.isActive,
    };

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

    if (submittedOptionIds.size === 0 && existingGroup?.options.length && group.options.length === 0) {
      await tx.foodOption.deleteMany({
        where: { groupId },
      });
    }

    for (let optionIndex = 0; optionIndex < group.options.length; optionIndex += 1) {
      const option = group.options[optionIndex];
      const optionData = {
        name: option.name.trim(),
        description: option.description?.trim() || null,
        priceDeltaUSD: option.priceDeltaUSD,
        isDefault: option.isDefault,
        isAvailable: option.isAvailable,
        stock: option.stock ?? null,
        displayOrder: option.displayOrder ?? optionIndex,
      };

      const optionExists = Boolean(
        option.id &&
          existingGroup?.options.some((existingOption) => existingOption.id === option.id),
      );

      if (optionExists && option.id) {
        await tx.foodOption.update({
          where: { id: option.id },
          data: optionData,
        });
      } else {
        await tx.foodOption.create({
          data: {
            groupId,
            ...optionData,
          },
        });
      }
    }
  }
}
