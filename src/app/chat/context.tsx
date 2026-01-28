'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import { AI_MODELS } from './data'

interface ModelContextType {
    selectedModel: string
    setSelectedModel: (model: string) => void
    isSidebarOpen: boolean
    setIsSidebarOpen: (isOpen: boolean) => void
}

const ModelContext = createContext<ModelContextType | null>(null)

export function useChatContext() {
    const context = useContext(ModelContext)
    if (!context) {
        throw new Error('useChatContext must be used within ChatContextProvider')
    }
    return context
}

export function ChatContextProvider({ children }: { children: React.ReactNode }) {
    const [selectedModel, setSelectedModel] = useState(AI_MODELS[0].id)
    // Default to false, will be set based on screen size on mount
    const [isSidebarOpen, setIsSidebarOpen] = useState(false)
    const [isInitialized, setIsInitialized] = useState(false)

    // Set sidebar state based on screen size on initial mount
    useEffect(() => {
        const isMobile = window.innerWidth < 768
        setIsSidebarOpen(!isMobile) // Open on desktop, closed on mobile
        setIsInitialized(true)
    }, [])

    // Don't render children until we've determined the correct sidebar state
    // This prevents the flash of incorrect layout
    if (!isInitialized) {
        return null
    }

    return (
        <ModelContext.Provider value={{
            selectedModel,
            setSelectedModel,
            isSidebarOpen,
            setIsSidebarOpen
        }}>
            {children}
        </ModelContext.Provider>
    )
}
