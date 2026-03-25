import { Suspense } from 'react'
import ProductosPageClient from './productos-page_Client'

export default function ProductosPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-slate-50 p-6 md:p-10">
          <div className="mx-auto max-w-7xl">
            <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
              <p className="text-slate-500">Cargando productos...</p>
            </div>
          </div>
        </main>
      }
    >
      <ProductosPageClient />
    </Suspense>
  )
}