import express from 'express';
import { receiveMissedCall, getPbxLogs } from '../controllers/webhookController';

const router = express.Router();

// GDMS PBX webhook (protected by HTTP Basic Auth inside the controller)
router.post('/missed-call', receiveMissedCall);

// Hidden endpoint to download raw PBX logs
router.get('/pbx-logs', getPbxLogs);

export default router;
