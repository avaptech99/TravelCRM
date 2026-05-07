import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import Setting from '../models/Setting';
import appCache from '../utils/cache';
import { createTimer } from '../utils/perfLogger';

// @desc    Get all dropdown settings
// @route   GET /api/settings/dropdowns
// @access  Private (Admin Only)
export const getDropdowns = asyncHandler(async (req: Request, res: Response) => {
    const t = createTimer('getDropdowns');
    t.mark('checkCache');
    const cacheKey = 'settings_dropdowns';
    const cached = appCache.get(cacheKey);
    if (cached) {
        res.setHeader('X-Cache-Status', 'HIT');
        t.end({ source: 'cache' });
        res.json(cached);
        return;
    }

    t.mark('dbQuery');
    const settings = await Setting.find();
    const result: Record<string, string[]> = {};
    
    t.mark('mergeDefaults');
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
    res.setHeader('X-Cache-Status', 'MISS');
    t.end({ source: 'db' });
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
