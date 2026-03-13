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
    agentFilter?: string;
}

export const BookingsTable: React.FC<BookingsTableProps> = ({ statusFilter, isEDTView, searchTerm, agentFilter }) => {
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
    }, [statusFilter, isEDTView, searchTerm, agentFilter]);

    const { data, isLoading } = useQuery({
        queryKey: ['bookings', user?.id, statusFilter, isEDTView, searchTerm, agentFilter, pagination.pageIndex, pagination.pageSize],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (statusFilter) params.append('status', statusFilter);
            if (isEDTView !== undefined) params.append('isConvertedToEDT', isEDTView.toString());
            if (searchTerm) params.append('search', searchTerm);
            if (agentFilter) params.append('assignedTo', agentFilter);
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
            header: 'Booking ID',
            cell: (info) => info.getValue() || '-',
        }),
        columnHelper.accessor('createdOn', {
            header: 'Created On',
            cell: (info) => dayjs(info.getValue()).format('DD MMM YYYY'),
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
            const flightDestination = row.travelers?.[0]?.country;
            return flightDestination || row.destinationCity || '-';
        }, {
            id: 'destination',
            header: 'Destination',
        }),
        columnHelper.accessor((row) => {
            const flightDate = row.travelers?.[0]?.departureTime;
            const date = flightDate || row.travelDate;
            return date ? dayjs(date).format('DD MMM YYYY') : '-';
        }, {
            id: 'travelDate',
            header: 'Travel Date',
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
                                    className="hover:bg-slate-50 transition-colors cursor-pointer"
                                    onClick={() => navigate(`/bookings/${row.original.id}`)}
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
