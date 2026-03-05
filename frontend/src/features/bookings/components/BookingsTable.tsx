import React, { useState } from 'react';
import {
    useReactTable,
    getCoreRowModel,
    flexRender,
    createColumnHelper,
} from '@tanstack/react-table';
import { useQuery } from '@tanstack/react-query';
import api from '../../../api/client';
import type { Booking } from '../../../types';
import dayjs from 'dayjs';
import { CommentModal } from './CommentModal';
import { ActionDropdown } from './ActionDropdown';
import { StatusUpdateModal } from './StatusUpdateModal';
import { AssignAgentModal } from './AssignAgentModal';
import { TravelerModal } from './TravelerModal';

interface BookingsTableProps {
    statusFilter?: string;
    isEDTView?: boolean;
}

export const BookingsTable: React.FC<BookingsTableProps> = ({ statusFilter, isEDTView }) => {
    const [activeCommentBooking, setActiveCommentBooking] = useState<Booking | null>(null);
    const [activeTravelerBooking, setActiveTravelerBooking] = useState<Booking | null>(null);
    const [activeStatusBooking, setActiveStatusBooking] = useState<Booking | null>(null);
    const [activeAgentBooking, setActiveAgentBooking] = useState<Booking | null>(null);

    const { data, isLoading } = useQuery({
        queryKey: ['bookings', statusFilter, isEDTView],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (statusFilter) params.append('status', statusFilter);
            if (isEDTView !== undefined) params.append('isConvertedToEDT', isEDTView.toString());

            const { data } = await api.get(`/bookings?${params.toString()}`);
            return data;
        },
    });

    const columnHelper = createColumnHelper<Booking>();

    const columns = [
        columnHelper.accessor('createdOn', {
            header: 'Created On',
            cell: (info) => dayjs(info.getValue()).format('DD MMM YYYY'),
        }),
        columnHelper.accessor((row) => row.createdByUser.name, {
            id: 'createdBy',
            header: 'Created By',
        }),
        columnHelper.accessor('contactPerson', {
            header: 'Contact Person',
        }),
        columnHelper.accessor('contactNumber', {
            header: 'Contact Number',
        }),
        columnHelper.accessor('requirements', {
            header: 'Requirements',
            cell: (info) => {
                const val = info.getValue();
                const travelers = info.row.original.travelers;

                return (
                    <div className="flex flex-col gap-1.5">
                        {val ? (
                            <span className="tooltip truncate max-w-[150px] inline-block" title={val}>
                                {val}
                            </span>
                        ) : (
                            <span className="text-slate-400 italic">None</span>
                        )}
                        {travelers && travelers.length > 0 && (
                            <div className="text-[11px] text-indigo-600 font-medium bg-indigo-50 px-2 py-0.5 rounded-md self-start truncate max-w-[150px]" title={travelers.map(t => `${t.name} (${t.travelDate || 'TBD'})`).join(', ')}>
                                ✈ {travelers[0].travelDate ? dayjs(travelers[0].travelDate).format('MMM DD, YYYY') : 'Data needed'}
                                {travelers[0].country ? ` • ${travelers[0].country}` : ''}
                                {travelers.length > 1 ? ` (+${travelers.length - 1})` : ''}
                            </div>
                        )}
                    </div>
                );
            },
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
                    onUpdateStatusClick={(b: Booking) => setActiveStatusBooking(b)}
                    onChangeAgentClick={(b: Booking) => setActiveAgentBooking(b)}
                    onAddCommentClick={(b: Booking) => setActiveCommentBooking(b)}
                />
            ),
        })
    ];

    const table = useReactTable({
        data: data?.data || [],
        columns,
        getCoreRowModel: getCoreRowModel(),
    });

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
                                            className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider bg-slate-50 whitespace-nowrap"
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
                                <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                                    {row.getVisibleCells().map((cell) => (
                                        <td
                                            key={cell.id}
                                            className="px-6 py-4 whitespace-nowrap text-sm text-slate-700"
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

            {!isLoading && (
                <div className="bg-white px-4 py-3 border-t border-slate-200 flex items-center justify-between sm:px-6">
                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                        <div>
                            <p className="text-sm text-slate-700">
                                Showing total <span className="font-medium text-slate-900">{data?.meta?.total || 0}</span> results
                            </p>
                        </div>
                    </div>
                </div>
            )}

            <CommentModal
                booking={activeCommentBooking}
                isOpen={!!activeCommentBooking}
                onClose={() => setActiveCommentBooking(null)}
            />

            <StatusUpdateModal
                booking={activeStatusBooking}
                isOpen={!!activeStatusBooking}
                onClose={() => setActiveStatusBooking(null)}
                onStatusChangeToBooked={(b: Booking) => setActiveTravelerBooking(b)}
            />

            <AssignAgentModal
                booking={activeAgentBooking}
                isOpen={!!activeAgentBooking}
                onClose={() => setActiveAgentBooking(null)}
            />

            <TravelerModal
                booking={activeTravelerBooking}
                isOpen={!!activeTravelerBooking}
                onClose={() => setActiveTravelerBooking(null)}
            />
        </div>
    );
};
