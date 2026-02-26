import Link from 'next/link';
import { fetchFrogOfTheDay, fetchTodayPomodorosCount } from '@/modules/pomodoros/queries';
import { PomodoroTimer } from '@/components/PomodoroTimer';

export const dynamic = 'force-dynamic';

export default async function FocusPage() {
    const frog = await fetchFrogOfTheDay();
    const count = await fetchTodayPomodorosCount();

    return (
        <div className="p-6 md:p-10 max-w-4xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-2">
                <h1 className="text-3xl font-extrabold text-gray-900">Modo Foco</h1>
                <div className="flex items-center gap-2 bg-red-50 text-red-700 px-4 py-2 rounded-xl border border-red-100 font-semibold shadow-sm">
                    <span className="text-xl leading-none">🍅</span> {count} {count === 1 ? 'Pomodoro' : 'Pomodoros'} hoje
                </div>
            </div>

            <p className="text-gray-500 mb-8 sm:mb-12">Execute a sua prioridade máxima e elimine distrações.</p>

            {!frog ? (
                <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center shadow-sm">
                    <div className="text-6xl mb-6 grayscale opacity-40">🐸</div>
                    <div className="flex flex-col items-center justify-center p-8 bg-white border-2 border-dashed border-gray-300 rounded-3xl animate-in fade-in duration-500">
                        <p className="text-gray-500 mb-6 font-medium text-lg">Você não tem um Sapo (prioridade máxima) para hoje.</p>
                        <Link href="/foco" className="inline-block bg-black text-white px-8 py-4 rounded-xl font-bold hover:bg-gray-800 transition-all duration-300 shadow-sm hover:shadow-lg hover:-translate-y-0.5">
                            Definir Sapo no Foco
                        </Link>
                    </div>
                </div>
            ) : (
                <PomodoroTimer taskId={frog.id} taskTitle={frog.title} />
            )}
        </div>
    );
}
