import { ConnectionStatus } from "@/components/ConnectionStatus";

export default function DashboardPage() {
    return (
        <div className="p-6 md:p-10 max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-2">
                <h1 className="text-3xl font-extrabold text-gray-900">Dashboard</h1>
                <ConnectionStatus />
            </div>
            <p className="text-gray-500 mb-8">Acompanhe seu Frog-Eating Streak e progresso diário.</p>

            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center shadow-sm">
                <div className="text-5xl mb-4">🐸</div>
                <h2 className="text-xl font-semibold mb-2">O Streak Começa Aqui</h2>
                <p className="text-gray-500 mb-6 max-w-md mx-auto">Sua North Star Metric está zerada. Conclua seu Sapo do dia para começar a contar os dias de execução consistente.</p>
                <button className="bg-black text-white px-6 py-2.5 rounded-lg font-medium hover:bg-gray-800 transition">
                    Ver Meu Sapo
                </button>
            </div>
        </div>
    );
}
