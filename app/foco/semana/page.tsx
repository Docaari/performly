import { WeekPlanner } from '@/components/foco/WeekPlanner'

export const metadata = {
    title: 'Semana | Performly',
    description: 'Planeje sua semana no longo prazo.',
}

export default function WeekPage() {
    return (
        <main className="min-h-screen bg-slate-50 w-full overflow-hidden">
            <WeekPlanner />
        </main>
    )
}
