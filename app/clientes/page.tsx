import { Suspense } from 'react'
import ClientesPageClient from './ClientesPageClient'

export default function ClientesPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-slate-50 p-6 md:p-10">
          <div className="mx-auto max-w-7xl">
            <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
              <p className="text-slate-500">Cargando clientes...</p>
            </div>
          </div>
        </main>
      }
    >
      <ClientesPageClient />
    </Suspense>
  )
}