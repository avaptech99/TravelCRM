/**
 * RESET ADMIN PASSWORD SCRIPT
 * Sets admin@travel.com password to: Aim4next@26
 */

const d = db.getSiblingDB('TravelCRM');

const result = d.users.updateOne(
  { email: "admin@travel.com" },
  { 
    $set: { 
      passwordHash: "$2b$10$RSFocCO1BvicweB4b64TCeOVG7HqL9OuGRLgJN56OmtYbLYS56/3S" 
    } 
  }
);

if (result.matchedCount > 0) {
    print('✅ SUCCESS: Password reset for admin@travel.com');
} else {
    print('❌ ERROR: User admin@travel.com not found in database: ' + d.getName());
}
