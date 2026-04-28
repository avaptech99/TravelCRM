import React, { useState, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const GlobalSearch: React.FC = () => {
    const [query, setQuery] = useState('');
    const navigate = useNavigate();
    const searchRef = useRef<HTMLDivElement>(null);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim()) {
            navigate(`/bookings?search=${encodeURIComponent(query.trim())}`);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSearch(e);
        }
    };

    return (
        <div className="relative w-full max-w-md" ref={searchRef}>
            <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                </div>
                <form onSubmit={handleSearch}>
                    <input
                        type="text"
                        className="block w-full pl-10 pr-10 py-2 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm placeholder:text-slate-400"
                        placeholder="Search Booking ID, Name, Phone..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                    />
                </form>
                {query && (
                    <button
                        onClick={() => setQuery('')}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                    >
                        <X size={14} />
                    </button>
                )}
            </div>
        </div>
    );
};
