import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends React.Component<
    { children: React.ReactNode },
    ErrorBoundaryState
> {
    constructor(props: { children: React.ReactNode }) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('[ErrorBoundary] Caught error:', error, errorInfo);
    }

    handleRetry = () => {
        this.setState({ hasError: false, error: null });
    };

    handleReload = () => {
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
                    <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8 max-w-md w-full text-center space-y-5">
                        <div className="mx-auto w-14 h-14 bg-amber-50 rounded-full flex items-center justify-center border border-amber-100">
                            <AlertTriangle className="text-amber-500" size={28} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900">Something went wrong</h2>
                            <p className="text-slate-500 text-sm mt-2">
                                The application encountered an unexpected error. This can happen when the server is restarting.
                            </p>
                        </div>
                        <div className="flex gap-3 justify-center pt-2">
                            <button
                                onClick={this.handleRetry}
                                className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-sm font-bold rounded-lg hover:opacity-90 transition-all shadow-sm"
                            >
                                <RefreshCw size={14} />
                                Try Again
                            </button>
                            <button
                                onClick={this.handleReload}
                                className="px-5 py-2.5 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-all"
                            >
                                Reload Page
                            </button>
                        </div>
                        {this.state.error && (
                            <p className="text-[10px] text-slate-400 bg-slate-50 rounded-lg p-3 font-mono break-all border border-slate-100">
                                {this.state.error.message}
                            </p>
                        )}
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
