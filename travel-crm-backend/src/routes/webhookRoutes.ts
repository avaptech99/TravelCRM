import express from 'express';
import { receiveMissedCall } from '../controllers/webhookController';

const router = express.Router();

// ponytail: GDMS PBX webhook (protected by HTTP Basic Auth inside controller)
router.post('/missed-call', receiveMissedCall);

export default router;
