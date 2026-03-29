import { z } from "zod";

const STORE_REVIEW_TITLE_MAX_LENGTH = 120;
const STORE_REVIEW_COMMENT_MAX_LENGTH = 1500;
const STORE_REVIEW_DEFAULT_PAGE_SIZE = 6;
const STORE_REVIEW_MAX_PAGE_SIZE = 20;

function normalizeOptionalLine(value?: string | null): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.replace(/\s+/g, " ").trim();
  return normalized.length > 0 ? normalized : null;
}

function normalizeOptionalParagraph(value?: string | null): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.replace(/\r\n/g, "\n").trim();
  return normalized.length > 0 ? normalized : null;
}

export const createStoreReviewSchema = z.object({
  storeId: z.string().trim().min(1),
  orderId: z.string().trim().min(1),
  sellerGroupId: z.string().trim().min(1),
  rating: z.coerce.number().int().min(1).max(5),
  title: z.string().max(STORE_REVIEW_TITLE_MAX_LENGTH).optional().nullable(),
  comment: z
    .string()
    .max(STORE_REVIEW_COMMENT_MAX_LENGTH)
    .optional()
    .nullable(),
});

export const updateStoreReviewSchema = z.object({
  reviewId: z.string().trim().min(1),
  rating: z.coerce.number().int().min(1).max(5),
  title: z.string().max(STORE_REVIEW_TITLE_MAX_LENGTH).optional().nullable(),
  comment: z
    .string()
    .max(STORE_REVIEW_COMMENT_MAX_LENGTH)
    .optional()
    .nullable(),
});

export const deleteStoreReviewSchema = z.object({
  reviewId: z.string().trim().min(1),
});

export const getStoreReviewsSchema = z.object({
  storeId: z.string().trim().min(1),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce
    .number()
    .int()
    .min(1)
    .max(STORE_REVIEW_MAX_PAGE_SIZE)
    .default(STORE_REVIEW_DEFAULT_PAGE_SIZE),
});

export const getStoreReviewSummarySchema = z.object({
  storeId: z.string().trim().min(1),
});

export const getReviewableStorePurchasesSchema = z.object({
  storeId: z.string().trim().min(1),
});

export function normalizeStoreReviewPayload(input: {
  title?: string | null;
  comment?: string | null;
}) {
  const title = normalizeOptionalLine(input.title);
  const comment = normalizeOptionalParagraph(input.comment);

  if (title && title.length > STORE_REVIEW_TITLE_MAX_LENGTH) {
    throw new Error(
      `Review title must be ${STORE_REVIEW_TITLE_MAX_LENGTH} characters or less.`,
    );
  }

  if (comment && comment.length > STORE_REVIEW_COMMENT_MAX_LENGTH) {
    throw new Error(
      `Review comment must be ${STORE_REVIEW_COMMENT_MAX_LENGTH} characters or less.`,
    );
  }

  return { title, comment };
}

export function normalizeStoreReviewPagination(input: {
  page: number;
  pageSize: number;
}) {
  const page = Math.max(1, input.page);
  const pageSize = Math.min(
    STORE_REVIEW_MAX_PAGE_SIZE,
    Math.max(1, input.pageSize),
  );

  return { page, pageSize };
}

