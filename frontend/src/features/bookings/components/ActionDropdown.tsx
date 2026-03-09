import React from 'react';
import { Edit, Users } from 'lucide-react';
import type { Booking } from '../../../types';

interface ActionDropdownProps {
    booking: Booking;
    onEditClick: (booking: Booking) => void;
    onUpdateTravelersClick: (booking: Booking) => void;
}

export const ActionDropdown: React.FC<ActionDropdownProps> = ({
    booking,
    onEditClick,
    onUpdateTravelersClick,
}) => {
    return (
        <div className="flex items-center gap-1">
            <button
                onClick={() => onEditClick(booking)}
                className="p-2 text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 rounded-md transition-colors border border-transparent hover:border-indigo-200"
                title="Edit Booking"
            >
                <Edit size={16} />
            </button>
            {booking.status === 'Booked' && (
                <button
                    onClick={() => onUpdateTravelersClick(booking)}
                    className="p-2 text-emerald-600 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-md transition-colors border border-transparent hover:border-emerald-200"
                    title="Update Travelers"
                >
                    <Users size={16} />
                </button>
            )}
        </div>
    );
};
