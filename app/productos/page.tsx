import { Suspense } from 'react'
import ProductosPageClient from './productos-page-client'

export default function ProductosPage() {
  return (
    <Suspense fallback={<div className="p-6">Cargando productos...</div>}>
      <ProductosPageClient />
    </Suspense>
  )
}