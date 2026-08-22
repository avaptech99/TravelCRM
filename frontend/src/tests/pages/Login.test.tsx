import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../../context/AuthContext';
import { Login } from '../../pages/Login';
import { Toaster } from 'react-hot-toast';

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

const renderLogin = () => {
    return render(
        <QueryClientProvider client={queryClient}>
            <BrowserRouter>
                <AuthProvider>
                    <Login />
                    <Toaster />
                </AuthProvider>
            </BrowserRouter>
        </QueryClientProvider>
    );
};

describe('Login Page', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('Renders email and password fields and the Sign In button', () => {
        renderLogin();
        expect(screen.getByPlaceholderText(/user@travel.com/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/Enter your password/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /SIGN IN/i })).toBeInTheDocument();
    });

    it('Has required email and password fields', () => {
        renderLogin();
        expect(screen.getByPlaceholderText(/user@travel.com/i)).toBeRequired();
        expect(screen.getByPlaceholderText(/Enter your password/i)).toBeRequired();
    });

    it('On successful login, stores JWT token in localStorage', async () => {
        const user = userEvent.setup();
        renderLogin();
        await user.type(screen.getByPlaceholderText(/user@travel.com/i), 'admin@test.com');
        await user.type(screen.getByPlaceholderText(/Enter your password/i), 'testpass123');
        await user.click(screen.getByRole('button', { name: /SIGN IN/i }));

        await waitFor(() => {
            expect(localStorage.getItem('token')).toBe('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6InVzZXIxIiwibmFtZSI6IkFkbWluIFRlc3QiLCJlbWFpbCI6ImFkbWluQHRlc3QuY29tIiwicm9sZSI6IkFETUlOIiwiZ3JvdXBzIjpbIk1hbmFnZW1lbnQiXX0.signature');
        });
    });

    it('Shows error toast/alert when API returns 401', async () => {
        const user = userEvent.setup();
        renderLogin();
        await user.type(screen.getByPlaceholderText(/user@travel.com/i), 'admin@test.com');
        await user.type(screen.getByPlaceholderText(/Enter your password/i), 'wrongpass');
        await user.click(screen.getByRole('button', { name: /SIGN IN/i }));

        // Real component displays errors in screen.getByText or displays as error message state in component
        expect(await screen.findByText(/Invalid credentials/i)).toBeInTheDocument();
    });
});
