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
    "numDusPerSite" INTEGER NOT NULL DEFAULT 1,
    "description" TEXT,
    "deploymentYears" INTEGER NOT NULL DEFAULT 1,
    CONSTRAINT "SiteArchetype_scenarioVersionId_fkey" FOREIGN KEY ("scenarioVersionId") REFERENCES "ScenarioVersion" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_SiteArchetype" ("deploymentYears", "description", "id", "name", "numCus", "numDcs", "numSites", "scenarioVersionId") SELECT "deploymentYears", "description", "id", "name", "numCus", "numDcs", "numSites", "scenarioVersionId" FROM "SiteArchetype";
DROP TABLE "SiteArchetype";
ALTER TABLE "new_SiteArchetype" RENAME TO "SiteArchetype";
CREATE INDEX "SiteArchetype_scenarioVersionId_idx" ON "SiteArchetype"("scenarioVersionId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
