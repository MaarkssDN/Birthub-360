import { Component, type ErrorInfo, type ReactNode } from 'react';
import { clientLogger } from '../lib/clientLogger.js';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    clientLogger.error({ err: error, errorInfo }, 'Uncaught error');
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 bg-black min-h-screen z-50 fixed inset-0 flex flex-col items-center justify-center">
          <h1 className="text-2xl font-bold text-red-400">
            Algo deu errado. Tente recarregar a página.
          </h1>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-6 px-4 py-2 bg-white text-black rounded-lg font-medium hover:bg-gray-200 transition-colors"
          >
            Recarregar página
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
