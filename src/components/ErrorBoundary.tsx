'use client';

import React, { Component, type ErrorInfo } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
          <div className="w-14 h-14 rounded-2xl bg-danger/10 border border-danger/20 flex items-center justify-center mb-5">
            <AlertTriangle className="w-7 h-7 text-danger" />
          </div>
          <h3 className="text-lg font-display font-semibold text-text-primary mb-2">
            Something went wrong
          </h3>
          <p className="text-sm text-text-tertiary max-w-sm mb-6 leading-relaxed">
            An unexpected error occurred. Try refreshing the page or click the button below.
          </p>
          {this.state.error && (
            <pre className="text-xs text-text-muted bg-surface-2 border border-border rounded-lg p-3 mb-6 max-w-md overflow-x-auto">
              {this.state.error.message}
            </pre>
          )}
          <button
            onClick={this.handleReset}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-surface-2 border border-border rounded-xl text-text-primary hover:bg-surface-3 hover:border-text-tertiary transition-all cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Functional wrapper for easier use
export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  fallback?: React.ReactNode
) {
  const displayName = WrappedComponent.displayName || WrappedComponent.name || 'Component';

  const WithBoundary = (props: P) => (
    <ErrorBoundary fallback={fallback}>
      <WrappedComponent {...props} />
    </ErrorBoundary>
  );

  WithBoundary.displayName = `withErrorBoundary(${displayName})`;
  return WithBoundary;
}
