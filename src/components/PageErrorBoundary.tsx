import { Component, type ReactNode, type ErrorInfo } from 'react'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

export class PageErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[PageErrorBoundary]', error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
          <p className="text-lg font-semibold">Something went wrong</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            This page encountered an error. Your other notebooks are unaffected.
          </p>
          <Button asChild variant="outline">
            <Link to="/app/notebooks">Go back to notebooks</Link>
          </Button>
        </div>
      )
    }

    return this.props.children
  }
}
