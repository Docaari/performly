"use client";

import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function LogoutButton() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const handleLogout = async () => {
        setLoading(true);
        const supabase = createClient();
        await supabase.auth.signOut();
        router.push("/login");
        router.refresh(); // força a reavaliação dos Server Components e layouts
    };

    return (
        <button
            onClick={handleLogout}
            disabled={loading}
            className="text-gray-500 hover:text-red-600 text-sm font-medium transition disabled:opacity-50"
        >
            {loading ? "Saindo..." : "Sair da Conta"}
        </button>
    );
}
