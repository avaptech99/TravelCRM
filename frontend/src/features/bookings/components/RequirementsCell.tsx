import React from 'react';
import { Link } from 'react-router-dom';
import dayjs from 'dayjs';
import type { Booking } from '../../../types';

interface RequirementsCellProps {
    booking: Booking;
}

export const RequirementsCell: React.FC<RequirementsCellProps> = ({ booking }) => {
    const val = booking.requirements || 'No specific requirements.';
    const travelers = booking.travelers;
    const bookingId = booking.id;

    let summaryNode: React.ReactNode = null;
    if (travelers && travelers.length > 0) {
        const primary = travelers[0];

        // Build passenger names list (only 1)
        const name = travelers[0].name.split(' ')[0];
        const extraCount = travelers.length - 1;
        const namesList = name + (extraCount > 0 ? ` +${extraCount}` : '');

        if (primary.flightFrom || primary.flightTo) {
            const from = primary.flightFrom || 'TBD';
            const to = primary.flightTo || 'TBD';
            const dep = primary.departureTime ? dayjs(primary.departureTime).format('MMM DD, HH:mm') : 'TBD';
            const arr = primary.arrivalTime ? dayjs(primary.arrivalTime).format('MMM DD, HH:mm') : 'TBD';

            let returnNode = null;
            if (primary.tripType === 'round-trip' && (primary.returnDate || primary.returnDepartureTime || primary.returnArrivalTime)) {
                const retDep = primary.returnDepartureTime ? dayjs(primary.returnDepartureTime).format('MMM DD, HH:mm') : 'TBD';
                const retArr = primary.returnArrivalTime ? dayjs(primary.returnArrivalTime).format('MMM DD, HH:mm') : 'TBD';
                returnNode = (
                    <div className="mt-1.5 pt-1.5 border-t border-indigo-100">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-semibold text-amber-700">Return</span>
                            <span className="bg-indigo-100 text-indigo-800 font-bold px-2 py-0.5 rounded flex-1 text-center text-xs border border-indigo-200 shadow-sm">{to} ⟶ {from}</span>
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-slate-600 bg-slate-50 p-1.5 rounded border border-slate-100">
                            <div className="flex items-center gap-1"><span title="Departure">🛫</span> {retDep}</div>
                            <div className="flex items-center gap-1"><span title="Arrival">🛬</span> {retArr}</div>
                        </div>
                    </div>
                );
            }

            summaryNode = (
                <div className="flex flex-col gap-1.5 mt-2">
                    <div className="flex items-center gap-2">
                        <span className="bg-indigo-100 text-indigo-800 font-bold px-2 py-0.5 rounded flex-1 text-center text-xs border border-indigo-200 shadow-sm">{from}</span>
                        <span className="text-indigo-400">⟶</span>
                        <span className="bg-indigo-100 text-indigo-800 font-bold px-2 py-0.5 rounded flex-1 text-center text-xs border border-indigo-200 shadow-sm">{to}</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-600 bg-slate-50 p-1.5 rounded border border-slate-100">
                        <div className="flex items-center gap-1"><span title="Departure">🛫</span> {dep}</div>
                        <div className="flex items-center gap-1"><span title="Arrival">🛬</span> {arr}</div>
                    </div>
                    {returnNode}
                    <div className="text-xs text-slate-600 font-medium flex items-center gap-1 mt-0.5">
                        👤 {namesList}
                    </div>
                </div>
            );
        } else {
            // No flight details — still show passenger names with any available info
            summaryNode = (
                <div className="flex flex-col gap-1 mt-2 p-2 bg-indigo-50/50 rounded-md border border-indigo-50">
                    <div className="flex items-center justify-between">
                        <span className="font-semibold text-indigo-800 text-xs flex items-center gap-1">
                            🌍 {primary.country || 'TBD'}
                        </span>
                    </div>
                    <div className="text-xs text-slate-600 font-medium flex items-center gap-1">
                        👤 {namesList}
                    </div>
                </div>
            );
        }
    }

    return (
        <div className="flex flex-col w-full max-w-[280px] py-1 text-sm">
            <Link to={`/bookings/${bookingId}`} className="group block mb-1">
                <span className="text-slate-800 font-medium whitespace-normal group-hover:text-indigo-600 transition-colors block line-clamp-3" title={val}>
                    {val}
                </span>
            </Link>

            <Link to={`/bookings/${bookingId}`} className="group block">
                {summaryNode && (
                    <div className="mt-1.5 group-hover:opacity-90 transition-opacity">
                        {summaryNode}
                    </div>
                )}
            </Link>
        </div>
    );
};
