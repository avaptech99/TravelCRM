// Step 1: set MODE = "VERIFY", then:
load("masterMigration_FINAL.js")
// Read the report. If all checks pass, you're done.

// Step 2: set MODE = "DRY_RUN", then:
load("masterMigration_FINAL.js")
// Confirm what it plans to do before any write happens.

// Step 3: set MODE = "APPLY", then:
load("masterMigration_FINAL.js")
// Runs backup → all 7 phases → post-verify in one shot.

// Step 4: if something went wrong:
load("undoMigration.js")
// Restores everything from the _bak collections.