"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheInvalidation = exports.CK = exports.TTL = void 0;
exports.bumpBookingWriteVersion = bumpBookingWriteVersion;
exports.getBookingWriteVersion = getBookingWriteVersion;
exports.cacheGet = cacheGet;
exports.cacheSet = cacheSet;
exports.cacheDel = cacheDel;
exports.cacheInvalidatePrefix = cacheInvalidatePrefix;
exports.getCacheStats = getCacheStats;
const node_cache_1 = __importDefault(require("node-cache"));
// ─── Cache instance ───────────────────────────────────────────────────────────
const appCache = new node_cache_1.default({
    stdTTL: 60, // default — always override per cacheSet() call
    checkperiod: 30, // scan for expired keys every 30s — prevents memory leak
    useClones: false, // no deep cloning — critical for large booking arrays
    maxKeys: 1000, // hard ceiling — prevents unbounded filter-combo growth
    deleteOnExpire: true, // auto-delete expired entries immediately
});
// ─── TTL constants — one place to change everything ──────────────────────────
exports.TTL = {
    BOOKING_DETAIL: 30, // 30s — busted on every write
    BOOKING_LIST: 30, // 30s — many filter combos, bust on any booking write
    BOOKING_STATS: 120, // 2min — dashboard stats
    BOOKING_RECENT: 60, // 1min — recent bookings widget
    BOOKING_CALENDAR: 60, // 1min — calendar view
    AGENTS: 600, // 10min — almost never changes
    ALL_USERS: 60, // 1min — role changes must propagate quickly
    USER_PROFILE: 120, // 2min — individual profile
    NOTIFICATIONS: 60, // 1min — was 300s, far too long for a live CRM
    // SSE will push instantly, cache = cold-load only
    DROPDOWNS: 3600, // 1hr — never changes mid-session
    SETTINGS: 3600, // 1hr — system settings
    ANALYTICS_SHORT: 120, // 2min
    ANALYTICS_LONG: 600, // 10min
    ANALYTICS: 300, // 5min fallback
    USERS: 60, // 1min
    SYNC: 120, // 2min
};
// ─── Cache key builders — no more inline string templates ────────────────────
exports.CK = {
    bookingDetail: (id) => `booking_${id}`,
    // userId included: queries like myBookings=true/assignedTo mean something
    // different per user, so the cache key must be scoped per user, not just
    // per query-string -- otherwise different users' results collide.
    bookingList: (params, userId) => `bookings_${userId || 'anon'}_${stableHash(params)}`,
    bookingStats: (userId) => `stats_${userId}`,
    bookingRecent: (userId) => `recent_${userId}`,
    bookingCalendar: (params) => `calendar_${stableHash(params)}`,
    agents: () => 'users_agents',
    allUsers: () => 'all_users',
    userProfile: (userId) => `user_${userId}`,
    notifications: (userId) => `notif_${userId}`,
    dropdowns: () => 'settings_dropdowns',
    settings: () => 'settings_main',
    analytics: (type, params) => `analytics_${type}_${stableHash(params)}`,
    sync: (userId) => `sync_${userId}`,
};
// ─── Per-booking write versioning ──────────────────────────────────────────────
// Closes a race: a GET that started before a write can still be mid-flight
// (real Atlas/Render network latency, not instant) when that write's
// invalidation runs. If the GET then finishes and blindly caches its
// pre-write snapshot, it silently re-poisons the cache for the full TTL --
// invisible to the client until the next lucky cache miss. A reader captures
// the version before it starts; if the version moved by the time it's ready
// to cache, a write happened mid-flight, so it skips caching (correctness
// over hit rate -- the next request just does a fresh, safe read).
const bookingWriteVersion = new Map();
function bumpBookingWriteVersion(bookingId) {
    bookingWriteVersion.set(bookingId, (bookingWriteVersion.get(bookingId) || 0) + 1);
}
function getBookingWriteVersion(bookingId) {
    return bookingWriteVersion.get(bookingId) || 0;
}
// ─── Typed cache wrappers ─────────────────────────────────────────────────────
function cacheGet(key) {
    const val = appCache.get(key);
    return val !== undefined ? val : null;
}
function cacheSet(key, value, ttl) {
    appCache.set(key, value, ttl);
}
function cacheDel(key) {
    appCache.del(key);
}
function cacheInvalidatePrefix(prefix) {
    const keys = appCache.keys().filter((k) => k.startsWith(prefix));
    if (keys.length > 0)
        appCache.del(keys);
}
// ─── Invalidation helpers — one function per event type ──────────────────────
// ALL synchronous (0ms). Call BEFORE res.json(). Never await.
exports.CacheInvalidation = {
    // ANY booking write: create, update, delete, status, assign, verify
    onBookingWrite(bookingId, userId) {
        bumpBookingWriteVersion(bookingId);
        appCache.del(exports.CK.bookingDetail(bookingId));
        cacheInvalidatePrefix('bookings_');
        cacheInvalidatePrefix('stats_');
        cacheInvalidatePrefix('recent_');
        cacheInvalidatePrefix('calendar_');
        if (userId)
            appCache.del(exports.CK.sync(userId));
    },
    // payment add or delete
    onPaymentWrite(bookingId) {
        bumpBookingWriteVersion(bookingId);
        appCache.del(exports.CK.bookingDetail(bookingId));
        cacheInvalidatePrefix('analytics_');
        cacheInvalidatePrefix('stats_');
    },
    // notification create, read, dismiss, delete
    onNotificationWrite(userId) {
        appCache.del(exports.CK.notifications(userId));
    },
    // user create, update, delete, role change
    onUserWrite() {
        appCache.del(exports.CK.agents());
        appCache.del(exports.CK.allUsers());
        cacheInvalidatePrefix('user_');
    },
    // settings or dropdown update
    onSettingsWrite() {
        appCache.del(exports.CK.dropdowns());
        appCache.del(exports.CK.settings());
    },
    // comment, passenger, attachment — detail only
    onBookingDetailWrite(bookingId) {
        bumpBookingWriteVersion(bookingId);
        appCache.del(exports.CK.bookingDetail(bookingId));
    },
    // bulk operations — nuclear option
    flush() {
        appCache.flushAll();
        console.log('[CACHE] Full flush executed');
    },
};
// ─── Stats for monitoring endpoint ───────────────────────────────────────────
function getCacheStats() {
    const s = appCache.getStats();
    const total = s.hits + s.misses;
    return {
        keys: s.keys,
        hits: s.hits,
        misses: s.misses,
        hitRate: total > 0 ? ((s.hits / total) * 100).toFixed(1) + '%' : '0%',
        ksize: s.ksize, // key size in bytes
        vsize: s.vsize, // value size in bytes
        vsizeMB: (s.vsize / 1024 / 1024).toFixed(2) + 'MB',
    };
}
// ─── Internal ─────────────────────────────────────────────────────────────────
// Stable object hash — {a:1,b:2} and {b:2,a:1} produce same key
function stableHash(obj) {
    const clean = Object.keys(obj)
        .sort()
        .reduce((acc, k) => {
        const v = obj[k];
        if (v !== undefined && v !== null && v !== '')
            acc[k] = v;
        return acc;
    }, {});
    return JSON.stringify(clean);
}
exports.default = appCache;
