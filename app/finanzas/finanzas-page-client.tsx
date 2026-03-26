'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'

type PedidoFinanzas = {
  id: string
  cantidad: number | null
  precio_venta: number | null
  coste: number | null
  estado: string | null
  fecha_entrega: string | null
  created_at: string | null
  clientes: { nombre: string } | null
  productos: { nombre: string } | null
}

type PedidoRaw = {
  id: string
  cantidad: number | null
  precio_venta: number | null
  coste: number | null
  estado: string | null
  fecha_entrega: string | null
  created_at: string | null
  clientes?: { nombre: string } | { nombre: string }[] | null
  productos?: { nombre: string } | { nombre: string }[] | null
}

type ClienteRanking = {
  nombre: string
  totalFacturado: number
  beneficio: number
  pedidos: number
}

type ProductoRanking = {
  nombre: string
  unidades: number
  totalFacturado: number
  beneficio: number
}

export default function FinanzasPageClient() {
  const [pedidos, setPedidos] = useState<PedidoFinanzas[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  function normalizarRelacion(
    value: { nombre: string } | { nombre: string }[] | null | undefined
  ): { nombre: string } | null {
    if (!value) return null
    if (Array.isArray(value)) return value[0] ?? null
    return value
  }

  async function cargarDatos() {
    setLoading(true)
    setError(null)

    const { data, error } = await supabase
      .from('pedidos')
      .select(
        `
        id,
        cantidad,
        precio_venta,
        coste,
        estado,
        fecha_entrega,
        created_at,
        clientes(nombre),
        productos(nombre)
      `
      )
      .order('created_at', { ascending: false })

    if (error) {
      setError(error.message)
      setPedidos([])
      setLoading(false)
      return
    }

    const pedidosNormalizados: PedidoFinanzas[] = Array.isArray(data)
      ? (data as PedidoRaw[]).map((item) => ({
          id: item.id,
          cantidad: item.cantidad ?? null,
          precio_venta: item.precio_venta ?? null,
          coste: item.coste ?? null,
          estado: item.estado ?? null,
          fecha_entrega: item.fecha_entrega ?? null,
          created_at: item.created_at ?? null,
          clientes: normalizarRelacion(item.clientes),
          productos: normalizarRelacion(item.productos),
        }))
      : []

    setPedidos(pedidosNormalizados)
    setLoading(false)
  }

  useEffect(() => {
    cargarDatos()
  }, [])

  function calcularTotal(cantidad: number | null, precioVenta: number | null) {
    return (cantidad ?? 0) * (precioVenta ?? 0)
  }

  function calcularCosteTotal(cantidad: number | null, coste: number | null) {
    return (cantidad ?? 0) * (coste ?? 0)
  }

  function calcularBeneficio(
    cantidad: number | null,
    precioVenta: number | null,
    coste: number | null
  ) {
    return (
      calcularTotal(cantidad, precioVenta) -
      calcularCosteTotal(cantidad, coste)
    )
  }

  function calcularMargen(
    cantidad: number | null,
    precioVenta: number | null,
    coste: number | null
  ) {
    const total = calcularTotal(cantidad, precioVenta)
    const beneficio = calcularBeneficio(cantidad, precioVenta, coste)

    if (total <= 0) return 0
    return (beneficio / total) * 100
  }

  function formatearEuros(valor: number) {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
    }).format(valor)
  }

  const resumen = useMemo(() => {
    const ahora = new Date()
    const mesActual = ahora.getMonth()
    const anioActual = ahora.getFullYear()

    const facturacionTotal = pedidos.reduce((acc, pedido) => {
      return acc + calcularTotal(pedido.cantidad, pedido.precio_venta)
    }, 0)

    const beneficioTotal = pedidos.reduce((acc, pedido) => {
      return (
        acc +
        calcularBeneficio(pedido.cantidad, pedido.precio_venta, pedido.coste)
      )
    }, 0)

    const pedidosDelMes = pedidos.filter((pedido) => {
      if (!pedido.created_at) return false
      const fecha = new Date(pedido.created_at)
      return (
        fecha.getMonth() === mesActual &&
        fecha.getFullYear() === anioActual
      )
    })

    const beneficioMes = pedidosDelMes.reduce((acc, pedido) => {
      return (
        acc +
        calcularBeneficio(pedido.cantidad, pedido.precio_venta, pedido.coste)
      )
    }, 0)

    const ticketMedio = pedidos.length > 0 ? facturacionTotal / pedidos.length : 0

    return {
      facturacionTotal,
      beneficioTotal,
      beneficioMes,
      ticketMedio,
    }
  }, [pedidos])

  const pedidosRentables = useMemo(() => {
    return [...pedidos].sort((a, b) => {
      const beneficioA = calcularBeneficio(a.cantidad, a.precio_venta, a.coste)
      const beneficioB = calcularBeneficio(b.cantidad, b.precio_venta, b.coste)
      return beneficioB - beneficioA
    })
  }, [pedidos])

  const rankingClientes = useMemo(() => {
    const mapa = new Map<string, ClienteRanking>()

    pedidos.forEach((pedido) => {
      const nombre = pedido.clientes?.nombre || 'Sin cliente'
      const total = calcularTotal(pedido.cantidad, pedido.precio_venta)
      const beneficio = calcularBeneficio(
        pedido.cantidad,
        pedido.precio_venta,
        pedido.coste
      )

      const actual = mapa.get(nombre)

      if (actual) {
        actual.totalFacturado += total
        actual.beneficio += beneficio
        actual.pedidos += 1
      } else {
        mapa.set(nombre, {
          nombre,
          totalFacturado: total,
          beneficio,
          pedidos: 1,
        })
      }
    })

    return Array.from(mapa.values()).sort(
      (a, b) => b.totalFacturado - a.totalFacturado
    )
  }, [pedidos])

  const rankingProductos = useMemo(() => {
    const mapa = new Map<string, ProductoRanking>()

    pedidos.forEach((pedido) => {
      const nombre = pedido.productos?.nombre || 'Sin producto'
      const unidades = pedido.cantidad ?? 0
      const total = calcularTotal(pedido.cantidad, pedido.precio_venta)
      const beneficio = calcularBeneficio(
        pedido.cantidad,
        pedido.precio_venta,
        pedido.coste
      )

      const actual = mapa.get(nombre)

      if (actual) {
        actual.unidades += unidades
        actual.totalFacturado += total
        actual.beneficio += beneficio
      } else {
        mapa.set(nombre, {
          nombre,
          unidades,
          totalFacturado: total,
          beneficio,
        })
      }
    })

    return Array.from(mapa.values()).sort((a, b) => b.unidades - a.unidades)
  }, [pedidos])

  return (
    <main className="min-h-screen bg-slate-50 p-6 md:p-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <p className="text-sm font-medium text-slate-500">Vinalux</p>
          <h1 className="text-3xl font-bold text-slate-900">Finanzas</h1>
          <p className="mt-1 text-slate-500">
            Controla ingresos, beneficios y rentabilidad de tu negocio.
          </p>
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

        {!loading && (
          <>
            <div className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm font-medium text-slate-500">
                  Facturación total
                </p>
                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {formatearEuros(resumen.facturacionTotal)}
                </p>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm font-medium text-slate-500">
                  Beneficio total
                </p>
                <p className="mt-2 text-3xl font-bold text-emerald-600">
                  {formatearEuros(resumen.beneficioTotal)}
                </p>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm font-medium text-slate-500">
                  Beneficio del mes
                </p>
                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {formatearEuros(resumen.beneficioMes)}
                </p>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm font-medium text-slate-500">
                  Ticket medio
                </p>
                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {formatearEuros(resumen.ticketMedio)}
                </p>
              </div>
            </div>

            <div className="mb-8 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 px-6 py-4">
                <h2 className="text-xl font-semibold text-slate-900">
                  Pedidos más rentables
                </h2>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full text-left">
                  <thead className="bg-slate-100 text-sm text-slate-600">
                    <tr>
                      <th className="px-6 py-4 font-semibold">Cliente</th>
                      <th className="px-6 py-4 font-semibold">Producto</th>
                      <th className="px-6 py-4 font-semibold">Cantidad</th>
                      <th className="px-6 py-4 font-semibold">Total</th>
                      <th className="px-6 py-4 font-semibold">Coste total</th>
                      <th className="px-6 py-4 font-semibold">Beneficio</th>
                      <th className="px-6 py-4 font-semibold">Margen</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                    {pedidosRentables.length === 0 ? (
                      <tr>
                        <td
                          colSpan={7}
                          className="px-6 py-10 text-center text-slate-500"
                        >
                          No hay pedidos para mostrar.
                        </td>
                      </tr>
                    ) : (
                      pedidosRentables.map((pedido) => {
                        const total = calcularTotal(
                          pedido.cantidad,
                          pedido.precio_venta
                        )
                        const costeTotal = calcularCosteTotal(
                          pedido.cantidad,
                          pedido.coste
                        )
                        const beneficio = calcularBeneficio(
                          pedido.cantidad,
                          pedido.precio_venta,
                          pedido.coste
                        )
                        const margen = calcularMargen(
                          pedido.cantidad,
                          pedido.precio_venta,
                          pedido.coste
                        )

                        return (
                          <tr key={pedido.id} className="hover:bg-slate-50">
                            <td className="px-6 py-4 font-medium text-slate-900">
                              {pedido.clientes?.nombre || '-'}
                            </td>
                            <td className="px-6 py-4">
                              {pedido.productos?.nombre || '-'}
                            </td>
                            <td className="px-6 py-4">{pedido.cantidad ?? 0}</td>
                            <td className="px-6 py-4 font-semibold text-slate-900">
                              {formatearEuros(total)}
                            </td>
                            <td className="px-6 py-4">
                              {formatearEuros(costeTotal)}
                            </td>
                            <td
                              className={`px-6 py-4 font-semibold ${
                                beneficio >= 0
                                  ? 'text-emerald-600'
                                  : 'text-red-600'
                              }`}
                            >
                              {formatearEuros(beneficio)}
                            </td>
                            <td className="px-6 py-4">
                              {margen.toFixed(1)}%
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid gap-8 xl:grid-cols-2">
              <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-200 px-6 py-4">
                  <h2 className="text-xl font-semibold text-slate-900">
                    Mejores clientes
                  </h2>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full text-left">
                    <thead className="bg-slate-100 text-sm text-slate-600">
                      <tr>
                        <th className="px-6 py-4 font-semibold">Cliente</th>
                        <th className="px-6 py-4 font-semibold">Pedidos</th>
                        <th className="px-6 py-4 font-semibold">Facturación</th>
                        <th className="px-6 py-4 font-semibold">Beneficio</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                      {rankingClientes.length === 0 ? (
                        <tr>
                          <td
                            colSpan={4}
                            className="px-6 py-10 text-center text-slate-500"
                          >
                            No hay clientes para mostrar.
                          </td>
                        </tr>
                      ) : (
                        rankingClientes.map((cliente) => (
                          <tr key={cliente.nombre} className="hover:bg-slate-50">
                            <td className="px-6 py-4 font-medium text-slate-900">
                              {cliente.nombre}
                            </td>
                            <td className="px-6 py-4">{cliente.pedidos}</td>
                            <td className="px-6 py-4 font-semibold text-slate-900">
                              {formatearEuros(cliente.totalFacturado)}
                            </td>
                            <td className="px-6 py-4 font-semibold text-emerald-600">
                              {formatearEuros(cliente.beneficio)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-200 px-6 py-4">
                  <h2 className="text-xl font-semibold text-slate-900">
                    Productos más vendidos
                  </h2>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full text-left">
                    <thead className="bg-slate-100 text-sm text-slate-600">
                      <tr>
                        <th className="px-6 py-4 font-semibold">Producto</th>
                        <th className="px-6 py-4 font-semibold">Unidades</th>
                        <th className="px-6 py-4 font-semibold">Facturación</th>
                        <th className="px-6 py-4 font-semibold">Beneficio</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                      {rankingProductos.length === 0 ? (
                        <tr>
                          <td
                            colSpan={4}
                            className="px-6 py-10 text-center text-slate-500"
                          >
                            No hay productos para mostrar.
                          </td>
                        </tr>
                      ) : (
                        rankingProductos.map((producto) => (
                          <tr
                            key={producto.nombre}
                            className="hover:bg-slate-50"
                          >
                            <td className="px-6 py-4 font-medium text-slate-900">
                              {producto.nombre}
                            </td>
                            <td className="px-6 py-4">{producto.unidades}</td>
                            <td className="px-6 py-4 font-semibold text-slate-900">
                              {formatearEuros(producto.totalFacturado)}
                            </td>
                            <td className="px-6 py-4 font-semibold text-emerald-600">
                              {formatearEuros(producto.beneficio)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  )
}