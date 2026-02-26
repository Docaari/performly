import Link from 'next/link';
import { fetchMonthReviewData, fetchWeeklyBudgetStats, fetchPerformanceMetrics, fetchRecentReflections } from '@/modules/review/queries';
import { formatServerDateStr } from '@/utils/date';
import { WeeklyBudgets } from '@/components/WeeklyBudgets';
import { DailyReflectionPanel } from '@/components/DailyReflectionPanel';

export const dynamic = 'force-dynamic';

export default async function ReviewPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    // 1. Determine Month to show
    const resolvedSearchParams = await searchParams;
    let year = new Date().getFullYear();
    let month = new Date().getMonth() + 1; // 1-12

    const queryMonth = resolvedSearchParams.month as string;
    if (queryMonth && /^\d{4}-\d{2}$/.test(queryMonth)) {
        const parts = queryMonth.split('-');
        year = parseInt(parts[0], 10);
        month = parseInt(parts[1], 10);
    }

    // 2. Fetch Data
    const daysData = await fetchMonthReviewData(year, month);
    const metricsResult = await fetchPerformanceMetrics();
    const recentReflections = await fetchRecentReflections(14);

    // Get current week start string (Monday)
    const today = new Date();
    // JS getDay() is 0 (Sun) to 6 (Sat). We want Monday as start.
    const dayOfWeek = today.getDay();
    const isSunday = dayOfWeek === 0;
    const diffToMonday = isSunday ? -6 : 1 - dayOfWeek;

    // Create new Date to avoid mutating today
    const currentMondayDate = new Date(today.getTime());
    currentMondayDate.setDate(today.getDate() + diffToMonday);
    const weekStartStr = formatServerDateStr(currentMondayDate);

    const weeklyStats = await fetchWeeklyBudgetStats(weekStartStr);

    // 3. Setup Calendar Grid
    const firstDayOfMonth = new Date(year, month - 1, 1);
    const lastDayOfMonth = new Date(year, month, 0);
    const daysInMonth = lastDayOfMonth.getDate();
    const startingDayOfWeek = firstDayOfMonth.getDay(); // 0 (Sun) to 6 (Sat)

    // Previous and Next month links
    let prevYear = year;
    let prevMonth = month - 1;
    if (prevMonth < 1) {
        prevMonth = 12;
        prevYear -= 1;
    }

    let nextYear = year;
    let nextMonth = month + 1;
    if (nextMonth > 12) {
        nextMonth = 1;
        nextYear += 1;
    }

    const prevMonthStr = `${prevYear}-${String(prevMonth).padStart(2, '0')}`;
    const nextMonthStr = `${nextYear}-${String(nextMonth).padStart(2, '0')}`;
    const currentMonthLabel = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(firstDayOfMonth);

    // Color intensity helper
    const getIntensityClass = (count: number) => {
        if (count === 0) return 'bg-gray-100 border-gray-200';
        if (count <= 2) return 'bg-green-200 border-green-300';
        if (count <= 5) return 'bg-green-400 border-green-500';
        return 'bg-green-600 border-green-700'; // 6+
    }

    return (
        <div className="p-6 md:p-10 max-w-4xl mx-auto min-h-[85vh]">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-2">
                <h1 className="text-3xl font-extrabold text-gray-900">Review</h1>
                <div className="flex items-center gap-2">
                    <span className="text-xl leading-none opacity-80">🗺️</span>
                    <span className="text-sm font-bold text-gray-500 uppercase tracking-widest">Mapa de Calor da Execução</span>
                </div>
            </div>

            <p className="text-gray-500 mb-8 sm:mb-10">Seu rastro de sangue. Disciplina sendo construída dia a dia.</p>

            {/* Metrics Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10 pb-10 border-b border-gray-200 border-dashed">
                {/* Metric 1 */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center text-xl border border-blue-100">
                        🎯
                    </div>
                    <div>
                        <div className="text-2xl font-black text-gray-900">{metricsResult.weeklyCompletionRate}%</div>
                        <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Taxa Conclusão (Sem)</div>
                    </div>
                </div>

                {/* Metric 2 */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-green-50 text-green-500 flex items-center justify-center text-xl border border-green-100">
                        🐸
                    </div>
                    <div>
                        <div className="text-2xl font-black text-gray-900">{metricsResult.weeklyFrogWinRate}%</div>
                        <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Frog Win Rate (Sem)</div>
                    </div>
                </div>

                {/* Metric 3 */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center text-xl border border-purple-100">
                        ⏳
                    </div>
                    <div>
                        <div className="text-2xl font-black text-gray-900">{metricsResult.allTimeFocusHours}h</div>
                        <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Foco Total (All Time)</div>
                    </div>
                </div>
            </div>

            <div className="mb-10">
                <WeeklyBudgets weekStart={weekStartStr} stats={weeklyStats} />
            </div>

            <div className="bg-white rounded-3xl border border-gray-200 p-8 shadow-sm">

                {/* Header Controls */}
                <div className="flex items-center justify-between mb-8">
                    <Link href={`/review?month=${prevMonthStr}`} className="p-2 rounded-xl text-gray-400 hover:bg-gray-50 hover:text-gray-900 transition-colors">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                        </svg>
                    </Link>
                    <h2 className="text-lg font-bold text-gray-900 capitalize tracking-wide">
                        {currentMonthLabel}
                    </h2>
                    <Link href={`/review?month=${nextMonthStr}`} className="p-2 rounded-xl text-gray-400 hover:bg-gray-50 hover:text-gray-900 transition-colors">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                    </Link>
                </div>

                {/* Weekdays Header */}
                <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2 sm:mb-4">
                    {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
                        <div key={day} className="text-center text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-widest py-1">
                            {day}
                        </div>
                    ))}
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-1 sm:gap-2">
                    {/* Empty Slots */}
                    {Array.from({ length: startingDayOfWeek }).map((_, i) => (
                        <div key={`empty-${i}`} className="aspect-square rounded-xl bg-transparent" />
                    ))}

                    {/* Days Slots */}
                    {Array.from({ length: daysInMonth }).map((_, i) => {
                        const dayNum = i + 1;
                        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                        const data = daysData[dateStr];
                        const count = data?.pomodoroCount || 0;
                        const isFrog = data?.frogCompleted || false;

                        return (
                            <Link href={`/review/${dateStr}`} key={dateStr} className="group relative aspect-square block">
                                <div className={`w-full h-full rounded-md sm:rounded-xl border ${getIntensityClass(count)} transition-all duration-200 hover:scale-[1.15] hover:shadow-lg hover:z-20 cursor-pointer flex items-center justify-center relative overflow-hidden`}>

                                    {/* Frog Indicator */}
                                    {isFrog && (
                                        <div className="absolute inset-x-0 bottom-0.5 sm:bottom-1 flex justify-center">
                                            <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-yellow-400 shadow-sm border border-yellow-500/30"></div>
                                        </div>
                                    )}

                                    {/* Day Number (Faint) */}
                                    <span className={`text-[9px] sm:text-xs font-bold ${count > 0 ? 'text-white/40' : 'text-gray-400/40'} pointer-events-none select-none`}>
                                        {dayNum}
                                    </span>
                                </div>
                            </Link>
                        );
                    })}
                </div>

                {/* Legend */}
                <div className="mt-8 pt-6 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 text-xs sm:text-sm text-gray-500 font-medium opacity-80">
                    <div className="flex items-center gap-2">
                        <span>Menos Foco</span>
                        <div className="flex gap-1">
                            <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-[4px] border border-gray-200 bg-gray-100"></div>
                            <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-[4px] border border-green-300 bg-green-200"></div>
                            <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-[4px] border border-green-500 bg-green-400"></div>
                            <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-[4px] border border-green-700 bg-green-600"></div>
                        </div>
                        <span>Mais Foco</span>
                    </div>
                    <div className="hidden sm:block text-gray-300">|</div>
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 border border-yellow-500/50"></div>
                        <span>Sapo Vencido</span>
                    </div>
                </div>

            </div>

            {/* Recent Reflections List */}
            {recentReflections.length > 0 && (
                <div className="mt-12 bg-white rounded-3xl border border-gray-200 p-8 shadow-sm">
                    <div className="flex items-center gap-3 mb-8">
                        <span className="text-3xl bg-amber-50 p-2 rounded-xl">💭</span>
                        <div>
                            <h3 className="text-gray-900 font-bold text-lg leading-tight">Reflexões Recentes</h3>
                            <p className="text-sm text-gray-500">Seus últimos 14 dias de impressões pessoais.</p>
                        </div>
                    </div>
                    <div className="space-y-4">
                        {recentReflections.map(reflection => (
                            <div key={reflection.id} className="relative">
                                <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-1.5 h-12 bg-gray-200 rounded-full" />
                                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-3 mb-1">
                                    {new Date(`${reflection.reflection_date}T12:00:00`).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })}
                                </div>
                                <DailyReflectionPanel date={reflection.reflection_date} initialReflection={reflection} />
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
