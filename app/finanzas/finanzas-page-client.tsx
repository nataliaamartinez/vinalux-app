import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import {
  Box,
  Users,
  Package,
  FileText,
  Clock3,
  CheckCircle2,
  BadgeEuro,
  Plus,
  AlertTriangle,
  Search,
  CalendarDays,
  Wallet,
} from 'lucide-react'

type PedidoIngreso = {
  cantidad: number | null
  precio_venta: number | null
  created_at?: string | null
}

type ProductoStock = {
  id: string
  nombre: string | null
  stock: number | null
  stock_minimo: number | null
}

function getLast6Months() {
  const meses = []
  const hoy = new Date()

  for (let i = 5; i >= 0; i--) {
    const fecha = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1)
    const key = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`
    const label = fecha.toLocaleDateString('es-ES', {
      month: 'short',
      year: '2-digit',
    })
    meses.push({ key, label })
  }

  return meses
}

export default async function Home() {
  const ahora = new Date()
  const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1)
    .toISOString()
    .slice(0, 10)

  const hace6Meses = new Date(ahora.getFullYear(), ahora.getMonth() - 5, 1)
    .toISOString()
    .slice(0, 10)

  const [
    productosRes,
    clientesRes,
    pedidosRes,
    presupuestosRes,
    pedidosPendientesRes,
    pedidosEntregadosRes,
    presupuestosAceptadosRes,
    ingresosRes,
    ultimosPedidosRes,
    ultimosPresupuestosRes,
    pedidosUrgentesRes,
    productosStockRes,
    pedidosMesRes,
    presupuestosMesRes,
    pedidosGraficaRes,
  ] = await Promise.all([
    supabase.from('productos').select('*', { count: 'exact', head: true }),
    supabase.from('clientes').select('*', { count: 'exact', head: true }),
    supabase.from('pedidos').select('*', { count: 'exact', head: true }),
    supabase.from('presupuestos').select('*', { count: 'exact', head: true }),
    supabase
      .from('pedidos')
      .select('*', { count: 'exact', head: true })
      .eq('estado', 'pendiente'),
    supabase
      .from('pedidos')
      .select('*', { count: 'exact', head: true })
      .eq('estado', 'entregado'),
    supabase
      .from('presupuestos')
      .select('*', { count: 'exact', head: true })
      .eq('estado', 'aceptado'),
    supabase.from('pedidos').select('cantidad, precio_venta, created_at'),
    supabase
      .from('pedidos')
      .select(
        `
        id,
        estado,
        cantidad,
        precio_venta,
        clientes(nombre),
        productos(nombre)
      `
      )
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('presupuestos')
      .select(
        `
        id,
        estado,
        cantidad,
        precio,
        clientes(nombre),
        productos(nombre)
      `
      )
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('pedidos')
      .select(
        `
        id,
        estado,
        prioridad,
        clientes(nombre),
        productos(nombre)
      `
      )
      .eq('prioridad', 'urgente')
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('productos')
      .select('id, nombre, stock, stock_minimo')
      .order('created_at', { ascending: false }),
    supabase
      .from('pedidos')
      .select('cantidad, precio_venta, created_at')
      .gte('created_at', inicioMes),
    supabase
      .from('presupuestos')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', inicioMes),
    supabase
      .from('pedidos')
      .select('cantidad, precio_venta, created_at')
      .gte('created_at', hace6Meses),
  ])

  const ingresosEstimados = Array.isArray(ingresosRes.data)
    ? (ingresosRes.data as PedidoIngreso[]).reduce((acc, pedido) => {
        const cantidad = pedido.cantidad ?? 0
        const precio = pedido.precio_venta ?? 0
        return acc + cantidad * precio
      }, 0)
    : 0

  const ingresosMes = Array.isArray(pedidosMesRes.data)
    ? (pedidosMesRes.data as PedidoIngreso[]).reduce((acc, pedido) => {
        const cantidad = pedido.cantidad ?? 0
        const precio = pedido.precio_venta ?? 0
        return acc + cantidad * precio
      }, 0)
    : 0

  const resumenGeneral = [
    {
      title: 'Productos',
      value: productosRes.count ?? 0,
      icon: Box,
      description: 'Productos guardados',
    },
    {
      title: 'Clientes',
      value: clientesRes.count ?? 0,
      icon: Users,
      description: 'Clientes registrados',
    },
    {
      title: 'Pedidos',
      value: pedidosRes.count ?? 0,
      icon: Package,
      description: 'Pedidos creados',
    },
    {
      title: 'Presupuestos',
      value: presupuestosRes.count ?? 0,
      icon: FileText,
      description: 'Presupuestos generados',
    },
  ]

  const indicadores = [
    {
      title: 'Pedidos pendientes',
      value: pedidosPendientesRes.count ?? 0,
      icon: Clock3,
      description: 'Aún por completar',
    },
    {
      title: 'Pedidos entregados',
      value: pedidosEntregadosRes.count ?? 0,
      icon: CheckCircle2,
      description: 'Ya finalizados',
    },
    {
      title: 'Presupuestos aceptados',
      value: presupuestosAceptadosRes.count ?? 0,
      icon: FileText,
      description: 'Aprobados por clientes',
    },
    {
      title: 'Ingresos estimados',
      value: `${ingresosEstimados.toFixed(2)} €`,
      icon: BadgeEuro,
      description: 'Suma de pedidos',
    },
  ]

  const resumenMes = [
    {
      title: 'Ingresos del mes',
      value: `${ingresosMes.toFixed(2)} €`,
      icon: BadgeEuro,
      description: 'Suma de pedidos creados este mes',
    },
    {
      title: 'Pedidos del mes',
      value: Array.isArray(pedidosMesRes.data) ? pedidosMesRes.data.length : 0,
      icon: CalendarDays,
      description: 'Pedidos creados este mes',
    },
    {
      title: 'Presupuestos del mes',
      value: presupuestosMesRes.count ?? 0,
      icon: FileText,
      description: 'Presupuestos creados este mes',
    },
  ]

  const accesosRapidos = [
    {
      title: 'Nuevo pedido',
      href: '/pedidos',
      icon: Package,
      description: 'Crear y gestionar pedidos',
    },
    {
      title: 'Nuevo presupuesto',
      href: '/presupuestos',
      icon: FileText,
      description: 'Preparar presupuesto rápido',
    },
    {
      title: 'Nuevo cliente',
      href: '/clientes',
      icon: Users,
      description: 'Añadir un nuevo cliente',
    },
    {
      title: 'Nuevo producto',
      href: '/productos',
      icon: Box,
      description: 'Añadir producto al catálogo',
    },
    {
      title: 'Finanzas',
      href: '/finanzas',
      icon: Wallet,
      description: 'Ver ingresos y beneficios',
    },
  ]

  const busquedaRapida = [
    {
      title: 'Buscar cliente',
      href: '/buscar',
      icon: Users,
      description: 'Encuentra un cliente rápido',
    },
    {
      title: 'Buscar pedido',
      href: '/buscar',
      icon: Package,
      description: 'Localiza un pedido concreto',
    },
    {
      title: 'Buscar producto',
      href: '/buscar',
      icon: Box,
      description: 'Consulta tu catálogo',
    },
    {
      title: 'Buscar presupuesto',
      href: '/buscar',
      icon: FileText,
      description: 'Busca presupuestos guardados',
    },
  ]

  const ultimosPedidos = Array.isArray(ultimosPedidosRes.data)
    ? ultimosPedidosRes.data
    : []

  const ultimosPresupuestos = Array.isArray(ultimosPresupuestosRes.data)
    ? ultimosPresupuestosRes.data
    : []

  const pedidosUrgentes = Array.isArray(pedidosUrgentesRes.data)
    ? pedidosUrgentesRes.data
    : []

  const productosBajoStock = Array.isArray(productosStockRes.data)
    ? (productosStockRes.data as ProductoStock[]).filter(
        (producto) => (producto.stock ?? 0) <= (producto.stock_minimo ?? 0)
      )
    : []

  const meses = getLast6Months()
  const pedidosGrafica = Array.isArray(pedidosGraficaRes.data)
    ? (pedidosGraficaRes.data as PedidoIngreso[])
    : []

  const datosGraficas = meses.map((mes) => {
    const pedidosDelMes = pedidosGrafica.filter((pedido) => {
      if (!pedido.created_at) return false
      const fecha = new Date(pedido.created_at)
      const key = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`
      return key === mes.key
    })

    const totalPedidos = pedidosDelMes.length
    const totalIngresos = pedidosDelMes.reduce((acc, pedido) => {
      const cantidad = pedido.cantidad ?? 0
      const precio = pedido.precio_venta ?? 0
      return acc + cantidad * precio
    }, 0)

    return {
      label: mes.label,
      pedidos: totalPedidos,
      ingresos: totalIngresos,
    }
  })

  const maxPedidos = Math.max(...datosGraficas.map((item) => item.pedidos), 1)
  const maxIngresos = Math.max(...datosGraficas.map((item) => item.ingresos), 1)

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10">
          <p className="text-sm font-medium text-white">Vinalux</p>
          <h1 className="mt-2 text-4xl font-bold text-white">Dashboard</h1>
          <p className="mt-3 text-slate-300">
            Resumen general de tu negocio.
          </p>
        </div>

        <section className="mb-10">
          <h2 className="mb-4 text-2xl font-bold text-white">
            Alertas importantes
          </h2>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-3xl border border-red-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100">
                <AlertTriangle size={22} className="text-red-700" />
              </div>
              <p className="text-sm font-medium text-slate-500">
                Pedidos urgentes
              </p>
              <h3 className="mt-2 text-3xl font-bold text-slate-900">
                {pedidosUrgentes.length}
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                Pedidos marcados como urgentes
              </p>
            </div>

            <div className="rounded-3xl border border-yellow-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-yellow-100">
                <Clock3 size={22} className="text-yellow-700" />
              </div>
              <p className="text-sm font-medium text-slate-500">
                Pedidos pendientes
              </p>
              <h3 className="mt-2 text-3xl font-bold text-slate-900">
                {pedidosPendientesRes.count ?? 0}
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                Aún pendientes de completar
              </p>
            </div>

            <div className="rounded-3xl border border-orange-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-100">
                <Box size={22} className="text-orange-700" />
              </div>
              <p className="text-sm font-medium text-slate-500">
                Productos con poco stock
              </p>
              <h3 className="mt-2 text-3xl font-bold text-slate-900">
                {productosBajoStock.length}
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                Igual o por debajo del stock mínimo
              </p>
            </div>
          </div>
        </section>

        <section className="mb-10">
          <h2 className="mb-4 text-2xl font-bold text-white">
            Accesos rápidos
          </h2>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {accesosRapidos.map((item) => {
              const Icon = item.icon

              return (
                <Link
                  key={item.title}
                  href={item.href}
                  className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100">
                      <Icon size={22} className="text-slate-700" />
                    </div>

                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900">
                      <Plus size={18} className="text-white" />
                    </div>
                  </div>

                  <h3 className="text-xl font-semibold text-slate-900">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm text-slate-500">
                    {item.description}
                  </p>
                </Link>
              )
            })}
          </div>
        </section>

        <section className="mb-10">
          <h2 className="mb-4 text-2xl font-bold text-white">
            Búsqueda rápida
          </h2>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {busquedaRapida.map((item) => {
              const Icon = item.icon

              return (
                <Link
                  key={item.title}
                  href={item.href}
                  className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100">
                      <Icon size={22} className="text-slate-700" />
                    </div>

                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900">
                      <Search size={18} className="text-white" />
                    </div>
                  </div>

                  <h3 className="text-xl font-semibold text-slate-900">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm text-slate-500">
                    {item.description}
                  </p>
                </Link>
              )
            })}
          </div>
        </section>

        <section className="mb-10">
          <h2 className="mb-4 text-2xl font-bold text-white">
            Totales del mes
          </h2>

          <div className="grid gap-4 md:grid-cols-3">
            {resumenMes.map((item) => {
              const Icon = item.icon

              return (
                <div
                  key={item.title}
                  className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
                >
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100">
                    <Icon size={22} className="text-slate-700" />
                  </div>

                  <p className="text-sm font-medium text-slate-500">
                    {item.title}
                  </p>
                  <h3 className="mt-2 text-3xl font-bold text-slate-900">
                    {item.value}
                  </h3>
                  <p className="mt-2 text-sm text-slate-500">
                    {item.description}
                  </p>
                </div>
              )
            })}
          </div>
        </section>

        <section className="mb-10 grid gap-6 xl:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-6 text-2xl font-bold text-slate-900">
              Pedidos por mes
            </h2>

            <div className="space-y-4">
              {datosGraficas.map((item) => (
                <div key={item.label}>
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-700">
                      {item.label}
                    </span>
                    <span className="text-sm text-slate-500">
                      {item.pedidos}
                    </span>
                  </div>

                  <div className="h-3 rounded-full bg-slate-100">
                    <div
                      className="h-3 rounded-full bg-slate-900"
                      style={{
                        width: `${(item.pedidos / maxPedidos) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-6 text-2xl font-bold text-slate-900">
              Ingresos por mes
            </h2>

            <div className="space-y-4">
              {datosGraficas.map((item) => (
                <div key={item.label}>
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-700">
                      {item.label}
                    </span>
                    <span className="text-sm text-slate-500">
                      {item.ingresos.toFixed(2)} €
                    </span>
                  </div>

                  <div className="h-3 rounded-full bg-slate-100">
                    <div
                      className="h-3 rounded-full bg-emerald-500"
                      style={{
                        width: `${(item.ingresos / maxIngresos) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mb-10">
          <h2 className="mb-4 text-2xl font-bold text-white">
            Resumen general
          </h2>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {resumenGeneral.map((item) => {
              const Icon = item.icon

              return (
                <div
                  key={item.title}
                  className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
                >
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100">
                    <Icon size={22} className="text-slate-700" />
                  </div>

                  <p className="text-sm font-medium text-slate-500">
                    {item.title}
                  </p>
                  <h3 className="mt-2 text-3xl font-bold text-slate-900">
                    {item.value}
                  </h3>
                  <p className="mt-2 text-sm text-slate-500">
                    {item.description}
                  </p>
                </div>
              )
            })}
          </div>
        </section>

        <section className="mb-10">
          <h2 className="mb-4 text-2xl font-bold text-white">
            Indicadores clave
          </h2>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {indicadores.map((item) => {
              const Icon = item.icon

              return (
                <div
                  key={item.title}
                  className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
                >
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100">
                    <Icon size={22} className="text-slate-700" />
                  </div>

                  <p className="text-sm font-medium text-slate-500">
                    {item.title}
                  </p>
                  <h3 className="mt-2 text-3xl font-bold text-slate-900">
                    {item.value}
                  </h3>
                  <p className="mt-2 text-sm text-slate-500">
                    {item.description}
                  </p>
                </div>
              )
            })}
          </div>
        </section>

        <section className="mb-10">
          <h2 className="mb-4 text-2xl font-bold text-white">
            Pedidos urgentes
          </h2>

          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left">
                <thead className="bg-slate-100 text-sm text-slate-700">
                  <tr>
                    <th className="p-4 font-semibold">Cliente</th>
                    <th className="p-4 font-semibold">Producto</th>
                    <th className="p-4 font-semibold">Estado</th>
                    <th className="p-4 font-semibold">Prioridad</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-200">
                  {pedidosUrgentes.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="p-6 text-center text-slate-500"
                      >
                        No hay pedidos urgentes.
                      </td>
                    </tr>
                  ) : (
                    pedidosUrgentes.map((pedido: any) => (
                      <tr key={pedido.id}>
                        <td className="p-4 text-black">
                          {pedido.clientes?.nombre || '-'}
                        </td>
                        <td className="p-4 text-black">
                          {pedido.productos?.nombre || '-'}
                        </td>
                        <td className="p-4 text-black">
                          {pedido.estado || '-'}
                        </td>
                        <td className="p-4 text-black">
                          {pedido.prioridad || '-'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="mb-10">
          <h2 className="mb-4 text-2xl font-bold text-white">
            Productos con poco stock
          </h2>

          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left">
                <thead className="bg-slate-100 text-sm text-slate-700">
                  <tr>
                    <th className="p-4 font-semibold">Producto</th>
                    <th className="p-4 font-semibold">Stock</th>
                    <th className="p-4 font-semibold">Stock mínimo</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-200">
                  {productosBajoStock.length === 0 ? (
                    <tr>
                      <td
                        colSpan={3}
                        className="p-6 text-center text-slate-500"
                      >
                        No hay productos con poco stock.
                      </td>
                    </tr>
                  ) : (
                    productosBajoStock.map((producto) => (
                      <tr key={producto.id}>
                        <td className="p-4 text-black">
                          {producto.nombre || '-'}
                        </td>
                        <td className="p-4 text-black">
                          {producto.stock ?? 0}
                        </td>
                        <td className="p-4 text-black">
                          {producto.stock_minimo ?? 0}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="mb-10">
          <h2 className="mb-4 text-2xl font-bold text-white">
            Últimos pedidos
          </h2>

          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left">
                <thead className="bg-slate-100 text-sm text-slate-700">
                  <tr>
                    <th className="p-4 font-semibold">Cliente</th>
                    <th className="p-4 font-semibold">Producto</th>
                    <th className="p-4 font-semibold">Estado</th>
                    <th className="p-4 font-semibold">Cantidad</th>
                    <th className="p-4 font-semibold">Total</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-200">
                  {ultimosPedidos.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="p-6 text-center text-slate-500"
                      >
                        No hay pedidos todavía.
                      </td>
                    </tr>
                  ) : (
                    ultimosPedidos.map((pedido: any) => (
                      <tr key={pedido.id}>
                        <td className="p-4 text-black">
                          {pedido.clientes?.nombre || '-'}
                        </td>
                        <td className="p-4 text-black">
                          {pedido.productos?.nombre || '-'}
                        </td>
                        <td className="p-4 text-black">
                          {pedido.estado || '-'}
                        </td>
                        <td className="p-4 text-black">
                          {pedido.cantidad ?? 0}
                        </td>
                        <td className="p-4 font-semibold text-black">
                          {(
                            (pedido.cantidad ?? 0) *
                            (pedido.precio_venta ?? 0)
                          ).toFixed(2)}{' '}
                          €
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-bold text-white">
            Últimos presupuestos
          </h2>

          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left">
                <thead className="bg-slate-100 text-sm text-slate-700">
                  <tr>
                    <th className="p-4 font-semibold">Cliente</th>
                    <th className="p-4 font-semibold">Producto</th>
                    <th className="p-4 font-semibold">Estado</th>
                    <th className="p-4 font-semibold">Cantidad</th>
                    <th className="p-4 font-semibold">Total</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-200">
                  {ultimosPresupuestos.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="p-6 text-center text-slate-500"
                      >
                        No hay presupuestos todavía.
                      </td>
                    </tr>
                  ) : (
                    ultimosPresupuestos.map((presupuesto: any) => (
                      <tr key={presupuesto.id}>
                        <td className="p-4 text-black">
                          {presupuesto.clientes?.nombre || '-'}
                        </td>
                        <td className="p-4 text-black">
                          {presupuesto.productos?.nombre || '-'}
                        </td>
                        <td className="p-4 text-black">
                          {presupuesto.estado || '-'}
                        </td>
                        <td className="p-4 text-black">
                          {presupuesto.cantidad ?? 0}
                        </td>
                        <td className="p-4 font-semibold text-black">
                          {(
                            (presupuesto.cantidad ?? 0) *
                            (presupuesto.precio ?? 0)
                          ).toFixed(2)}{' '}
                          €
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}