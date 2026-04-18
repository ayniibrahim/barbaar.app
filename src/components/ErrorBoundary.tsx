import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      let errorMessage = 'An unexpected error occurred.';
      let isFirestoreError = false;

      try {
        if (this.state.error?.message) {
          const parsed = JSON.parse(this.state.error.message);
          if (parsed.error && parsed.operationType) {
            errorMessage = `Database Error: ${parsed.error}`;
            isFirestoreError = true;
          }
        }
      } catch (e) {
        errorMessage = this.state.error?.message || errorMessage;
      }

      return (
        <div className="min-h-screen bg-bg flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-card border border-border rounded-[2.5rem] p-8 text-center shadow-xl">
            <div className="w-20 h-20 bg-red-500/10 rounded-[2rem] flex items-center justify-center mx-auto mb-6 text-red-500">
              <AlertTriangle size={40} />
            </div>
            <h2 className="text-2xl font-black text-text mb-4 tracking-tight">Something went wrong</h2>
            <p className="text-text/60 text-sm mb-8 leading-relaxed">
              {isFirestoreError 
                ? "We're having trouble connecting to our services. Please check your connection and try again."
                : "The application encountered an error. We've been notified and are looking into it."}
            </p>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mb-8 p-4 bg-slate-900 rounded-2xl text-left overflow-auto max-h-40">
                <p className="text-xs font-mono text-red-400 break-all">{this.state.error.toString()}</p>
              </div>
            )}

            <button
              onClick={this.handleReset}
              className="w-full py-4 bg-brand text-white rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:opacity-90 transition-all active:scale-95"
            >
              <RefreshCw size={18} />
              Reload App
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
