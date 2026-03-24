'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

type TipoBusqueda =
  | 'todos'
  | 'Producto'
  | 'Cliente'
  | 'Pedido'
  | 'Presupuesto'

type ItemBusqueda = {
  id: string
  nombre: string
  tipo: Exclude<TipoBusqueda, 'todos'>
  href: string
}

export default function BuscarPage() {
  const [tipoSeleccionado, setTipoSeleccionado] =
    useState<TipoBusqueda>('todos')
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [productos, setProductos] = useState<ItemBusqueda[]>([])
  const [clientes, setClientes] = useState<ItemBusqueda[]>([])
  const [pedidos, setPedidos] = useState<ItemBusqueda[]>([])
  const [presupuestos, setPresupuestos] = useState<ItemBusqueda[]>([])

  useEffect(() => {
    async function cargarDatos() {
      setLoading(true)
      setError(null)

      const [
        productosRes,
        clientesRes,
        pedidosRes,
        presupuestosRes,
      ] = await Promise.all([
        supabase.from('productos').select('id, nombre').order('nombre'),
        supabase.from('clientes').select('id, nombre').order('nombre'),
        supabase
          .from('pedidos')
          .select(`
            id,
            clientes(nombre),
            productos(nombre)
          `)
          .order('created_at', { ascending: false }),
        supabase
          .from('presupuestos')
          .select(`
            id,
            clientes(nombre),
            productos(nombre)
          `)
          .order('created_at', { ascending: false }),
      ])

      if (productosRes.error) {
        setError(productosRes.error.message)
      } else {
        const productosMapeados: ItemBusqueda[] = Array.isArray(productosRes.data)
          ? productosRes.data.map((item: any) => ({
              id: item.id,
              nombre: item.nombre || 'Sin nombre',
              tipo: 'Producto',
              href: `/productos?id=${item.id}`,
            }))
          : []
        setProductos(productosMapeados)
      }

      if (clientesRes.error) {
        setError(clientesRes.error.message)
      } else {
        const clientesMapeados: ItemBusqueda[] = Array.isArray(clientesRes.data)
          ? clientesRes.data.map((item: any) => ({
              id: item.id,
              nombre: item.nombre || 'Sin nombre',
              tipo: 'Cliente',
              href: `/clientes?id=${item.id}`,
            }))
          : []
        setClientes(clientesMapeados)
      }

      if (pedidosRes.error) {
        setError(pedidosRes.error.message)
      } else {
        const pedidosMapeados: ItemBusqueda[] = Array.isArray(pedidosRes.data)
          ? pedidosRes.data.map((item: any) => {
              const cliente = Array.isArray(item.clientes)
                ? item.clientes[0]?.nombre
                : item.clientes?.nombre

              const producto = Array.isArray(item.productos)
                ? item.productos[0]?.nombre
                : item.productos?.nombre

              return {
                id: item.id,
                nombre: `Pedido - ${cliente || 'Sin cliente'} - ${producto || 'Sin producto'}`,
                tipo: 'Pedido',
                href: `/pedidos?id=${item.id}`,
              }
            })
          : []
        setPedidos(pedidosMapeados)
      }

      if (presupuestosRes.error) {
        setError(presupuestosRes.error.message)
      } else {
        const presupuestosMapeados: ItemBusqueda[] = Array.isArray(presupuestosRes.data)
          ? presupuestosRes.data.map((item: any) => {
              const cliente = Array.isArray(item.clientes)
                ? item.clientes[0]?.nombre
                : item.clientes?.nombre

              const producto = Array.isArray(item.productos)
                ? item.productos[0]?.nombre
                : item.productos?.nombre

              return {
                id: item.id,
                nombre: `Presupuesto - ${cliente || 'Sin cliente'} - ${producto || 'Sin producto'}`,
                tipo: 'Presupuesto',
                href: `/presupuestos?id=${item.id}`,
              }
            })
          : []
        setPresupuestos(presupuestosMapeados)
      }

      setLoading(false)
    }

    cargarDatos()
  }, [])

  const datos: ItemBusqueda[] = useMemo(() => {
    return [...productos, ...clientes, ...pedidos, ...presupuestos]
  }, [productos, clientes, pedidos, presupuestos])

  const resultados = useMemo(() => {
    let filtrados = datos

    if (tipoSeleccionado !== 'todos') {
      filtrados = filtrados.filter((item) => item.tipo === tipoSeleccionado)
    }

    const texto = query.trim().toLowerCase()

    if (!texto) return filtrados

    return filtrados.filter((item) =>
      item.nombre.toLowerCase().includes(texto)
    )
  }, [query, tipoSeleccionado, datos])

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <p className="text-sm font-medium text-white">Vinalux</p>
          <h1 className="mt-2 text-4xl font-bold text-white">Buscar</h1>
          <p className="mt-3 text-slate-300">
            Primero elige qué quieres buscar y después escribe.
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        <div className="mb-8 rounded-3xl border border-slate-700 bg-white p-6 shadow-sm">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Qué quieres buscar
              </label>
              <select
                value={tipoSeleccionado}
                onChange={(e) =>
                  setTipoSeleccionado(e.target.value as TipoBusqueda)
                }
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-black outline-none focus:border-slate-500"
              >
                <option value="todos">Todos</option>
                <option value="Producto">Productos</option>
                <option value="Cliente">Clientes</option>
                <option value="Pedido">Pedidos</option>
                <option value="Presupuesto">Presupuestos</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Buscar
              </label>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Escribe aquí..."
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-black outline-none focus:border-slate-500"
              />
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-700 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-4">
            <h2 className="text-lg font-semibold text-slate-900">
              Resultados
            </h2>
          </div>

          {loading ? (
            <div className="p-6 text-slate-500">Cargando resultados...</div>
          ) : resultados.length === 0 ? (
            <div className="p-6 text-slate-500">No se encontraron resultados.</div>
          ) : (
            <div className="divide-y divide-slate-200">
              {resultados.map((item) => (
                <Link
                  key={`${item.tipo}-${item.id}`}
                  href={item.href}
                  className="block p-4 transition hover:bg-slate-50"
                >
                  <div className="text-sm text-slate-500">{item.tipo}</div>
                  <div className="mt-1 font-medium text-black">
                    {item.nombre}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}