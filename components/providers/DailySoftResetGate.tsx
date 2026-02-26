'use client'

import { useEffect } from 'react'
import { softResetOverdueTasks } from '@/modules/tasks/actions'
import { getTodayStrClient } from '@/utils/date'

export function DailySoftResetGate() {
    useEffect(() => {
        const todayStr = getTodayStrClient()
        const lastReset = localStorage.getItem('performly_last_soft_reset')

        if (lastReset !== todayStr) {
            // Se as datas diferem (ou nunca rodou), o dia virou (ou é o primeiro acesso)
            console.log('[DailySoftResetGate] Executando soft reset preguiçoso para:', todayStr)

            softResetOverdueTasks(todayStr).then((res) => {
                if (res?.success) {
                    // Confirma o reset para não rodar novamente no mesmo dia
                    localStorage.setItem('performly_last_soft_reset', todayStr)
                    console.log(`[DailySoftResetGate] Reset concluído com sucesso. Afetadas: ${res.updated || 0}`)
                } else if (res?.error) {
                    console.error('[DailySoftResetGate] Erro ao resetar:', res.error)
                }
            }).catch(err => {
                console.error('[DailySoftResetGate] Erro inesperado ao resetar:', err)
            })
        }
    }, [])

    return null // Componente invisível (Gatekeeper)
}
