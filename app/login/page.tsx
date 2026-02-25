"use client";

import { useState, useEffect, Suspense } from "react";
import { createClient } from "@/utils/supabase/client";
import { useSearchParams } from "next/navigation";

function LoginContent() {
    const searchParams = useSearchParams();
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ text: string; type: "error" | "success" } | null>(null);

    const supabase = createClient();

    useEffect(() => {
        const error = searchParams.get("error");
        const errorDesc = searchParams.get("error_description");

        if (error || errorDesc) {
            const fullError = (errorDesc || error || "").toLowerCase();
            if (fullError.includes("expired") || error === "otp_expired") {
                setMessage({
                    text: "O link expirou ou já foi usado. Por favor, solicite um novo Magic Link e clique no recebido mais recentemente.",
                    type: "error"
                });
            } else if (error === "missing_params") {
                setMessage({ text: "Link incompleto ou inválido. Tente novamente.", type: "error" });
            } else if (error === "auth_failed") {
                const reason = searchParams.get("reason");
                setMessage({ text: `Falha na Autenticação: ${reason || "Credencial inválida."}`, type: "error" });
            } else {
                setMessage({ text: "Não foi possível autenticar. Detalhes: " + (errorDesc || error), type: "error" });
            }
        }
    }, [searchParams]);

    const handleMagicLink = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        const { error } = await supabase.auth.signInWithOtp({
            email,
            options: {
                emailRedirectTo: `${location.origin}/auth/callback`,
            },
        });

        if (error) {
            setMessage({ text: error.message, type: "error" });
        } else {
            setMessage({ text: "Verifique seu email pelo Magic Link!", type: "success" });
        }
        setLoading(false);
    };

    const handleGoogleLogin = async () => {
        setMessage(null);
        const { error } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
                redirectTo: `${location.origin}/auth/callback`,
            },
        });

        if (error) setMessage({ text: error.message, type: "error" });
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <div className="w-full max-w-md bg-white rounded-2xl p-8 border border-gray-200 shadow-sm text-center">
                <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Performly</h1>
                <p className="text-gray-500 mb-8">Clareza Radical → Execução Consistente</p>

                {message && (
                    <div className={`p - 4 rounded - lg mb - 6 text - sm font - medium ${message.type === "error" ? "bg-red-50 text-red-600" : "bg-green-50 text-green-700"} `}>
                        {message.text}
                    </div>
                )}

                <button
                    onClick={handleGoogleLogin}
                    className="w-full bg-white border border-gray-300 text-gray-700 font-medium py-3 px-4 rounded-xl flex items-center justify-center gap-3 hover:bg-gray-50 transition mb-6"
                >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    Entrar com Google
                </button>

                <div className="relative mb-6">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-200"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-white text-gray-400">Ou</span>
                    </div>
                </div>

                <form onSubmit={handleMagicLink} className="space-y-4">
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Seu email melhor"
                        required
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                    />
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-black text-white font-medium py-3 px-4 rounded-xl hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? "Enviando..." : "Receber Magic Link"}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-400">Verificando...</div>}>
            <LoginContent />
        </Suspense>
    );
}
