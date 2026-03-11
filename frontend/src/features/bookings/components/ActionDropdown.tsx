import { Edit, Users, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Booking } from '../../../types';
import { useAuth } from '../../../context/AuthContext';

interface ActionDropdownProps {
    booking: Booking;
    onEditClick: (booking: Booking) => void;
}

export const ActionDropdown: React.FC<ActionDropdownProps> = ({
    booking,
    onEditClick,
}) => {
    const navigate = useNavigate();
    const { user } = useAuth();

    const isAgent = user?.role === 'AGENT';
    const isAssignedToMe = booking?.assignedToUserId === user?.id;
    const isReadOnly = isAgent && !isAssignedToMe;

    return (
        <div className="flex items-center gap-1">
            {isReadOnly ? (
                <button
                    onClick={() => navigate(`/bookings/${booking.id}`)}
                    className="p-2 text-amber-600 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 rounded-md transition-colors border border-transparent hover:border-amber-200"
                    title="View Details & Take Ownership"
                >
                    <Eye size={16} />
                </button>
            ) : (
                <>
                    <button
                        onClick={() => onEditClick(booking)}
                        className="p-2 text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 rounded-md transition-colors border border-transparent hover:border-indigo-200"
                        title="Edit Booking"
                    >
                        <Edit size={16} />
                    </button>

                    {booking.status === 'Booked' && (
                        <button
                            onClick={() => navigate(`/bookings/${booking.id}/travelers`)}
                            className="p-2 text-emerald-600 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-md transition-colors border border-transparent hover:border-emerald-200"
                            title="Update Travelers"
                        >
                            <Users size={16} />
                        </button>
                    )}
                </>
            )}
        </div>
    );
};
