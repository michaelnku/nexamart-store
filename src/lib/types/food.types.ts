import {
  FoodInventoryMode,
  FoodItemType,
  FoodOptionGroupType,
} from "@/generated/prisma/client";

export type FoodDetails = {
  ingredients?: string[];
  preparationTimeMinutes?: number;
  portionSize?: string;
  spiceLevel?: "MILD" | "MEDIUM" | "HOT";
  dietaryTags?: string[];
  isPerishable?: boolean;
  expiresAt?: string | Date;
};

export type FoodProductConfigInput = {
  itemType: FoodItemType;
  inventoryMode: FoodInventoryMode;
  isAvailable: boolean;
  isSoldOut: boolean;
  preparationTimeMinutes?: number | null;
  dailyOrderLimit?: number | null;
  availableFrom?: string | null;
  availableUntil?: string | null;
  availableDays: string[];
  allowScheduledOrder: boolean;
  allowSameDayPreorder: boolean;
};

export type FoodOptionInput = {
  id?: string;
  name: string;
  description?: string | null;
  priceDeltaUSD: number;
  isDefault: boolean;
  isAvailable: boolean;
  stock?: number | null;
  displayOrder: number;
};

export type FoodOptionGroupInput = {
  id?: string;
  name: string;
  type: FoodOptionGroupType;
  isRequired: boolean;
  minSelections: number;
  maxSelections?: number | null;
  displayOrder: number;
  isActive: boolean;
  options: FoodOptionInput[];
};

export type FoodSelectedOptionInput = {
  optionGroupId: string;
  optionId: string;
};
