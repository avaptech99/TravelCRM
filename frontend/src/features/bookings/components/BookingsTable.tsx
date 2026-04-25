import React, { useState } from 'react';
import {
    useReactTable,
    getCoreRowModel,
    flexRender,
    createColumnHelper,
} from '@tanstack/react-table';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../api/client';
import { useAuth } from '../../../context/AuthContext';
import type { Booking } from '../../../types';
import dayjs from 'dayjs';
import { ActionDropdown } from './ActionDropdown';
import { EditModal } from './EditModal';
import { AssignAgentModal } from './AssignAgentModal';
import { ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { toast } from 'sonner';



interface BookingsTableProps {
    statusFilter?: string;
    agentFilter?: string;
    searchTerm?: string;
    isMyBookingsView?: boolean;
    isEDTView?: boolean;
    travelDateFilter?: string;
    isInlineView?: boolean;
    outstandingFilter?: boolean;
}

export const BookingsTable: React.FC<BookingsTableProps> = ({ statusFilter, agentFilter, searchTerm, isMyBookingsView, isEDTView, travelDateFilter, isInlineView, outstandingFilter }) => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams, setSearchParams] = useSearchParams();
    const queryClient = useQueryClient();
    const [activeEditBooking, setActiveEditBooking] = useState<Booking | null>(null);
    const [activeAssignBooking, setActiveAssignBooking] = useState<Booking | null>(null);
    const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});
    const [isSelectionMode, setIsSelectionMode] = useState(false);

    const initialPage = isInlineView ? 1 : parseInt(searchParams.get('page') || '1', 10);

    const [pagination, setPagination] = useState({
        pageIndex: initialPage > 0 ? initialPage - 1 : 0,
        pageSize: 15,
    });

    const [jumpPage, setJumpPage] = useState((pagination.pageIndex + 1).toString());

    // Update URL when pagination changes
    React.useEffect(() => {
        if (!isInlineView) {
            setSearchParams(prev => {
                const next = new URLSearchParams(prev);
                if (pagination.pageIndex > 0) {
                    next.set('page', (pagination.pageIndex + 1).toString());
                } else {
                    next.delete('page');
                }
                return next;
            }, { replace: true });
        }
        setJumpPage((pagination.pageIndex + 1).toString());
    }, [pagination.pageIndex, isInlineView, setSearchParams]);

    const isFirstRun = React.useRef(true);
    // Reset pagination when filters change
    React.useEffect(() => {
        if (isFirstRun.current) {
            isFirstRun.current = false;
            return;
        }
        setPagination(prev => ({ ...prev, pageIndex: 0 }));
    }, [statusFilter, searchTerm, agentFilter, isMyBookingsView, isEDTView, travelDateFilter]);

    const unassignMutation = useMutation({
        mutationFn: async (bookingId: string) => {
            if (window.confirm('Are you sure you want to unassign this booking?')) {
                const { data } = await api.patch(`/bookings/${bookingId}/assign`, { assignedToUserId: null });
                return data;
            }
            return Promise.reject(new Error('Cancelled'));
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['bookings'] });
            toast.success('Booking unassigned successfully');
        },
        onError: (error: any) => {
            if (error.message !== 'Cancelled') {
                toast.error(error.response?.data?.message || 'Failed to unassign booking');
            }
        }
    });

    const bulkDeleteMutation = useMutation({
        mutationFn: async (bookingIds: string[]) => {
            if (window.confirm(`Are you sure you want to completely DELETE ${bookingIds.length} selected leads? This action cannot be undone.`)) {
                const { data } = await api.post('/bookings/bulk-delete', { bookingIds });
                return data;
            }
            return Promise.reject(new Error('Cancelled'));
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['bookings'] });
            setRowSelection({});
            setIsSelectionMode(false);
            toast.success('Leads deleted successfully');
        },
        onError: (error: any) => {
            if (error.message !== 'Cancelled') {
                toast.error(error.response?.data?.message || 'Failed to delete leads');
            }
        }
    });

    const { data, isLoading } = useQuery({
        queryKey: ['bookings', user?.id, statusFilter, searchTerm, agentFilter, travelDateFilter, isMyBookingsView, isEDTView, outstandingFilter, pagination.pageIndex, pagination.pageSize],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (statusFilter) params.append('status', statusFilter);
            if (searchTerm) params.append('search', searchTerm);
            if (agentFilter) params.append('assignedTo', agentFilter);
            if (travelDateFilter) params.append('travelDateFilter', travelDateFilter);
            if (isMyBookingsView) params.append('myBookings', 'true');
            if (isEDTView !== undefined) params.append('isConvertedToEDT', isEDTView.toString());
            if (outstandingFilter) params.append('outstandingOnly', 'true');
            params.append('page', (pagination.pageIndex + 1).toString());
            params.append('limit', pagination.pageSize.toString());

            const { data } = await api.get(`/bookings?${params.toString()}`);
            return data;
        },
        staleTime: 15000,         // Consider data fresh for 15s
        gcTime: 1000 * 60 * 10,   // Keep in memory for 10 minutes
        refetchInterval: 20000,    // Auto-refresh every 20s — live feel without WebSockets
    });

    const columnHelper = createColumnHelper<Booking>();

    // 3-click cycle handler for master checkbox:
    // Click 1: Enter selection mode (show row checkboxes, nothing selected)
    // Click 2: Select all rows on page
    // Click 3: Deselect all & exit selection mode
    const handleMasterCheckboxClick = (e: React.MouseEvent<HTMLInputElement>, table: any) => {
        e.stopPropagation();
        
        if (!isSelectionMode) {
            setIsSelectionMode(true);
            setRowSelection({});
        } else if (Object.keys(rowSelection).length === 0 || table.getIsSomePageRowsSelected()) {
            table.toggleAllPageRowsSelected(true);
        } else {
            table.toggleAllPageRowsSelected(false);
            setRowSelection({});
            setIsSelectionMode(false);
        }
    };

    const columns = [
        columnHelper.accessor('uniqueCode', {
            header: ({ table }) => (
                <div className="flex items-center gap-2">
                    {user?.role === 'ADMIN' && (
                        <input
                            type="checkbox"
                            className="rounded border-slate-300 text-primary focus:ring-primary cursor-pointer w-3.5 h-3.5"
                            checked={isSelectionMode && table.getIsAllPageRowsSelected()}
                            ref={(el) => {
                                if (el) {
                                    el.indeterminate = isSelectionMode && !table.getIsAllPageRowsSelected() && Object.keys(rowSelection).length > 0;
                                }
                            }}
                            onClick={(e) => handleMasterCheckboxClick(e, table)}
                            onChange={() => {}}
                            title={
                                !isSelectionMode ? "Enable Selection Mode" :
                                Object.keys(rowSelection).length === 0 ? "Select All" :
                                "Deselect All & Exit"
                            }
                        />
                    )}
                    <span>Booking ID</span>
                </div>
            ),
            cell: (info) => (
                <div className="flex items-center gap-2">
                    {isSelectionMode && user?.role === 'ADMIN' && (
                        <input
                            type="checkbox"
                            className="rounded border-slate-300 text-primary focus:ring-primary cursor-pointer w-4 h-4 shrink-0"
                            checked={info.row.getIsSelected()}
                            onChange={info.row.getToggleSelectedHandler()}
                            onClick={(e) => e.stopPropagation()}
                        />
                    )}
                    <span>{info.getValue() || '-'}</span>
                </div>
            ),
        }),
        columnHelper.accessor('createdAt', {
            header: 'Created On',
            cell: (info) => {
                const date = info.getValue();
                if (!date) return '-';
                return (
                    <div className="flex flex-col leading-tight">
                        <span className="whitespace-nowrap">{dayjs(date).format('DD MMM YYYY')}</span>
                        <span className="text-[10px] text-slate-400 font-normal whitespace-nowrap">{dayjs(date).format('hh:mm A')}</span>
                    </div>
                );
            },
        }),
        columnHelper.accessor((row) => row.createdByUser?.name || 'Unknown', {
            id: 'createdBy',
            header: 'Created By',
        }),
        columnHelper.accessor('contactPerson', {
            header: 'Contact Person',
        }),
        columnHelper.accessor('contactNumber', {
            header: 'Contact Number',
        }),
        columnHelper.accessor((row) => {
            const flightDestination = row.travelers?.[0]?.flightTo;
            return flightDestination || row.destinationCity || '-';
        }, {
            id: 'destination',
            header: 'Destination',
        }),
        columnHelper.accessor((row) => {
            const flightDate = row.travelers?.[0]?.departureTime;
            const date = flightDate || row.travelDate;
            return date;
        }, {
            id: 'travelDate',
            header: 'Travel Date',
            cell: (info) => {
                const date = info.getValue() as string;
                if (!date) return '-';
                return <span className="whitespace-nowrap">{dayjs(date).format('DD MMM YYYY')}</span>;
            },
        }),
        columnHelper.accessor('travellers', {
            header: 'Travellers',
            cell: (info) => info.getValue() || '-',
        }),
        columnHelper.display({
            id: 'status',
            header: 'Status',
            cell: (info) => {
                const status = info.row.original.status;
                return (
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status === 'Booked' ? 'bg-green-100 text-green-800' :
                        status === 'Working' ? 'bg-purple-100 text-purple-800' :
                            status === 'Sent' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-blue-100 text-blue-800'
                        }`}>
                        {status}
                    </span>
                );
            },
        }),
        columnHelper.display({
            id: 'assignedTo',
            header: 'Assigned To',
            cell: (info) => (
                <span className="text-slate-600">
                    {info.row.original.assignedToUser?.name || <span className="text-slate-400 italic">Unassigned</span>}
                </span>
            ),
        }),
        columnHelper.display({
            id: 'actions',
            header: 'Actions',
            cell: (info) => (
                <ActionDropdown
                    booking={info.row.original}
                    onEditClick={(b: Booking) => setActiveEditBooking(b)}
                    onUnassignClick={
                        isInlineView && user?.role === 'ADMIN' && info.row.original.assignedToUser
                            ? (b: Booking) => unassignMutation.mutate(b.id)
                            : undefined
                    }
                />
            ),
        }),
    ];

    const table = useReactTable({
        data: data?.data || [],
        columns,
        pageCount: data?.meta?.totalPages || -1,
        state: {
            pagination,
            rowSelection,
        },
        enableRowSelection: true,
        onRowSelectionChange: setRowSelection,
        getRowId: (row) => row.id,
        onPaginationChange: setPagination,
        getCoreRowModel: getCoreRowModel(),
        manualPagination: true,
        autoResetPageIndex: false,
    });

    const totalCount = data?.meta?.total || 0;

    return (
        <div className="bg-transparent md:bg-white rounded-none md:rounded-lg shadow-none md:shadow-sm border-0 md:border border-slate-200 overflow-hidden">
            <div className="w-full">
                {isLoading ? (
                    <div className="p-8 text-center text-slate-500 bg-white rounded-lg shadow-sm border border-slate-200">Loading bookings...</div>
                ) : (
                    <>
                        {Object.keys(rowSelection).length > 0 && (
                            <div className="bg-primary/10 border-b border-primary/20 px-4 py-3 flex items-center justify-between">
                                <span className="text-sm font-bold text-primary">
                                    {Object.keys(rowSelection).length} leads selected
                                </span>
                                {user?.role === 'ADMIN' && (
                                    <button 
                                        onClick={() => bulkDeleteMutation.mutate(Object.keys(rowSelection))}
                                        disabled={bulkDeleteMutation.isPending}
                                        className="p-2 rounded-lg text-red-500 hover:bg-red-100 hover:text-red-700 transition-colors disabled:opacity-50"
                                        title="Delete Selected"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Desktop View Table */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            {table.getHeaderGroups().map((headerGroup) => (
                                <tr key={headerGroup.id}>
                                    {headerGroup.headers.map((header) => (
                                        <th
                                            key={header.id}
                                            scope="col"
                                            className="px-2 py-2 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider bg-slate-50"
                                        >
                                            {header.isPlaceholder
                                                ? null
                                                : flexRender(
                                                    header.column.columnDef.header,
                                                    header.getContext()
                                                )}
                                        </th>
                                    ))}
                                </tr>
                            ))}
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                            {table.getRowModel().rows.map((row) => (
                                <tr 
                                    key={row.id} 
                                    className={`transition-colors cursor-pointer ${
                                        row.original.outstanding && row.original.outstanding > 0 
                                            ? 'bg-[#FEF2F2] hover:bg-[#FEE2E2]' 
                                            : 'bg-white hover:bg-slate-50'
                                    }`}
                                    onClick={() => {
                                        if (window.getSelection()?.toString().length) return;
                                        sessionStorage.setItem('bookingsReturnUrl', location.pathname + location.search);
                                        navigate(`/bookings/${row.original.id}`);
                                    }}
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <td
                                            key={cell.id}
                                            className="px-2 py-2 text-sm text-slate-700 font-medium"
                                            onClick={(e) => {
                                                // Prevent navigation when clicking on the Actions column
                                                if (cell.column.id === 'actions') {
                                                    e.stopPropagation();
                                                }
                                            }}
                                        >
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                            {table.getRowModel().rows.length === 0 && (
                                <tr>
                                    <td colSpan={columns.length} className="px-6 py-8 text-center text-slate-500 text-sm">
                                        No bookings found matching the criteria.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                            </table>
                        </div>

                        {/* Mobile View Cards */}
                        <div className="md:hidden flex flex-col gap-4">
                            {table.getRowModel().rows.map((row) => {
                                const booking = row.original;
                                const flightDate = booking.travelers?.[0]?.departureTime;
                                const tDate = flightDate || booking.travelDate;
                                const isBooked = booking.status === 'Booked';

                                return (
                                    <div 
                                        key={row.id} 
                                        onClick={() => {
                                            if (window.getSelection()?.toString().length) return;
                                            sessionStorage.setItem('bookingsReturnUrl', location.pathname + location.search);
                                            navigate(`/bookings/${booking.id}`);
                                        }}
                                        className={`rounded-xl p-4 border flex flex-col gap-4 shadow-[0_2px_10px_rgb(0,0,0,0.03)] cursor-pointer active:scale-[0.99] transition-transform relative ${
                                            (booking as any).outstanding > 0 
                                                ? 'bg-red-50 border-red-200' 
                                                : 'bg-white border-slate-200'
                                        }`}
                                    >
                                        <div className="flex justify-between items-start">
                                            <div className="flex flex-1 items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-600 font-bold border border-slate-100">
                                                    {booking.contactPerson?.charAt(0) || 'U'}
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-slate-900 leading-tight">{booking.contactPerson || 'Unknown'}</h3>
                                                    <div className="flex items-center gap-1.5 mt-0.5 text-xs text-slate-500">
                                                        <span>{booking.contactNumber || 'No Phone'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] font-bold text-slate-400 tracking-wider">#{booking.uniqueCode || '-'}</span>
                                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                                    isBooked ? 'bg-green-50 text-green-700 border border-green-200' :
                                                    booking.status === 'Working' ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                                                    booking.status === 'Sent' ? 'bg-yellow-50 text-yellow-700 border border-yellow-200' :
                                                    'bg-blue-50 text-blue-700 border border-blue-200'
                                                }`}>
                                                    {booking.status}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-3 py-3 border-y border-slate-50">
                                            <div className="text-xs text-slate-500 bg-slate-50/50 p-2 rounded-lg border border-slate-100/50">
                                                <span className="font-medium mr-1">Created by</span>
                                                <strong className="text-slate-700">{booking.createdByUser?.name || 'Unknown'}</strong>
                                                <span className="mx-1.5">on</span>
                                                <strong className="text-slate-700">{booking.createdAt ? dayjs(booking.createdAt).format('DD MMM YYYY') : '-'}</strong>
                                            </div>
                                            
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Travel Date</span>
                                                    <span className="text-[13px] font-semibold text-slate-700">{tDate ? dayjs(tDate).format('DD MMM YYYY') : '-'}</span>
                                                </div>
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Destination</span>
                                                    <span className="text-[13px] font-semibold text-slate-700 line-clamp-1" title={booking.travelers?.[0]?.flightTo || booking.destinationCity || '-'}>{booking.travelers?.[0]?.flightTo || booking.destinationCity || '-'}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between pt-1">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-[10px]">
                                                    {(booking.assignedToUser?.name || 'U').charAt(0).toUpperCase()}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider leading-none">Assignee</span>
                                                    <span className="text-xs font-bold text-slate-700 leading-tight">
                                                        {booking.assignedToUser?.name?.split(' ')[0] || 'Unassigned'}
                                                    </span>
                                                </div>
                                            </div>
                                            <div onClick={(e) => e.stopPropagation()}>
                                                <ActionDropdown
                                                    booking={booking}
                                                    onEditClick={(b: Booking) => setActiveEditBooking(b)}
                                                    onUnassignClick={
                                                        isInlineView && user?.role === 'ADMIN' && booking.assignedToUser
                                                            ? (b: Booking) => unassignMutation.mutate(b.id)
                                                            : undefined
                                                    }
                                                />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            {table.getRowModel().rows.length === 0 && (
                                <div className="p-8 text-center bg-white rounded-xl border border-slate-200 shadow-sm">
                                    <p className="text-slate-500 text-sm">No bookings found matching the criteria.</p>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>

            {!isLoading && totalCount > 0 && (
                <div className="bg-white px-4 py-3 border border-slate-200 md:border-t-0 md:rounded-b-lg rounded-xl mt-4 md:mt-0 flex items-center justify-between sm:px-6 shadow-sm md:shadow-none">
                    <div className="flex-1 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-0">
                        <p className="text-sm text-slate-700 text-center sm:text-left">
                            Showing{' '}
                            <span className="font-medium text-slate-900">
                                {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}
                            </span>
                            {' '}to{' '}
                            <span className="font-medium text-slate-900">
                                {Math.min(
                                    (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                                    totalCount
                                )}
                            </span>
                            {' '}of{' '}
                            <span className="font-medium text-slate-900">{totalCount}</span> results
                        </p>
                        <nav className="flex items-center justify-center gap-1 sm:gap-2 w-full sm:w-auto">
                            <button
                                onClick={() => table.previousPage()}
                                disabled={!table.getCanPreviousPage()}
                                className="relative inline-flex items-center px-2 sm:px-3 py-1.5 rounded-md text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-1 sm:flex-none justify-center"
                            >
                                <ChevronLeft size={16} className="sm:mr-1" /> <span className="hidden md:inline">Previous</span>
                            </button>
                            <span className="px-2 py-1.5 text-sm text-slate-600 font-bold whitespace-nowrap flex items-center gap-1">
                                <span className="hidden sm:inline">Page </span>
                                <input
                                    type="number"
                                    min={1}
                                    max={table.getPageCount() > 0 ? table.getPageCount() : 1}
                                    value={jumpPage}
                                    onChange={(e) => setJumpPage(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            const parsed = parseInt(jumpPage, 10);
                                            if (!isNaN(parsed) && parsed >= 1 && parsed <= table.getPageCount()) {
                                                table.setPageIndex(parsed - 1);
                                            } else {
                                                setJumpPage((table.getState().pagination.pageIndex + 1).toString());
                                            }
                                        }
                                    }}
                                    onBlur={() => {
                                        const parsed = parseInt(jumpPage, 10);
                                        if (!isNaN(parsed) && parsed >= 1 && parsed <= table.getPageCount()) {
                                            table.setPageIndex(parsed - 1);
                                        } else {
                                            setJumpPage((table.getState().pagination.pageIndex + 1).toString());
                                        }
                                    }}
                                    className="w-12 h-7 text-center border border-slate-300 rounded font-bold text-slate-700 bg-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-sm"
                                />
                                / {table.getPageCount() > 0 ? table.getPageCount() : 1}
                            </span>
                            <button
                                onClick={() => table.nextPage()}
                                disabled={!table.getCanNextPage()}
                                className="relative inline-flex items-center px-2 sm:px-3 py-1.5 rounded-md text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-1 sm:flex-none justify-center"
                            >
                                <span className="hidden md:inline">Next</span> <ChevronRight size={16} className="sm:ml-1" />
                            </button>
                        </nav>
                    </div>
                </div>
            )}

            <EditModal
                booking={activeEditBooking}
                isOpen={!!activeEditBooking}
                onClose={() => setActiveEditBooking(null)}
                onStatusChangeToBooked={() => { }}
            />

            <AssignAgentModal
                booking={activeAssignBooking}
                isOpen={!!activeAssignBooking}
                onClose={() => setActiveAssignBooking(null)}
            />
        </div>
    );
};
