export function successResponse() {
  return { success: true } as const;
}

export function errorResponse(error: string) {
  return { error } as const;
}

