import type {
  FieldErrors,
  Path,
  UseFormClearErrors,
  UseFormSetError,
} from "react-hook-form";

import type {
  productSchemaType,
  updateProductSchemaType,
} from "@/lib/zodValidation";

type ProductFormValues = productSchemaType | updateProductSchemaType;
type ProductFormSectionField = "categoryId" | "images" | "variants";

type FirstErrorDetail = {
  message: string;
  path: string[];
};

function setSectionError<T extends ProductFormValues>(
  setError: UseFormSetError<T>,
  field: ProductFormSectionField,
  message: string,
) {
  setError(field as Path<T>, {
    type: "manual",
    message,
  });
}

function clearSectionError<T extends ProductFormValues>(
  clearErrors: UseFormClearErrors<T>,
  field: ProductFormSectionField,
) {
  clearErrors(field as Path<T>);
}

function getFieldErrorMessage(value: unknown): string | undefined {
  if (
    value &&
    typeof value === "object" &&
    "message" in value &&
    typeof (value as { message?: unknown }).message === "string"
  ) {
    return (value as { message: string }).message;
  }

  return undefined;
}

export function getProductFormSectionErrors<T extends ProductFormValues>(
  errors: FieldErrors<T>,
) {
  return {
    categoryError: getFieldErrorMessage(errors.categoryId),
    imagesError: getFieldErrorMessage(errors.images),
    variantsError: getFieldErrorMessage(errors.variants),
  };
}

export function getFirstProductFormErrorDetail(
  value: unknown,
  path: string[] = [],
): FirstErrorDetail | undefined {
  if (!value || typeof value !== "object") return undefined;

  const message = getFieldErrorMessage(value);
  if (message) {
    return { message, path };
  }

  for (const [key, nestedValue] of Object.entries(
    value as Record<string, unknown>,
  )) {
    const detail = getFirstProductFormErrorDetail(nestedValue, [...path, key]);
    if (detail) return detail;
  }

  return undefined;
}

export function normalizeProductFormErrorMessage(message: string) {
  if (message === "Too small: expected string to have >= 1 characters") {
    return "This field is required.";
  }

  return message;
}

export function formatProductFormErrorPath(path: string[]) {
  const [root, second, third] = path;

  if (root === "categoryId") return "Category";
  if (root === "images") return "Product Images";
  if (root === "variants") {
    if (typeof second === "undefined") return "Variants";
    const variantLabel = `Variant ${Number(second) + 1}`;
    if (third === "priceUSD") return `${variantLabel} Price`;
    if (third === "stock") return `${variantLabel} Stock`;
    if (third === "color") return `${variantLabel} Color`;
    if (third === "size") return `${variantLabel} Size`;
    if (third === "sku") return `${variantLabel} SKU`;
    if (third === "oldPriceUSD") return `${variantLabel} Old Price`;
    if (third === "discount") return `${variantLabel} Discount`;
    return variantLabel;
  }

  if (root === "foodDetails") {
    if (second === "ingredients") {
      return `Food Details > Ingredient ${Number(third) + 1}`;
    }
    if (second === "preparationTimeMinutes") {
      return "Food Details > Preparation Time";
    }
    if (second === "portionSize") return "Food Details > Portion Size";
    if (second === "spiceLevel") return "Food Details > Spice Level";
    if (second === "dietaryTags") return "Food Details > Dietary Tags";
    if (second === "expiresAt") return "Food Details > Expiry Date";
    return "Food Details";
  }

  if (root === "foodConfig") {
    if (second === "itemType") return "Food Configuration > Item Type";
    if (second === "inventoryMode") {
      return "Food Configuration > Inventory Mode";
    }
    if (second === "isAvailable") return "Availability > Accepting Orders";
    if (second === "isSoldOut") return "Availability > Sold Out";
    if (second === "preparationTimeMinutes") {
      return "Food Configuration > Preparation Time";
    }
    if (second === "dailyOrderLimit") {
      return "Food Configuration > Daily Order Limit";
    }
    if (second === "availableFrom") return "Availability > Available From";
    if (second === "availableUntil") return "Availability > Available Until";
    if (second === "availableDays") return "Availability > Available Days";
    if (second === "allowScheduledOrder") return "Schedule > Scheduled Orders";
    if (second === "allowSameDayPreorder") {
      return "Schedule > Same-Day Preorder";
    }
    return "Food Configuration";
  }

  if (root === "foodOptionGroups") {
    const groupLabel =
      typeof second === "undefined"
        ? "Food Option Groups"
        : `Food Option Group ${Number(second) + 1}`;

    if (third === "name") return `${groupLabel} Name`;
    if (third === "type") return `${groupLabel} Type`;
    if (third === "minSelections") return `${groupLabel} Min Selections`;
    if (third === "maxSelections") return `${groupLabel} Max Selections`;
    if (third === "options") return `${groupLabel} Options`;
    return groupLabel;
  }

  if (root === "technicalDetails") {
    const detailLabel =
      typeof second === "undefined"
        ? "Technical Details"
        : `Technical Detail ${Number(second) + 1}`;
    if (third === "key") return `${detailLabel} Label`;
    if (third === "value") return `${detailLabel} Value`;
    return detailLabel;
  }

  if (root === "name") return "Product Name";
  if (root === "brand") return "Brand";
  if (root === "description") return "Description";
  if (root === "specifications") return "Specifications";

  return path
    .map((segment) =>
      segment
        .replace(/([A-Z])/g, " $1")
        .replace(/^\w/, (char) => char.toUpperCase()),
    )
    .join(" > ");
}

export function getProductFormValidationToastMessage<T extends ProductFormValues>(
  errors: FieldErrors<T>,
) {
  const errorDetail = getFirstProductFormErrorDetail(errors);

  if (!errorDetail) {
    return "Please fix the highlighted fields";
  }

  return `${formatProductFormErrorPath(errorDetail.path)}: ${normalizeProductFormErrorMessage(errorDetail.message)}`;
}

export function validateProductFormBeforeSubmit<T extends ProductFormValues>({
  values,
  isFoodStore,
  isUploadingImages,
  hasDuplicateSkus,
  setError,
  clearErrors,
}: {
  values: T;
  isFoodStore: boolean;
  isUploadingImages: boolean;
  hasDuplicateSkus: (variants: Array<{ sku: string }>) => boolean;
  setError: UseFormSetError<T>;
  clearErrors: UseFormClearErrors<T>;
}) {
  if (!values.categoryId) {
    const message = "Please select a category.";
    setSectionError(setError, "categoryId", message);
    return { error: message };
  }
  clearSectionError(clearErrors, "categoryId");

  if (!values.images.length) {
    const message = "Upload at least one product image.";
    setSectionError(setError, "images", message);
    return { error: message };
  }
  clearSectionError(clearErrors, "images");

  if (isUploadingImages) {
    return { error: "Wait for images to finish uploading" };
  }

  if (!values.variants.length) {
    const message = "At least one variant is required.";
    setSectionError(setError, "variants", message);
    return { error: message };
  }

  if (isFoodStore && values.variants.length !== 1) {
    const message = "Food products can only have one pricing option.";
    setSectionError(setError, "variants", message);
    return { error: message };
  }

  if (hasDuplicateSkus(values.variants)) {
    const message = "Each variant must have a unique SKU.";
    setSectionError(setError, "variants", message);
    return { error: message };
  }

  clearSectionError(clearErrors, "variants");
  return {};
}
