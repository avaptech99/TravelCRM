import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../api/client';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '../../../components/ui/dialog';
import { toast } from 'sonner';

const paymentSchema = z.object({
    amount: z.number().min(1, 'Amount must be greater than 0'),
    paymentMethod: z.string().min(1, 'Payment method is required'),
    transactionId: z.string().optional(),
    date: z.string().min(1, 'Date is required'),
    remarks: z.string().optional(),
});

type FormValues = z.infer<typeof paymentSchema>;

interface PaymentModalProps {
    bookingId: string;
    isOpen: boolean;
    onClose: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ bookingId, isOpen, onClose }) => {
    const queryClient = useQueryClient();

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<FormValues>({
        resolver: zodResolver(paymentSchema),
        defaultValues: {
            amount: 0,
            paymentMethod: '',
            transactionId: '',
            date: new Date().toISOString().split('T')[0],
            remarks: '',
        },
    });

    React.useEffect(() => {
        if (isOpen) {
            reset({
                amount: 0,
                paymentMethod: '',
                transactionId: '',
                date: new Date().toISOString().split('T')[0],
                remarks: '',
            });
        }
    }, [isOpen, reset]);

    const mutation = useMutation({
        mutationFn: async (data: FormValues) => {
            await api.post(`/bookings/${bookingId}/payments`, data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['bookings'] });
            queryClient.invalidateQueries({ queryKey: ['booking', bookingId] });
            toast.success('Payment added successfully');
            onClose();
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to add payment');
        },
    });

    const onSubmit = (data: FormValues) => {
        mutation.mutate(data);
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Add Payment</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Amount *</label>
                        <input
                            type="number"
                            step="0.01"
                            {...register('amount', { valueAsNumber: true })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="0.00"
                        />
                        {errors.amount && (
                            <p className="text-red-500 text-xs mt-1">{errors.amount.message}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Payment Method *</label>
                        <select
                            {...register('paymentMethod')}
                            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                        >
                            <option value="">Select Method</option>
                            <option value="Credit Card">Credit Card</option>
                            <option value="Debit Card">Debit Card</option>
                            <option value="Bank Transfer">Bank Transfer</option>
                            <option value="UPI">UPI</option>
                            <option value="Cash">Cash</option>
                            <option value="Other">Other</option>
                        </select>
                        {errors.paymentMethod && (
                            <p className="text-red-500 text-xs mt-1">{errors.paymentMethod.message}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Transaction/Reference ID</label>
                        <input
                            {...register('transactionId')}
                            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="e.g. TXN123456789"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Date *</label>
                        <input
                            type="date"
                            {...register('date')}
                            max={new Date().toISOString().split('T')[0]}
                            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        {errors.date && (
                            <p className="text-red-500 text-xs mt-1">{errors.date.message}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Remarks</label>
                        <textarea
                            {...register('remarks')}
                            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[80px]"
                            placeholder="Optional remarks..."
                        />
                    </div>

                    <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={mutation.isPending || isSubmitting}
                            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                        >
                            {mutation.isPending ? 'Saving...' : 'Save Payment'}
                        </button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};
