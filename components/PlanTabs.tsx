'use client'

import { useState } from 'react'
import type { Task } from '@/modules/tasks/queries'
import { PlanList } from './PlanList'
import { HistoryTab } from './HistoryTab'
import { CreateTaskForm } from './CreateTaskForm'
import { getTodayStrClient } from '@/utils/date'

type PlanTabsProps = {
    activeTasks: Task[]
    historyTasks: Task[]
}

type TabType = 'plan' | 'history'

export function PlanTabs({ activeTasks, historyTasks }: PlanTabsProps) {
    const [activeTab, setActiveTab] = useState<TabType>('plan')
    const todayStr = getTodayStrClient()

    return (
        <div>
            {/* Tabs Header */}
            <div className="flex space-x-1 border-b border-gray-200 mb-6">
                <button
                    onClick={() => setActiveTab('plan')}
                    className={`pb-3 px-4 text-sm font-bold transition-all relative ${activeTab === 'plan'
                        ? 'text-black'
                        : 'text-gray-400 hover:text-gray-600'
                        }`}
                >
                    Planejamento Semanal
                    {activeTab === 'plan' && (
                        <span className="absolute bottom-0 left-0 w-full h-[2px] bg-black rounded-t-full" />
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('history')}
                    className={`pb-3 px-4 text-sm font-bold transition-all relative flex items-center gap-2 ${activeTab === 'history'
                        ? 'text-black'
                        : 'text-gray-400 hover:text-gray-600'
                        }`}
                >
                    Histórico
                    <span className="bg-gray-100 text-gray-500 text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                        {historyTasks.length}
                    </span>
                    {activeTab === 'history' && (
                        <span className="absolute bottom-0 left-0 w-full h-[2px] bg-black rounded-t-full" />
                    )}
                </button>
            </div>

            {/* Tab Content */}
            <div className="relative min-h-[400px]">
                {activeTab === 'plan' ? (
                    <>
                        <div className="mb-8 max-w-2xl">
                            <CreateTaskForm targetDateStr={todayStr} />
                        </div>
                        <PlanList tasks={activeTasks} />
                    </>
                ) : (
                    <HistoryTab tasks={historyTasks} />
                )}
            </div>
        </div>
    )
}
