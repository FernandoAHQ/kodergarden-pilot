import { Component, type ErrorInfo, type ReactNode } from "react";

interface AppErrorBoundaryProps {
  readonly children: ReactNode;
}

interface AppErrorBoundaryState {
  readonly failed: boolean;
}

export class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = { failed: false };

  static getDerivedStateFromError(): AppErrorBoundaryState {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("Kodergarden UI failure", { error, componentStack: info.componentStack });
  }

  render(): ReactNode {
    if (!this.state.failed) return this.props.children;

    return (
      <main className="app-failure" role="alert">
        <div className="app-failure__card">
          <p className="eyebrow">KODERGARDEN</p>
          <h1>We hit an unexpected problem.</h1>
          <p>Ocurrió un problema inesperado. Reload the page to continue.</p>
          <button className="primary-button" type="button" onClick={() => window.location.reload()}>
            Reload / Recargar
          </button>
        </div>
      </main>
    );
  }
}
