"use client";
import React from "react";
import toast from "react-hot-toast";

/**
 * Error Boundary Component
 * Catches React component errors and displays them gracefully
 * 
 * Usage:
 * Wrap your app in the root layout:
 * 
 * <ErrorBoundary>
 *   <YourApp />
 * </ErrorBoundary>
 */
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null,
      errorCount: 0
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // ✅ IMPROVED: Detailed error logging
    console.error("❌ Error Boundary caught an error:", {
      message: error?.message,
      code: error?.code,
      stack: error?.stack,
      componentStack: errorInfo?.componentStack,
      timestamp: new Date().toISOString(),
    });

    // Update state with error details
    this.setState(prevState => ({
      errorInfo,
      errorCount: prevState.errorCount + 1
    }));

    // Show toast to user only once per error type (avoid spam)
    if (this.state.errorCount < 3) {
      toast.error(`An error occurred: ${error?.message || "Unknown error"}`);
    }
  }

  handleReset = () => {
    this.setState({ 
      hasError: false, 
      error: null,
      errorInfo: null,
      errorCount: 0
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const isDevelopment = process.env.NODE_ENV === "development";

      return (
        <div className="min-h-screen bg-gradient-to-b from-red-950 to-red-900 flex items-center justify-center p-4">
          <div className="bg-red-900 border-2 border-red-700 text-white p-8 rounded-xl max-w-2xl shadow-2xl">
            {/* Header */}
            <div className="mb-6">
              <h1 className="text-3xl font-bold mb-2">⚠️ Something Went Wrong</h1>
              <p className="text-red-200">The application encountered an unexpected error.</p>
            </div>

            {/* Error Message */}
            <div className="bg-red-800 p-4 rounded-lg mb-6 border border-red-700">
              <p className="font-mono text-sm text-red-100">
                {this.state.error?.message || "Unknown error"}
              </p>
            </div>

            {/* Development Only - Full Stack Trace */}
            {isDevelopment && (
              <div className="mb-6 bg-black bg-opacity-50 p-4 rounded-lg border border-red-700 max-h-64 overflow-y-auto">
                <p className="text-red-300 text-xs font-bold mb-2">DEVELOPMENT - Error Details:</p>
                <pre className="text-red-100 text-xs font-mono whitespace-pre-wrap break-words">
                  {this.state.error?.stack}
                </pre>
                {this.state.errorInfo && (
                  <>
                    <p className="text-red-300 text-xs font-bold mt-4 mb-2">Component Stack:</p>
                    <pre className="text-red-100 text-xs font-mono whitespace-pre-wrap break-words">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </>
                )}
              </div>
            )}

            {/* Error Code Info */}
            {this.state.error?.code && (
              <div className="bg-red-800 bg-opacity-50 p-4 rounded-lg mb-6 border border-red-700">
                <p className="text-red-300 text-sm font-mono">
                  Error Code: <span className="font-bold">{this.state.error.code}</span>
                </p>
              </div>
            )}

            {/* Helpful Actions */}
            <div className="bg-red-800 bg-opacity-50 p-4 rounded-lg mb-6 border border-red-700">
              <p className="text-red-200 text-sm mb-3 font-semibold">What you can try:</p>
              <ul className="list-disc list-inside text-red-100 text-sm space-y-1">
                <li>Refresh the page</li>
                <li>Clear your browser cache</li>
                <li>Check your internet connection</li>
                <li>Try again in a few minutes</li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 flex-wrap">
              <button
                onClick={this.handleReset}
                className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 rounded-lg transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={this.handleReload}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-colors"
              >
                Reload Page
              </button>
              <button
                onClick={() => window.location.href = "/dashboard"}
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-lg transition-colors"
              >
                Go to Dashboard
              </button>
            </div>

            {/* Support Info */}
            <div className="mt-6 pt-6 border-t border-red-700">
              <p className="text-red-200 text-xs text-center">
                If this problem persists, please contact support with the error details above.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;