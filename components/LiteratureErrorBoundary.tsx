/**
 * Error Boundary for Literature Components
 * Catches and handles errors in the literature integration
 * @module components/LiteratureErrorBoundary
 */

import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

/**
 * Error boundary specifically for literature/PubMed components
 * Prevents errors in literature features from breaking the entire app
 */
export class LiteratureErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console in development
    console.error('Literature Panel Error:', error, errorInfo);
    
    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // In production, you would send this to an error tracking service
    // Example: Sentry.captureException(error, { extra: errorInfo });
    
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div className="p-4 border border-red-200 dark:border-red-900/50 rounded-lg bg-red-50/50 dark:bg-red-900/10">
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-red-600 dark:text-red-400 text-2xl">
              error
            </span>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-red-900 dark:text-red-100">
                Unable to load literature
              </h3>
              <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                {this.state.error?.message || 'An unexpected error occurred'}
              </p>
              {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
                <details className="mt-2 text-xs text-red-600 dark:text-red-400">
                  <summary className="cursor-pointer hover:underline">
                    Error details (dev only)
                  </summary>
                  <pre className="mt-2 p-2 bg-red-100 dark:bg-red-900/30 rounded overflow-auto text-[10px]">
                    {this.state.errorInfo.componentStack}
                  </pre>
                </details>
              )}
              <button
                onClick={this.handleReset}
                className="mt-3 text-xs px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default LiteratureErrorBoundary;
