import { Suspense } from 'react'
import FinanzasPageClient from './finanzas-page-client'

export default function FinanzasPage() {
  return (
    <Suspense fallback={<div className="p-6">Cargando finanzas...</div>}>
      <FinanzasPageClient />
    </Suspense>
  )
}