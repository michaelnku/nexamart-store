ALTER TABLE "Store"
ADD COLUMN IF NOT EXISTS "averageRating" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "reviewCount" INTEGER NOT NULL DEFAULT 0;

DO $$
BEGIN
  IF to_regclass('"StoreReview"') IS NULL THEN
    CREATE TABLE "StoreReview" (
      "id" TEXT NOT NULL,
      "storeId" TEXT NOT NULL,
      "userId" TEXT NOT NULL,
      "orderId" TEXT NOT NULL,
      "sellerGroupId" TEXT NOT NULL,
      "rating" INTEGER NOT NULL,
      "title" TEXT,
      "comment" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

      CONSTRAINT "StoreReview_pkey" PRIMARY KEY ("id")
    );
  ELSE
    ALTER TABLE "StoreReview"
    ADD COLUMN IF NOT EXISTS "orderId" TEXT,
    ADD COLUMN IF NOT EXISTS "sellerGroupId" TEXT,
    ADD COLUMN IF NOT EXISTS "title" TEXT,
    ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3);

    UPDATE "StoreReview"
    SET "updatedAt" = COALESCE("updatedAt", "createdAt")
    WHERE "updatedAt" IS NULL;

    WITH ranked_candidates AS (
      SELECT
        sr."id" AS "reviewId",
        osg."orderId",
        osg."id" AS "sellerGroupId",
        ROW_NUMBER() OVER (
          PARTITION BY sr."id"
          ORDER BY o."createdAt" DESC, osg."createdAt" DESC
        ) AS "rank"
      FROM "StoreReview" sr
      JOIN "OrderSellerGroup" osg
        ON osg."storeId" = sr."storeId"
      JOIN "Order" o
        ON o."id" = osg."orderId"
      LEFT JOIN "StoreReview" linked
        ON linked."sellerGroupId" = osg."id"
       AND linked."userId" = sr."userId"
       AND linked."id" <> sr."id"
      WHERE sr."orderId" IS NULL
        AND sr."sellerGroupId" IS NULL
        AND o."userId" = sr."userId"
        AND o."isPaid" = TRUE
        AND o."status" = 'COMPLETED'
        AND osg."cancelledAt" IS NULL
        AND osg."status" <> 'CANCELLED'
        AND linked."id" IS NULL
    )
    UPDATE "StoreReview" sr
    SET
      "orderId" = rc."orderId",
      "sellerGroupId" = rc."sellerGroupId"
    FROM ranked_candidates rc
    WHERE sr."id" = rc."reviewId"
      AND rc."rank" = 1;

    DELETE FROM "StoreReview"
    WHERE "orderId" IS NULL OR "sellerGroupId" IS NULL;

    ALTER TABLE "StoreReview"
    ALTER COLUMN "orderId" SET NOT NULL,
    ALTER COLUMN "sellerGroupId" SET NOT NULL,
    ALTER COLUMN "updatedAt" SET NOT NULL;
  END IF;
END $$;

ALTER TABLE "StoreReview"
DROP CONSTRAINT IF EXISTS "StoreReview_storeId_userId_key";

CREATE UNIQUE INDEX IF NOT EXISTS "StoreReview_sellerGroupId_userId_key"
ON "StoreReview"("sellerGroupId", "userId");

CREATE INDEX IF NOT EXISTS "StoreReview_storeId_createdAt_idx"
ON "StoreReview"("storeId", "createdAt");

CREATE INDEX IF NOT EXISTS "StoreReview_userId_createdAt_idx"
ON "StoreReview"("userId", "createdAt");

CREATE INDEX IF NOT EXISTS "StoreReview_orderId_idx"
ON "StoreReview"("orderId");

CREATE INDEX IF NOT EXISTS "StoreReview_sellerGroupId_idx"
ON "StoreReview"("sellerGroupId");

DO $$
BEGIN
  BEGIN
    ALTER TABLE "StoreReview"
    ADD CONSTRAINT "StoreReview_storeId_fkey"
    FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  EXCEPTION
    WHEN duplicate_object THEN NULL;
  END;

  BEGIN
    ALTER TABLE "StoreReview"
    ADD CONSTRAINT "StoreReview_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  EXCEPTION
    WHEN duplicate_object THEN NULL;
  END;

  BEGIN
    ALTER TABLE "StoreReview"
    ADD CONSTRAINT "StoreReview_orderId_fkey"
    FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  EXCEPTION
    WHEN duplicate_object THEN NULL;
  END;

  BEGIN
    ALTER TABLE "StoreReview"
    ADD CONSTRAINT "StoreReview_sellerGroupId_fkey"
    FOREIGN KEY ("sellerGroupId") REFERENCES "OrderSellerGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  EXCEPTION
    WHEN duplicate_object THEN NULL;
  END;
END $$;
