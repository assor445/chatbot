'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/cjs/styles/prism'
import { useState, useCallback, ReactNode } from 'react'

interface MessageContentProps {
    content: string
    isUser?: boolean
}

// Preprocessor to fix LaTeX that's not properly wrapped with $ delimiters
function preprocessLaTeX(content: string): string {
    if (!content) return content

    let processed = content

    // Convert \[...\] to $$...$$
    processed = processed.replace(/\\\[([\s\S]*?)\\\]/g, '\n$$$$1$$\n')

    // Convert \(...\) to $...$
    processed = processed.replace(/\\\(([\s\S]*?)\\\)/g, '$$$1$$')

    // Convert standalone [ ... ] blocks with LaTeX commands to $$ ... $$
    // This handles cases like [ 1024\ \text{byte} \times 8 = 8192\ \text{bit} ]
    processed = processed.replace(/\[\s*((?:[^[\]]*\\(?:text|frac|times|div|sqrt|sum|prod|int|lim|infty|alpha|beta|gamma|delta|theta|pi|sigma|omega|cdot|ldots|cdots|leq|geq|neq|approx|equiv|pm|mp|cap|cup|subset|supset|in|notin|forall|exists|nabla|partial|underline|overline|underbrace|overbrace|boxed|cancel|binom|choose)[^[\]]*)+)\s*\]/g, '\n$$$$$1$$$$\n')

    // Detect inline LaTeX patterns that aren't wrapped
    // Pattern: text containing common LaTeX commands
    const latexCommands = /(?<![\$`])(\b\d*\s*\\(?:text|frac|times|div|sqrt|cdot|pm|mp|leq|geq|neq|approx|underline|overline|boxed)\{[^}]*\}(?:\s*[=+\-*/×÷]\s*(?:\d+|\\[a-z]+\{[^}]*\}))*)/gi

    processed = processed.replace(latexCommands, (match) => {
        // Don't wrap if already inside $ or `
        return `$${match}$`
    })

    // Handle superscript/subscript patterns like 2^{10} or x_{n}
    processed = processed.replace(/(?<![`$])(\b\d+\^?\{[^}]+\})/g, (match, p1, offset, string) => {
        // Check if already inside math delimiters
        const before = string.substring(Math.max(0, offset - 10), offset)
        if (before.includes('$') || before.includes('`')) return match
        return `$${p1}$`
    })

    // Handle patterns like (formula with LaTeX) - but be careful not to break normal parentheses
    processed = processed.replace(/\((\s*\d+\s*\\(?:text|times|frac|div)[^)]+)\)/g, '$$$1$$')

    return processed
}

function CopyButton({ code }: { code: string }) {
    const [copied, setCopied] = useState(false)

    const handleCopy = async () => {
        await navigator.clipboard.writeText(code)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <button
            onClick={handleCopy}
            className="absolute top-2 right-2 px-2 py-1 text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 rounded transition-colors"
        >
            {copied ? 'Copied!' : 'Copy'}
        </button>
    )
}

// External Link Dialog Component
function ExternalLinkDialog({
    url,
    isOpen,
    onClose
}: {
    url: string
    isOpen: boolean
    onClose: () => void
}) {
    const [copied, setCopied] = useState(false)

    const handleCopyLink = async () => {
        await navigator.clipboard.writeText(url)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const handleOpenLink = () => {
        window.open(url, '_blank', 'noopener,noreferrer')
        onClose()
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Dialog */}
            <div className="relative bg-slate-800 border border-slate-700 rounded-xl shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="p-6">
                    <h2 className="text-xl font-semibold text-white mb-2">
                        Buka link eksternal
                    </h2>
                    <p className="text-slate-400 text-sm mb-4">
                        Kamu akan meninggalkan AI Chatbot untuk mengunjungi link eksternal:
                    </p>

                    {/* URL Display */}
                    <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-3 mb-6">
                        <p className="text-slate-300 text-sm break-all font-mono">
                            {url}
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 justify-end">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                        >
                            Batal
                        </button>
                        <button
                            onClick={handleCopyLink}
                            className="px-4 py-2 text-sm bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors flex items-center gap-2"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                                <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                            </svg>
                            {copied ? 'Tersalin!' : 'Salin link'}
                        </button>
                        <button
                            onClick={handleOpenLink}
                            className="px-4 py-2 text-sm bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center gap-2"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                                <polyline points="15 3 21 3 21 9" />
                                <line x1="10" x2="21" y1="14" y2="3" />
                            </svg>
                            Buka link
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

// Custom Link Component with Dialog
function ExternalLink({ href, children }: { href?: string; children: ReactNode }) {
    const [isDialogOpen, setIsDialogOpen] = useState(false)

    const handleClick = useCallback((e: React.MouseEvent) => {
        e.preventDefault()
        setIsDialogOpen(true)
    }, [])

    return (
        <>
            <a
                href={href}
                onClick={handleClick}
                className="text-purple-400 hover:text-purple-300 underline cursor-pointer inline-flex items-center gap-1"
            >
                {children}
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline-block opacity-60">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" x2="21" y1="14" y2="3" />
                </svg>
            </a>
            <ExternalLinkDialog
                url={href || ''}
                isOpen={isDialogOpen}
                onClose={() => setIsDialogOpen(false)}
            />
        </>
    )
}

export default function MessageContent({ content, isUser }: MessageContentProps) {
    // For user messages, just render plain text
    if (isUser) {
        return <p className="whitespace-pre-wrap leading-relaxed text-[15px]">{content || '...'}</p>
    }

    // For assistant messages, render markdown
    return (
        <div className="prose prose-invert prose-sm max-w-none">
            <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkMath]}
                rehypePlugins={[rehypeKatex]}
                components={{
                    // Code blocks
                    code({ className, children, ...props }) {
                        const match = /language-(\w+)/.exec(className || '')
                        const codeString = String(children).replace(/\n$/, '')

                        // Check if it's an inline code or code block
                        const isInline = !match && !codeString.includes('\n')

                        if (isInline) {
                            return (
                                <code className="bg-slate-700/50 px-1.5 py-0.5 rounded text-pink-400 text-sm" {...props}>
                                    {children}
                                </code>
                            )
                        }

                        return (
                            <div className="relative group my-4">
                                {match && (
                                    <div className="absolute top-0 left-0 px-3 py-1 text-xs text-slate-400 bg-slate-800 rounded-tl-lg border-b border-r border-slate-700">
                                        {match[1]}
                                    </div>
                                )}
                                <CopyButton code={codeString} />
                                <SyntaxHighlighter
                                    style={oneDark}
                                    language={match?.[1] || 'text'}
                                    PreTag="div"
                                    customStyle={{
                                        margin: 0,
                                        borderRadius: '0.5rem',
                                        padding: '2.5rem 1rem 1rem 1rem',
                                        fontSize: '0.875rem',
                                        backgroundColor: '#1e1e2e',
                                    }}
                                >
                                    {codeString}
                                </SyntaxHighlighter>
                            </div>
                        )
                    },
                    // Paragraphs
                    p({ children }) {
                        return <p className="mb-3 last:mb-0 leading-relaxed">{children}</p>
                    },
                    // Headers
                    h1({ children }) {
                        return <h1 className="text-xl font-bold mt-4 mb-2 text-white">{children}</h1>
                    },
                    h2({ children }) {
                        return <h2 className="text-lg font-bold mt-4 mb-2 text-white">{children}</h2>
                    },
                    h3({ children }) {
                        return <h3 className="text-base font-bold mt-3 mb-2 text-white">{children}</h3>
                    },
                    // Lists
                    ul({ children }) {
                        return <ul className="list-disc list-inside mb-3 space-y-1">{children}</ul>
                    },
                    ol({ children }) {
                        return <ol className="list-decimal list-inside mb-3 space-y-1">{children}</ol>
                    },
                    li({ children }) {
                        return <li className="text-slate-200">{children}</li>
                    },
                    // Links - Now with dialog confirmation
                    a({ href, children }) {
                        return <ExternalLink href={href}>{children}</ExternalLink>
                    },
                    // Blockquotes
                    blockquote({ children }) {
                        return (
                            <blockquote className="border-l-4 border-purple-500 pl-4 my-3 text-slate-300 italic">
                                {children}
                            </blockquote>
                        )
                    },
                    // Tables
                    table({ children }) {
                        return (
                            <div className="overflow-x-auto my-4">
                                <table className="min-w-full border border-slate-600 rounded-lg overflow-hidden">
                                    {children}
                                </table>
                            </div>
                        )
                    },
                    thead({ children }) {
                        return <thead className="bg-slate-700">{children}</thead>
                    },
                    th({ children }) {
                        return <th className="px-4 py-2 text-left text-sm font-semibold text-white border-b border-slate-600">{children}</th>
                    },
                    td({ children }) {
                        return <td className="px-4 py-2 text-sm text-slate-300 border-b border-slate-700">{children}</td>
                    },
                    // Horizontal rule
                    hr() {
                        return <hr className="my-4 border-slate-600" />
                    },
                    // Strong/Bold
                    strong({ children }) {
                        return <strong className="font-semibold text-white">{children}</strong>
                    },
                    // Emphasis/Italic
                    em({ children }) {
                        return <em className="italic text-slate-300">{children}</em>
                    },
                }}
            >
                {preprocessLaTeX(content) || '...'}
            </ReactMarkdown>
        </div>
    )
}
