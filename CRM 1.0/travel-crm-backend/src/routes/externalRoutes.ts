import express from 'express';
import { createExternalLead } from '../controllers/externalController';

const router = express.Router();

router.post('/lead', createExternalLead);

export default router;
