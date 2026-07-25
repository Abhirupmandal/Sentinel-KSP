import React from 'react';
import { ShieldAlert, RefreshCw } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[Sentinel ErrorBoundary] Caught exception:', error, errorInfo);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 rounded-2xl bg-red-950/20 border border-red-500/30 text-center max-w-lg mx-auto my-12 backdrop-blur-xl">
          <div className="w-14 h-14 rounded-2xl bg-red-500/20 border border-red-500/30 flex items-center justify-center mx-auto mb-4 text-red-400">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-bold text-white mb-2">View Render Error</h2>
          <p className="text-xs text-slate-400 mb-6 leading-relaxed">
            An unexpected client rendering exception occurred. The system has logged the error for inspection.
          </p>
          <button
            onClick={this.handleReload}
            className="px-4 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-200 text-xs font-semibold transition-colors flex items-center gap-2 mx-auto"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reload Workspace
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
