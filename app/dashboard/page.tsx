import Link from 'next/link';
import { getFrogEatingStreak, getFrogToday, getTodayStats } from '@/modules/dashboard/queries';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
    const [streak, frog, stats] = await Promise.all([
        getFrogEatingStreak(),
        getFrogToday(),
        getTodayStats()
    ]);

    const isFrogCompleted = frog?.status === 'completed';

    return (
        <div className="p-6 md:p-10 max-w-5xl mx-auto min-h-[85vh]">
            <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Visão Geral</h1>
            <p className="text-gray-500 mb-8 sm:mb-12">Seu progresso da North Star Metric e execução diária.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

                {/* Streak Card */}
                <div className="bg-gradient-to-br from-green-50 to-white rounded-3xl border border-green-200 p-8 shadow-sm col-span-1 lg:col-span-2 relative overflow-hidden group hover:shadow-md transition-shadow">
                    <div className="absolute top-0 right-0 -mr-6 -mt-6 text-9xl opacity-[0.03] transform group-hover:scale-110 transition-transform duration-500">🏆</div>
                    <h2 className="text-sm font-bold text-green-800 uppercase tracking-widest mb-1 opacity-80">North Star Metric</h2>
                    <h3 className="text-gray-900 font-bold text-xl mb-4">Frog-Eating Streak</h3>

                    <div className="flex items-baseline gap-2">
                        <span className="text-7xl font-black text-green-600 tracking-tighter tabular-nums">{streak}</span>
                        <span className="text-green-700 font-bold text-lg">dias seguidos</span>
                    </div>
                    <p className="text-sm text-green-700/70 mt-4 max-w-xs">
                        Dias consecutivos devorando seu sapo na Data Planejada original sem falhas. O progresso é cumulativo.
                    </p>
                </div>

                {/* Sapo de Hoje */}
                <div className={`bg-white rounded-3xl border p-8 shadow-sm col-span-1 lg:col-span-2 ${isFrogCompleted ? 'border-green-200 bg-green-50/20' : 'border-gray-200'} transition-all`}>
                    <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center gap-3">
                            <span className="text-3xl bg-gray-100/50 p-2 rounded-xl">🐸</span>
                            <h3 className="text-gray-900 font-bold text-lg">Sapo de Hoje</h3>
                        </div>
                        {frog && (
                            <span className={`px-3 py-1 text-xs font-bold rounded-full ${isFrogCompleted ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                {isFrogCompleted ? 'Concluído' : 'Pendente'}
                            </span>
                        )}
                    </div>

                    {!frog ? (
                        <div className="h-24 flex flex-col justify-center items-start">
                            <p className="text-gray-400 mb-3 font-medium text-sm">Nenhum sapo planejado para hoje.</p>
                            <Link href="/plan" className="text-sm bg-black text-white px-4 py-2 font-bold rounded-lg hover:bg-gray-800 transition">
                                Ir para o Planejamento
                            </Link>
                        </div>
                    ) : (
                        <div className="flex flex-col justify-center">
                            <p className={`text-xl font-bold line-clamp-2 ${isFrogCompleted ? 'text-gray-400 line-through' : 'text-gray-900'} mb-4 capitalize`}>
                                {frog.title}
                            </p>
                            {!isFrogCompleted && (
                                <Link href="/focus" className="text-sm self-start outline outline-2 outline-gray-200 outline-offset-0 bg-white text-gray-900 px-5 py-2.5 font-bold rounded-xl hover:bg-gray-50 hover:outline-gray-300 transition-all shadow-sm">
                                    Focar 25:00
                                </Link>
                            )}
                        </div>
                    )}
                </div>

                {/* Pomodoros Hoje */}
                <div className="bg-white rounded-3xl border border-gray-200 p-8 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center gap-3 mb-6">
                        <span className="text-3xl bg-red-50 p-2 rounded-xl">🍅</span>
                        <h3 className="text-gray-600 font-bold text-sm uppercase tracking-wide">Foco Hoje</h3>
                    </div>
                    <div className="flex items-end gap-2">
                        <span className="text-5xl font-black text-gray-900 tabular-nums">{stats.pomodoros}</span>
                        <span className="text-gray-400 font-bold text-base mb-1">ciclos</span>
                    </div>
                </div>

                {/* Tasks Completed */}
                <div className="bg-white rounded-3xl border border-gray-200 p-8 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center gap-3 mb-6">
                        <span className="text-3xl bg-blue-50 p-2 rounded-xl">✅</span>
                        <h3 className="text-gray-600 font-bold text-sm uppercase tracking-wide">Tarefas Hoje</h3>
                    </div>
                    <div className="flex items-end gap-2">
                        <span className="text-5xl font-black text-gray-900 tabular-nums">{stats.completedTasks}</span>
                        <span className="text-gray-400 font-bold text-base mb-1">concluídas</span>
                    </div>
                </div>

            </div>
        </div>
    );
}
