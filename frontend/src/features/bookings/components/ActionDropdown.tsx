import { Edit, Users, Eye, UserMinus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Booking } from '../../../types';
import { useAuth } from '../../../context/AuthContext';

interface ActionDropdownProps {
    booking: Booking;
    onEditClick: (booking: Booking) => void;
    onUnassignClick?: (booking: Booking) => void;
}

export const ActionDropdown: React.FC<ActionDropdownProps> = ({
    booking,
    onEditClick,
    onUnassignClick,
}) => {
    const navigate = useNavigate();
    const { user } = useAuth();

    const isMarketer = user?.role === 'MARKETER';
    const isAgent = user?.role === 'AGENT';
    const isAssignedToMe = booking?.assignedToUserId === user?.id;
    const isCreatedByMe = booking?.createdByUserId === user?.id;
    
    // Marketers can only edit if they created it AND it's unassigned.
    // Agents can only edit if assigned to them or created by them.
    const canEdit = user?.role === 'ADMIN' || (isMarketer && isCreatedByMe && !booking.assignedToUserId) || (isAgent && (isAssignedToMe || isCreatedByMe));
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

                    {booking.status === 'Booked' && !isMarketer && (
                        <button
                            onClick={() => navigate(`/bookings/${booking.id}/travelers`)}
                            className="p-2 text-emerald-600 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-md transition-colors border border-transparent hover:border-emerald-200"
                            title="Update Travelers"
                        >
                            <Users size={16} />
                        </button>
                    )}

                    {onUnassignClick && !isMarketer && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onUnassignClick(booking); }}
                            className="p-2 text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 rounded-md transition-colors border border-transparent hover:border-rose-200"
                            title="Unassign Booking"
                        >
                            <UserMinus size={16} />
                        </button>
                    )}
                </>
            )}
        </div>
    );

};
