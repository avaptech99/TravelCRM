import express from 'express';
import { protect } from '../middleware/auth';
import { getMyNotifications, markNotificationAsRead } from '../controllers/notificationController';

const router = express.Router();

router.use(protect); // All notification routes are private

router.route('/').get(getMyNotifications);
router.route('/:id/read').put(markNotificationAsRead);

export default router;
