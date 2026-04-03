import express from 'express';
import { protect } from '../middleware/auth';
import { getMyNotifications, markNotificationAsRead, dismissNotification, dismissAllNotifications, deleteNotification } from '../controllers/notificationController';

const router = express.Router();

router.use(protect); // All notification routes are private

router.route('/').get(getMyNotifications);
router.route('/dismiss-all').put(dismissAllNotifications);  // Must be before /:id routes
router.route('/:id/read').put(markNotificationAsRead);
router.route('/:id/dismiss').put(dismissNotification);
router.route('/:id').delete(deleteNotification);

export default router;
