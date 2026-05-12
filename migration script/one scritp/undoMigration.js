/**
 * CRM 3.0 — UNDO MIGRATION
 * Restores database to the exact pre-migration state.
 *
 * Usage (mongosh):
 *   load("undoMigration.js")
 *
 * REQUIRES: backups created by masterMigration_FINAL.js in APPLY mode.
 * Backup collections: bookings_bak, passengers_bak, primarycontacts_bak,
 *                     comments_bak, payments_bak
 *
 * WHAT IT DOES:
 *   1. Verifies all backups exist before touching anything
 *   2. Drops current collections
 *   3. Restores each from its _bak counterpart (atomic $out)
 *   4. Reverts the index changes (drops segment index, restores travelDate index)
 *   5. Prints a post-undo health summary
 *
 * WHAT IT DOES NOT UNDO:
 *   - The _bak collections themselves (kept for safety — drop manually)
 *   - Any new bookings/passengers created AFTER the migration ran
 *     (those would be in the live collections, not the backups)
 */

// ─────────────────────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────────────────────

function esep() { print("═".repeat(58)); }
function sep()  { print("  " + "─".repeat(54)); }
function ok(m)  { print("  ✓  " + m); }
function fail(m){ print("  ✗  " + m); }
function warn(m){ print("  ⚠  " + m); }
function info(m){ print("  ·  " + m); }

// ─────────────────────────────────────────────────────────────
//  STEP 1 — VERIFY ALL BACKUPS EXIST BEFORE TOUCHING ANYTHING
// ─────────────────────────────────────────────────────────────

const restoreTargets = [
  { bak: "bookings_bak",        live: "bookings" },
  { bak: "passengers_bak",      live: "passengers" },
  { bak: "primarycontacts_bak", live: "primarycontacts" },
  { bak: "comments_bak",        live: "comments" },
  { bak: "payments_bak",        live: "payments" },
];

print("\n");
esep();
print(" CRM 3.0 UNDO MIGRATION  |  DB: " + db.getName());
esep();

print("\n  STEP 1 — Checking backups exist...\n");
sep();

const cols = db.getCollectionNames();
let missingBaks = 0;

restoreTargets.forEach(function(t) {
  if (!cols.includes(t.bak)) {
    fail("MISSING BACKUP: " + t.bak + " — cannot restore " + t.live);
    missingBaks++;
  } else {
    const cnt = db.getCollection(t.bak).countDocuments({});
    ok("Found: " + t.bak + " (" + cnt + " docs)");
  }
});

if (missingBaks > 0) {
  print("");
  sep();
  fail("UNDO ABORTED — " + missingBaks + " backup(s) missing.");
  print("  Backups are only created when masterMigration_FINAL.js runs in APPLY mode.");
  print("  If you never ran APPLY, there is nothing to undo.");
  print("");
  esep();
} else {
  // ─────────────────────────────────────────────────────────────
  //  STEP 2 — WARN ABOUT DATA CREATED AFTER MIGRATION
  // ─────────────────────────────────────────────────────────────

  print("\n  STEP 2 — Checking for new data created after migration...\n");
  sep();

  let hasNewData = false;
  restoreTargets.forEach(function(t) {
    const liveCnt = db.getCollection(t.live).countDocuments({});
    const bakCnt  = db.getCollection(t.bak).countDocuments({});
    if (liveCnt > bakCnt) {
      warn(t.live + ": " + liveCnt + " live vs " + bakCnt + " in backup — " + (liveCnt - bakCnt) + " doc(s) created after migration will be LOST");
      hasNewData = true;
    } else {
      ok(t.live + ": no new documents since backup (" + liveCnt + " docs)");
    }
  });

  if (hasNewData) {
    print("");
    warn("New data exists that will be lost on restore.");
    warn("If these are real customer records, export them first:");
    warn("  db.bookings.find({ createdAt: { \\$gt: ISODate(\"<migration-timestamp>\") } })");
    print("");
    warn("Proceeding in 0 seconds — this is IRREVERSIBLE for those records.");
    print("  (Edit this script to add a manual confirmation gate if needed.)");
  }

  // ─────────────────────────────────────────────────────────────
  //  STEP 3 — RESTORE COLLECTIONS
  // ─────────────────────────────────────────────────────────────

  print("\n  STEP 3 — Restoring collections from backups...\n");
  sep();

  let restored = 0;
  restoreTargets.forEach(function(t) {
    try {
      // Drop current live collection
      db.getCollection(t.live).drop();
      // Restore from backup using $out (creates the collection atomically)
      const bakCnt = db.getCollection(t.bak).countDocuments({});
      if (bakCnt > 0) {
        db.getCollection(t.bak).aggregate([{ $out: t.live }]);
      } else {
        db.createCollection(t.live);
      }
      const restoredCnt = db.getCollection(t.live).countDocuments({});
      ok(t.live + " restored from " + t.bak + " (" + restoredCnt + " docs)");
      restored++;
    } catch(e) {
      fail("Failed to restore " + t.live + ": " + e.message);
    }
  });

  // ─────────────────────────────────────────────────────────────
  //  STEP 4 — REVERT INDEXES
  // ─────────────────────────────────────────────────────────────

  print("\n  STEP 4 — Reverting indexes...\n");
  sep();

  // Drop the new segment-based index
  try {
    db.bookings.dropIndex("status_segment_departureDate");
    ok("Dropped: status_segment_departureDate");
  } catch(e) {
    info("status_segment_departureDate not found — already gone or never created");
  }

  // Restore the old travelDate compound index
  const existingIdx = db.bookings.getIndexes().map(function(i) { return i.name; });
  if (!existingIdx.includes("status_1_travelDate_1")) {
    try {
      db.bookings.createIndex({ status: 1, travelDate: 1 }, { background: true });
      ok("Restored: status_1_travelDate_1");
    } catch(e) {
      warn("Could not restore status_1_travelDate_1: " + e.message);
    }
  } else {
    ok("Already present: status_1_travelDate_1");
  }

  // ─────────────────────────────────────────────────────────────
  //  STEP 5 — POST-UNDO HEALTH CHECK
  // ─────────────────────────────────────────────────────────────

  print("\n  STEP 5 — Post-undo health check...\n");
  sep();

  restoreTargets.forEach(function(t) {
    const cnt = db.getCollection(t.live).countDocuments({});
    const bakCnt = db.getCollection(t.bak).countDocuments({});
    cnt === bakCnt
      ? ok(t.live + ": " + cnt + " docs (matches backup)")
      : fail(t.live + ": " + cnt + " docs (backup has " + bakCnt + " — mismatch)");
  });

  const idxAfter = db.bookings.getIndexes().map(function(i) { return i.name; });
  idxAfter.includes("status_1_travelDate_1")
    ? ok("Index restored: status_1_travelDate_1")
    : warn("Index NOT restored: status_1_travelDate_1");
  !idxAfter.includes("status_segment_departureDate")
    ? ok("Index removed: status_segment_departureDate")
    : warn("Index still present: status_segment_departureDate");

  // ─────────────────────────────────────────────────────────────
  //  SUMMARY
  // ─────────────────────────────────────────────────────────────

  print("\n");
  esep();
  print(" UNDO COMPLETE — " + restored + "/" + restoreTargets.length + " collections restored.");
  print("");
  print(" Backup collections are KEPT (not dropped). Remove manually when satisfied:");
  restoreTargets.forEach(function(t) { print("   db." + t.bak + ".drop()"); });
  print("");
  print(" Next: run masterMigration_FINAL.js in VERIFY mode to confirm restored state.");
  esep();
  print("");
}
