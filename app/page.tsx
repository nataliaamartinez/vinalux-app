'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import {
  Box,
  Wallet,
  ShoppingCart,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Scale,
  ArrowRight,
} from 'lucide-react'

type Pedido = {
  id: string
  numero_pedido: string | null
  cantidad: number | null
  precio_venta: number | null
  estado: string | null
  estado_pago: string | null
  fecha_entrega: string | null
  created_at: string | null
  clientes: { nombre: string } | null
  productos: { nombre: string } | null
}

type MovimientoFinanza = {
  id: string
  tipo: 'ingreso' | 'gasto' | null
  importe: number | null
  fecha: string | null
  descripcion: string | null
  referencia: string | null
  cliente_proveedor: string | null
  estado: string | null
  created_at: string | null
}

type Producto = {
  id: string
  nombre: string | null
  stock: number | null
  stock_minimo: number | null
}

export default function DashboardPage() {
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [finanzas, setFinanzas] = useState<MovimientoFinanza[]>([])
  const [productos, setProductos] = useState<Producto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function cargarDatos() {
    setLoading(true)
    setError(null)

    const [pedidosRes, finanzasRes, productosRes] = await Promise.all([
      supabase
        .from('pedidos')
        .select(
          `
          id,
          numero_pedido,
          cantidad,
          precio_venta,
          estado,
          estado_pago,
          fecha_entrega,
          created_at,
          clientes(nombre),
          productos(nombre)
        `
        )
        .order('created_at', { ascending: false })
        .limit(8),

      supabase
        .from('finanzas')
        .select(
          `
          id,
          tipo,
          importe,
          fecha,
          descripcion,
          referencia,
          cliente_proveedor,
          estado,
          created_at
        `
        )
        .order('fecha', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(8),

      supabase
        .from('productos')
        .select('id, nombre, stock, stock_minimo')
        .order('nombre'),
    ])

    if (pedidosRes.error) {
      setError(pedidosRes.error.message)
    } else {
setPedidos((pedidosRes.data as any[]) || [])    }

    if (finanzasRes.error) {
      setError(finanzasRes.error.message)
    } else {
      setFinanzas((finanzasRes.data as MovimientoFinanza[]) || [])
    }

    if (productosRes.error) {
      setError(productosRes.error.message)
    } else {
      setProductos((productosRes.data as Producto[]) || [])
    }

    setLoading(false)
  }

  useEffect(() => {
    cargarDatos()
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

  function calcularTotalPedido(
    cantidad: number | null,
    precioVenta: number | null
  ) {
    return (cantidad ?? 0) * (precioVenta ?? 0)
  }

  const resumen = useMemo(() => {
    const totalPedidos = pedidos.length

    const pedidosPendientes = pedidos.filter(
      (pedido) => pedido.estado === 'pendiente'
    ).length

    const ingresos = finanzas
      .filter((movimiento) => movimiento.tipo === 'ingreso')
      .reduce((acc, movimiento) => acc + (movimiento.importe ?? 0), 0)

    const gastos = finanzas
      .filter((movimiento) => movimiento.tipo === 'gasto')
      .reduce((acc, movimiento) => acc + (movimiento.importe ?? 0), 0)

    const beneficioNeto = ingresos - gastos

    const productosStockBajo = productos.filter((producto) => {
      const stock = producto.stock ?? 0
      const stockMinimo = producto.stock_minimo ?? 0
      return stock <= stockMinimo
    }).length

    return {
      totalPedidos,
      pedidosPendientes,
      ingresos,
      gastos,
      beneficioNeto,
      productosStockBajo,
    }
  }, [pedidos, finanzas, productos])

  const productosConStockBajo = useMemo(() => {
    return productos
      .filter((producto) => {
        const stock = producto.stock ?? 0
        const stockMinimo = producto.stock_minimo ?? 0
        return stock <= stockMinimo
      })
      .sort((a, b) => (a.stock ?? 0) - (b.stock ?? 0))
      .slice(0, 6)
  }, [productos])

  return (
    <main className="min-h-screen bg-slate-50 p-6 md:p-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Vinalux</p>
            <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
            <p className="mt-1 text-slate-500">
              Resumen general del negocio en tiempo real.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/pedidos"
              className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
            >
              Ver pedidos
            </Link>
            <Link
              href="/finanzas"
              className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Ver finanzas
            </Link>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        {loading && (
          <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <p className="text-slate-500">Cargando dashboard...</p>
          </div>
        )}

        {!loading && (
          <>
            <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-sky-100 p-3">
                    <ShoppingCart className="h-5 w-5 text-sky-700" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500">
                      Total pedidos
                    </p>
                    <p className="mt-2 text-3xl font-bold text-slate-900">
                      {resumen.totalPedidos}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-yellow-100 p-3">
                    <AlertTriangle className="h-5 w-5 text-yellow-700" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500">
                      Pedidos pendientes
                    </p>
                    <p className="mt-2 text-3xl font-bold text-slate-900">
                      {resumen.pedidosPendientes}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-emerald-100 p-3">
                    <TrendingUp className="h-5 w-5 text-emerald-700" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500">
                      Ingresos
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
                    <p className="text-sm font-medium text-slate-500">Gastos</p>
                    <p className="mt-2 text-3xl font-bold text-red-600">
                      {formatearEuros(resumen.gastos)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-violet-100 p-3">
                    <Scale className="h-5 w-5 text-violet-700" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500">
                      Beneficio neto
                    </p>
                    <p
                      className={`mt-2 text-3xl font-bold ${
                        resumen.beneficioNeto >= 0
                          ? 'text-violet-700'
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
                  <div className="rounded-2xl bg-orange-100 p-3">
                    <Box className="h-5 w-5 text-orange-700" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500">
                      Stock bajo
                    </p>
                    <p className="mt-2 text-3xl font-bold text-slate-900">
                      {resumen.productosStockBajo}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-6 xl:grid-cols-3">
              <div className="xl:col-span-2">
                <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                  <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900">
                        Últimos pedidos
                      </h2>
                      <p className="mt-1 text-sm text-slate-500">
                        Pedidos recientes del sistema.
                      </p>
                    </div>

                    <Link
                      href="/pedidos"
                      className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-slate-900"
                    >
                      Ver todos
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="min-w-full text-left">
                      <thead className="bg-slate-100 text-sm text-slate-600">
                        <tr>
                          <th className="px-6 py-4 font-semibold">Cliente</th>
                          <th className="px-6 py-4 font-semibold">Producto</th>
                          <th className="px-6 py-4 font-semibold">Estado</th>
                          <th className="px-6 py-4 font-semibold">Pago</th>
                          <th className="px-6 py-4 font-semibold">Total</th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                        {pedidos.map((pedido) => (
                          <tr key={pedido.id} className="hover:bg-slate-50">
                            <td className="px-6 py-4 font-medium text-slate-900">
                              {pedido.clientes?.nombre || '-'}
                            </td>
                            <td className="px-6 py-4">
                              {pedido.productos?.nombre || '-'}
                            </td>
                            <td className="px-6 py-4">{pedido.estado || '-'}</td>
                            <td className="px-6 py-4">
                              <span
                                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                  pedido.estado_pago === 'pagado'
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : 'bg-yellow-100 text-yellow-700'
                                }`}
                              >
                                {pedido.estado_pago || 'pendiente'}
                              </span>
                            </td>
                            <td className="px-6 py-4 font-semibold text-slate-900">
                              {formatearEuros(
                                calcularTotalPedido(
                                  pedido.cantidad,
                                  pedido.precio_venta
                                )
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                  <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900">
                        Últimos movimientos financieros
                      </h2>
                      <p className="mt-1 text-sm text-slate-500">
                        Ingresos y gastos recientes.
                      </p>
                    </div>

                    <Link
                      href="/finanzas"
                      className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-slate-900"
                    >
                      Ver finanzas
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="min-w-full text-left">
                      <thead className="bg-slate-100 text-sm text-slate-600">
                        <tr>
                          <th className="px-6 py-4 font-semibold">Fecha</th>
                          <th className="px-6 py-4 font-semibold">Tipo</th>
                          <th className="px-6 py-4 font-semibold">Descripción</th>
                          <th className="px-6 py-4 font-semibold">Importe</th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                        {finanzas.map((movimiento) => (
                          <tr key={movimiento.id} className="hover:bg-slate-50">
                            <td className="px-6 py-4">
                              {formatearFecha(movimiento.fecha)}
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                  movimiento.tipo === 'ingreso'
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : 'bg-red-100 text-red-700'
                                }`}
                              >
                                {movimiento.tipo || '-'}
                              </span>
                            </td>
                            <td className="px-6 py-4 font-medium text-slate-900">
                              {movimiento.descripcion || '-'}
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
              </div>

              <div>
                <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                  <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900">
                        Alertas de stock
                      </h2>
                      <p className="mt-1 text-sm text-slate-500">
                        Productos igual o por debajo del stock mínimo.
                      </p>
                    </div>

                    <Link
                      href="/productos"
                      className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-slate-900"
                    >
                      Ver productos
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {productosConStockBajo.length === 0 ? (
                      <div className="p-6">
                        <p className="text-sm text-slate-500">
                          No hay productos con stock bajo.
                        </p>
                      </div>
                    ) : (
                      productosConStockBajo.map((producto) => (
                        <div
                          key={producto.id}
                          className="flex items-center justify-between p-6"
                        >
                          <div>
                            <p className="font-semibold text-slate-900">
                              {producto.nombre || '-'}
                            </p>
                            <p className="mt-1 text-sm text-slate-500">
                              Stock mínimo: {producto.stock_minimo ?? 0}
                            </p>
                          </div>

                          <div className="text-right">
                            <p
                              className={`text-lg font-bold ${
                                (producto.stock ?? 0) === 0
                                  ? 'text-red-600'
                                  : 'text-orange-600'
                              }`}
                            >
                              {producto.stock ?? 0}
                            </p>
                            <p className="text-xs text-slate-500">unidades</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h2 className="text-lg font-semibold text-slate-900">
                    Acciones rápidas
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Accede rápido a las secciones más usadas.
                  </p>

                  <div className="mt-5 grid gap-3">
                    <Link
                      href="/pedidos"
                      className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      Ir a pedidos
                    </Link>
                    <Link
                      href="/gastos"
                      className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      Ir a gastos
                    </Link>
                    <Link
                      href="/finanzas"
                      className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      Ir a finanzas
                    </Link>
                    <Link
                      href="/productos"
                      className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      Revisar stock
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  )
}