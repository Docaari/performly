import Link from 'next/link';
import { LogoutButton } from '@/components/LogoutButton';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-gray-50 flex-col md:flex-row">
      {/* Desktop Sidebar */}
      <nav className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200">
        <div className="p-6">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Performly</h1>
        </div>
        <div className="flex-1 px-4 space-y-2">
          <Link href="/dashboard" className="block p-3 rounded-lg hover:bg-gray-100 text-gray-700 font-medium transition">Dashboard</Link>
          <Link href="/tasks" className="block p-3 rounded-lg hover:bg-gray-100 text-gray-700 font-medium transition">Central</Link>
          <Link href="/plan" className="block p-3 rounded-lg hover:bg-gray-100 text-gray-700 font-medium transition">Planejar</Link>
          <div className="pt-4 mt-4 border-t border-gray-100">
            <Link href="/focus" className="block p-3 rounded-lg bg-green-50 text-green-700 font-bold hover:bg-green-100 transition">Focar (Pomodoro)</Link>
          </div>
        </div>
        <div className="p-6 border-t border-gray-200">
          <LogoutButton />
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto pb-20 md:pb-0 bg-gray-50">
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around shadow-lg z-50">
        <Link href="/dashboard" className="flex-1 py-4 text-center text-sm font-medium text-gray-600 hover:text-gray-900">Dash</Link>
        <Link href="/tasks" className="flex-1 py-4 text-center text-sm font-medium text-gray-600 hover:text-gray-900">Central</Link>
        <Link href="/plan" className="flex-1 py-4 text-center text-sm font-medium text-gray-600 hover:text-gray-900">Plan</Link>
        <Link href="/focus" className="flex-1 py-4 text-center text-sm font-bold text-green-700">Foco</Link>
      </nav>
    </div>
  );
}
