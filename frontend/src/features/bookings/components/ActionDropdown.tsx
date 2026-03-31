import { Edit, Users, Eye, UserMinus, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Booking } from '../../../types';
import { useAuth } from '../../../context/AuthContext';

interface ActionDropdownProps {
    booking: Booking;
    onEditClick: (booking: Booking) => void;
    onUnassignClick?: (booking: Booking) => void;
    onDeleteClick?: (booking: Booking) => void;
}

export const ActionDropdown: React.FC<ActionDropdownProps> = ({
    booking,
    onEditClick,
    onUnassignClick,
    onDeleteClick,
}) => {
    const navigate = useNavigate();
    const { user } = useAuth();

    const canEdit = user?.role === 'ADMIN' || 
                   (user?.role === 'AGENT' && (booking.assignedToUserId === user.id || booking.createdByUserId === user.id)) ||
                   (user?.role === 'MARKETER' && booking.createdByUserId === user.id && !booking.assignedToUserId);

    const canDelete = user?.role === 'ADMIN';

    const isReadOnly = !canEdit;

    return (
        <div className="flex items-center gap-1">
            {isReadOnly ? (
                <button
                    onClick={() => navigate(`/bookings/${booking.id}`)}
                    className="p-2 text-amber-600 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 rounded-md transition-colors border border-transparent hover:border-amber-200"
                    title="View Details"
                >
                    <Eye size={16} />
                </button>
            ) : (
                <>
                    <button
                        onClick={() => onEditClick(booking)}
                        className="p-2 text-secondary hover:text-secondary bg-secondary/10 hover:bg-secondary/20 rounded-md transition-colors border border-transparent hover:border-secondary/20"
                        title="Edit Booking"
                    >
                        <Edit size={16} />
                    </button>

                    {booking.status === 'Booked' && user?.role !== 'MARKETER' && (
                        <button
                            onClick={() => navigate(`/bookings/${booking.id}/travelers`)}
                            className="p-2 text-emerald-600 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-md transition-colors border border-transparent hover:border-emerald-200"
                            title="Update Travelers"
                        >
                            <Users size={16} />
                        </button>
                    )}

                    {onUnassignClick && user?.role !== 'MARKETER' && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onUnassignClick(booking); }}
                            className="p-2 text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 rounded-md transition-colors border border-transparent hover:border-rose-200"
                            title="Unassign Booking"
                        >
                            <UserMinus size={16} />
                        </button>
                    )}

                    {canDelete && onDeleteClick && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onDeleteClick(booking); }}
                            className="p-2 text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 rounded-md transition-colors border border-transparent hover:border-red-200"
                            title="Delete Booking"
                        >
                            <Trash2 size={16} />
                        </button>
                    )}
                </>
            )}
        </div>
    );

};
