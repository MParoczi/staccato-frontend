import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import i18n from '@/i18n';

interface PageErrorBoundaryProps {
  children: ReactNode;
}

interface PageErrorBoundaryState {
  hasError: boolean;
}

function ErrorFallback({ onReset }: { onReset: () => void }) {
  const t = (key: string) => i18n.t(key);

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 p-10 text-center">
      <AlertTriangle
        className="size-10 text-destructive"
        aria-hidden="true"
      />
      <h2 className="text-lg font-semibold">
        {t('common.errorBoundary.title')}
      </h2>
      <p className="text-sm text-muted-foreground">
        {t('common.errorBoundary.message')}
      </p>
      <Button variant="outline" onClick={onReset}>
        <RefreshCw className="size-4" aria-hidden="true" />
        {t('common.errorBoundary.retry')}
      </Button>
    </div>
  );
}

export class PageErrorBoundary extends Component<
  PageErrorBoundaryProps,
  PageErrorBoundaryState
> {
  constructor(props: PageErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): PageErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('PageErrorBoundary caught an error:', error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return <ErrorFallback onReset={this.handleReset} />;
    }
    return this.props.children;
  }
}
