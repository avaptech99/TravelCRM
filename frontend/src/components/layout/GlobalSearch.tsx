import React, { useState, useEffect, useRef } from 'react';
import { Search, X, User, Phone, MapPin, Hash, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/client';
import { useDebounce } from '../../hooks/useDebounce';

interface SearchResult {
    id: string;
    uniqueCode: string;
    destination: string;
    status: string;
    contactName: string;
    contactPhoneNo: string;
}

export const GlobalSearch: React.FC = () => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const debouncedQuery = useDebounce(query, 300);
    const navigate = useNavigate();
    const searchRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        const performSearch = async () => {
            if (debouncedQuery.length < 2) {
                setResults([]);
                setIsOpen(false);
                return;
            }

            setIsLoading(true);
            setIsOpen(true);
            try {
                const { data } = await api.get(`/bookings/search/global?q=${debouncedQuery}`);
                setResults(data);
            } catch (error) {
                console.error('Global search error:', error);
            } finally {
                setIsLoading(false);
            }
        };

        performSearch();
    }, [debouncedQuery]);

    const handleSelect = (id: string) => {
        navigate(`/bookings/${id}`);
        setIsOpen(false);
        setQuery('');
    };

    return (
        <div className="relative w-full max-w-md" ref={searchRef}>
            <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className={`h-4 w-4 transition-colors ${isOpen ? 'text-primary' : 'text-slate-400'}`} />
                </div>
                <input
                    type="text"
                    className="block w-full pl-10 pr-10 py-2 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm placeholder:text-slate-400"
                    placeholder="Search Booking ID, Name, Phone..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => query.length >= 2 && setIsOpen(true)}
                />
                {query && (
                    <button
                        onClick={() => { setQuery(''); setResults([]); setIsOpen(false); }}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                    >
                        <X size={14} />
                    </button>
                )}
            </div>

            {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden z-[100] max-h-[400px] flex flex-col">
                    <div className="px-4 py-2 bg-slate-50/80 border-b border-slate-100 flex justify-between items-center">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Search Results</span>
                        {isLoading && <Loader2 className="h-3 w-3 text-primary animate-spin" />}
                    </div>
                    
                    <div className="overflow-y-auto flex-1">
                        {isLoading && results.length === 0 ? (
                            <div className="p-8 text-center">
                                <Loader2 className="h-6 w-6 text-primary animate-spin mx-auto mb-2" />
                                <p className="text-sm text-slate-500 font-medium">Searching records...</p>
                            </div>
                        ) : results.length > 0 ? (
                            <div className="divide-y divide-slate-50">
                                {results.map((result) => (
                                    <button
                                        key={result.id}
                                        onClick={() => handleSelect(result.id)}
                                        className="w-full text-left p-4 hover:bg-slate-50 transition-colors flex items-start gap-3 group"
                                    >
                                        <div className="mt-0.5 p-2 bg-primary/10 text-primary rounded-lg group-hover:bg-primary group-hover:text-white transition-colors">
                                            <Hash size={16} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-sm font-bold text-slate-900">{result.uniqueCode}</span>
                                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                                                    result.status === 'Booked' ? 'bg-green-100 text-green-700' :
                                                    result.status === 'Working' ? 'bg-blue-100 text-blue-700' :
                                                    'bg-amber-100 text-amber-700'
                                                }`}>
                                                    {result.status}
                                                </span>
                                            </div>
                                            <div className="space-y-1">
                                                <div className="flex items-center text-xs text-slate-600 font-medium">
                                                    <User size={12} className="mr-1.5 text-slate-400" />
                                                    <span className="truncate">{result.contactName}</span>
                                                </div>
                                                <div className="flex items-center text-xs text-slate-500">
                                                    <Phone size={12} className="mr-1.5 text-slate-400" />
                                                    <span>{result.contactPhoneNo}</span>
                                                </div>
                                                {result.destination && (
                                                    <div className="flex items-center text-xs text-slate-500 italic">
                                                        <MapPin size={12} className="mr-1.5 text-slate-400" />
                                                        <span className="truncate">{result.destination}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        ) : query.length >= 2 ? (
                            <div className="p-8 text-center">
                                <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <Search className="h-6 w-6 text-slate-300" />
                                </div>
                                <p className="text-sm text-slate-500 font-medium">No results found for "{query}"</p>
                                <p className="text-xs text-slate-400 mt-1">Try searching with a different term</p>
                            </div>
                        ) : null}
                    </div>
                    
                    {results.length > 0 && (
                        <div className="px-4 py-2 bg-slate-50 border-t border-slate-100">
                            <p className="text-[10px] text-slate-400 text-center font-medium">
                                Found {results.length} matches
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
