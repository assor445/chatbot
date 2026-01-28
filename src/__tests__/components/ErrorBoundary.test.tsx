import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ErrorBoundary } from '@/components/ErrorBoundary'

describe('ErrorBoundary Component', () => {
    it('should render children when no error', () => {
        render(
            <ErrorBoundary>
                <div data-testid="child">Hello World</div>
            </ErrorBoundary>
        )

        expect(screen.getByTestId('child')).toBeInTheDocument()
        expect(screen.getByText('Hello World')).toBeInTheDocument()
    })

    it('should render fallback when provided and error occurs', () => {
        const ThrowError = () => {
            throw new Error('Test Error')
        }

        // Suppress console.error for this test
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { })

        render(
            <ErrorBoundary fallback={<div data-testid="fallback">Error Fallback</div>}>
                <ThrowError />
            </ErrorBoundary>
        )

        expect(screen.getByTestId('fallback')).toBeInTheDocument()
        consoleSpy.mockRestore()
    })

    it('should render default error UI when no fallback provided', () => {
        const ThrowError = () => {
            throw new Error('Test Error')
        }

        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { })

        render(
            <ErrorBoundary>
                <ThrowError />
            </ErrorBoundary>
        )

        expect(screen.getByText('Something went wrong')).toBeInTheDocument()
        expect(screen.getByText('Try Again')).toBeInTheDocument()
        expect(screen.getByText('Reload Page')).toBeInTheDocument()

        consoleSpy.mockRestore()
    })

    it('should show error details in expandable section', () => {
        const ThrowError = () => {
            throw new Error('Specific Error Message')
        }

        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { })

        render(
            <ErrorBoundary>
                <ThrowError />
            </ErrorBoundary>
        )

        expect(screen.getByText('Error details')).toBeInTheDocument()
        expect(screen.getByText('Specific Error Message')).toBeInTheDocument()

        consoleSpy.mockRestore()
    })
})
