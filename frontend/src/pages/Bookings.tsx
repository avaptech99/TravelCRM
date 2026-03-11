import React, { useState, useEffect } from 'react';
import { BookingsTable } from '../features/bookings/components/BookingsTable';
import { Plus, Search } from 'lucide-react';
import { NewBookingModal } from '../features/bookings/components/NewBookingModal';

export const Bookings: React.FC = () => {
    const [isNewBookingModalOpen, setIsNewBookingModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchTerm.length === 0 || searchTerm.length >= 3) {
                setDebouncedSearch(searchTerm);
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center px-2">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">All Bookings</h1>
                    <p className="text-slate-500 text-sm mt-1">Manage and track all customer travel bookings.</p>
                </div>
                <div className="flex items-center space-x-4">
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search size={18} className="text-slate-400" />
                        </div>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search contact person/number..."
                            className="bg-white border border-slate-200 text-slate-900 text-sm rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 block w-64 pl-10 p-2 shadow-sm transition-all"
                        />
                    </div>
                    <button
                        onClick={() => setIsNewBookingModalOpen(true)}
                        className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md shadow-sm transition-colors font-medium"
                    >
                        <Plus size={18} />
                        <span>New Booking</span>
                    </button>
                </div>
            </div>

            <BookingsTable searchTerm={debouncedSearch} />

            <NewBookingModal
                isOpen={isNewBookingModalOpen}
                onClose={() => setIsNewBookingModalOpen(false)}
            />
        </div>
    );
};
