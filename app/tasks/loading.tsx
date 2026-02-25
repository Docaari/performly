export default function Loading() {
    return (
        <div className="p-6 md:p-10 max-w-4xl mx-auto">
            <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Central de Tarefas</h1>
            <p className="text-gray-500 mb-8">Buscando na base de dados...</p>

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm p-4">
                <div className="animate-pulse flex flex-col space-y-4">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="flex gap-4 items-center">
                            <div className="w-6 h-6 bg-gray-200 rounded-md"></div>
                            <div className="flex-1 space-y-2">
                                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                                <div className="h-3 bg-gray-100 rounded w-1/4"></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
