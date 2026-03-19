import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../api/client';
import type { Booking, Comment } from '../../../types';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '../../../components/ui/dialog';
import { toast } from 'sonner';
import dayjs from 'dayjs';

interface CommentModalProps {
    booking: Booking | null;
    isOpen: boolean;
    onClose: () => void;
}

export const CommentModal: React.FC<CommentModalProps> = ({ booking, isOpen, onClose }) => {
    const [newComment, setNewComment] = useState('');
    const queryClient = useQueryClient();

    const { data: comments, isLoading } = useQuery({
        queryKey: ['comments', booking?.id],
        queryFn: async () => {
            const { data } = await api.get(`/bookings/${booking?.id}/comments`);
            return data as Comment[];
        },
        enabled: !!booking?.id && isOpen,
    });

    const mutation = useMutation({
        mutationFn: async () => {
            const { data } = await api.post(`/bookings/${booking?.id}/comments`, { text: newComment });
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['comments', booking?.id] });
            setNewComment('');
            toast.success('Comment added');
        },
        onError: () => {
            toast.error('Failed to add comment');
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim()) return;
        mutation.mutate();
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Comments & Remarks</DialogTitle>
                </DialogHeader>

                <div className="flex flex-col h-[400px]">
                    <div className="flex-1 overflow-y-auto p-2 space-y-4">
                        {isLoading ? (
                            <p className="text-center text-slate-500">Loading comments...</p>
                        ) : comments?.length === 0 ? (
                            <p className="text-center text-slate-500 mt-10">No comments yet. Be the first to add one!</p>
                        ) : (
                            comments?.map((comment) => (
                                <div key={comment.id} className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                    <div className="flex justify-between items-start mb-1">
                                        <span className="font-semibold text-sm text-slate-800">{comment.createdBy.name}</span>
                                        <span className="text-xs text-slate-500">{dayjs(comment.createdAt).format('DD MMM, HH:mm')}</span>
                                    </div>
                                    <p className="text-sm text-slate-700 whitespace-pre-wrap">{comment.text}</p>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="pt-4 border-t border-slate-200 mt-2">
                        <form onSubmit={handleSubmit} className="flex space-x-2">
                            <input
                                type="text"
                                placeholder="Type a comment..."
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                className="flex-1 px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                            />
                            <button
                                type="submit"
                                disabled={mutation.isPending || !newComment.trim()}
                                className="bg-brand-gradient text-white px-4 py-2 rounded-md hover:opacity-90 disabled:opacity-50 transition-all text-sm font-bold transform hover:scale-[1.02] active:scale-[0.98]"
                            >
                                Add
                            </button>
                        </form>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
