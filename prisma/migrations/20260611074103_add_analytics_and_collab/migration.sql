-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('VIEW_START', 'WATCH_PROGRESS', 'COMPLETE', 'RATING', 'SUBSCRIBE', 'TIP');

-- CreateEnum
CREATE TYPE "CollaborationStatus" AS ENUM ('ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "CollaboratorRole" AS ENUM ('OWNER', 'COCREATOR');

-- CreateEnum
CREATE TYPE "CollaboratorStatus" AS ENUM ('INVITED', 'ACCEPTED', 'DECLINED');

-- CreateTable
CREATE TABLE "ViewerEvent" (
    "id" TEXT NOT NULL,
    "videoId" TEXT NOT NULL,
    "type" "EventType" NOT NULL,
    "country" TEXT,
    "positionSec" INTEGER,
    "valueCents" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ViewerEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyRollup" (
    "id" TEXT NOT NULL,
    "videoId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "views" INTEGER NOT NULL DEFAULT 0,
    "watchTimeSec" INTEGER NOT NULL DEFAULT 0,
    "completes" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyRollup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Collaboration" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "videoId" TEXT,
    "status" "CollaborationStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Collaboration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Collaborator" (
    "id" TEXT NOT NULL,
    "collaborationId" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "role" "CollaboratorRole" NOT NULL DEFAULT 'COCREATOR',
    "status" "CollaboratorStatus" NOT NULL DEFAULT 'INVITED',
    "sharePct" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Collaborator_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectNote" (
    "id" TEXT NOT NULL,
    "collaborationId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectNote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ViewerEvent_videoId_idx" ON "ViewerEvent"("videoId");

-- CreateIndex
CREATE INDEX "ViewerEvent_type_idx" ON "ViewerEvent"("type");

-- CreateIndex
CREATE INDEX "ViewerEvent_createdAt_idx" ON "ViewerEvent"("createdAt");

-- CreateIndex
CREATE INDEX "DailyRollup_videoId_idx" ON "DailyRollup"("videoId");

-- CreateIndex
CREATE UNIQUE INDEX "DailyRollup_videoId_date_key" ON "DailyRollup"("videoId", "date");

-- CreateIndex
CREATE INDEX "Collaboration_ownerId_idx" ON "Collaboration"("ownerId");

-- CreateIndex
CREATE INDEX "Collaborator_creatorId_idx" ON "Collaborator"("creatorId");

-- CreateIndex
CREATE UNIQUE INDEX "Collaborator_collaborationId_creatorId_key" ON "Collaborator"("collaborationId", "creatorId");

-- CreateIndex
CREATE INDEX "ProjectNote_collaborationId_idx" ON "ProjectNote"("collaborationId");

-- AddForeignKey
ALTER TABLE "ViewerEvent" ADD CONSTRAINT "ViewerEvent_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "Video"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyRollup" ADD CONSTRAINT "DailyRollup_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "Video"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Collaboration" ADD CONSTRAINT "Collaboration_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "CreatorProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Collaboration" ADD CONSTRAINT "Collaboration_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "Video"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Collaborator" ADD CONSTRAINT "Collaborator_collaborationId_fkey" FOREIGN KEY ("collaborationId") REFERENCES "Collaboration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Collaborator" ADD CONSTRAINT "Collaborator_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "CreatorProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectNote" ADD CONSTRAINT "ProjectNote_collaborationId_fkey" FOREIGN KEY ("collaborationId") REFERENCES "Collaboration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectNote" ADD CONSTRAINT "ProjectNote_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "CreatorProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
