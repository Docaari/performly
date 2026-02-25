export default function FocusPage() {
    return (
        <div className="p-6 md:p-10 flex flex-col items-center justify-center min-h-[85vh]">
            <div className="text-center w-full max-w-md">
                <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Modo Ação</h1>
                <p className="text-gray-500 mb-10">O barulho sumiu. Só a execução importa agora.</p>

                <div className="bg-white rounded-2xl border border-gray-200 p-10 py-14 text-center shadow-md">
                    <div className="text-7xl font-mono text-gray-900 mb-4 tracking-tighter">25:00</div>
                    <div className="inline-flex items-center space-x-2 bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-bold mb-6">
                        <span>🐸</span>
                        <span>Sapo do Dia</span>
                    </div>
                    <h2 className="text-xl font-medium text-gray-800 mb-10 px-4">Terminar o Documento de Arquitetura</h2>
                    <button className="bg-green-600 text-white w-full py-4 rounded-xl font-bold text-lg hover:bg-green-700 transition shadow-sm">
                        Iniciar Pomodoro
                    </button>
                </div>
            </div>
        </div>
    );
}
