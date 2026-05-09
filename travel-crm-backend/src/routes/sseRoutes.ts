import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import {
  registerSSEClient,
  removeSSEClient,
  getSSEStats,
} from '../sse/sseManager';
import { protect } from '../middleware/auth';

const router = Router();

// ── GET /api/stream — SSE connection endpoint ─────────────────────────────────
router.get('/', async (req: Request, res: Response) => {
  // ── Auth via query-string token ────────────────────────────────────────────
  // Browser EventSource API cannot send custom headers.
  // Token is passed as: /api/stream?token=xxx
  const token = req.query.token as string;

  if (!token) {
    return res.status(401).json({ message: 'Token required' });
  }

  let user: { id: string; role: string; name: string; groups: string[] };
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    user = {
      id:     decoded.id || decoded._id,
      role:   decoded.role,
      name:   decoded.name,
      groups: decoded.groups || [],
    };
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }

  // ── SSE headers ───────────────────────────────────────────────────────────
  res.setHeader('Content-Type',  'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection',    'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // disables Nginx/Render buffering
  res.flushHeaders(); // send headers immediately — client knows connection is open

  // ── Register ──────────────────────────────────────────────────────────────
  registerSSEClient(user.id, user.role, user.groups, res);

  // ── Send initial connected event ──────────────────────────────────────────
  res.write(`event: connected\ndata: ${JSON.stringify({
    userId:    user.id,
    role:      user.role,
    message:   'SSE connection established',
    timestamp: Date.now(),
  })}\n\n`);

  // ── Cleanup on disconnect ─────────────────────────────────────────────────
  req.on('close', () => {
    removeSSEClient(user.id);
  });

  req.on('error', () => {
    removeSSEClient(user.id);
  });

  // Note: do NOT call res.end() — connection stays open
});

// ── GET /api/stream/status — monitoring ──────────────────────────────────────
router.get('/status', protect, (req: any, res: Response) => {
  if (req.user.role.toUpperCase() !== 'ADMIN') {
    return res.status(403).json({ message: 'Admin only' });
  }
  res.json(getSSEStats());
});

export default router;
