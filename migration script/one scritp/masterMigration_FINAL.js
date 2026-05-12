/**
 * CRM 3.0 — MASTER MIGRATION (All-in-One)
 * Combines: masterMigrationV3 + masterMigrationV4 + migrateToSegments + verifyMigration
 *
 * Usage (mongosh):
 *   load("masterMigration_FINAL.js")
 *
 * SET MODE BEFORE RUNNING:
 *   "VERIFY"   → health check only, zero writes, always safe to run
 *   "DRY_RUN"  → shows exactly what APPLY would change, zero writes
 *   "APPLY"    → creates backups, runs all phases, verifies result
 */

const MODE = "VERIFY"; // ← change this before running

// ─────────────────────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────────────────────

function sep()  { print("  " + "─".repeat(54)); }
function esep() { print("═".repeat(58)); }
function ok(m)  { print("  ✓  " + m); }
function fail(m){ print("  ✗  " + m); }
function warn(m){ print("  ⚠  " + m); }
function info(m){ print("  ·  " + m); }
function dry(m) { print("  →  " + m); }
function phase(n, title) {
  print("\n  PHASE " + n + " — " + title);
  sep();
}

// ─────────────────────────────────────────────────────────────
//  AUDIT — reads DB, returns counts. Never writes anything.
// ─────────────────────────────────────────────────────────────

function runAudit() {
  const A = {};
  const cols = db.getCollectionNames();

  // BOOKINGS
  A.bTotal           = db.bookings.countDocuments({});
  A.bStringAmt       = db.bookings.countDocuments({ amount: { $type: "string" } });
  A.bStringTotal     = db.bookings.countDocuments({ totalAmount: { $type: "string" } });
  A.bStringOutst     = db.bookings.countDocuments({ outstanding: { $type: "string" } });
  A.bStringFlight    = db.bookings.countDocuments({ includesFlight: { $type: "string" } });
  A.bMissingSnap     = db.bookings.countDocuments({ contact: { $exists: false } });
  A.bEmptySegments   = db.bookings.countDocuments({
    $or: [{ segments: { $exists: false } }, { segments: { $size: 0 } }]
  });
  A.bAmountNotSynced = db.bookings.countDocuments({
    amount: { $gt: 0 },
    $or: [{ totalAmount: 0 }, { totalAmount: null }]
  });
  A.bMissingPart     = db.bookings.countDocuments({
    $or: [{ participantIds: { $exists: false } }, { participantIds: { $size: 0 } }]
  });
  A.bOldSegFmt       = db.bookings.countDocuments({ "segments.date": { $exists: true } });
  A.bLegacyFlat      = db.bookings.countDocuments({
    $or: [{ flightFrom: { $nin: [null, ""] } }, { travelDate: { $ne: null } }]
  });

  // PASSENGERS
  A.pTotal           = db.passengers.countDocuments({});
  A.pWithFlight      = db.passengers.countDocuments({
    $or: [{ flightFrom: { $nin: [null, ""] } }, { flightTo: { $nin: [null, ""] } }]
  });
  A.pAlwaysEmpty     = db.passengers.countDocuments({ arrivalTime: { $exists: true } });
  A.pWithVKey        = db.passengers.countDocuments({ __v: { $exists: true } });

  // PRIMARY CONTACTS
  A.cTotal           = db.primarycontacts.countDocuments({});
  A.cStringInterest  = db.primarycontacts.countDocuments({ interested: { $type: "string" } });
  A.cWithEmail       = db.primarycontacts.countDocuments({ contactEmail: { $nin: [null, ""] } });

  // COMMENTS
  A.comTotal         = db.comments.countDocuments({});
  A.comLegacy        = db.comments.countDocuments({ createdById: { $exists: true } });

  // PAYMENTS
  A.pmTotal          = db.payments.countDocuments({});
  A.pmStringAmt      = db.payments.countDocuments({ amount: { $type: "string" } });

  // LEGACY COLLECTIONS TO DROP
  const legacy = ["timelines", "activities", "crmsettings", "travellers", "activities_backup"];
  A.legacyCols = legacy.filter(n => cols.includes(n));

  // INDEXES
  const idx = db.bookings.getIndexes().map(i => i.name);
  A.idxOldTravel   = idx.includes("status_1_travelDate_1");
  A.idxSegment     = idx.includes("status_segment_departureDate");
  A.idxParticipant = idx.includes("participantIds_1_status_1_createdAt_-1");
  A.idxOutstanding = idx.includes("outstanding_1_status_1");
  A.idxGroup       = idx.includes("assignedGroup_1_status_1");
  A.idxCreatedAt   = idx.includes("createdAt_-1");

  // BACKUPS
  A.hasBakBookings  = cols.includes("bookings_bak");
  A.hasBakPassengers= cols.includes("passengers_bak");
  A.hasBakComments  = cols.includes("comments_bak");
  A.hasBakContacts  = cols.includes("primarycontacts_bak");

  // ISSUE COUNT (things APPLY would fix)
  A.issues =
    (A.bStringAmt + A.bStringTotal + A.bStringOutst + A.bStringFlight > 0 ? 1 : 0) +
    (A.cStringInterest > 0 ? 1 : 0) +
    (A.pmStringAmt > 0 ? 1 : 0) +
    (A.bMissingSnap > 0 ? 1 : 0) +
    (A.bMissingPart > 0 ? 1 : 0) +
    (A.comLegacy > 0 ? 1 : 0) +
    (A.bEmptySegments > 0 ? 1 : 0) +
    (A.bOldSegFmt > 0 ? 1 : 0) +
    (A.legacyCols.length > 0 ? 1 : 0) +
    (!A.idxSegment || !A.idxParticipant || !A.idxOutstanding ? 1 : 0);

  return A;
}

// ─────────────────────────────────────────────────────────────
//  PRINT VERIFY REPORT
// ─────────────────────────────────────────────────────────────

function printVerify(A) {
  print("\n  BOOKINGS  (" + A.bTotal + " docs)");
  (A.bStringAmt + A.bStringTotal + A.bStringOutst + A.bStringFlight > 0)
    ? fail("wrong field types: amount=" + A.bStringAmt + " totalAmount=" + A.bStringTotal +
           " outstanding=" + A.bStringOutst + " includesFlight=" + A.bStringFlight + " stored as String")
    : ok("all numeric/boolean fields are correct native types");
  A.bMissingSnap > 0
    ? fail("missing contact snapshot: " + A.bMissingSnap + " bookings")
    : ok("all contact snapshots present");
  A.bMissingPart > 0
    ? fail("missing participantIds: " + A.bMissingPart + " bookings")
    : ok("all participantIds present");
  A.bEmptySegments > 0
    ? fail("empty segments[]: " + A.bEmptySegments + "/" + A.bTotal + " bookings need backfill")
    : ok("all segments[] populated");
  A.bOldSegFmt > 0
    ? fail("old segment format {date}: " + A.bOldSegFmt + " bookings need field rename → {departureDate}")
    : ok("segment field names are correct");
  A.bAmountNotSynced > 0
    ? warn("amount → totalAmount not synced: " + A.bAmountNotSynced + " bookings")
    : ok("totalAmount synced from amount");
  A.bLegacyFlat > 0
    ? warn("legacy flat flight fields still exist: " + A.bLegacyFlat +
           " bookings (remove AFTER frontend updated — see finalMigration_CRM3.js)")
    : ok("no legacy flat flight fields");

  print("\n  PASSENGERS  (" + A.pTotal + " docs)");
  A.pWithFlight > 0
    ? warn("flight fields still in passengers: " + A.pWithFlight +
           " docs (remove AFTER frontend updated — see finalMigration_CRM3.js)")
    : ok("passengers are traveler-only data");
  A.pAlwaysEmpty > 0
    ? warn("arrivalTime/returnArrivalTime/returnDate still present: " + A.pAlwaysEmpty + " docs")
    : ok("no always-empty fields");
  A.pWithVKey > 0
    ? warn("__v key present: " + A.pWithVKey + " docs")
    : ok("no __v keys");

  print("\n  PRIMARY CONTACTS  (" + A.cTotal + " docs)");
  A.cStringInterest > 0
    ? fail("interested stored as \"Yes\"/\"No\" string: " + A.cStringInterest + " docs")
    : ok("interested is Boolean");
  A.cWithEmail > 0
    ? warn("contactEmail non-null: " + A.cWithEmail + " docs (will be archived to booking before removal)")
    : ok("contactEmail clear");

  print("\n  PAYMENTS  (" + A.pmTotal + " docs)");
  A.pmStringAmt > 0
    ? fail("amount stored as String: " + A.pmStringAmt + " docs")
    : ok("payment amount is correct Number type");

  print("\n  COMMENTS  (" + A.comTotal + " docs)");
  A.comLegacy > 0
    ? fail("legacy createdById field: " + A.comLegacy + " docs need sync to userId")
    : ok("comments normalized");

  print("\n  LEGACY COLLECTIONS");
  A.legacyCols.length > 0
    ? fail("still present, will be dropped: " + A.legacyCols.join(", "))
    : ok("all legacy collections already gone");

  print("\n  INDEXES");
  A.idxSegment     ? ok("status_segment_departureDate") : fail("MISSING: status_segment_departureDate");
  A.idxParticipant ? ok("participantIds_1_status_1_createdAt_-1") : fail("MISSING: participantIds_1_status_1_createdAt_-1");
  A.idxOutstanding ? ok("outstanding_1_status_1") : fail("MISSING: outstanding_1_status_1");
  A.idxGroup       ? ok("assignedGroup_1_status_1") : warn("MISSING: assignedGroup_1_status_1");
  A.idxCreatedAt   ? ok("createdAt_-1") : warn("MISSING: createdAt_-1");
  A.idxOldTravel   ? warn("OLD INDEX still alive: status_1_travelDate_1 (will be dropped)") : ok("status_1_travelDate_1 already removed");

  print("\n  BACKUPS");
  A.hasBakBookings   ? ok("bookings_bak exists — undo is available") : info("no bookings_bak (created on APPLY)");
  A.hasBakPassengers ? ok("passengers_bak exists") : info("no passengers_bak (created on APPLY)");
  A.hasBakComments   ? ok("comments_bak exists")   : info("no comments_bak (created on APPLY)");
  A.hasBakContacts   ? ok("primarycontacts_bak exists") : info("no primarycontacts_bak (created on APPLY)");

  print("");
  sep();
  A.issues === 0
    ? ok("ALL CHECKS PASSED — database is clean")
    : fail(A.issues + " area(s) need attention. Run DRY_RUN to preview, APPLY to fix.");
}

// ─────────────────────────────────────────────────────────────
//  PRINT DRY RUN PREVIEW
// ─────────────────────────────────────────────────────────────

function printDryRun(A) {
  print("\n  DRY RUN — What APPLY would do (zero writes)\n");
  sep();

  phase(1, "Type normalization");
  const typeCount = A.bStringAmt + A.bStringTotal + A.bStringOutst + A.bStringFlight;
  typeCount > 0
    ? dry("Fix " + A.bStringAmt + " bookings where amount is String → Number")
    + (A.bStringFlight > 0 ? dry("Fix " + A.bStringFlight + " bookings where includesFlight is String → Boolean") : null)
    : ok("Nothing to fix — all types correct");
  A.pmStringAmt > 0 ? dry("Fix " + A.pmStringAmt + " payments where amount is String → Number") : ok("Payment amounts already correct");
  A.cStringInterest > 0 ? dry("Fix " + A.cStringInterest + " primarycontacts where interested is \"Yes\"/\"No\" → Boolean") : ok("interested already Boolean");

  phase(2, "Contact snapshot backfill  [V3]");
  A.bMissingSnap > 0
    ? dry("Lookup primarycontacts and build contact{} snapshot for " + A.bMissingSnap + " bookings")
    : ok("Nothing to backfill — all snapshots present");

  phase(3, "ParticipantIds backfill  [V3]");
  A.bMissingPart > 0
    ? dry("Build participantIds[] from createdByUserId + assignedToUserId for " + A.bMissingPart + " bookings")
    : ok("Nothing to backfill — all participantIds present");

  phase(4, "Comments cleanup  [V3]");
  A.comLegacy > 0
    ? dry("Sync createdById → userId for " + A.comLegacy + " comments, then unset createdById + type + __v")
    : ok("Nothing to clean — comments already normalized");

  phase(5, "Segments backfill  [migrateToSegments]");
  if (A.bEmptySegments > 0) {
    dry("Build segments[0] from flat fields (flightFrom/flightTo/travelDate/returnDate/tripType/destination) for " + A.bEmptySegments + " bookings");
    dry("Fallback to passenger.flightFrom/flightTo/departureTime if booking has no flat data");
    A.bAmountNotSynced > 0 ? dry("Also sync amount → totalAmount for " + A.bAmountNotSynced + " bookings") : null;
  } else {
    ok("Nothing to backfill — all segments already populated");
  }
  A.bOldSegFmt > 0
    ? dry("Rename segments[].date → segments[].departureDate for " + A.bOldSegFmt + " bookings (old format)")
    : ok("Segment field names already correct");

  phase(6, "Drop legacy collections  [V4]");
  A.legacyCols.length > 0
    ? A.legacyCols.forEach(c => {
        const cnt = db.getCollection(c).countDocuments({});
        dry("DROP " + c + " (" + cnt + " docs) — already migrated to passengers/comments");
      })
    : ok("Nothing to drop — legacy collections already gone");

  phase(7, "Index optimization  [V4]");
  !A.idxSegment     ? dry("CREATE: { status:1, 'segments.0.departureDate':1 }  name=status_segment_departureDate") : ok("Already exists: status_segment_departureDate");
  !A.idxParticipant ? dry("CREATE: { participantIds:1, status:1, createdAt:-1 }") : ok("Already exists: participantIds_1_status_1_createdAt_-1");
  !A.idxOutstanding ? dry("CREATE: { outstanding:1, status:1 }") : ok("Already exists: outstanding_1_status_1");
  !A.idxGroup       ? dry("CREATE: { assignedGroup:1, status:1 }") : ok("Already exists: assignedGroup_1_status_1");
  !A.idxCreatedAt   ? dry("CREATE: { createdAt:-1 }") : ok("Already exists: createdAt_-1");
  A.idxOldTravel    ? dry("DROP:   status_1_travelDate_1 (replaced by segment index)") : ok("Already removed: status_1_travelDate_1");

  print("\n  BACKUPS THAT WILL BE CREATED FIRST:");
  dry("bookings → bookings_bak (" + A.bTotal + " docs)   via $out aggregate");
  dry("passengers → passengers_bak (" + A.pTotal + " docs)");
  dry("primarycontacts → primarycontacts_bak (" + A.cTotal + " docs)");
  dry("comments → comments_bak (" + A.comTotal + " docs)");
  dry("payments → payments_bak (" + A.pmTotal + " docs)");

  print("");
  sep();
  print("  No writes made. Set MODE = \"APPLY\" to execute.");
}

// ─────────────────────────────────────────────────────────────
//  BACKUP  (uses $out for atomic collection copy)
// ─────────────────────────────────────────────────────────────

function runBackup() {
  const targets = [
    { col: "bookings",        bak: "bookings_bak" },
    { col: "passengers",      bak: "passengers_bak" },
    { col: "primarycontacts", bak: "primarycontacts_bak" },
    { col: "comments",        bak: "comments_bak" },
    { col: "payments",        bak: "payments_bak" },
  ];
  targets.forEach(function(t) {
    const cnt = db.getCollection(t.col).countDocuments({});
    if (db.getCollectionNames().includes(t.bak)) {
      db.getCollection(t.bak).drop();
    }
    if (cnt > 0) {
      db.getCollection(t.col).aggregate([{ $out: t.bak }]);
    } else {
      db.createCollection(t.bak);
    }
    ok(t.col + " → " + t.bak + " (" + cnt + " docs)");
  });
}

// ─────────────────────────────────────────────────────────────
//  PHASE 1 — Type normalization
// ─────────────────────────────────────────────────────────────

function applyPhase1() {
  let fixed = 0;
  // Bookings
  db.bookings.find({
    $or: [
      { amount: { $type: "string" } },
      { totalAmount: { $type: "string" } },
      { outstanding: { $type: "string" } },
      { includesFlight: { $type: "string" } }
    ]
  }).forEach(function(doc) {
    const u = {};
    if (typeof doc.amount === "string")         u.amount         = parseFloat(doc.amount) || 0;
    if (typeof doc.totalAmount === "string")    u.totalAmount    = parseFloat(doc.totalAmount) || 0;
    if (typeof doc.outstanding === "string")    u.outstanding    = parseFloat(doc.outstanding) || 0;
    if (typeof doc.includesFlight === "string") u.includesFlight = (doc.includesFlight.toLowerCase() === "true");
    db.bookings.updateOne({ _id: doc._id }, { $set: u });
    fixed++;
  });
  // Payments
  db.payments.find({ amount: { $type: "string" } }).forEach(function(doc) {
    db.payments.updateOne({ _id: doc._id }, { $set: { amount: parseFloat(doc.amount) || 0 } });
    fixed++;
  });
  // PrimaryContacts — interested "Yes"/"No" → Boolean
  db.primarycontacts.find({ interested: { $type: "string" } }).forEach(function(doc) {
    const val = (doc.interested === "Yes" || doc.interested === "true");
    db.primarycontacts.updateOne({ _id: doc._id }, { $set: { interested: val } });
    fixed++;
  });
  fixed > 0 ? ok("Fixed " + fixed + " documents with wrong types") : ok("All types already correct — nothing to do");
}

// ─────────────────────────────────────────────────────────────
//  PHASE 2 — Contact snapshot backfill
// ─────────────────────────────────────────────────────────────

function applyPhase2() {
  let backfilled = 0;
  db.bookings.find({ contact: { $exists: false } }).forEach(function(doc) {
    const pcId = doc.primaryContactId || doc.contactId;
    if (!pcId) return;
    const objId = (typeof pcId === "string") ? ObjectId(pcId) : pcId;
    const pc = db.primarycontacts.findOne({ _id: objId });
    if (!pc) return;
    db.bookings.updateOne({ _id: doc._id }, {
      $set: {
        contact: {
          name:         pc.contactName   || "",
          phone:        pc.contactPhoneNo || "",
          email:        pc.contactEmail  || null,
          type:         pc.bookingType === "Agent (B2B)" ? "B2B" : "B2C",
          requirements: pc.requirements  || null,
          interested:   (pc.interested === "Yes" || pc.interested === true)
        },
        primaryContactId: objId
      }
    });
    backfilled++;
  });
  backfilled > 0 ? ok("Backfilled " + backfilled + " contact snapshots") : ok("All snapshots already present");
}

// ─────────────────────────────────────────────────────────────
//  PHASE 3 — ParticipantIds backfill
// ─────────────────────────────────────────────────────────────

function applyPhase3() {
  let fixed = 0;
  db.bookings.find({
    $or: [{ participantIds: { $exists: false } }, { participantIds: { $size: 0 } }]
  }).forEach(function(doc) {
    const ids = [doc.createdByUserId, doc.assignedToUserId].filter(function(id) { return id != null; });
    if (ids.length === 0) return;
    db.bookings.updateOne({ _id: doc._id }, { $set: { participantIds: ids } });
    fixed++;
  });
  fixed > 0 ? ok("Backfilled participantIds for " + fixed + " bookings") : ok("All participantIds already present");
}

// ─────────────────────────────────────────────────────────────
//  PHASE 4 — Comments cleanup
// ─────────────────────────────────────────────────────────────

function applyPhase4() {
  db.comments.updateMany(
    { userId: { $exists: false }, createdById: { $exists: true } },
    [{ $set: { userId: "$createdById" } }]
  );
  const r = db.comments.updateMany({}, { $unset: { createdById: "", type: "", __v: "" } });
  ok("Comments normalized (" + r.modifiedCount + " docs updated)");
}

// ─────────────────────────────────────────────────────────────
//  PHASE 5 — Segments backfill
// ─────────────────────────────────────────────────────────────

function applyPhase5() {
  let backfilled = 0, alreadyDone = 0, amtSynced = 0, noData = 0;

  db.bookings.find({}).forEach(function(b) {
    const hasRealSeg = b.segments && b.segments.length > 0 &&
      b.segments.some(function(s) { return s.from || s.to || s.departureDate || s.date; });

    if (hasRealSeg) {
      // Fix old { date } → { departureDate } field name
      const needsRename = b.segments.some(function(s) { return s.date && !s.departureDate; });
      if (needsRename) {
        const updated = b.segments.map(function(s) {
          return {
            from:                s.from   || "",
            to:                  s.to     || "",
            departureDate:       s.departureDate || s.date || null,
            returnDate:          s.returnDate    || null,
            returnDepartureTime: s.returnDepartureTime || null,
            tripType:            s.tripType || b.tripType || "one-way",
            country:             s.country  || b.destination || null,
          };
        });
        db.bookings.updateOne({ _id: b._id }, { $set: { segments: updated } });
        backfilled++;
      } else {
        alreadyDone++;
      }
      return;
    }

    // Build segment from legacy root fields
    let from    = b.flightFrom   || null;
    let to      = b.flightTo     || null;
    let depDate = b.travelDate   || null;
    let retDate = b.returnDate   || null;
    const tripType = b.tripType  || "one-way";
    const country  = b.destination || null;

    // Fallback: look up first passenger's flight data
    if (!from && !to && !depDate) {
      const pax = db.passengers.findOne({ bookingId: b._id });
      if (pax) {
        from    = pax.flightFrom   || from;
        to      = pax.flightTo     || to;
        depDate = pax.departureTime       ? new Date(pax.departureTime)       : depDate;
        retDate = pax.returnDepartureTime ? new Date(pax.returnDepartureTime) : retDate;
      }
    }

    if (!from && !to && !depDate) { noData++; return; }

    const setData = {
      segments: [{
        from:                from    || "",
        to:                  to      || "",
        departureDate:       depDate || null,
        returnDate:          retDate || null,
        returnDepartureTime: null,
        tripType:            tripType,
        country:             country,
      }]
    };

    // Sync amount → totalAmount where totalAmount is missing
    if ((b.totalAmount === 0 || !b.totalAmount) && b.amount > 0) {
      setData.totalAmount = b.amount;
      amtSynced++;
    }

    db.bookings.updateOne({ _id: b._id }, { $set: setData });
    backfilled++;
  });

  ok("Segments backfilled: " + backfilled);
  if (alreadyDone > 0) ok("Already had valid segments: " + alreadyDone + " (skipped)");
  if (amtSynced > 0)   ok("amount → totalAmount synced: " + amtSynced);
  if (noData > 0)      info("No flight data found: " + noData + " bookings (segments stays [])");
}

// ─────────────────────────────────────────────────────────────
//  PHASE 6 — Drop legacy collections
// ─────────────────────────────────────────────────────────────

function applyPhase6(legacyCols) {
  if (legacyCols.length === 0) { ok("No legacy collections to drop"); return; }
  legacyCols.forEach(function(c) {
    const cnt = db.getCollection(c).countDocuments({});
    db.getCollection(c).drop();
    ok("Dropped: " + c + " (" + cnt + " docs)");
  });
}

// ─────────────────────────────────────────────────────────────
//  PHASE 7 — Index optimization
// ─────────────────────────────────────────────────────────────

function applyPhase7(A) {
  // Drop the old travelDate index first
  if (A.idxOldTravel) {
    try { db.bookings.dropIndex("status_1_travelDate_1"); ok("Dropped old index: status_1_travelDate_1"); }
    catch(e) { warn("Could not drop status_1_travelDate_1: " + e.message); }
  }

  if (!A.idxSegment) {
    db.bookings.createIndex(
      { status: 1, "segments.0.departureDate": 1 },
      { background: true, name: "status_segment_departureDate" }
    );
    ok("Created: status_segment_departureDate");
  } else { ok("Already exists: status_segment_departureDate"); }

  if (!A.idxParticipant) {
    db.bookings.createIndex({ participantIds: 1, status: 1, createdAt: -1 }, { background: true });
    ok("Created: participantIds_1_status_1_createdAt_-1");
  } else { ok("Already exists: participantIds_1_status_1_createdAt_-1"); }

  if (!A.idxOutstanding) {
    db.bookings.createIndex({ outstanding: 1, status: 1 }, { background: true });
    ok("Created: outstanding_1_status_1");
  } else { ok("Already exists: outstanding_1_status_1"); }

  if (!A.idxGroup) {
    db.bookings.createIndex({ assignedGroup: 1, status: 1 }, { background: true });
    ok("Created: assignedGroup_1_status_1");
  } else { ok("Already exists: assignedGroup_1_status_1"); }

  if (!A.idxCreatedAt) {
    db.bookings.createIndex({ createdAt: -1 }, { background: true });
    ok("Created: createdAt_-1");
  } else { ok("Already exists: createdAt_-1"); }
}

// ─────────────────────────────────────────────────────────────
//  MAIN RUNNER
// ─────────────────────────────────────────────────────────────

print("\n");
esep();
print(" CRM 3.0 MASTER MIGRATION  |  DB: " + db.getName() + "  |  MODE: " + MODE);
esep();

if (MODE !== "VERIFY" && MODE !== "DRY_RUN" && MODE !== "APPLY") {
  print("\n  ERROR: Unknown MODE \"" + MODE + "\"");
  print("  Valid options: \"VERIFY\"  \"DRY_RUN\"  \"APPLY\"");
  print("");
} else {

  // AUDIT always runs
  const A = runAudit();

  if (MODE === "VERIFY") {
    print("\n  VERIFY REPORT — " + db.getName());
    sep();
    printVerify(A);

  } else if (MODE === "DRY_RUN") {
    print("\n  VERIFY REPORT — " + db.getName() + "  (current state)");
    sep();
    printVerify(A);
    print("");
    esep();
    printDryRun(A);
    print("");
    esep();
    print(" DRY RUN COMPLETE — no writes made.");
    print(" Set MODE = \"APPLY\" to execute.");
    esep();

  } else if (MODE === "APPLY") {

    // Pre-migration verify
    print("\n  PRE-MIGRATION STATE\n");
    sep();
    printVerify(A);

    if (A.issues === 0) {
      print("");
      esep();
      print(" Nothing to migrate — all checks already pass.");
      print(" If this is unexpected, run VERIFY and DRY_RUN first.");
      esep();
    } else {
      // Backup
      print("\n");
      esep();
      print(" STEP 1 — BACKUPS");
      esep();
      runBackup();

      // Run all phases
      print("\n");
      esep();
      print(" STEP 2 — MIGRATION");
      esep();
      phase(1, "Type normalization");       applyPhase1();
      phase(2, "Contact snapshot backfill");applyPhase2();
      phase(3, "ParticipantIds backfill");  applyPhase3();
      phase(4, "Comments cleanup");         applyPhase4();
      phase(5, "Segments backfill");        applyPhase5();
      phase(6, "Drop legacy collections");  applyPhase6(A.legacyCols);
      phase(7, "Index optimization");       applyPhase7(A);

      // Post-migration verify
      print("\n");
      esep();
      print(" STEP 3 — POST-MIGRATION VERIFY");
      esep();
      const A2 = runAudit();
      printVerify(A2);

      // Summary
      print("\n");
      esep();
      if (A2.issues === 0) {
        print(" MIGRATION COMPLETE — all checks pass.");
      } else {
        print(" MIGRATION COMPLETE WITH " + A2.issues + " REMAINING WARNING(S) — see verify report above.");
      }
      print(" Backups kept: bookings_bak  passengers_bak  comments_bak  primarycontacts_bak  payments_bak");
      print(" To roll back: load(\"undoMigration.js\")");
      esep();
    }
  }
}
