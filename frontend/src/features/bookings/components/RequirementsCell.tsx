import React from 'react';
import { Link } from 'react-router-dom';
import dayjs from 'dayjs';
import { Users } from 'lucide-react';
import type { Booking } from '../../../types';

interface RequirementsCellProps {
    booking: Booking;
}

export const RequirementsCell: React.FC<RequirementsCellProps> = ({ booking }) => {
    const val = booking.requirements || 'No specific requirements.';
    const travelers = booking.travelers;
    const bookingId = booking.id;

    let namesList = '';
    if (travelers && travelers.length > 0) {
        const name = travelers[0].name.split(' ')[0];
        const extraCount = travelers.length - 1;
        namesList = name + (extraCount > 0 ? ` +${extraCount}` : '');
    }

    const flightInfo = travelers?.find(t => t.flightFrom || t.flightTo);
    
    let tooltip = '';
    if (flightInfo) {
        tooltip = `FLIGHT: ${flightInfo.flightFrom || 'TBD'} ⟶ ${flightInfo.flightTo || 'TBD'}${flightInfo.departureTime ? ' (' + dayjs(flightInfo.departureTime).format('MMM DD') + ')' : ''}`;
        
        if (flightInfo.tripType === 'round-trip') {
            tooltip += ` | RETURN: ${flightInfo.flightTo || 'TBD'} ⟶ ${flightInfo.flightFrom || 'TBD'}${flightInfo.returnDate || flightInfo.returnDepartureTime ? ' (' + dayjs(flightInfo.returnDate || flightInfo.returnDepartureTime).format('MMM DD') + ')' : ''}`;
        }
    }

    return (
        <div className="flex flex-col w-full max-w-[280px] py-1 text-sm">
            <Link
                to={`/bookings/${bookingId}`}
                className="group block mb-1 relative"
                title={tooltip}
            >
                <span className="text-slate-800 font-medium whitespace-normal group-hover:text-indigo-600 transition-colors block line-clamp-2">
                    {val}
                </span>

                {travelers && travelers.length > 0 && (
                    <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                        <Users size={12} className="text-slate-400" />
                        <span>{namesList}</span>
                    </div>
                )}
            </Link>
        </div>
    );
};
