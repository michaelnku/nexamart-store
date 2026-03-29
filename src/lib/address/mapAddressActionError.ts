export function isInvalidAddressError(error: unknown) {
  return (
    error instanceof Error &&
    (error.message.toLowerCase().includes("invalid") ||
      error.message.toLowerCase().includes("geocode"))
  );
}

export function mapAddressActionError(
  error: unknown,
  fallbackMessage:
    | "Failed to create address"
    | "Failed to update address"
    | "Failed to delete address"
    | "Failed to set default address"
    | "Failed to load addresses",
) {
  if (isInvalidAddressError(error)) {
    return { error: "Please select a valid address from suggestions." };
  }

  return { error: fallbackMessage };
}
