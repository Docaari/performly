'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

type TabType = 'inbox' | 'radar'

interface PlanningShellContextType {
    isOpen: boolean;
    activeTab: TabType;
    openShell: (tab?: TabType) => void;
    closeShell: () => void;
    setTab: (tab: TabType) => void;
    refreshInboxKey: number;
    triggerRefreshInbox: () => void;
    refreshTodayKey: number;
    triggerRefreshToday: () => void;
}

const PlanningShellContext = createContext<PlanningShellContextType | undefined>(undefined)

export function PlanningShellProvider({ children }: { children: ReactNode }) {
    const [isOpen, setIsOpen] = useState(false)
    const [activeTab, setActiveTab] = useState<TabType>('inbox')
    const [refreshInboxKey, setRefreshInboxKey] = useState(0)
    const [refreshTodayKey, setRefreshTodayKey] = useState(0)

    const openShell = (tab?: TabType) => {
        console.log("openShell disparado. Aba alvo:", tab || activeTab)
        if (tab) setActiveTab(tab)
        setIsOpen(true)
    }

    const closeShell = () => {
        console.log("closeShell disparado.")
        setIsOpen(false)
    }
    const setTab = (tab: TabType) => setActiveTab(tab)
    const triggerRefreshInbox = () => setRefreshInboxKey(prev => prev + 1)
    const triggerRefreshToday = () => setRefreshTodayKey(prev => prev + 1)

    return (
        <PlanningShellContext.Provider value={{ isOpen, activeTab, openShell, closeShell, setTab, refreshInboxKey, triggerRefreshInbox, refreshTodayKey, triggerRefreshToday }}>
            {children}
        </PlanningShellContext.Provider>
    )
}

export function usePlanningShell() {
    const context = useContext(PlanningShellContext)
    if (!context) throw new Error('usePlanningShell must be used within PlanningShellProvider')
    return context
}
