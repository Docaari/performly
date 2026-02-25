"use client";

import { useEffect, useState } from "react";

export function ConnectionStatus() {
    const [status, setStatus] = useState<"loading" | "connected" | "error">("loading");

    useEffect(() => {
        fetch("/api/health")
            .then((res) => res.json())
            .then((data) => {
                if (data.ok) setStatus("connected");
                else setStatus("error");
            })
            .catch(() => setStatus("error"));
    }, []);

    if (status === "loading") return <span className="text-gray-400 text-sm">Verificando banco...</span>;
    if (status === "error") return <span className="text-red-500 text-sm font-medium">Erro de conexão 🔴</span>;
    return <span className="text-green-600 text-sm font-medium">Supabase conectado 🟢</span>;
}
