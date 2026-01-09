-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_InputFact" (
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
    CONSTRAINT "InputFact_scenarioVersionId_fkey" FOREIGN KEY ("scenarioVersionId") REFERENCES "ScenarioVersion" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_InputFact" ("assumptionFlag", "bucket", "createdAt", "currency", "day", "domain", "driver", "id", "layer", "licenseModel", "notes", "scenarioVersionId", "scopeId", "scopeType", "source", "spreadYears", "unit", "updatedAt", "valueJson", "valueNumber") SELECT "assumptionFlag", "bucket", "createdAt", "currency", "day", "domain", "driver", "id", "layer", "licenseModel", "notes", "scenarioVersionId", "scopeId", "scopeType", "source", "spreadYears", "unit", "updatedAt", "valueJson", "valueNumber" FROM "InputFact";
DROP TABLE "InputFact";
ALTER TABLE "new_InputFact" RENAME TO "InputFact";
CREATE INDEX "InputFact_scenarioVersionId_idx" ON "InputFact"("scenarioVersionId");
CREATE INDEX "InputFact_day_idx" ON "InputFact"("day");
CREATE INDEX "InputFact_domain_idx" ON "InputFact"("domain");
CREATE INDEX "InputFact_layer_idx" ON "InputFact"("layer");
CREATE INDEX "InputFact_bucket_idx" ON "InputFact"("bucket");
CREATE INDEX "InputFact_scopeType_scopeId_idx" ON "InputFact"("scopeType", "scopeId");
CREATE INDEX "InputFact_scenarioVersionId_day_domain_idx" ON "InputFact"("scenarioVersionId", "day", "domain");
CREATE INDEX "InputFact_scenarioVersionId_day_domain_layer_idx" ON "InputFact"("scenarioVersionId", "day", "domain", "layer");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
