/**
 * CRM 2.0 Requirements Compliance Test Script
 * Tests the codebase against "CRM Enhancements & Feature Requirements.md"
 * 
 * Usage: node test-crm-requirements.js
 */

const fs = require('fs');
const path = require('path');

const BACKEND = path.join(__dirname, 'travel-crm-backend', 'src');
const FRONTEND = path.join(__dirname, 'frontend', 'src');

let passed = 0;
let failed = 0;
let warnings = 0;

function check(label, condition, detail = '') {
    if (condition) {
        console.log(`  ✅ PASS: ${label}`);
        passed++;
    } else {
        console.log(`  ❌ FAIL: ${label}${detail ? ' — ' + detail : ''}`);
        failed++;
    }
}

function warn(label, detail = '') {
    console.log(`  ⚠️  WARN: ${label}${detail ? ' — ' + detail : ''}`);
    warnings++;
}

function readFile(filePath) {
    try { return fs.readFileSync(filePath, 'utf8'); } catch { return ''; }
}

function fileExists(filePath) {
    return fs.existsSync(filePath);
}

// =====================================================================
// REQUIREMENT 1: Lead Filters (Left Menu)
// =====================================================================
console.log('\n' + '═'.repeat(70));
console.log('📊 REQUIREMENT 1: Lead Filters (All Leads / My Leads / Unassigned)');
console.log('═'.repeat(70));

const sidebar = readFile(path.join(FRONTEND, 'components', 'layout', 'Sidebar.tsx'));
const appTsx = readFile(path.join(FRONTEND, 'App.tsx'));

check('Sidebar has "All Bookings" nav item', sidebar.includes("'All Bookings'") || sidebar.includes('"All Bookings"'));
check('Sidebar has "My Leads" nav item', sidebar.includes("'My Leads'") || sidebar.includes('"My Leads"'));
check('Sidebar has "Unassigned Leads" nav item', sidebar.includes("'Unassigned Leads'") || sidebar.includes('"Unassigned Leads"'));

check('Route /bookings exists', appTsx.includes('"/bookings"'));
check('Route /my-bookings exists', appTsx.includes('"/my-bookings"'));
check('Route /unassigned-bookings exists', appTsx.includes('"/unassigned-bookings"'));

// Check if unassigned bookings has a real implementation
const unassignedImport = appTsx.match(/UnassignedBookings.*lazy.*import.*\.then/s);
if (unassignedImport && unassignedImport[0].includes('Bookings')) {
    warn('UnassignedBookings route reuses Bookings component without pre-filtering', 
         'Should auto-filter for unassigned leads only');
}

// Check MyBookings page uses isMyBookingsView
const myBookings = readFile(path.join(FRONTEND, 'pages', 'MyBookings.tsx'));
check('MyBookings passes isMyBookingsView=true to BookingsTable', myBookings.includes('isMyBookingsView={true}') || myBookings.includes('isMyBookingsView'));

// Backend lead visibility enforcement
const bookingCtrl = readFile(path.join(BACKEND, 'controllers', 'bookingController.ts'));
check('Backend enforces leadVisibility permission', bookingCtrl.includes("perms.leadVisibility === 'own'"));
check('Backend has myBookings filter', bookingCtrl.includes("myBookings === 'true'"));

// =====================================================================
// REQUIREMENT 2: User Roles & Access Control
// =====================================================================
console.log('\n' + '═'.repeat(70));
console.log('👥 REQUIREMENT 2: User Roles & Access Control');
console.log('═'.repeat(70));

const userModel = readFile(path.join(BACKEND, 'models', 'User.ts'));
const bookingModel = readFile(path.join(BACKEND, 'models', 'Booking.ts'));

// 2.1 Permission fields exist
check('User model has leadVisibility permission', userModel.includes('leadVisibility'));
check('User model has canAssignLeads permission', userModel.includes('canAssignLeads'));
check('User model has canEditActualCost permission', userModel.includes('canEditActualCost'));
check('User model has canVerifyBookings permission', userModel.includes('canVerifyBookings'));
check('User model has canManageUsers permission', userModel.includes('canManageUsers'));
check('User model has canViewReports permission', userModel.includes('canViewReports'));
check('User model has featureAccess.visa', userModel.includes('visa'));
check('User model has featureAccess.ticketing', userModel.includes('ticketing'));
check('User model has featureAccess.operation', userModel.includes('operation'));
check('User model has featureAccess.account', userModel.includes('account'));

// 2.2 Role-based visibility
check('leadVisibility supports "all" (Agent/Package/LCC)', userModel.includes("'all'"));
check('leadVisibility supports "own" (Visa/Ticketing)', userModel.includes("'own'"));

// 2.3 Operation users see only booked queries
check('Operation/Account users filtered to Booked status',
    bookingCtrl.includes("perms.featureAccess?.operation") && bookingCtrl.includes("query.status = 'Booked'"));

// 2.4 Verify booking endpoint
check('Verify booking endpoint exists', bookingCtrl.includes('verifyBooking'));
check('Only Booked queries can be verified', bookingCtrl.includes("booking.status !== 'Booked'"));

// 2.5 Booking model has verified + verifiedBy
check('Booking model has verified field', bookingModel.includes('verified'));
check('Booking model has verifiedBy field', bookingModel.includes('verifiedBy'));

// Verify route registered
const bookingRoutes = readFile(path.join(BACKEND, 'routes', 'bookingRoutes.ts'));
check('Verify booking route registered', bookingRoutes.includes("/:id/verify"));

// JWT includes permissions
const jwt = readFile(path.join(BACKEND, 'utils', 'jwt.ts'));
check('JWT token includes permissions', jwt.includes('permissions: user.permissions'));

// Permission middleware exists
check('checkPermission middleware exists', fileExists(path.join(BACKEND, 'middleware', 'checkPermission.ts')));

// Check assign booking restriction (ISSUE)
const assignFuncMatch = bookingCtrl.match(/assignBooking[\s\S]*?agent\.role !== 'AGENT'/);
if (assignFuncMatch) {
    warn('assignBooking restricts assignment to AGENT role only', 
         'Spec says queries can be assigned to Visa/Ticketing/Operation users too');
}

// =====================================================================
// REQUIREMENT 3: Finalize Booking – Company Dropdown
// =====================================================================
console.log('\n' + '═'.repeat(70));
console.log('🧾 REQUIREMENT 3: Finalize Booking – Company Dropdown');
console.log('═'.repeat(70));

check('Booking model has companyName field', bookingModel.includes('companyName'));
check('updateBookingSchema includes companyName', 
    readFile(path.join(BACKEND, 'types', 'index.ts')).includes("companyName"));

const settingsCtrl = readFile(path.join(BACKEND, 'controllers', 'settingsController.ts'));
check('Default companies include Skylight', settingsCtrl.includes('Skylight'));
check('Default companies include Travowords', settingsCtrl.includes('Travowords'));
check('Default companies include Travel Window Dubai', settingsCtrl.includes('Travel Window Dubai'));
check('Default companies include Travel Window Canada', settingsCtrl.includes('Travel Window Canada'));

// Settings endpoint
const settingsRoutes = readFile(path.join(BACKEND, 'routes', 'settingsRoutes.ts'));
check('GET /api/settings/dropdowns route exists', settingsRoutes.includes("get('/dropdowns'") || settingsRoutes.includes('getDropdownSettings'));
check('PUT /api/settings/dropdowns/:key is admin-only', settingsRoutes.includes('adminGuard') && settingsRoutes.includes("put('/dropdowns/:key'"));

// Frontend Settings page
const settingsPage = readFile(path.join(FRONTEND, 'pages', 'Settings.tsx'));
check('Settings page has Dropdown Management section', settingsPage.includes('Dropdown Management'));
check('Settings page has Companies dropdown editor', settingsPage.includes("'companies'") || settingsPage.includes('"companies"'));

// Check EditModal for companyName
const editModal = readFile(path.join(FRONTEND, 'features', 'bookings', 'components', 'EditModal.tsx'));
check('EditModal references companyName field', editModal.includes('companyName'));

// =====================================================================
// REQUIREMENT 4: Query Reporting (Group by Contact Number)
// =====================================================================
console.log('\n' + '═'.repeat(70));
console.log('📂 REQUIREMENT 4: Query Reporting (Group by Contact Number)');
console.log('═'.repeat(70));

const analyticsCtrl = readFile(path.join(BACKEND, 'controllers', 'analyticsController.ts'));
const reportsPage = readFile(path.join(FRONTEND, 'pages', 'Reports.tsx'));

// Check if grouped query reporting exists
const hasGrouping = analyticsCtrl.includes('contactPhoneNo') && analyticsCtrl.includes('$group');
const hasGroupingUI = reportsPage.includes('groupedQueries') || reportsPage.includes('queryGrouping') || reportsPage.includes('grouped');

check('Backend has query grouping by contact number', hasGrouping, 
    'Need endpoint to group queries by primaryContact.contactPhoneNo');
check('Reports UI has grouped query view', hasGroupingUI, 
    'Reports page needs a section showing queries grouped by contact number');

// =====================================================================
// REQUIREMENT 5: Payment Filters (Reports)
// =====================================================================
console.log('\n' + '═'.repeat(70));
console.log('💰 REQUIREMENT 5: Payment Filters (Reports)');
console.log('═'.repeat(70));

// Backend analytics
check('Payment breakdown endpoint exists', analyticsCtrl.includes('getPaymentBreakdown'));
check('Payment analytics has date filter', analyticsCtrl.includes('fromDate') && analyticsCtrl.includes('toDate'));
check('Payment analytics has company filter', analyticsCtrl.includes('companyName'));

// Pending Payments
check('Payment breakdown tracks pending payments', analyticsCtrl.includes('pending'));
check('Payment breakdown tracks received payments', analyticsCtrl.includes('received'));
check('Payment breakdown has totalPending', analyticsCtrl.includes('totalPending'));
check('Payment breakdown has totalReceived', analyticsCtrl.includes('totalReceived'));

// Analytics routes
const analyticsRoutes = readFile(path.join(BACKEND, 'routes', 'analyticsRoutes.ts'));
check('GET /analytics/payment-breakdown route registered', analyticsRoutes.includes('payment-breakdown'));

// Frontend Reports
check('Reports page has date filter inputs', reportsPage.includes('type="date"'));
check('Reports page has company filter input', reportsPage.includes('Filter by Company'));
check('Reports page shows Pending Payments section', reportsPage.includes('Pending Payments'));
check('Reports page shows Received Payments section', reportsPage.includes('Received Payments'));
check('Reports page shows Total Pending amount', reportsPage.includes('totalPending'));
check('Reports page shows Total Received amount', reportsPage.includes('totalReceived'));

// =====================================================================
// REQUIREMENT 6: Create New Booking – Group Dropdown
// =====================================================================
console.log('\n' + '═'.repeat(70));
console.log('🆕 REQUIREMENT 6: Create New Booking – Group Assignment Dropdown');
console.log('═'.repeat(70));

const newBookingModal = readFile(path.join(FRONTEND, 'features', 'bookings', 'components', 'NewBookingModal.tsx'));
const types = readFile(path.join(BACKEND, 'types', 'index.ts'));

check('Booking model has assignedGroup field', bookingModel.includes('assignedGroup'));
check('createBookingSchema includes assignedGroup', types.includes('assignedGroup'));
check('NewBookingModal has assignedGroup dropdown', newBookingModal.includes('assignedGroup'));
check('NewBookingModal fetches groups from dropdown settings', newBookingModal.includes('dropdownSettings?.groups'));

// Default groups
check('Default groups include Package / LCC', settingsCtrl.includes('Package / LCC'));
check('Default groups include Ticketing INT', settingsCtrl.includes('Ticketing INT'));
check('Default groups include Visa', settingsCtrl.includes("'Visa'"));
check('Default groups include Operation', settingsCtrl.includes("'Operation'"));
check('Default groups include Account', settingsCtrl.includes("'Account'"));

// Backend createBooking handles assignedGroup
check('createBooking stores assignedGroup', bookingCtrl.includes("assignedGroup: result.data.assignedGroup"));

// =====================================================================
// REQUIREMENT 7: Pricing Information Enhancements
// =====================================================================
console.log('\n' + '═'.repeat(70));
console.log('💸 REQUIREMENT 7: Estimated Cost & Actual Cost Sections');
console.log('═'.repeat(70));

// 7a: Estimated Cost
check('Booking model has estimatedCosts array', bookingModel.includes('estimatedCosts'));
check('estimatedCosts has costType field', bookingModel.includes("costType: { type: String"));
check('estimatedCosts has price field', bookingModel.includes("price: { type: Number"));
check('estimatedCosts has source field', bookingModel.includes("source: { type: String"));
check('Booking model has estimatedMargin field', bookingModel.includes('estimatedMargin'));

// 7b: Actual Cost
check('Booking model has actualCosts array', bookingModel.includes('actualCosts'));
check('Booking model has netMargin field', bookingModel.includes('netMargin'));

// Auto-calculation
check('updateBooking calculates estimatedMargin', bookingCtrl.includes('booking.estimatedMargin = income - totalEstimatedCost'));
check('updateBooking calculates netMargin', bookingCtrl.includes('booking.netMargin = income - totalActualCost'));

// Schema validation
check('updateBookingSchema has estimatedCosts', types.includes('estimatedCosts'));
check('updateBookingSchema has actualCosts', types.includes('actualCosts'));

// Cost type defaults
check('Default costTypes include Air Ticket', settingsCtrl.includes('Air Ticket'));
check('Default costTypes include Hotel', settingsCtrl.includes('Hotel'));
check('Default costTypes include Visa (costType)', settingsCtrl.includes("'Visa'"));

// Frontend EditModal check for cost sections
check('EditModal references estimatedCosts', editModal.includes('estimatedCosts'));
check('EditModal references actualCosts', editModal.includes('actualCosts'));

// =====================================================================
// ADDITIONAL CHECKS
// =====================================================================
console.log('\n' + '═'.repeat(70));
console.log('🔧 ADDITIONAL CHECKS');
console.log('═'.repeat(70));

// Duplicate routes
const userRoutes = readFile(path.join(BACKEND, 'routes', 'userRoutes.ts'));
const createUserMatches = (userRoutes.match(/router\.(post|get|put|delete)\('\/'/g) || []);
const postRootCount = (userRoutes.match(/router\.post\('\/',/g) || []).length;
const deleteIdCount = (userRoutes.match(/router\.delete\('\/:id',/g) || []).length;
if (postRootCount > 1) warn('Duplicate POST / route in userRoutes.ts', `Found ${postRootCount} registrations`);
if (deleteIdCount > 1) warn('Duplicate DELETE /:id route in userRoutes.ts', `Found ${deleteIdCount} registrations`);

// Server mounts all required routes
const server = readFile(path.join(BACKEND, 'server.ts'));
check('Server mounts /api/bookings', server.includes("'/api/bookings'"));
check('Server mounts /api/users', server.includes("'/api/users'"));
check('Server mounts /api/analytics', server.includes("'/api/analytics'"));
check('Server mounts /api/settings', server.includes("'/api/settings'"));
check('Server mounts /api/auth', server.includes("'/api/auth'"));

// CrmSetting model
check('CrmSetting model exists', fileExists(path.join(BACKEND, 'models', 'CrmSetting.ts')));

// =====================================================================
// SUMMARY
// =====================================================================
console.log('\n' + '═'.repeat(70));
console.log('📋 COMPLIANCE SUMMARY');
console.log('═'.repeat(70));
console.log(`  ✅ Passed:   ${passed}`);
console.log(`  ❌ Failed:   ${failed}`);
console.log(`  ⚠️  Warnings: ${warnings}`);
console.log('─'.repeat(70));

const total = passed + failed;
const percentage = total > 0 ? ((passed / total) * 100).toFixed(1) : 0;
console.log(`  Compliance: ${percentage}% (${passed}/${total})`);

if (failed === 0 && warnings === 0) {
    console.log('\n  🎉 ALL REQUIREMENTS FULLY COMPLIANT!\n');
} else if (failed === 0) {
    console.log('\n  ✅ All requirements pass, but there are warnings to address.\n');
} else {
    console.log(`\n  ⚠️  ${failed} requirement(s) need fixes. See details above.\n`);
}

process.exit(failed > 0 ? 1 : 0);
