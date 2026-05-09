import express from 'express';
import { getDropdowns, updateDropdown } from '../controllers/settingsController';
import { protect, adminGuard } from '../middleware/auth';
import { getCacheStats } from '../utils/cache';
import { getBGStats } from '../utils/background';

const router = express.Router();

// Dropdown routes
router.get('/dropdowns', protect, getDropdowns);
router.put('/dropdowns/:key', protect, adminGuard, updateDropdown);

// Cache Monitoring
router.get('/cache-stats', protect, adminGuard, (req: any, res: any) => {
  res.json({
    cache: getCacheStats(),
    background: getBGStats(),
    memory: {
      heapUsed:  Math.round(process.memoryUsage().heapUsed  / 1024 / 1024) + 'MB',
      heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + 'MB',
      rss:       Math.round(process.memoryUsage().rss       / 1024 / 1024) + 'MB',
    },
    uptime: Math.round(process.uptime()) + 's',
    pid: process.pid,
  });
});

export default router;
