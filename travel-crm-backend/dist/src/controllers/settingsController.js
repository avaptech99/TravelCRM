"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateDropdown = exports.warmDropdownCache = exports.getDropdowns = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const Setting_1 = __importDefault(require("../models/Setting"));
const cache_1 = require("../utils/cache");
const perfLogger_1 = require("../utils/perfLogger");
// @desc    Get all dropdown settings
// @route   GET /api/settings/dropdowns
// @access  Private (Admin Only)
exports.getDropdowns = (0, express_async_handler_1.default)(async (req, res) => {
    const t = (0, perfLogger_1.createTimer)('getDropdowns');
    const cacheKey = cache_1.CK.dropdowns();
    const cached = (0, cache_1.cacheGet)(cacheKey);
    if (cached) {
        res.setHeader('X-Cache-Status', 'HIT');
        t.end({ source: 'cache' });
        res.json(cached);
        return;
    }
    // If cache miss (should be rare with warmup), calculate
    const result = await calculateDropdowns();
    (0, cache_1.cacheSet)(cacheKey, result, cache_1.TTL.SETTINGS);
    res.setHeader('X-Cache-Status', 'MISS');
    t.end({ source: 'db' });
    res.json(result);
});
// Helper to calculate merged dropdowns (Pure JS logic)
async function calculateDropdowns() {
    const settings = await Setting_1.default.find().lean();
    const defaults = {
        companies: ['Skylight', 'Travowords', 'Travel Window Dubai', 'Travel Window Canada'],
        costTypes: ['Air Ticket', 'Hotel', 'Visa', 'Insurance', 'Transport', 'Others'],
        costSources: ['Self', 'Agent', 'Direct Vendor'],
        groups: ['Package / LCC', 'Ticketing INT', 'Visa', 'Operation', 'Account']
    };
    const result = { ...defaults };
    settings.forEach(s => {
        result[s.key] = s.values;
    });
    return result;
}
// Warmup function to be called at server startup
const warmDropdownCache = async () => {
    try {
        const result = await calculateDropdowns();
        (0, cache_1.cacheSet)(cache_1.CK.dropdowns(), result, cache_1.TTL.SETTINGS);
        console.log('✅ Dropdown cache warmed successfully');
    }
    catch (error) {
        console.error('❌ Failed to warm dropdown cache:', error);
    }
};
exports.warmDropdownCache = warmDropdownCache;
// @desc    Update a specific dropdown setting
// @route   PUT /api/settings/dropdowns/:key
// @access  Private (Admin Only)
exports.updateDropdown = (0, express_async_handler_1.default)(async (req, res) => {
    const { key } = req.params;
    const { values } = req.body;
    if (!Array.isArray(values)) {
        res.status(400);
        throw new Error('Values must be an array of strings');
    }
    let setting = await Setting_1.default.findOne({ key });
    if (setting) {
        setting.values = values;
        await setting.save();
    }
    else {
        setting = await Setting_1.default.create({ key, values });
    }
    // Invalidate dropdown cache
    cache_1.CacheInvalidation.onSettingsWrite();
    res.json({ message: `${key} updated successfully`, values: setting.values });
});
