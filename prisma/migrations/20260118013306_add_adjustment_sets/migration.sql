-- CreateTable
CREATE TABLE "AdjustmentSet" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "scenarioVersionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AdjustmentSet_scenarioVersionId_fkey" FOREIGN KEY ("scenarioVersionId") REFERENCES "ScenarioVersion" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AdjustmentRule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "adjustmentSetId" TEXT NOT NULL,
    "targetDay" TEXT,
    "targetDomain" TEXT,
    "targetLayer" TEXT,
    "targetBucket" TEXT,
    "targetScopeType" TEXT,
    "targetScopeId" TEXT,
    "adjustmentType" TEXT NOT NULL,
    "adjustmentValue" REAL NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AdjustmentRule_adjustmentSetId_fkey" FOREIGN KEY ("adjustmentSetId") REFERENCES "AdjustmentSet" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "AdjustmentSet_scenarioVersionId_idx" ON "AdjustmentSet"("scenarioVersionId");

-- CreateIndex
CREATE INDEX "AdjustmentSet_scenarioVersionId_isActive_idx" ON "AdjustmentSet"("scenarioVersionId", "isActive");

-- CreateIndex
CREATE INDEX "AdjustmentRule_adjustmentSetId_idx" ON "AdjustmentRule"("adjustmentSetId");

-- CreateIndex
CREATE INDEX "AdjustmentRule_adjustmentSetId_priority_idx" ON "AdjustmentRule"("adjustmentSetId", "priority");
