"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateDropdown = exports.getDropdowns = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const Setting_1 = __importDefault(require("../models/Setting"));
const cache_1 = __importDefault(require("../utils/cache"));
// @desc    Get all dropdown settings
// @route   GET /api/settings/dropdowns
// @access  Private (Admin Only)
exports.getDropdowns = (0, express_async_handler_1.default)(async (req, res) => {
    const cacheKey = 'settings_dropdowns';
    const cached = cache_1.default.get(cacheKey);
    if (cached) {
        console.log(`[CACHE HIT] ${cacheKey}`);
        res.json(cached);
        return;
    }
    const settings = await Setting_1.default.find();
    const result = {};
    // Initialize default if empty
    const defaultKeys = ['companies', 'costTypes', 'costSources', 'groups'];
    const defaults = {
        companies: ['Skylight', 'Travowords', 'Travel Window Dubai', 'Travel Window Canada'],
        costTypes: ['Air Ticket', 'Hotel', 'Visa', 'Insurance', 'Transport', 'Others'],
        costSources: ['Self', 'Agent', 'Direct Vendor'],
        groups: ['Package / LCC', 'Ticketing INT', 'Visa', 'Operation', 'Account']
    };
    settings.forEach(s => {
        result[s.key] = s.values;
    });
    // Merge with defaults if missing
    defaultKeys.forEach(key => {
        if (!result[key]) {
            result[key] = defaults[key];
        }
    });
    // Cache the merged result for 1 hour
    cache_1.default.set(cacheKey, result, 3600);
    res.json(result);
});
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
    cache_1.default.del('settings_dropdowns');
    res.json({ message: `${key} updated successfully`, values: setting.values });
});
