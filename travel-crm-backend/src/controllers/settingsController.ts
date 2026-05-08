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
    const cacheKey = 'settings_dropdowns';
    const cached = appCache.get(cacheKey);
    
    if (cached) {
        res.setHeader('X-Cache-Status', 'HIT');
        t.end({ source: 'cache' });
        res.json(cached);
        return;
    }

    // If cache miss (should be rare with warmup), calculate
    const result = await calculateDropdowns();
    appCache.set(cacheKey, result, 86400); // 24 hour cache
    
    res.setHeader('X-Cache-Status', 'MISS');
    t.end({ source: 'db' });
    res.json(result);
});

// Helper to calculate merged dropdowns (Pure JS logic)
async function calculateDropdowns() {
    const settings = await Setting.find().lean();
    const defaults: Record<string, string[]> = {
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
export const warmDropdownCache = async () => {
    try {
        const result = await calculateDropdowns();
        appCache.set('settings_dropdowns', result, 86400);
        console.log('✅ Dropdown cache warmed successfully');
    } catch (error) {
        console.error('❌ Failed to warm dropdown cache:', error);
    }
};

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
