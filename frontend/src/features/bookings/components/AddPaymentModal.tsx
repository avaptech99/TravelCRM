import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../api/client';
import { toast } from 'sonner';
import { X, CreditCard, Plus } from 'lucide-react';
import type { Booking } from '../../../types';

interface AddPaymentModalProps {
    booking: Booking;
    isOpen: boolean;
    onClose: () => void;
}

export const AddPaymentModal: React.FC<AddPaymentModalProps> = ({ booking, isOpen, onClose }) => {
    const queryClient = useQueryClient();

    const [paymentAmount, setPaymentAmount] = useState<string>('');
    const [paymentMethod, setPaymentMethod] = useState<string>('Bank Transfer');
    const [paymentTransactionId, setPaymentTransactionId] = useState<string>('');
    const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [paymentRemarks, setPaymentRemarks] = useState<string>('');

    // If totalAmount is not present but pricePerTicket is, derive totalPayment as fallback
    let totalPayment = booking.totalAmount || 0;
    if (!booking.totalAmount && booking.pricePerTicket) {
        const passengerCount = booking.travelers ? booking.travelers.length : 1;
        totalPayment = booking.pricePerTicket * passengerCount;
    }

    const totalPaid = booking.payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
    const currentOutstanding = totalPayment - totalPaid;
    const finalOutstanding = currentOutstanding - parseFloat(paymentAmount || '0');

    const recordPaymentMutation = useMutation({
        mutationFn: async () => {
            const payAmt = parseFloat(paymentAmount);
            if (isNaN(payAmt) || payAmt <= 0) {
                throw new Error('Please enter a valid payment amount');
            }

            if (payAmt > currentOutstanding + 0.01) { // Allowing small float margin
                throw new Error(`Payment cannot exceed outstanding amount (${currentOutstanding.toFixed(2)})`);
            }

            await api.post(`/bookings/${booking.id}/payments`, {
                amount: payAmt,
                paymentMethod,
                transactionId: paymentTransactionId || undefined,
                date: new Date(paymentDate).toISOString(),
                remarks: paymentRemarks || undefined
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['booking', booking.id] });
            toast.success('Payment recorded successfully');
            setPaymentAmount('');
            setPaymentTransactionId('');
            setPaymentRemarks('');
            onClose();
        },
        onError: (error: any) => {
            toast.error(error.message || error.response?.data?.message || 'Failed to record payment');
        },
    });

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-emerald-50">
                    <h2 className="text-lg font-bold text-emerald-900 flex items-center gap-2">
                        <CreditCard size={20} className="text-emerald-600" />
                        Record New Payment
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div className="bg-slate-50 border border-slate-100 rounded-lg p-3">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight mb-1 block">Total Booking Amount</span>
                            <span className="text-lg font-bold text-slate-800">
                                {totalPayment.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </span>
                        </div>
                        <div className="bg-orange-50/50 border border-orange-100 rounded-lg p-3">
                            <span className="text-[10px] font-bold text-orange-600 uppercase tracking-tight mb-1 block">Current Outstanding</span>
                            <span className="text-lg font-bold text-orange-700">
                                {currentOutstanding.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </span>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-[11px] font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Amount Received *</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                </div>
                                <input
                                    type="text"
                                    inputMode="decimal"
                                    value={paymentAmount}
                                    onChange={(e) => {
                                        let val = e.target.value;
                                        val = val.replace(/[^0-9.]/g, '');
                                        const parts = val.split('.');
                                        if (parts.length > 2) {
                                            val = parts[0] + '.' + parts.slice(1).join('');
                                        }
                                        if (val === '') {
                                            setPaymentAmount('');
                                            return;
                                        }
                                        const num = parseFloat(val);
                                        if (!isNaN(num)) {
                                            if (num > currentOutstanding && currentOutstanding > 0) {
                                                setPaymentAmount(currentOutstanding.toString());
                                            } else {
                                                setPaymentAmount(val);
                                            }
                                        } else {
                                            setPaymentAmount(val);
                                        }
                                    }}
                                    className="bg-white border border-slate-200 text-sm font-bold text-slate-900 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 block w-full pl-6 p-2.5 shadow-sm transition-all"
                                    placeholder="0.00"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[11px] font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Payment Method</label>
                                <select
                                    value={paymentMethod}
                                    onChange={(e) => setPaymentMethod(e.target.value)}
                                    className="bg-white border border-slate-200 text-slate-900 text-xs font-semibold rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 block w-full p-2.5 shadow-sm transition-all h-[42px]"
                                >
                                    <option value="Bank Transfer">Bank Transfer</option>
                                    <option value="Credit Card">Credit Card</option>
                                    <option value="Cash">Cash</option>
                                    <option value="Check">Check</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-[11px] font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Date</label>
                                <input
                                    type="date"
                                    max={new Date().toISOString().split('T')[0]}
                                    value={paymentDate}
                                    onChange={(e) => setPaymentDate(e.target.value)}
                                    className="bg-white border border-slate-200 text-slate-900 text-xs rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 block w-full p-2.5 shadow-sm transition-all h-[42px]"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-[11px] font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Transaction ID / Reference Number</label>
                            <input
                                type="text"
                                value={paymentTransactionId}
                                onChange={(e) => setPaymentTransactionId(e.target.value)}
                                className="bg-white border border-slate-200 text-slate-900 text-xs rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 block w-full p-2.5 shadow-sm transition-all h-[42px]"
                                placeholder="E.g., TXN-123456789"
                            />
                        </div>

                        <div>
                            <label className="block text-[11px] font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Remarks / Notes</label>
                            <textarea
                                value={paymentRemarks}
                                onChange={(e) => setPaymentRemarks(e.target.value)}
                                rows={2}
                                className="bg-white border border-slate-200 text-slate-900 text-xs rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 block w-full p-2.5 shadow-sm transition-all"
                                placeholder="Any additional payment notes..."
                            />
                        </div>

                    </div>
                </div>

                <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
                    <div>
                        {paymentAmount && parseFloat(paymentAmount) > 0 && (
                            <span className="text-[11px] font-bold text-slate-500 uppercase">
                                Balance after payment: <span className={finalOutstanding > 0 ? 'text-red-500' : 'text-emerald-600'}>{finalOutstanding.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                            </span>
                        )}
                    </div>
                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2.5 text-xs font-bold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={() => recordPaymentMutation.mutate()}
                            disabled={recordPaymentMutation.isPending || !paymentAmount || parseFloat(paymentAmount) <= 0}
                            className="flex items-center justify-center gap-2 px-6 py-2.5 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md transition-all"
                        >
                            <Plus size={14} /> {recordPaymentMutation.isPending ? 'Recording...' : 'Record Payment'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
