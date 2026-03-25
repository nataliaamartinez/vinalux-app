import { connection } from 'next/server'
import ProductosPageClient from './productos-page-client'

export default async function ProductosPage() {
  await connection()

  return <ProductosPageClient />
}