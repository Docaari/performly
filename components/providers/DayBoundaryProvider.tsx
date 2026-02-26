'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { getTodayStrClient } from '@/utils/date'

export function DayBoundaryProvider({ children }: { children: React.ReactNode }) {
    const router = useRouter()

    // Guardamos o último dia conhecido
    const lastKnownDayStr = useRef<string>(getTodayStrClient())

    useEffect(() => {
        let debounceTimer: NodeJS.Timeout

        const handleVisibilityOrFocus = () => {
            if (document.hidden) return

            // Proteção letal contra quebra de Drag and Drop
            if (document.body.dataset.dragging === "1") {
                console.log('[DayBoundaryProvider] Refresh abortado: Drag & Drop ativo.')
                return
            }

            // Usa a mesma função estrita do cliente
            const currentDayStr = getTodayStrClient()

            // Se o dia mudou desde a última vez que olhamos...
            if (currentDayStr !== lastKnownDayStr.current) {
                console.log(`[DayBoundaryProvider] Virada de dia detectada: ${lastKnownDayStr.current} -> ${currentDayStr}. Atualizando app...`)

                // Evita disparo múltiplo em eventos quase simultâneos (focus vs visibilitychange)
                clearTimeout(debounceTimer)

                debounceTimer = setTimeout(() => {
                    // Atualiza a memória
                    lastKnownDayStr.current = currentDayStr

                    // Força um rebuild seguro (sem recarregar hard via window.location, validando caches de Server Components)
                    router.refresh()
                }, 300)
            }
        }

        document.addEventListener('visibilitychange', handleVisibilityOrFocus)
        window.addEventListener('focus', handleVisibilityOrFocus)

        // Verificação passiva ao montar também é sã
        handleVisibilityOrFocus()

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityOrFocus)
            window.removeEventListener('focus', handleVisibilityOrFocus)
            clearTimeout(debounceTimer)
        }
    }, [router])

    return <>{children}</>
}
