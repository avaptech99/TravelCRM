import React, { useState, useEffect } from 'react';
import { BookingsTable } from '../features/bookings/components/BookingsTable';
import { CheckCircle, Search } from 'lucide-react';

export const BookedEDT: React.FC = () => {
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
                <div className="flex items-center space-x-3">
                    <div className="bg-green-100 p-2 rounded-full">
                        <CheckCircle className="text-green-600" size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Booked & EDT</h1>
                        <p className="text-slate-500 text-sm mt-1">Customers who have confirmed bookings and expected dates of travel.</p>
                    </div>
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
                            className="bg-white border border-slate-200 text-slate-900 text-sm rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary block w-64 pl-10 p-2 shadow-sm transition-all"
                        />
                    </div>
                </div>
            </div>

            <BookingsTable statusFilter="Booked" isEDTView={true} searchTerm={debouncedSearch} />
        </div>
    );
};
