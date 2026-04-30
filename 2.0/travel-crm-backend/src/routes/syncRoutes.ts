import express from 'express';
import { getGlobalSync } from '../controllers/syncController';
import { protect } from '../middleware/auth';

const router = express.Router();

router.use(protect);

router.get('/', getGlobalSync);

export default router;
