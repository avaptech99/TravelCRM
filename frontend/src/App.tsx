
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';

import { Login } from './pages/Login';
import { MainLayout } from './components/layout/MainLayout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Bookings } from './pages/Bookings';
import { Dashboard } from './pages/Dashboard';
import { BookedEDT } from './pages/BookedEDT';
import { Users } from './pages/Users';
import { BookingDetails } from './pages/BookingDetails';
import { BookingTravelers } from './pages/BookingTravelers';
import { Settings } from './pages/Settings';
import { MyBookings } from './pages/MyBookings';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: true,
      staleTime: 0,
      gcTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />

            <Route element={<ProtectedRoute />}>
              <Route element={<MainLayout />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/bookings" element={<Bookings />} />
                <Route path="/my-bookings" element={<MyBookings />} />
                <Route path="/bookings/:id" element={<BookingDetails />} />
                <Route path="/bookings/:id/travelers" element={<BookingTravelers />} />
                <Route path="/booked" element={<BookedEDT />} />
                <Route path="/users" element={<Users />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Route>
          </Routes>
        </BrowserRouter>
        <Toaster position="top-right" richColors />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
