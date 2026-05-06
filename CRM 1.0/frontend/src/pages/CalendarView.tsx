import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, MapPin, Loader2, RefreshCw, WifiOff } from 'lucide-react';
import api from '../api/client';
import { useNavigate } from 'react-router-dom';

const Loader: React.FC<{ fullPage?: boolean }> = ({ fullPage = false }) => {
    const content = (
        <div className="flex flex-col items-center justify-center space-y-4 animate-in fade-in duration-500">
            <div className="relative">
                <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl animate-pulse"></div>
                <Loader2 size={40} className="text-primary animate-spin relative z-10" />
            </div>
        </div>
    );
    if (fullPage) {
        return (
            <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-[9999] flex items-center justify-center">
                {content}
            </div>
        );
    }
    return (
        <div className="w-full flex items-center justify-center py-20 min-h-[200px]">
            {content}
        </div>
    );
};


interface CalendarEvent {
    id: string;
    title: string;
    date: string;
    status: string;
    destination: string;
}

export const CalendarView: React.FC = () => {
    const [currentDate, setCurrentDate] = useState(dayjs());
    const navigate = useNavigate();

    useEffect(() => {
        // Find the main scrollable container and hide its scrollbar
        const main = document.querySelector('main');
        if (main) {
            const originalOverflow = main.style.overflowY;
            main.style.overflowY = 'hidden';
            return () => {
                main.style.overflowY = originalOverflow || 'auto';
            };
        }
    }, []);

    const { data: events, isLoading, isError, refetch } = useQuery({

        queryKey: ['calendar-events', currentDate.format('MM-YYYY')],
        queryFn: async () => {
            const { data } = await api.get('/bookings/calendar', {
                params: {
                    month: currentDate.month() + 1,
                    year: currentDate.year(),
                }
            });
            return data as CalendarEvent[];
        }
    });

    const startOfMonth = currentDate.startOf('month');
    const startDay = startOfMonth.day(); // 0 (Sun) to 6 (Sat)
    const daysInMonth = currentDate.daysInMonth();

    const prevMonth = () => setCurrentDate(currentDate.subtract(1, 'month'));
    const nextMonth = () => setCurrentDate(currentDate.add(1, 'month'));
    const goToToday = () => setCurrentDate(dayjs());

    const days: (number | null)[] = [];
    // Add empty slots for the beginning of the month
    for (let i = 0; i < startDay; i++) {
        days.push(null);
    }
    // Add days of the month
    for (let i = 1; i <= daysInMonth; i++) {
        days.push(i);
    }
    // Always show 42 slots (6 rows of 7) for a consistent layout
    while (days.length < 42) {
        days.push(null);
    }


    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'Booked': return { backgroundColor: '#10b981', color: 'white' }; // emerald-500
            case 'Working': return { backgroundColor: '#8b5cf6', color: 'white' }; // purple-500
            case 'Sent': return { backgroundColor: '#f59e0b', color: 'white' }; // amber-500
            case 'Pending': return { backgroundColor: '#3b82f6', color: 'white' }; // blue-500
            case 'Follow Up': return { backgroundColor: '#5d4037', color: 'white' }; // chocolate brown
            default: return { backgroundColor: '#64748b', color: 'white' }; // slate-500
        }
    };

    const handleDateClick = (dateStr: string | null) => {
        if (!dateStr) return;
        setSelectedDate(dateStr);
        setIsModalOpen(true);
    };

    const selectedDateBookings = events?.filter(e => dayjs(e.date).format('YYYY-MM-DD') === selectedDate) || [];

    if (isLoading) {
        return <Loader fullPage />;
    }

    if (isError) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 max-w-sm w-full text-center space-y-4">
                    <WifiOff className="mx-auto text-amber-400" size={28} />
                    <p className="text-slate-600 text-sm font-medium">Unable to load calendar data</p>
                    <button
                        onClick={() => refetch()}
                        className="flex items-center gap-2 mx-auto px-4 py-2 bg-primary text-white text-xs font-bold rounded-lg hover:opacity-90 transition-all"
                    >
                        <RefreshCw size={12} />
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 relative">
            <div className="flex flex-col md:flex-row md:items-center justify-between px-2 gap-4 md:gap-0">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2 whitespace-nowrap">
                        <CalendarIcon className="text-primary" />
                        Travel Calendar
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">Track upcoming departures and arrivals.</p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-2 md:space-x-4 bg-white p-1 rounded-xl shadow-sm border border-slate-200">
                    <button
                        onClick={prevMonth}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-600"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <div className="text-lg font-bold text-slate-900 min-w-[150px] text-center">
                        {currentDate.format('MMMM YYYY')}
                    </div>
                    <button
                        onClick={nextMonth}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-600"
                    >
                        <ChevronRight size={20} />
                    </button>
                    <div className="h-6 w-px bg-slate-200 mx-1"></div>
                    <button
                        onClick={goToToday}
                        className="px-4 py-1.5 text-sm font-bold text-primary hover:bg-primary/10 rounded-lg transition-all"
                    >
                        Today
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                {/* Weekdays Header */}
                <div 
                    className="grid border-b border-slate-100 bg-slate-50/50"
                    style={{ gridTemplateColumns: 'repeat(7, 1fr)' }}
                >
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <div key={day} className="py-2.5 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">
                            {day}
                        </div>
                    ))}
                </div>

                {/* Days Grid */}
                <div 
                    className="grid auto-rows-[75px] md:auto-rows-[85px]"
                    style={{ gridTemplateColumns: 'repeat(7, 1fr)' }}
                >
                    {days.map((day, idx) => {
                        const dateStr = day ? currentDate.date(day).format('YYYY-MM-DD') : null;
                        const dayEvents = events?.filter(e => dayjs(e.date).format('YYYY-MM-DD') === dateStr) || [];
                        const isToday = day && dayjs().format('YYYY-MM-DD') === dateStr;

                        return (
                            <div
                                key={idx}
                                onClick={() => day && handleDateClick(dateStr)}
                                className={`border-r border-b border-slate-100 p-1.5 transition-all group ${
                                    day ? 'bg-white cursor-pointer hover:bg-slate-50/80 active:bg-slate-100' : 'bg-slate-50/50'
                                }`}
                            >
                                {day && (
                                    <div className="flex flex-col h-full">
                                        <div className="flex justify-between items-start">
                                            <span className={`text-xs font-bold leading-none ${
                                                isToday 
                                                ? 'bg-primary text-white w-6 h-6 flex items-center justify-center rounded-full shadow-sm shadow-primary/30' 
                                                : 'text-slate-400'
                                            }`}>
                                                {day}
                                            </span>
                                            {dayEvents.length > 0 && (
                                                <span className="text-[9px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-full border border-slate-200/50">
                                                    {dayEvents.length}
                                                </span>
                                            )}
                                        </div>
                                        {dayEvents.length > 0 && (
                                            <div className="mt-auto pb-0.5">
                                                <div className="flex flex-wrap gap-1 opacity-90 group-hover:opacity-100 transition-opacity">
                                                    {['Booked', 'Working', 'Sent', 'Pending', 'Follow Up'].map(status => {
                                                        const count = dayEvents.filter(e => e.status === status).length;
                                                        if (count === 0) return null;
                                                        const style = getStatusStyle(status);
                                                        return (
                                                            <div 
                                                                key={status}
                                                                title={`${count} ${status}`}
                                                                className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black" 
                                                                style={{ backgroundColor: style.backgroundColor, color: 'white' }}
                                                            >
                                                                {count}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Legend as Footer */}
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 px-6 py-3 bg-slate-50/50 border-t border-slate-100 text-[10px] font-bold text-slate-500">
                    <span className="uppercase tracking-wider text-slate-400 mr-2">Status Legend:</span>
                    <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: '#10b981' }}></span>
                        <span>Booked</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: '#8b5cf6' }}></span>
                        <span>Working</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: '#f59e0b' }}></span>
                        <span>Sent</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: '#3b82f6' }}></span>
                        <span>Pending</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: '#5d4037' }}></span>
                        <span>Follow Up</span>
                    </div>
                </div>
            </div>


            {/* Date Details Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border border-white/20">
                        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900">
                                        {dayjs(selectedDate).format('MMMM DD, YYYY')}
                                    </h2>
                                    <p className="text-slate-500 text-sm font-medium">
                                        {selectedDateBookings.length} total bookings scheduled
                                    </p>
                                </div>
                                <button 
                                    onClick={() => setIsModalOpen(false)}
                                    className="p-2 hover:bg-white rounded-full text-slate-400 hover:text-slate-600 transition-colors shadow-sm"
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                                </button>

                            </div>
                        </div>
                        <div className="p-4 space-y-3">

                            {selectedDateBookings.length > 0 ? (
                                selectedDateBookings.map((event) => {
                                    const style = getStatusStyle(event.status);
                                    return (
                                        <button
                                            key={event.id}
                                            onClick={() => {
                                                navigate(`/bookings/${event.id}`);
                                                setIsModalOpen(false);
                                            }}
                                            className="w-full flex items-center justify-between p-4 rounded-2xl bg-white border border-slate-100 hover:border-primary/20 hover:shadow-md transition-all group"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div 
                                                    className="w-3 h-12 rounded-full" 
                                                    style={{ backgroundColor: style.backgroundColor }}
                                                />
                                                <div className="text-left">
                                                    <p className="font-bold text-slate-900 group-hover:text-primary transition-colors">
                                                        {event.title}
                                                    </p>
                                                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5 font-medium uppercase tracking-tight">
                                                        <MapPin size={10} /> {event.destination || 'TBD'}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end gap-1.5">
                                                <span 
                                                    className="text-[10px] font-black px-2.5 py-1 rounded-full shadow-sm"
                                                    style={{ ...style, backgroundColor: style.backgroundColor }}
                                                >
                                                    {event.status}
                                                </span>
                                                <span className="text-[10px] text-primary font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                                                    VIEW &rarr;
                                                </span>
                                            </div>
                                        </button>
                                    );
                                })
                            ) : (
                                <div className="text-center py-12">
                                    <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                                        <CalendarIcon className="text-slate-300" size={32} />
                                    </div>
                                    <p className="text-slate-400 font-medium">No bookings for this date.</p>
                                </div>
                            )}
                        </div>
                        <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex justify-end">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="px-6 py-2 text-sm font-bold text-slate-700 hover:bg-white rounded-xl transition-all border border-slate-200 shadow-sm"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
