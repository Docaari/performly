import Link from 'next/link';
import { DailyReflectionPanel } from '@/components/DailyReflectionPanel';
import { fetchDailyReflection, fetchDailyReviewDetails } from '@/modules/review/queries';
import { formatServerDateStr } from '@/utils/date';

export const dynamic = 'force-dynamic';

export default async function DailyReviewPage({
    params
}: {
    params: Promise<{ date: string }>
}) {
    const resolvedParams = await params;
    const dateStr = resolvedParams.date;

    // Validate date format YYYY-MM-DD
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        return (
            <div className="p-6 md:p-10 max-w-2xl mx-auto text-center mt-20">
                <p className="text-gray-500 mb-6">Data inválida.</p>
                <Link href="/review" className="text-sm font-bold bg-black text-white px-6 py-3 rounded-xl hover:bg-gray-800 transition-colors">
                    Voltar para Review
                </Link>
            </div>
        );
    }

    const [reflection, details] = await Promise.all([
        fetchDailyReflection(dateStr),
        fetchDailyReviewDetails(dateStr)
    ]);

    // Format date for display - forces midnight UTC to display the correct YYYY-MM-DD day regardless of local tz
    const dateObj = new Date(`${dateStr}T00:00:00Z`);
    const displayDate = new Intl.DateTimeFormat('pt-BR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        timeZone: 'UTC'
    }).format(dateObj);

    return (
        <div className="p-6 md:p-10 max-w-4xl mx-auto min-h-[85vh]">
            <Link href="/review" className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors mb-8">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Voltar
            </Link>

            <div className="mb-10">
                <h1 className="text-3xl font-extrabold text-gray-900 capitalize mb-2">{displayDate}</h1>
                <p className="text-gray-500">Detalhes da execução do dia.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                {/* Metrica de Conclusão */}
                <div className="bg-white rounded-3xl border border-gray-200 p-6 flex flex-col justify-center">
                    <div className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">Taxa de Conclusão</div>
                    <div className="text-3xl font-black text-gray-900 flex items-baseline gap-2">
                        {details.completionRate}%
                        <span className="text-base font-bold text-gray-400 bg-gray-50 px-2 py-0.5 rounded-lg border border-gray-100">
                            {details.completedTasks}/{details.totalTasks} tarefas
                        </span>
                    </div>
                </div>

                {/* Sapo do Dia */}
                <div className={`md:col-span-2 rounded-3xl border p-6 flex flex-col justify-center transition-colors ${details.frogTask?.status === 'completed'
                    ? 'bg-green-50 border-green-200 shadow-[inset_0_0_20px_rgba(34,197,94,0.05)]'
                    : 'bg-white border-gray-200'
                    }`}>
                    <div className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                        <span>Sapo do Dia</span>
                        {details.frogTask?.status === 'completed' && (
                            <span className="bg-green-500 text-white text-[10px] px-2 py-0.5 rounded-full">MORTO</span>
                        )}
                    </div>

                    {details.frogTask ? (
                        <div className="flex items-start gap-3">
                            <span className="text-2xl mt-0.5 grayscale-[0.2]">🐸</span>
                            <span className={`text-lg font-bold leading-tight ${details.frogTask.status === 'completed' ? 'text-green-900 line-through opacity-80' : 'text-gray-900'}`}>
                                {details.frogTask.status === 'completed' ? 'Sapo executado' : 'Sapo pendente'}
                            </span>
                        </div>
                    ) : (
                        <div className="text-gray-400 font-medium italic opacity-80">
                            Sem registros de sapo para este dia.
                        </div>
                    )}
                </div>
            </div>

            {/* Reflexão */}
            <div className="mb-10 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex items-center gap-3 mb-6">
                    <span className="text-2xl bg-indigo-50 text-indigo-500 p-2 rounded-xl">💭</span>
                    <h2 className="text-xl font-bold text-gray-900">Reflexão Diária</h2>
                </div>
                {reflection ? (
                    <DailyReflectionPanel date={dateStr} initialReflection={reflection} />
                ) : (
                    <div className="bg-gray-50 border border-gray-100 rounded-3xl p-8 text-center flex flex-col items-center justify-center">
                        <span className="text-4xl grayscale-[0.5] mb-4 opacity-50">📝</span>
                        <p className="text-gray-500 font-medium max-w-sm mb-6">Você não registrou nenhuma reflexão diária ou avaliação de sono para este dia específico.</p>
                        <DailyReflectionPanel date={dateStr} initialReflection={null} />
                    </div>
                )}
            </div>
        </div>
    );
}
