import { useQuery } from '@tanstack/react-query';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

interface SyncData {
    stats: {
        total: number;
        booked: number;
        pending: number;
        working: number;
        sent: number;
        agents: number;
    };
    recentBookings: any[];
    notifications: any[];
}

export const useGlobalSync = () => {
    const { user } = useAuth();

    return useQuery<SyncData>({
        queryKey: ['global-sync', user?.id],
        queryFn: async () => {
            const { data } = await api.get('/sync');
            return data;
        },
        enabled: !!user?.id,
        refetchInterval: 60000, // Poll every 60 seconds
        staleTime: 30000,
    });
};
