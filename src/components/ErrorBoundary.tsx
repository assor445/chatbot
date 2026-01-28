'use client'

import { Component, ReactNode } from 'react'
import { Button } from '@/components/ui/button'

interface Props {
    children: ReactNode
    fallback?: ReactNode
}

interface State {
    hasError: boolean
    error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props)
        this.state = { hasError: false }
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error }
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo)
    }

    handleRetry = () => {
        this.setState({ hasError: false, error: undefined })
    }

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback
            }

            return (
                <div className="flex-1 flex items-center justify-center bg-slate-900 p-4">
                    <div className="max-w-md w-full bg-slate-800/50 border border-slate-700 rounded-xl p-6 text-center">
                        <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-400">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="12" x2="12" y1="8" y2="12" />
                                <line x1="12" x2="12.01" y1="16" y2="16" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-semibold text-white mb-2">
                            Something went wrong
                        </h2>
                        <p className="text-slate-400 text-sm mb-4">
                            An unexpected error occurred. Please try again.
                        </p>
                        {this.state.error && (
                            <details className="mb-4 text-left">
                                <summary className="text-xs text-slate-500 cursor-pointer hover:text-slate-400">
                                    Error details
                                </summary>
                                <pre className="mt-2 p-2 bg-slate-900 rounded text-xs text-red-300 overflow-auto max-h-32">
                                    {this.state.error.message}
                                </pre>
                            </details>
                        )}
                        <div className="flex gap-2 justify-center">
                            <Button
                                onClick={this.handleRetry}
                                className="bg-slate-700 hover:bg-slate-600 text-white"
                            >
                                Try Again
                            </Button>
                            <Button
                                onClick={() => window.location.reload()}
                                variant="outline"
                                className="border-slate-600 text-slate-300 hover:bg-slate-700"
                            >
                                Reload Page
                            </Button>
                        </div>
                    </div>
                </div>
            )
        }

        return this.props.children
    }
}

export default ErrorBoundary
