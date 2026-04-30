import express from 'express';
import { getDropdownSettings, updateDropdownSetting } from '../controllers/settingsController';
import { protect, adminGuard } from '../middleware/auth';

const router = express.Router();

router.use(protect);

router.get('/dropdowns', getDropdownSettings);
router.put('/dropdowns/:key', adminGuard, updateDropdownSetting);

export default router;
