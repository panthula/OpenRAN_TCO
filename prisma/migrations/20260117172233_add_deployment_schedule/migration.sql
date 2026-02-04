-- CreateTable
CREATE TABLE "DeploymentYear" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "archetypeId" TEXT NOT NULL,
    "yearIndex" INTEGER NOT NULL,
    "sitesDeployed" INTEGER NOT NULL DEFAULT 0,
    "cusDeployed" INTEGER NOT NULL DEFAULT 0,
    "dcsDeployed" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "DeploymentYear_archetypeId_fkey" FOREIGN KEY ("archetypeId") REFERENCES "SiteArchetype" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_SiteArchetype" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "scenarioVersionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "numSites" INTEGER NOT NULL,
    "numCus" INTEGER NOT NULL,
    "numDcs" INTEGER NOT NULL DEFAULT 1,
    "description" TEXT,
    "deploymentYears" INTEGER NOT NULL DEFAULT 1,
    CONSTRAINT "SiteArchetype_scenarioVersionId_fkey" FOREIGN KEY ("scenarioVersionId") REFERENCES "ScenarioVersion" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_SiteArchetype" ("description", "id", "name", "numCus", "numSites", "scenarioVersionId") SELECT "description", "id", "name", "numCus", "numSites", "scenarioVersionId" FROM "SiteArchetype";
DROP TABLE "SiteArchetype";
ALTER TABLE "new_SiteArchetype" RENAME TO "SiteArchetype";
CREATE INDEX "SiteArchetype_scenarioVersionId_idx" ON "SiteArchetype"("scenarioVersionId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "DeploymentYear_archetypeId_idx" ON "DeploymentYear"("archetypeId");

-- CreateIndex
CREATE UNIQUE INDEX "DeploymentYear_archetypeId_yearIndex_key" ON "DeploymentYear"("archetypeId", "yearIndex");

-- CreateIndex
CREATE INDEX "InputFact_scenarioVersionId_layer_idx" ON "InputFact"("scenarioVersionId", "layer");

-- CreateIndex
CREATE INDEX "InputFact_scenarioVersionId_bucket_idx" ON "InputFact"("scenarioVersionId", "bucket");
