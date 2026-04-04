import express from 'express';
import { handleMissedCallWebhook } from '../controllers/webhookController';

const router = express.Router();

router.post('/missed-call', handleMissedCallWebhook);

export default router;
