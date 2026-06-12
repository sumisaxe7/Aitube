-- CreateEnum
CREATE TYPE "PipelineStep" AS ENUM ('QUEUED', 'AI_CHECK', 'PROVENANCE', 'MODERATION', 'DEEPFAKE', 'DONE');

-- CreateEnum
CREATE TYPE "PipelineDecision" AS ENUM ('PUBLISH', 'HOLD_FOR_REVIEW', 'BLOCK');

-- CreateEnum
CREATE TYPE "BlockReason" AS ENUM ('NONE', 'NOT_AI', 'AMBIGUOUS', 'EXPLICIT', 'VIOLENCE', 'REAL_PERSON_DEEPFAKE', 'OTHER');

-- CreateTable
CREATE TABLE "ProcessingStatus" (
    "id" TEXT NOT NULL,
    "videoId" TEXT NOT NULL,
    "step" "PipelineStep" NOT NULL DEFAULT 'QUEUED',
    "decision" "PipelineDecision",
    "reason" "BlockReason" NOT NULL DEFAULT 'NONE',
    "messageKey" TEXT,
    "aiIsGenerated" BOOLEAN,
    "aiConfidence" DOUBLE PRECISION,
    "aiModel" TEXT,
    "provenanceHasCredentials" BOOLEAN,
    "provenanceGenerator" TEXT,
    "moderationDecision" TEXT,
    "moderationTopCategory" TEXT,
    "realPersonDeepfake" BOOLEAN,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProcessingStatus_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProcessingStatus_videoId_key" ON "ProcessingStatus"("videoId");

-- AddForeignKey
ALTER TABLE "ProcessingStatus" ADD CONSTRAINT "ProcessingStatus_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "Video"("id") ON DELETE CASCADE ON UPDATE CASCADE;
