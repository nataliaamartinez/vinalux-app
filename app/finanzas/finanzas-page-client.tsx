'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Scale,
  Search,
  CalendarDays,
} from 'lucide-react'

type MovimientoFinanza = {
  id: string
  concepto: string | null
  tipo: 'ingreso' | 'gasto' | null
  importe: number | null
  estado: string | null
  fecha: string | null
  metodo_pago: string | null
  cliente_proveedor: string | null
  created_at: string | null
  origen: string | null
  origen_id: string | null
  descripcion: string | null
  referencia: string | null
}

export default function FinanzasPage() {
  const [movimientos, setMovimientos] = useState<MovimientoFinanza[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [filtroTipo, setFiltroTipo] = useState<'todos' | 'ingreso' | 'gasto'>(
    'todos'
  )
  const [busqueda, setBusqueda] = useState('')
  const [mesSeleccionado, setMesSeleccionado] = useState('todos')

  async function cargarFinanzas() {
    setLoading(true)
    setError(null)

    const { data, error } = await supabase
      .from('finanzas')
      .select(
        `
        id,
        concepto,
        tipo,
        importe,
        estado,
        fecha,
        metodo_pago,
        cliente_proveedor,
        created_at,
        origen,
        origen_id,
        descripcion,
        referencia
      `
      )
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

  function obtenerClaveMes(fecha: string | null) {
    if (!fecha) return 'sin-fecha'
    const date = new Date(fecha)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    return `${year}-${month}`
  }

  function obtenerNombreMes(clave: string) {
    if (clave === 'sin-fecha') return 'Sin fecha'
    const [year, month] = clave.split('-')
    const date = new Date(Number(year), Number(month) - 1, 1)
    return date.toLocaleDateString('es-ES', {
      month: 'long',
      year: 'numeric',
    })
  }

  function colorTipo(tipo: string | null) {
    if (tipo === 'ingreso') return 'bg-emerald-100 text-emerald-700'
    return 'bg-red-100 text-red-700'
  }

  function colorEstado(estado: string | null) {
    if (estado === 'completado') return 'bg-emerald-100 text-emerald-700'
    if (estado === 'pendiente') return 'bg-yellow-100 text-yellow-700'
    if (estado === 'anulado') return 'bg-slate-200 text-slate-700'
    return 'bg-slate-100 text-slate-600'
  }

  const opcionesMes = useMemo(() => {
    const claves = Array.from(
      new Set(movimientos.map((movimiento) => obtenerClaveMes(movimiento.fecha)))
    ).sort((a, b) => (a < b ? 1 : -1))

    return claves.map((clave) => ({
      value: clave,
      label: obtenerNombreMes(clave),
    }))
  }, [movimientos])

  const movimientosFiltrados = useMemo(() => {
    return movimientos.filter((movimiento) => {
      const coincideTipo =
        filtroTipo === 'todos' ? true : movimiento.tipo === filtroTipo

      const coincideMes =
        mesSeleccionado === 'todos'
          ? true
          : obtenerClaveMes(movimiento.fecha) === mesSeleccionado

      const textoBusqueda = busqueda.trim().toLowerCase()

      const coincideBusqueda =
        textoBusqueda === ''
          ? true
          : [
              movimiento.descripcion,
              movimiento.referencia,
              movimiento.cliente_proveedor,
              movimiento.concepto,
              movimiento.metodo_pago,
              movimiento.tipo,
              movimiento.estado,
            ]
              .filter(Boolean)
              .some((valor) =>
                String(valor).toLowerCase().includes(textoBusqueda)
              )

      return coincideTipo && coincideMes && coincideBusqueda
    })
  }, [movimientos, filtroTipo, mesSeleccionado, busqueda])

  const resumen = useMemo(() => {
    const ingresos = movimientosFiltrados
      .filter((movimiento) => movimiento.tipo === 'ingreso')
      .reduce((acc, movimiento) => acc + (movimiento.importe ?? 0), 0)

    const gastos = movimientosFiltrados
      .filter((movimiento) => movimiento.tipo === 'gasto')
      .reduce((acc, movimiento) => acc + (movimiento.importe ?? 0), 0)

    const beneficioNeto = ingresos - gastos

    return {
      totalMovimientos: movimientosFiltrados.length,
      ingresos,
      gastos,
      beneficioNeto,
    }
  }, [movimientosFiltrados])

  return (
    <main className="min-h-screen bg-slate-50 p-6 md:p-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Vinalux</p>
            <h1 className="text-3xl font-bold text-slate-900">Finanzas</h1>
            <p className="mt-1 text-slate-500">
              Controla ingresos, gastos y beneficio neto del negocio.
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-white shadow-sm">
            <Wallet className="h-5 w-5" />
            <span className="text-sm font-semibold">Resumen financiero</span>
          </div>
        </div>

        <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-emerald-100 p-3">
                <TrendingUp className="h-5 w-5 text-emerald-700" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Total ingresos
                </p>
                <p className="mt-2 text-3xl font-bold text-emerald-600">
                  {formatearEuros(resumen.ingresos)}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-red-100 p-3">
                <TrendingDown className="h-5 w-5 text-red-700" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Total gastos
                </p>
                <p className="mt-2 text-3xl font-bold text-red-600">
                  {formatearEuros(resumen.gastos)}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-sky-100 p-3">
                <Scale className="h-5 w-5 text-sky-700" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Beneficio neto
                </p>
                <p
                  className={`mt-2 text-3xl font-bold ${
                    resumen.beneficioNeto >= 0
                      ? 'text-sky-700'
                      : 'text-red-600'
                  }`}
                >
                  {formatearEuros(resumen.beneficioNeto)}
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
                  Movimientos
                </p>
                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {resumen.totalMovimientos}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Buscar
              </label>
              <div className="flex items-center gap-2 rounded-2xl border border-slate-300 bg-white px-4 py-3">
                <Search className="h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  placeholder="Descripción, referencia, cliente..."
                  className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Tipo
              </label>
              <select
                value={filtroTipo}
                onChange={(e) =>
                  setFiltroTipo(
                    e.target.value as 'todos' | 'ingreso' | 'gasto'
                  )
                }
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none"
              >
                <option value="todos">Todos</option>
                <option value="ingreso">Ingresos</option>
                <option value="gasto">Gastos</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Mes
              </label>
              <select
                value={mesSeleccionado}
                onChange={(e) => setMesSeleccionado(e.target.value)}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none"
              >
                <option value="todos">Todos los meses</option>
                {opcionesMes.map((opcion) => (
                  <option key={opcion.value} value={opcion.value}>
                    {opcion.label}
                  </option>
                ))}
              </select>
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

        {!loading && movimientosFiltrados.length === 0 && !error && (
          <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">
              No hay movimientos
            </h2>
            <p className="mt-2 text-slate-500">
              Prueba con otros filtros o registra nuevos ingresos y gastos.
            </p>
          </div>
        )}

        {!loading && movimientosFiltrados.length > 0 && (
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left">
                <thead className="bg-slate-100 text-sm text-slate-600">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Fecha</th>
                    <th className="px-6 py-4 font-semibold">Tipo</th>
                    <th className="px-6 py-4 font-semibold">Descripción</th>
                    <th className="px-6 py-4 font-semibold">Referencia</th>
                    <th className="px-6 py-4 font-semibold">Cliente / proveedor</th>
                    <th className="px-6 py-4 font-semibold">Estado</th>
                    <th className="px-6 py-4 font-semibold">Método pago</th>
                    <th className="px-6 py-4 font-semibold">Importe</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                  {movimientosFiltrados.map((movimiento) => (
                    <tr key={movimiento.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4">
                        {formatearFecha(movimiento.fecha)}
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${colorTipo(
                            movimiento.tipo
                          )}`}
                        >
                          {movimiento.tipo || '-'}
                        </span>
                      </td>

                      <td className="px-6 py-4 font-medium text-slate-900">
                        {movimiento.descripcion || movimiento.concepto || '-'}
                      </td>

                      <td className="px-6 py-4">
                        {movimiento.referencia || '-'}
                      </td>

                      <td className="px-6 py-4">
                        {movimiento.cliente_proveedor || '-'}
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${colorEstado(
                            movimiento.estado
                          )}`}
                        >
                          {movimiento.estado || '-'}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        {movimiento.metodo_pago || '-'}
                      </td>

                      <td
                        className={`px-6 py-4 font-semibold ${
                          movimiento.tipo === 'ingreso'
                            ? 'text-emerald-600'
                            : 'text-red-600'
                        }`}
                      >
                        {formatearEuros(movimiento.importe ?? 0)}
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