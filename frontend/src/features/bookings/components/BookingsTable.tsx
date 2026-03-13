import React, { useState } from 'react';
import {
    useReactTable,
    getCoreRowModel,
    flexRender,
    createColumnHelper,
} from '@tanstack/react-table';
import { useQuery } from '@tanstack/react-query';
import api from '../../../api/client';
import { useAuth } from '../../../context/AuthContext';
import type { Booking } from '../../../types';
import dayjs from 'dayjs';
import { ActionDropdown } from './ActionDropdown';
import { EditModal } from './EditModal';
import { AssignAgentModal } from './AssignAgentModal';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';



interface BookingsTableProps {
    statusFilter?: string;
    isEDTView?: boolean;
    searchTerm?: string;
}

export const BookingsTable: React.FC<BookingsTableProps> = ({ statusFilter, isEDTView, searchTerm }) => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [activeEditBooking, setActiveEditBooking] = useState<Booking | null>(null);
    const [activeAssignBooking, setActiveAssignBooking] = useState<Booking | null>(null);

    const [pagination, setPagination] = useState({
        pageIndex: 0,
        pageSize: 15,
    });

    // Reset pagination when filters change
    React.useEffect(() => {
        setPagination(prev => ({ ...prev, pageIndex: 0 }));
    }, [statusFilter, isEDTView, searchTerm]);

    const { data, isLoading } = useQuery({
        queryKey: ['bookings', user?.id, statusFilter, isEDTView, searchTerm, pagination.pageIndex, pagination.pageSize],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (statusFilter) params.append('status', statusFilter);
            if (isEDTView !== undefined) params.append('isConvertedToEDT', isEDTView.toString());
            if (searchTerm) params.append('search', searchTerm);
            params.append('page', (pagination.pageIndex + 1).toString());
            params.append('limit', pagination.pageSize.toString());

            const { data } = await api.get(`/bookings?${params.toString()}`);
            return data;
        },
        staleTime: 1000 * 60 * 5, // Cache for 5 minutes
        gcTime: 1000 * 60 * 10,  // Keep in garbage collection for 10 minutes
    });

    const columnHelper = createColumnHelper<Booking>();

    const columns = [
        columnHelper.accessor('uniqueCode', {
            header: 'ID',
            cell: (info) => info.getValue() ? `#${info.getValue()}` : '-',
        }),
        columnHelper.accessor((row) => ({ date: row.createdOn, user: row.createdByUser?.name }), {
            id: 'source',
            header: 'Source',
            cell: (info) => (
                <div className="flex flex-col">
                    <span className="font-medium text-slate-900">{dayjs(info.getValue().date).format('DD MMM YYYY')}</span>
                    <span className="text-[10px] text-slate-500">{info.getValue().user || 'Unknown'}</span>
                </div>
            ),
        }),
        columnHelper.accessor((row) => ({ name: row.contactPerson, phone: row.contactNumber }), {
            id: 'client',
            header: 'Client',
            cell: (info) => (
                <div className="flex flex-col leading-tight">
                    <span className="font-semibold text-slate-800">{info.getValue().name}</span>
                    <span className="text-[10px] text-slate-500">{info.getValue().phone}</span>
                </div>
            ),
        }),
        columnHelper.accessor((row) => {
            const flightDestination = row.travelers?.[0]?.country;
            const flightDate = row.travelers?.[0]?.departureTime;
            return {
                dest: flightDestination || row.destinationCity || '-',
                date: flightDate || row.travelDate
            };
        }, {
            id: 'travelInfo',
            header: 'Travel Info',
            cell: (info) => (
                <div className="flex flex-col leading-tight">
                    <span className="font-medium text-slate-900 uppercase tracking-tighter text-[11px]">{info.getValue().dest}</span>
                    <span className="text-[10px] text-slate-500">
                        {info.getValue().date ? dayjs(info.getValue().date).format('DD MMM') : '-'}
                    </span>
                </div>
            ),
        }),
        columnHelper.display({
            id: 'status',
            header: 'Status',
            cell: (info) => {
                const status = info.row.original.status;
                return (
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${status === 'Booked' ? 'bg-green-100 text-green-800' :
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
            header: 'Agent',
            cell: (info) => (
                <span className="text-xs text-slate-600 font-medium">
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
        },
        onPaginationChange: setPagination,
        getCoreRowModel: getCoreRowModel(),
        manualPagination: true,
    });

    const totalCount = data?.meta?.total || 0;

    return (
        <div className="bg-white rounded-lg shadow border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
                {isLoading ? (
                    <div className="p-8 text-center text-slate-500">Loading bookings...</div>
                ) : (
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            {table.getHeaderGroups().map((headerGroup) => (
                                <tr key={headerGroup.id}>
                                    {headerGroup.headers.map((header) => (
                                        <th
                                            key={header.id}
                                            scope="col"
                                            className="px-2 py-1.5 text-left text-xs font-medium text-slate-500 uppercase tracking-tight bg-slate-50"
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
                                    className="hover:bg-slate-50 transition-colors cursor-pointer"
                                    onClick={() => navigate(`/bookings/${row.original.id}`)}
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <td
                                            key={cell.id}
                                            className="px-2 py-1.5 text-sm text-slate-700"
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
                )}
            </div>

            {!isLoading && totalCount > 0 && (
                <div className="bg-white px-4 py-3 border-t border-slate-200 flex items-center justify-between sm:px-6">
                    <div className="flex-1 flex items-center justify-between">
                        <p className="text-sm text-slate-700">
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
                        <nav className="flex items-center gap-1">
                            <button
                                onClick={() => table.previousPage()}
                                disabled={!table.getCanPreviousPage()}
                                className="relative inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronLeft size={16} className="mr-1" /> Previous
                            </button>
                            <span className="px-3 py-1.5 text-sm text-slate-600 font-medium">
                                Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
                            </span>
                            <button
                                onClick={() => table.nextPage()}
                                disabled={!table.getCanNextPage()}
                                className="relative inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                                Next <ChevronRight size={16} className="ml-1" />
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
