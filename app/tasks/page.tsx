export default function TasksPage() {
    return (
        <div className="p-6 md:p-10 max-w-4xl mx-auto">
            <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Central de Tarefas</h1>
            <p className="text-gray-500 mb-8">Descarregue sua mente. Todo começo nasce aqui.</p>

            <div className="bg-white rounded-xl border border-gray-200 border-dashed p-10 text-center">
                <h2 className="text-xl font-semibold mb-2">Sua mente está limpa</h2>
                <p className="text-gray-500 mb-6 max-w-md mx-auto">Surgiu uma ideia ou demanda? Adicione na Central antes de esquecer. Sem categorias complexas, apenas capture.</p>
                <button className="bg-black text-white px-6 py-2.5 rounded-lg font-medium hover:bg-gray-800 transition shadow-sm">
                    + Capturar Nova Tarefa
                </button>
            </div>
        </div>
    );
}
