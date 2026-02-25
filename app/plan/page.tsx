export default function PlanPage() {
    return (
        <div className="p-6 md:p-10 max-w-4xl mx-auto">
            <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Planejamento Diário</h1>
            <p className="text-gray-500 mb-8">Defina seu Top 6 e escolha o Sapo do dia. Clareza Radical antes da Ação.</p>

            <div className="bg-white rounded-xl border border-gray-200 p-10 text-center shadow-sm">
                <div className="text-4xl mb-4">📋</div>
                <h2 className="text-xl font-semibold mb-2">Nenhum plano para hoje</h2>
                <p className="text-gray-500 mb-6 max-w-md mx-auto">Selecione até 6 tarefas da Central e marque a prioridade número 1 (Seu Sapo). Se você tem mais de 6 prioridades, você não tem prioridade nenhuma.</p>
                <button className="bg-black text-white px-6 py-2.5 rounded-lg font-medium hover:bg-gray-800 transition">
                    Montar o Top 6
                </button>
            </div>
        </div>
    );
}
