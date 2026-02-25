import { fetchTasks, type Task } from '@/modules/tasks/queries';
import { PlanList } from '@/components/PlanList';

export const dynamic = 'force-dynamic';

export default async function PlanPage() {
    let tasks: Task[] = [];
    let fetchError = null;

    try {
        tasks = await fetchTasks();
    } catch (error: unknown) {
        fetchError = error instanceof Error ? error.message : String(error);
    }

    return (
        <div className="p-6 md:p-10 max-w-4xl mx-auto">
            <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Planejamento Diário</h1>
            <p className="text-gray-500 mb-8">Defina seu Top 6 e escolha o Sapo do dia. Clareza Radical antes da Ação.</p>

            {fetchError ? (
                <div className="bg-red-50 text-red-700 p-4 rounded-lg shadow-sm border border-red-200">
                    Ocorreu um erro: {fetchError}
                </div>
            ) : (
                <PlanList tasks={tasks} />
            )}
        </div>
    );
}
