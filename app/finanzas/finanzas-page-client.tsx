'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Wallet, TrendingUp, CalendarDays, Receipt } from 'lucide-react'

type MovimientoFinanza = {
  id: string
  tipo: string | null
  fecha: string | null
  descripcion: string | null
  referencia: string | null
  origen: string | null
  origen_id: string | null
  created_at: string | null
  [key: string]: any
}

export default function FinanzasPage() {
  const [movimientos, setMovimientos] = useState<MovimientoFinanza[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function cargarFinanzas() {
    setLoading(true)
    setError(null)

    const { data, error } = await supabase
      .from('finanzas')
      .select('*')
      .eq('tipo', 'ingreso')
      .eq('origen', 'pedido')
      .order('fecha', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setMovimientos((data as MovimientoFinanza[]) || [])
    setLoading(false)
  }

  useEffect(() => {
    cargarFinanzas()
  }, [])

  function obtenerImporte(movimiento: MovimientoFinanza) {
    return Number(
      movimiento.importe ??
        movimiento.monto ??
        movimiento.total ??
        movimiento.valor ??
        0
    )
  }

  function formatearEuros(valor: number) {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
    }).format(valor)
  }

  function formatearFecha(fecha: string | null) {
    if (!fecha) return '-'
    return new Date(fecha).toLocaleDateString('es-ES')
  }

  const resumen = useMemo(() => {
    const totalMovimientos = movimientos.length

    const totalIngresos = movimientos.reduce((acc, item) => {
      return acc + obtenerImporte(item)
    }, 0)

    const ultimoPago =
      movimientos.length > 0
        ? movimientos[0].fecha || movimientos[0].created_at
        : null

    return {
      totalMovimientos,
      totalIngresos,
      ultimoPago,
    }
  }, [movimientos])

  return (
    <main className="min-h-screen bg-slate-50 p-6 md:p-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Vinalux</p>
            <h1 className="text-3xl font-bold text-slate-900">Finanzas</h1>
            <p className="mt-1 text-slate-500">
              Aquí se muestran únicamente los pedidos pagados registrados como ingresos.
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-white shadow-sm">
            <Wallet className="h-5 w-5" />
            <span className="text-sm font-semibold">Ingresos de pedidos</span>
          </div>
        </div>

        <div className="mb-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-emerald-100 p-3">
                <TrendingUp className="h-5 w-5 text-emerald-700" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Total ingresos
                </p>
                <p className="mt-1 text-3xl font-bold text-emerald-600">
                  {formatearEuros(resumen.totalIngresos)}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-sky-100 p-3">
                <Receipt className="h-5 w-5 text-sky-700" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Pedidos pagados
                </p>
                <p className="mt-1 text-3xl font-bold text-slate-900">
                  {resumen.totalMovimientos}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-violet-100 p-3">
                <CalendarDays className="h-5 w-5 text-violet-700" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Último pago
                </p>
                <p className="mt-1 text-2xl font-bold text-slate-900">
                  {formatearFecha(resumen.ultimoPago)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        {loading && (
          <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <p className="text-slate-500">Cargando finanzas...</p>
          </div>
        )}

        {!loading && movimientos.length === 0 && !error && (
          <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">
              No hay pedidos pagados
            </h2>
            <p className="mt-2 text-slate-500">
              Cuando un pedido se marque como pagado y entre en finanzas, aparecerá aquí.
            </p>
          </div>
        )}

        {!loading && movimientos.length > 0 && (
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-6 py-4">
              <h2 className="text-lg font-semibold text-slate-900">
                Movimientos de pedidos pagados
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Solo se muestran ingresos con origen en pedidos.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-left">
                <thead className="bg-slate-100 text-sm text-slate-600">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Fecha</th>
                    <th className="px-6 py-4 font-semibold">Descripción</th>
                    <th className="px-6 py-4 font-semibold">Referencia</th>
                    <th className="px-6 py-4 font-semibold">Origen</th>
                    <th className="px-6 py-4 font-semibold">Importe</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                  {movimientos.map((movimiento) => (
                    <tr key={movimiento.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4">
                        {formatearFecha(movimiento.fecha || movimiento.created_at)}
                      </td>

                      <td className="px-6 py-4 font-medium text-slate-900">
                        {movimiento.descripcion || 'Ingreso de pedido'}
                      </td>

                      <td className="px-6 py-4">
                        {movimiento.referencia || '-'}
                      </td>

                      <td className="px-6 py-4">
                        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                          {movimiento.origen || 'pedido'}
                        </span>
                      </td>

                      <td className="px-6 py-4 font-semibold text-emerald-600">
                        {formatearEuros(obtenerImporte(movimiento))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}