import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import CrmSetting from '../models/CrmSetting';

// Default values for first-time seeding
const DEFAULTS: Record<string, string[]> = {
    companies: ['Skylight', 'Travowords', 'Travel Window Dubai', 'Travel Window Canada'],
    costTypes: ['Air Ticket', 'Hotel', 'Visa'],
    costSources: [],
    groups: ['Package / LCC', 'Ticketing INT', 'Visa', 'Operation', 'Account'],
};

// @desc    Get all CRM dropdown settings
// @route   GET /api/settings/dropdowns
// @access  Private
export const getDropdownSettings = asyncHandler(async (_req: Request, res: Response) => {
    const settings = await CrmSetting.find().lean();
    const result: Record<string, string[]> = {};

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
export const updateDropdownSetting = asyncHandler(async (req: Request, res: Response) => {
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

    const setting = await CrmSetting.findOneAndUpdate(
        { key },
        { key, values },
        { upsert: true, new: true }
    );

    res.json({ key: setting.key, values: setting.values });
});
