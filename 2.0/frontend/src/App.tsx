import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';

import { Login } from './pages/Login';
import { MainLayout } from './components/layout/MainLayout';
import { ProtectedRoute } from './components/ProtectedRoute';

// Lazy load pages for better performance
const Dashboard = lazy(() => import('./pages/Dashboard').then(module => ({ default: module.Dashboard })));
const Bookings = lazy(() => import('./pages/Bookings').then(module => ({ default: module.Bookings })));
const MyBookings = lazy(() => import('./pages/MyBookings').then(module => ({ default: module.MyBookings })));
const UnassignedBookings = lazy(() => import('./pages/UnassignedBookings').then(module => ({ default: module.UnassignedBookings })));
const CalendarView = lazy(() => import('./pages/CalendarView').then(module => ({ default: module.CalendarView })));
const BookingDetails = lazy(() => import('./pages/BookingDetails').then(module => ({ default: module.BookingDetails })));

const BookingTravelers = lazy(() => import('./pages/BookingTravelers').then(module => ({ default: module.BookingTravelers })));
const BookedEDT = lazy(() => import('./pages/BookedEDT').then(module => ({ default: module.BookedEDT })));
const Reports = lazy(() => import('./pages/Reports').then(module => ({ default: module.Reports })));
const Users = lazy(() => import('./pages/Users').then(module => ({ default: module.Users })));
const Settings = lazy(() => import('./pages/Settings').then(module => ({ default: module.Settings })));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60,      // 60 seconds — data barely changes with 15 users
      gcTime: 1000 * 60 * 10,    // 10 minutes — keep data in memory longer
    },
  },
});

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/login" element={<Login />} />

              <Route element={<ProtectedRoute />}>
                <Route element={<MainLayout />}>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/bookings" element={<Bookings />} />
                  <Route path="/my-bookings" element={<MyBookings />} />
                  <Route path="/unassigned-bookings" element={<UnassignedBookings />} />
                  <Route path="/calendar" element={<CalendarView />} />
                  <Route path="/bookings/:id" element={<BookingDetails />} />

                  <Route path="/bookings/:id/travelers" element={<BookingTravelers />} />
                  <Route path="/booked" element={<BookedEDT />} />
                  <Route path="/reports" element={<Reports />} />
                  <Route path="/users" element={<Users />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Route>
              </Route>
            </Routes>
          </Suspense>
        </BrowserRouter>
        <Toaster position="top-right" richColors />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
