import { fetchTasks, type Task } from '@/modules/tasks/queries';

export const dynamic = 'force-dynamic';

export default async function TasksPage() {
    let tasks: Task[] = [];
    let fetchError: string | null = null;

    try {
        tasks = await fetchTasks();
    } catch (error: any) {
        fetchError = error.message;
    }

    const renderStatus = (status: string) => {
        switch (status) {
            case 'pending': return <span className="text-gray-500 text-sm font-medium">Pendente</span>;
            case 'in_progress': return <span className="text-blue-600 text-sm font-medium">Em Progresso</span>;
            case 'completed': return <span className="text-green-600 text-sm font-medium">Concluída</span>;
            case 'archived': return <span className="text-gray-400 text-sm font-medium">Arquivada</span>;
            default: return null;
        }
    };

    const renderDate = (date: string | null) => {
        if (!date) return <span className="text-gray-400 text-sm">Sem data</span>;

        const todayDate = new Date();
        const today = new Date(todayDate.getTime() - todayDate.getTimezoneOffset() * 60000).toISOString().split('T')[0];

        if (date === today) return <span className="text-blue-600 font-semibold text-sm">Hoje</span>;

        const [y, m, d] = date.split('-');
        return <span className="text-gray-600 text-sm">{`${d}/${m}/${y}`}</span>;
    }

    return (
        <div className="p-6 md:p-10 max-w-4xl mx-auto">
            <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Central de Tarefas</h1>
            <p className="text-gray-500 mb-8">Descarregue sua mente. Todo começo nasce aqui.</p>

            {fetchError && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-6 shadow-sm">
                    <p className="font-semibold">Falha na Comunicação</p>
                    <p className="text-sm">{fetchError}</p>
                </div>
            )}

            {!fetchError && tasks.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 border-dashed p-10 text-center shadow-sm">
                    <div className="text-4xl mb-4">📭</div>
                    <h2 className="text-xl font-semibold mb-2">Sua mente está limpa</h2>
                    <p className="text-gray-500 mb-6 max-w-md mx-auto">Surgiu uma ideia ou demanda? Adicione na Central antes de esquecer. Sem categorizações complexas, apenas capture.</p>
                    <button disabled className="bg-gray-200 text-gray-500 px-6 py-2.5 rounded-lg font-medium cursor-not-allowed">
                        + Nova Tarefa (Modo Leitura)
                    </button>
                </div>
            ) : !fetchError ? (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                    <ul className="divide-y divide-gray-100">
                        {tasks.map(task => (
                            <li key={task.id} className="p-4 sm:p-5 hover:bg-gray-50 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="flex items-start gap-3">
                                    <div className="mt-1 flex-shrink-0">
                                        {task.is_frog ? (
                                            <span className="text-2xl drop-shadow-sm" title="Sapo do Dia">🐸</span>
                                        ) : (
                                            <span className="text-gray-300 text-xl">⬜</span>
                                        )}
                                    </div>
                                    <div>
                                        <h3 className={`font-semibold text-gray-900 ${task.status === 'completed' ? 'line-through opacity-50' : ''}`}>
                                            {task.title}
                                        </h3>
                                        <div className="flex flex-wrap items-center gap-3 mt-1.5">
                                            {renderStatus(task.status)}
                                            <span className="text-gray-300">•</span>
                                            {renderDate(task.planned_date)}
                                        </div>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            ) : null}
        </div>
    );
}
