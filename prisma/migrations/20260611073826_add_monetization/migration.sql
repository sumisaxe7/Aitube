-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'CANCELED');

-- CreateEnum
CREATE TYPE "LedgerEntryType" AS ENUM ('SUBSCRIPTION', 'TIP', 'COCREATOR_SHARE');

-- AlterTable
ALTER TABLE "CreatorProfile" ADD COLUMN     "subscriptionPriceCents" INTEGER;

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "subscriberUserId" TEXT NOT NULL,
    "priceCents" INTEGER NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "canceledAt" TIMESTAMP(3),

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LedgerEntry" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" "LedgerEntryType" NOT NULL,
    "creatorId" TEXT NOT NULL,
    "payerUserId" TEXT,
    "grossCents" INTEGER NOT NULL,
    "platformFeeCents" INTEGER NOT NULL,
    "netCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "splitGroupId" TEXT,
    "sourceEntryId" TEXT,
    "note" TEXT,

    CONSTRAINT "LedgerEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Subscription_creatorId_idx" ON "Subscription"("creatorId");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_creatorId_subscriberUserId_key" ON "Subscription"("creatorId", "subscriberUserId");

-- CreateIndex
CREATE INDEX "LedgerEntry_creatorId_idx" ON "LedgerEntry"("creatorId");

-- CreateIndex
CREATE INDEX "LedgerEntry_splitGroupId_idx" ON "LedgerEntry"("splitGroupId");

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "CreatorProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_subscriberUserId_fkey" FOREIGN KEY ("subscriberUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerEntry" ADD CONSTRAINT "LedgerEntry_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "CreatorProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerEntry" ADD CONSTRAINT "LedgerEntry_payerUserId_fkey" FOREIGN KEY ("payerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
