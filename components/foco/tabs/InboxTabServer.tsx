import { fetchInboxTasks } from '@/modules/tasks/queries'
import { TaskItem } from '@/components/TaskItem'
import { getTodayStrServer } from '@/utils/date'

export async function InboxTabServer() {
    const allBacklog = await fetchInboxTasks()
    const todayStr = getTodayStrServer()

    // Filtro visual: exclui radar de hoje, que irá futuramente para o RadarTab.
    // Radar de Hoje = planned_date nulo (já na query) e scheduled_date === todayStr
    // Como a Inbox é um saco sem fundo, ela guarda todo o resto.
    const inboxTasks = allBacklog.filter(t => t.scheduled_date !== todayStr)

    return (
        <div className="p-4 sm:p-6 pb-24">
            <div className="mb-4">
                <h3 className="text-lg font-bold text-gray-900 border-b pb-2">Backlog</h3>
            </div>
            {inboxTasks.length === 0 ? (
                <div className="p-6 flex flex-col items-center justify-center text-center h-[200px] text-gray-500 bg-white rounded-xl border border-gray-100 shadow-sm">
                    <svg className="w-10 h-10 mb-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <p className="font-medium text-gray-900 text-sm">Sua Inbox está limpa!</p>
                </div>
            ) : (
                <ul className="divide-y divide-gray-100 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                    {inboxTasks.map(task => (
                        <TaskItem key={task.id} task={task} />
                    ))}
                </ul>
            )}
        </div>
    )
}
