export function validateSellerAcceptInput(
  isFoodOrder: true,
  prepTimeMinutes?: number,
):
  | { prepTimeMinutes: number; error?: never }
  | { error: true; prepTimeMinutes?: never };
export function validateSellerAcceptInput(
  isFoodOrder: false,
  prepTimeMinutes?: number,
): { prepTimeMinutes: undefined; error?: never };
export function validateSellerAcceptInput(
  isFoodOrder: boolean,
  prepTimeMinutes?: number,
) {
  if (!isFoodOrder) {
    return { prepTimeMinutes: undefined } as const;
  }

  if (
    !Number.isInteger(prepTimeMinutes) ||
    (prepTimeMinutes as number) < 1 ||
    (prepTimeMinutes as number) > 180
  ) {
    return { error: true } as const;
  }

  return { prepTimeMinutes: prepTimeMinutes as number } as const;
}
