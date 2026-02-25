import { fetchTasks, type Task } from '@/modules/tasks/queries';
import { CreateTaskForm } from '@/components/CreateTaskForm';
import { TaskItem } from '@/components/TaskItem';

export const dynamic = 'force-dynamic';

export default async function TasksPage() {
    let tasks: Task[] = [];
    let fetchError: string | null = null;

    try {
        tasks = await fetchTasks();
    } catch (error: unknown) {
        fetchError = error instanceof Error ? error.message : String(error);
    }

    return (
        <div className="p-6 md:p-10 max-w-4xl mx-auto">
            <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Central de Tarefas</h1>
            <p className="text-gray-500 mb-8">Descarregue sua mente. Todo começo nasce aqui.</p>

            <CreateTaskForm />

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
                    <p className="text-gray-500 mb-2 max-w-md mx-auto">Use o campo de captura acima para descarregar o que precisa ser feito hoje, ou simplesmente esvaziar a cabeça.</p>
                </div>
            ) : !fetchError ? (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                    <ul className="divide-y divide-gray-100">
                        {tasks.map(task => (
                            <TaskItem key={task.id} task={task} />
                        ))}
                    </ul>
                </div>
            ) : null}
        </div>
    );
}
