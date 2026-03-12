DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = 'ConversationType'
      AND e.enumlabel = 'PRODUCT_INQUIRY'
  ) THEN
    ALTER TYPE "ConversationType" ADD VALUE 'PRODUCT_INQUIRY';
  END IF;
END $$;

ALTER TABLE "Conversation"
ADD COLUMN IF NOT EXISTS "storeId" TEXT,
ADD COLUMN IF NOT EXISTS "productId" TEXT,
ADD COLUMN IF NOT EXISTS "lastMessageAt" TIMESTAMP(3);

UPDATE "Conversation" c
SET "lastMessageAt" = COALESCE(
  (
    SELECT MAX(m."createdAt")
    FROM "Message" m
    WHERE m."conversationId" = c."id"
  ),
  c."updatedAt"
)
WHERE c."lastMessageAt" IS NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'Conversation_storeId_fkey'
  ) THEN
    ALTER TABLE "Conversation"
    ADD CONSTRAINT "Conversation_storeId_fkey"
    FOREIGN KEY ("storeId") REFERENCES "Store"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'Conversation_productId_fkey'
  ) THEN
    ALTER TABLE "Conversation"
    ADD CONSTRAINT "Conversation_productId_fkey"
    FOREIGN KEY ("productId") REFERENCES "Product"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'ConversationMember_userId_fkey'
  ) THEN
    ALTER TABLE "ConversationMember"
    ADD CONSTRAINT "ConversationMember_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "Conversation_type_userId_storeId_productId_idx"
ON "Conversation"("type", "userId", "storeId", "productId");

CREATE INDEX IF NOT EXISTS "Conversation_lastMessageAt_idx"
ON "Conversation"("lastMessageAt");

CREATE UNIQUE INDEX IF NOT EXISTS "ConversationMember_conversationId_userId_key"
ON "ConversationMember"("conversationId", "userId");

CREATE INDEX IF NOT EXISTS "ConversationMember_userId_idx"
ON "ConversationMember"("userId");
