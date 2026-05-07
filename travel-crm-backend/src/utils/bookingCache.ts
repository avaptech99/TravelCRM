import Booking from '../models/Booking';
import appCache from './cache';

/**
 * Re-fetches the booking from DB with all populates and updates the cache.
 * Switch from Invalidate-Only to Write-Through pattern.
 */
export async function refreshBookingCache(bookingId: string) {
  const booking = await Booking.findById(bookingId)
    .populate('assignedToUserId', 'name role')
    .populate('createdByUserId', 'name role')
    .populate('passengers')
    .populate('payments')
    .populate({
        path: 'timeline',
        populate: { path: 'userId', select: 'name role' },
        options: { sort: { createdAt: -1 }, limit: 20 }
    })
    .lean()
    .maxTimeMS(3000);

  if (booking) {
    // Write-through: cache is always warm, never cold after a mutation
    appCache.set(`booking_${bookingId}`, booking, 600); // 10 minute TTL
    return booking;
  }
  
  // If booking not found, ensure cache is cleared
  appCache.del(`booking_${bookingId}`);
  return null;
}

/**
 * Simply invalidates the booking cache.
 */
export async function invalidateBookingCache(bookingId: string) {
  appCache.del(`booking_${bookingId}`);
}
