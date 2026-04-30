"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateDropdownSetting = exports.getDropdownSettings = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const CrmSetting_1 = __importDefault(require("../models/CrmSetting"));
// Default values for first-time seeding
const DEFAULTS = {
    companies: ['Skylight', 'Travowords', 'Travel Window Dubai', 'Travel Window Canada'],
    costTypes: ['Air Ticket', 'Hotel', 'Visa'],
    costSources: [],
    groups: ['Package / LCC', 'Ticketing INT', 'Visa', 'Operation', 'Account'],
};
// @desc    Get all CRM dropdown settings
// @route   GET /api/settings/dropdowns
// @access  Private
exports.getDropdownSettings = (0, express_async_handler_1.default)(async (_req, res) => {
    const settings = await CrmSetting_1.default.find().lean();
    const result = {};
    // Merge DB values with defaults for any missing keys
    for (const key of Object.keys(DEFAULTS)) {
        const found = settings.find(s => s.key === key);
        result[key] = found ? found.values : DEFAULTS[key];
    }
    res.json(result);
});
// @desc    Update a specific dropdown setting
// @route   PUT /api/settings/dropdowns/:key
// @access  Private/Admin
exports.updateDropdownSetting = (0, express_async_handler_1.default)(async (req, res) => {
    const { key } = req.params;
    const { values } = req.body;
    if (!DEFAULTS.hasOwnProperty(key)) {
        res.status(400);
        throw new Error(`Invalid setting key: ${key}. Must be one of: ${Object.keys(DEFAULTS).join(', ')}`);
    }
    if (!Array.isArray(values)) {
        res.status(400);
        throw new Error('values must be an array of strings');
    }
    const setting = await CrmSetting_1.default.findOneAndUpdate({ key }, { key, values }, { upsert: true, new: true });
    res.json({ key: setting.key, values: setting.values });
});
