-- CreateTable
CREATE TABLE "Scenario" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isBaseline" BOOLEAN NOT NULL DEFAULT false,
    "parentId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Scenario_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Scenario" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ScenarioVersion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "scenarioId" TEXT NOT NULL,
    "versionNum" INTEGER NOT NULL,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "ScenarioVersion_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "Scenario" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SiteArchetype" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "scenarioVersionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "numSites" INTEGER NOT NULL,
    "numCus" INTEGER NOT NULL,
    "description" TEXT,
    CONSTRAINT "SiteArchetype_scenarioVersionId_fkey" FOREIGN KEY ("scenarioVersionId") REFERENCES "ScenarioVersion" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DcType" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "scenarioVersionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "numDcs" INTEGER NOT NULL,
    "description" TEXT,
    CONSTRAINT "DcType_scenarioVersionId_fkey" FOREIGN KEY ("scenarioVersionId") REFERENCES "ScenarioVersion" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "InputFact" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "scenarioVersionId" TEXT NOT NULL,
    "day" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "layer" TEXT NOT NULL,
    "bucket" TEXT NOT NULL,
    "scopeType" TEXT NOT NULL,
    "scopeId" TEXT,
    "driver" TEXT NOT NULL,
    "valueNumber" REAL NOT NULL,
    "valueJson" TEXT,
    "unit" TEXT NOT NULL DEFAULT 'USD',
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "notes" TEXT,
    "source" TEXT,
    "assumptionFlag" BOOLEAN NOT NULL DEFAULT false,
    "licenseModel" TEXT,
    "spreadYears" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "InputFact_scenarioVersionId_fkey" FOREIGN KEY ("scenarioVersionId") REFERENCES "ScenarioVersion" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "InputFact_scopeId_fkey" FOREIGN KEY ("scopeId") REFERENCES "SiteArchetype" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "InputFact_scopeId_fkey" FOREIGN KEY ("scopeId") REFERENCES "DcType" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ComputedFact" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "scenarioVersionId" TEXT NOT NULL,
    "metric" TEXT NOT NULL,
    "day" TEXT,
    "domain" TEXT,
    "layer" TEXT,
    "bucket" TEXT,
    "year" INTEGER NOT NULL,
    "capex" REAL NOT NULL DEFAULT 0,
    "opex" REAL NOT NULL DEFAULT 0,
    "tco" REAL NOT NULL DEFAULT 0,
    "npv" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ComputedFact_scenarioVersionId_fkey" FOREIGN KEY ("scenarioVersionId") REFERENCES "ScenarioVersion" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SweepDefinition" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "scenarioId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "parameters" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SweepDefinition_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "Scenario" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SweepRun" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sweepDefinitionId" TEXT NOT NULL,
    "scenarioVersionId" TEXT NOT NULL,
    "runIndex" INTEGER NOT NULL,
    "parameterValues" TEXT NOT NULL,
    "results" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SweepRun_sweepDefinitionId_fkey" FOREIGN KEY ("sweepDefinitionId") REFERENCES "SweepDefinition" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SweepRun_scenarioVersionId_fkey" FOREIGN KEY ("scenarioVersionId") REFERENCES "ScenarioVersion" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ChangeSet" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "scenarioVersionId" TEXT NOT NULL,
    "changes" TEXT NOT NULL,
    "rationale" TEXT,
    "prompt" TEXT,
    "status" TEXT NOT NULL DEFAULT 'proposed',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "appliedAt" DATETIME,
    "resultVersionId" TEXT,
    CONSTRAINT "ChangeSet_scenarioVersionId_fkey" FOREIGN KEY ("scenarioVersionId") REFERENCES "ScenarioVersion" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "ScenarioVersion_scenarioId_idx" ON "ScenarioVersion"("scenarioId");

-- CreateIndex
CREATE UNIQUE INDEX "ScenarioVersion_scenarioId_versionNum_key" ON "ScenarioVersion"("scenarioId", "versionNum");

-- CreateIndex
CREATE INDEX "SiteArchetype_scenarioVersionId_idx" ON "SiteArchetype"("scenarioVersionId");

-- CreateIndex
CREATE INDEX "DcType_scenarioVersionId_idx" ON "DcType"("scenarioVersionId");

-- CreateIndex
CREATE INDEX "InputFact_scenarioVersionId_idx" ON "InputFact"("scenarioVersionId");

-- CreateIndex
CREATE INDEX "InputFact_day_idx" ON "InputFact"("day");

-- CreateIndex
CREATE INDEX "InputFact_domain_idx" ON "InputFact"("domain");

-- CreateIndex
CREATE INDEX "InputFact_layer_idx" ON "InputFact"("layer");

-- CreateIndex
CREATE INDEX "InputFact_bucket_idx" ON "InputFact"("bucket");

-- CreateIndex
CREATE INDEX "InputFact_scopeType_scopeId_idx" ON "InputFact"("scopeType", "scopeId");

-- CreateIndex
CREATE INDEX "InputFact_scenarioVersionId_day_domain_idx" ON "InputFact"("scenarioVersionId", "day", "domain");

-- CreateIndex
CREATE INDEX "InputFact_scenarioVersionId_day_domain_layer_idx" ON "InputFact"("scenarioVersionId", "day", "domain", "layer");

-- CreateIndex
CREATE INDEX "ComputedFact_scenarioVersionId_idx" ON "ComputedFact"("scenarioVersionId");

-- CreateIndex
CREATE INDEX "ComputedFact_scenarioVersionId_year_idx" ON "ComputedFact"("scenarioVersionId", "year");

-- CreateIndex
CREATE INDEX "ComputedFact_scenarioVersionId_metric_idx" ON "ComputedFact"("scenarioVersionId", "metric");

-- CreateIndex
CREATE INDEX "ComputedFact_scenarioVersionId_day_domain_idx" ON "ComputedFact"("scenarioVersionId", "day", "domain");

-- CreateIndex
CREATE INDEX "SweepDefinition_scenarioId_idx" ON "SweepDefinition"("scenarioId");

-- CreateIndex
CREATE INDEX "SweepRun_sweepDefinitionId_idx" ON "SweepRun"("sweepDefinitionId");

-- CreateIndex
CREATE INDEX "SweepRun_scenarioVersionId_idx" ON "SweepRun"("scenarioVersionId");

-- CreateIndex
CREATE INDEX "ChangeSet_scenarioVersionId_idx" ON "ChangeSet"("scenarioVersionId");

-- CreateIndex
CREATE INDEX "ChangeSet_status_idx" ON "ChangeSet"("status");
