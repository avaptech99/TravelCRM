import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import Setting from '../models/Setting';
import appCache from '../utils/cache';

// @desc    Get all dropdown settings
// @route   GET /api/settings/dropdowns
// @access  Private (Admin Only)
export const getDropdowns = asyncHandler(async (req: Request, res: Response) => {
    const cacheKey = 'settings_dropdowns';
    const cached = appCache.get(cacheKey);
    if (cached) {
        console.log(`[CACHE HIT] ${cacheKey}`);
        res.json(cached);
        return;
    }

    const settings = await Setting.find();
    const result: Record<string, string[]> = {};
    
    // Initialize default if empty
    const defaultKeys = ['companies', 'costTypes', 'costSources', 'groups'];
    const defaults: Record<string, string[]> = {
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
    appCache.set(cacheKey, result, 3600);
    res.json(result);
});

// @desc    Update a specific dropdown setting
// @route   PUT /api/settings/dropdowns/:key
// @access  Private (Admin Only)
export const updateDropdown = asyncHandler(async (req: Request, res: Response) => {
    const { key } = req.params;
    const { values } = req.body;

    if (!Array.isArray(values)) {
        res.status(400);
        throw new Error('Values must be an array of strings');
    }

    let setting = await Setting.findOne({ key });

    if (setting) {
        setting.values = values;
        await setting.save();
    } else {
        setting = await Setting.create({ key, values });
    }

    // Invalidate dropdown cache
    appCache.del('settings_dropdowns');

    res.json({ message: `${key} updated successfully`, values: setting.values });
});
