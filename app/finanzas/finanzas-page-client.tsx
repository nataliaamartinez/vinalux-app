'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import {
  Search,
  Wallet,
  ArrowUpCircle,
  ArrowDownCircle,
  Filter,
  CalendarDays,
  CircleDollarSign,
  Plus,
  X,
} from 'lucide-react'

type Movimiento = {
  id: string
  concepto: string | null
  tipo: 'ingreso' | 'gasto'
  importe: number | null
  estado: 'pendiente' | 'pagado' | 'vencido' | null
  fecha: string | null
  metodo_pago: string | null
  cliente_proveedor: string | null
  created_at: string | null
}

function formatearFecha(fecha: string | null) {
  if (!fecha) return '-'
  return new Date(fecha).toLocaleDateString('es-ES')
}

function formatearEuros(valor: number) {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
  }).format(valor)
}

function hoyISO() {
  return new Date().toISOString().split('T')[0]
}

export default function FinanzasPageClient() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const [movimientos, setMovimientos] = useState<Movimiento[]>([])
  const [loading, setLoading] = useState(true)
  const [guardando, setGuardando] = useState(false)

  const [mostrarFormulario, setMostrarFormulario] = useState(false)

  const [busqueda, setBusqueda] = useState(searchParams.get('q') || '')
  const [tipo, setTipo] = useState(searchParams.get('tipo') || 'todos')
  const [estado, setEstado] = useState(searchParams.get('estado') || 'todos')
  const [desde, setDesde] = useState(searchParams.get('desde') || '')
  const [hasta, setHasta] = useState(searchParams.get('hasta') || '')

  const [nuevoConcepto, setNuevoConcepto] = useState('')
  const [nuevoTipo, setNuevoTipo] = useState<'ingreso' | 'gasto'>('ingreso')
  const [nuevoImporte, setNuevoImporte] = useState('')
  const [nuevoEstado, setNuevoEstado] = useState<'pendiente' | 'pagado' | 'vencido'>('pagado')
  const [nuevaFecha, setNuevaFecha] = useState(hoyISO())
  const [nuevoMetodoPago, setNuevoMetodoPago] = useState('')
  const [nuevoClienteProveedor, setNuevoClienteProveedor] = useState('')

  const cargarMovimientos = async () => {
    setLoading(true)

    let query = supabase
      .from('finanzas')
      .select('*')
      .order('fecha', { ascending: false })
      .order('created_at', { ascending: false })

    if (tipo !== 'todos') {
      query = query.eq('tipo', tipo)
    }

    if (estado !== 'todos') {
      query = query.eq('estado', estado)
    }

    if (desde) {
      query = query.gte('fecha', desde)
    }

    if (hasta) {
      query = query.lte('fecha', hasta)
    }

    if (busqueda.trim()) {
      query = query.or(
        `concepto.ilike.%${busqueda.trim()}%,cliente_proveedor.ilike.%${busqueda.trim()}%,metodo_pago.ilike.%${busqueda.trim()}%`
      )
    }

    const { data, error } = await query

    if (error) {
      console.error('Error al cargar finanzas:', error)
      setMovimientos([])
    } else {
      setMovimientos((data as Movimiento[]) || [])
    }

    setLoading(false)
  }

  useEffect(() => {
    cargarMovimientos()
  }, [busqueda, tipo, estado, desde, hasta])

  useEffect(() => {
    const params = new URLSearchParams()

    if (busqueda) params.set('q', busqueda)
    if (tipo !== 'todos') params.set('tipo', tipo)
    if (estado !== 'todos') params.set('estado', estado)
    if (desde) params.set('desde', desde)
    if (hasta) params.set('hasta', hasta)

    const queryString = params.toString()
    router.replace(queryString ? `${pathname}?${queryString}` : pathname)
  }, [busqueda, tipo, estado, desde, hasta, router, pathname])

  const resumen = useMemo(() => {
    const ingresos = movimientos
      .filter((m) => m.tipo === 'ingreso')
      .reduce((acc, item) => acc + (item.importe || 0), 0)

    const gastos = movimientos
      .filter((m) => m.tipo === 'gasto')
      .reduce((acc, item) => acc + (item.importe || 0), 0)

    const balance = ingresos - gastos

    return { ingresos, gastos, balance }
  }, [movimientos])

  const limpiarFiltros = () => {
    setBusqueda('')
    setTipo('todos')
    setEstado('todos')
    setDesde('')
    setHasta('')
  }

  const limpiarFormulario = () => {
    setNuevoConcepto('')
    setNuevoTipo('ingreso')
    setNuevoImporte('')
    setNuevoEstado('pagado')
    setNuevaFecha(hoyISO())
    setNuevoMetodoPago('')
    setNuevoClienteProveedor('')
  }

  const guardarMovimiento = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!nuevoConcepto.trim()) {
      alert('Debes indicar un concepto')
      return
    }

    if (!nuevoImporte || Number(nuevoImporte) <= 0) {
      alert('Debes indicar un importe válido')
      return
    }

    setGuardando(true)

    const { error } = await supabase.from('finanzas').insert([
      {
        concepto: nuevoConcepto.trim(),
        tipo: nuevoTipo,
        importe: Number(nuevoImporte),
        estado: nuevoEstado,
        fecha: nuevaFecha || null,
        metodo_pago: nuevoMetodoPago.trim() || null,
        cliente_proveedor: nuevoClienteProveedor.trim() || null,
      },
    ])

    if (error) {
      console.error('Error al guardar movimiento:', error)
      alert('No se pudo guardar el movimiento')
      setGuardando(false)
      return
    }

    limpiarFormulario()
    setMostrarFormulario(false)
    await cargarMovimientos()
    setGuardando(false)
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Finanzas</h1>
          <p className="text-sm text-gray-500">
            Control de ingresos, gastos y estado de cobros/pagos
          </p>
        </div>

        <button
          onClick={() => setMostrarFormulario((prev) => !prev)}
          className="inline-flex items-center gap-2 rounded-xl bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
        >
          {mostrarFormulario ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {mostrarFormulario ? 'Cerrar formulario' : 'Nuevo movimiento'}
        </button>
      </div>

      {mostrarFormulario && (
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Añadir movimiento</h2>
            <p className="text-sm text-gray-500">
              Registra un ingreso o un gasto manualmente
            </p>
          </div>

          <form onSubmit={guardarMovimiento} className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="xl:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Concepto
              </label>
              <input
                type="text"
                value={nuevoConcepto}
                onChange={(e) => setNuevoConcepto(e.target.value)}
                placeholder="Ej. Venta vino tinto / Compra botellas"
                className="w-full rounded-xl border px-3 py-2 text-sm outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Tipo
              </label>
              <select
                value={nuevoTipo}
                onChange={(e) => setNuevoTipo(e.target.value as 'ingreso' | 'gasto')}
                className="w-full rounded-xl border px-3 py-2 text-sm outline-none"
              >
                <option value="ingreso">Ingreso</option>
                <option value="gasto">Gasto</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Importe
              </label>
              <input
                type="number"
                step="0.01"
                value={nuevoImporte}
                onChange={(e) => setNuevoImporte(e.target.value)}
                placeholder="0.00"
                className="w-full rounded-xl border px-3 py-2 text-sm outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Estado
              </label>
              <select
                value={nuevoEstado}
                onChange={(e) =>
                  setNuevoEstado(e.target.value as 'pendiente' | 'pagado' | 'vencido')
                }
                className="w-full rounded-xl border px-3 py-2 text-sm outline-none"
              >
                <option value="pagado">Pagado</option>
                <option value="pendiente">Pendiente</option>
                <option value="vencido">Vencido</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Fecha
              </label>
              <input
                type="date"
                value={nuevaFecha}
                onChange={(e) => setNuevaFecha(e.target.value)}
                className="w-full rounded-xl border px-3 py-2 text-sm outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Método de pago
              </label>
              <input
                type="text"
                value={nuevoMetodoPago}
                onChange={(e) => setNuevoMetodoPago(e.target.value)}
                placeholder="Efectivo, transferencia..."
                className="w-full rounded-xl border px-3 py-2 text-sm outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Cliente / proveedor
              </label>
              <input
                type="text"
                value={nuevoClienteProveedor}
                onChange={(e) => setNuevoClienteProveedor(e.target.value)}
                placeholder="Nombre del cliente o proveedor"
                className="w-full rounded-xl border px-3 py-2 text-sm outline-none"
              />
            </div>

            <div className="md:col-span-2 xl:col-span-4 flex gap-3 pt-2">
              <button
                type="submit"
                disabled={guardando}
                className="rounded-xl bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {guardando ? 'Guardando...' : 'Guardar movimiento'}
              </button>

              <button
                type="button"
                onClick={() => {
                  limpiarFormulario()
                  setMostrarFormulario(false)
                }}
                className="rounded-xl border px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="mb-2 flex items-center gap-2 text-sm text-gray-500">
            <ArrowUpCircle className="h-4 w-4" />
            Ingresos
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {formatearEuros(resumen.ingresos)}
          </p>
        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="mb-2 flex items-center gap-2 text-sm text-gray-500">
            <ArrowDownCircle className="h-4 w-4" />
            Gastos
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {formatearEuros(resumen.gastos)}
          </p>
        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="mb-2 flex items-center gap-2 text-sm text-gray-500">
            <Wallet className="h-4 w-4" />
            Balance
          </div>
          <p
            className={`text-2xl font-bold ${
              resumen.balance >= 0 ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {formatearEuros(resumen.balance)}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <h2 className="font-semibold text-gray-900">Filtros</h2>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <div className="xl:col-span-2">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Buscar
            </label>
            <div className="flex items-center gap-2 rounded-xl border px-3 py-2">
              <Search className="h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Concepto, cliente, método..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full border-0 bg-transparent text-sm outline-none"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Tipo
            </label>
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              className="w-full rounded-xl border px-3 py-2 text-sm outline-none"
            >
              <option value="todos">Todos</option>
              <option value="ingreso">Ingresos</option>
              <option value="gasto">Gastos</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Estado
            </label>
            <select
              value={estado}
              onChange={(e) => setEstado(e.target.value)}
              className="w-full rounded-xl border px-3 py-2 text-sm outline-none"
            >
              <option value="todos">Todos</option>
              <option value="pendiente">Pendiente</option>
              <option value="pagado">Pagado</option>
              <option value="vencido">Vencido</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Desde
            </label>
            <div className="flex items-center gap-2 rounded-xl border px-3 py-2">
              <CalendarDays className="h-4 w-4 text-gray-400" />
              <input
                type="date"
                value={desde}
                onChange={(e) => setDesde(e.target.value)}
                className="w-full border-0 bg-transparent text-sm outline-none"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Hasta
            </label>
            <div className="flex items-center gap-2 rounded-xl border px-3 py-2">
              <CalendarDays className="h-4 w-4 text-gray-400" />
              <input
                type="date"
                value={hasta}
                onChange={(e) => setHasta(e.target.value)}
                className="w-full border-0 bg-transparent text-sm outline-none"
              />
            </div>
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            onClick={limpiarFiltros}
            className="rounded-xl border px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Limpiar filtros
          </button>
        </div>
      </div>

      <div className="rounded-2xl border bg-white shadow-sm">
        <div className="flex items-center justify-between border-b p-4">
          <div>
            <h2 className="font-semibold text-gray-900">Movimientos</h2>
            <p className="text-sm text-gray-500">
              {loading ? 'Cargando...' : `${movimientos.length} resultados`}
            </p>
          </div>

          <div className="hidden items-center gap-2 text-sm text-gray-500 md:flex">
            <CircleDollarSign className="h-4 w-4" />
            Finanzas filtradas en tiempo real
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-600">
              <tr>
                <th className="px-4 py-3 font-medium">Fecha</th>
                <th className="px-4 py-3 font-medium">Concepto</th>
                <th className="px-4 py-3 font-medium">Tipo</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium">Método</th>
                <th className="px-4 py-3 font-medium">Cliente / Proveedor</th>
                <th className="px-4 py-3 text-right font-medium">Importe</th>
              </tr>
            </thead>

            <tbody>
              {!loading && movimientos.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    No hay movimientos con esos filtros.
                  </td>
                </tr>
              )}

              {movimientos.map((item) => (
                <tr key={item.id} className="border-t">
                  <td className="px-4 py-3 text-gray-700">
                    {formatearFecha(item.fecha)}
                  </td>

                  <td className="px-4 py-3 font-medium text-gray-900">
                    {item.concepto || '-'}
                  </td>

                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        item.tipo === 'ingreso'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {item.tipo}
                    </span>
                  </td>

                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        item.estado === 'pagado'
                          ? 'bg-green-100 text-green-700'
                          : item.estado === 'pendiente'
                          ? 'bg-yellow-100 text-yellow-700'
                          : item.estado === 'vencido'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {item.estado || '-'}
                    </span>
                  </td>

                  <td className="px-4 py-3 text-gray-700">
                    {item.metodo_pago || '-'}
                  </td>

                  <td className="px-4 py-3 text-gray-700">
                    {item.cliente_proveedor || '-'}
                  </td>

                  <td
                    className={`px-4 py-3 text-right font-semibold ${
                      item.tipo === 'ingreso' ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {formatearEuros(item.importe || 0)}
                  </td>
                </tr>
              ))}

              {loading && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    Cargando movimientos...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}