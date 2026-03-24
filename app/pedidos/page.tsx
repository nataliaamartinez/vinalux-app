'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type Cliente = {
  id: string
  nombre: string
}

type Producto = {
  id: string
  nombre: string
  precio_compra: number | null
  precio_venta: number | null
}

type Pedido = {
  id: string
  cliente_id: string | null
  producto_id: string | null
  cantidad: number | null
  precio_venta: number | null
  coste: number | null
  estado: string | null
  prioridad: string | null
  fecha_entrega: string | null
  notas: string | null
  clientes: { nombre: string } | null
  productos: { nombre: string } | null
}

type FormDataType = {
  cliente_id: string
  producto_id: string
  cantidad: string
  precio_venta: string
  coste: string
  estado: string
  prioridad: string
  fecha_entrega: string
  notas: string
}

const initialFormData: FormDataType = {
  cliente_id: '',
  producto_id: '',
  cantidad: '1',
  precio_venta: '',
  coste: '',
  estado: 'pendiente',
  prioridad: 'media',
  fecha_entrega: '',
  notas: '',
}

export default function PedidosPage() {
  const searchParams = useSearchParams()
  const highlightedId = searchParams.get('id')

  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [productos, setProductos] = useState<Producto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [selectedPedido, setSelectedPedido] = useState<Pedido | null>(null)
  const [filtroEstado, setFiltroEstado] = useState('todos')

  const [formData, setFormData] = useState<FormDataType>(initialFormData)

  async function cargarDatos() {
    setLoading(true)
    setError(null)

    const [pedidosRes, clientesRes, productosRes] = await Promise.all([
      supabase
        .from('pedidos')
        .select(`
          *,
          clientes(nombre),
          productos(nombre)
        `)
        .order('created_at', { ascending: false }),
      supabase.from('clientes').select('id, nombre').order('nombre'),
      supabase
        .from('productos')
        .select('id, nombre, precio_compra, precio_venta')
        .order('nombre'),
    ])

    if (pedidosRes.error) {
      setError(pedidosRes.error.message)
    } else {
      setPedidos((pedidosRes.data as Pedido[]) || [])
    }

    if (clientesRes.error) {
      setError(clientesRes.error.message)
    } else {
      setClientes((clientesRes.data as Cliente[]) || [])
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

  useEffect(() => {
    if (!highlightedId) return

    const timer = setTimeout(() => {
      const element = document.getElementById(`pedido-${highlightedId}`)
      element?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 300)

    return () => clearTimeout(timer)
  }, [highlightedId, pedidos])

  useEffect(() => {
    if (!highlightedId || pedidos.length === 0) return

    const pedido = pedidos.find((item) => item.id === highlightedId)
    if (!pedido) return

    setSelectedPedido(pedido)
  }, [highlightedId, pedidos])

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))

    if (name === 'producto_id') {
      const producto = productos.find((p) => p.id === value)
      if (producto) {
        setFormData((prev) => ({
          ...prev,
          producto_id: value,
          precio_venta:
            producto.precio_venta !== null ? String(producto.precio_venta) : '',
          coste:
            producto.precio_compra !== null ? String(producto.precio_compra) : '',
        }))
      }
    }
  }

  function abrirNuevoPedido() {
    setEditingId(null)
    setFormData(initialFormData)
    setShowForm(true)
    setError(null)
  }

  function abrirEdicion(pedido: Pedido) {
    setEditingId(pedido.id)
    setFormData({
      cliente_id: pedido.cliente_id || '',
      producto_id: pedido.producto_id || '',
      cantidad: pedido.cantidad !== null ? String(pedido.cantidad) : '1',
      precio_venta:
        pedido.precio_venta !== null ? String(pedido.precio_venta) : '',
      coste: pedido.coste !== null ? String(pedido.coste) : '',
      estado: pedido.estado || 'pendiente',
      prioridad: pedido.prioridad || 'media',
      fecha_entrega: pedido.fecha_entrega || '',
      notas: pedido.notas || '',
    })
    setShowForm(true)
    setError(null)
  }

  function cerrarFormulario() {
    setShowForm(false)
    setEditingId(null)
    setFormData(initialFormData)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const payload = {
      cliente_id: formData.cliente_id || null,
      producto_id: formData.producto_id || null,
      cantidad: formData.cantidad ? Number(formData.cantidad) : 1,
      precio_venta: formData.precio_venta ? Number(formData.precio_venta) : 0,
      coste: formData.coste ? Number(formData.coste) : 0,
      estado: formData.estado || 'pendiente',
      prioridad: formData.prioridad || 'media',
      fecha_entrega: formData.fecha_entrega || null,
      notas: formData.notas || null,
    }

    let result

    if (editingId) {
      result = await supabase.from('pedidos').update(payload).eq('id', editingId)
    } else {
      result = await supabase.from('pedidos').insert([payload])
    }

    if (result.error) {
      setError(result.error.message)
      setSaving(false)
      return
    }

    cerrarFormulario()
    setSaving(false)
    await cargarDatos()
  }

  async function borrarPedido(id: string) {
    const confirmado = window.confirm('¿Seguro que quieres borrar este pedido?')
    if (!confirmado) return

    const { error } = await supabase.from('pedidos').delete().eq('id', id)

    if (error) {
      setError(error.message)
      return
    }

    await cargarDatos()
  }

  function colorPrioridad(prioridad: string | null) {
    if (prioridad === 'urgente') return 'bg-red-100 text-red-700'
    if (prioridad === 'alta') return 'bg-orange-100 text-orange-700'
    if (prioridad === 'media') return 'bg-yellow-100 text-yellow-700'
    return 'bg-green-100 text-green-700'
  }

  const pedidosFiltrados =
    filtroEstado === 'todos'
      ? pedidos
      : pedidos.filter((pedido) => pedido.estado === filtroEstado)

  function botonFiltroClase(valor: string) {
    return filtroEstado === valor
      ? 'rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white'
      : 'rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50'
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6 md:p-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Vinalux</p>
            <h1 className="text-3xl font-bold text-slate-900">Pedidos</h1>
            <p className="mt-1 text-slate-500">
              Gestiona pedidos con cliente, producto y prioridad.
            </p>
          </div>

          <button
            onClick={abrirNuevoPedido}
            className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
          >
            + Nuevo pedido
          </button>
        </div>

        <div className="mb-6 flex flex-wrap gap-2">
          <button
            onClick={() => setFiltroEstado('todos')}
            className={botonFiltroClase('todos')}
          >
            Todos
          </button>
          <button
            onClick={() => setFiltroEstado('pendiente')}
            className={botonFiltroClase('pendiente')}
          >
            Pendiente
          </button>
          <button
            onClick={() => setFiltroEstado('diseñando')}
            className={botonFiltroClase('diseñando')}
          >
            Diseñando
          </button>
          <button
            onClick={() => setFiltroEstado('producción')}
            className={botonFiltroClase('producción')}
          >
            Producción
          </button>
          <button
            onClick={() => setFiltroEstado('enviado')}
            className={botonFiltroClase('enviado')}
          >
            Enviado
          </button>
          <button
            onClick={() => setFiltroEstado('entregado')}
            className={botonFiltroClase('entregado')}
          >
            Entregado
          </button>
        </div>

        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        {showForm && (
          <div className="mb-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-slate-900">
                {editingId ? 'Editar pedido' : 'Nuevo pedido'}
              </h2>
              <button
                onClick={cerrarFormulario}
                className="rounded-xl px-3 py-2 text-sm text-slate-500 hover:bg-slate-100"
              >
                Cerrar
              </button>
            </div>

            <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Cliente
                </label>
                <select
                  name="cliente_id"
                  value={formData.cliente_id}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-black outline-none focus:border-slate-500"
                  required
                >
                  <option value="">Selecciona un cliente</option>
                  {clientes.map((cliente) => (
                    <option key={cliente.id} value={cliente.id}>
                      {cliente.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Producto
                </label>
                <select
                  name="producto_id"
                  value={formData.producto_id}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-black outline-none focus:border-slate-500"
                  required
                >
                  <option value="">Selecciona un producto</option>
                  {productos.map((producto) => (
                    <option key={producto.id} value={producto.id}>
                      {producto.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Cantidad
                </label>
                <input
                  name="cantidad"
                  type="number"
                  value={formData.cantidad}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-black outline-none focus:border-slate-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Precio venta
                </label>
                <input
                  name="precio_venta"
                  type="number"
                  step="0.01"
                  value={formData.precio_venta}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-black outline-none focus:border-slate-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Coste
                </label>
                <input
                  name="coste"
                  type="number"
                  step="0.01"
                  value={formData.coste}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-black outline-none focus:border-slate-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Fecha entrega
                </label>
                <input
                  name="fecha_entrega"
                  type="date"
                  value={formData.fecha_entrega}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-black outline-none focus:border-slate-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Estado
                </label>
                <select
                  name="estado"
                  value={formData.estado}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-black outline-none focus:border-slate-500"
                >
                  <option value="pendiente">Pendiente</option>
                  <option value="diseñando">Diseñando</option>
                  <option value="producción">Producción</option>
                  <option value="enviado">Enviado</option>
                  <option value="entregado">Entregado</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Prioridad
                </label>
                <select
                  name="prioridad"
                  value={formData.prioridad}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-black outline-none focus:border-slate-500"
                >
                  <option value="baja">Baja</option>
                  <option value="media">Media</option>
                  <option value="alta">Alta</option>
                  <option value="urgente">Urgente</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Observaciones
                </label>
                <textarea
                  name="notas"
                  value={formData.notas}
                  onChange={handleChange}
                  rows={4}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-black outline-none focus:border-slate-500"
                  placeholder="Detalles del pedido..."
                />
              </div>

              <div className="md:col-span-2 flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:opacity-50"
                >
                  {saving
                    ? 'Guardando...'
                    : editingId
                    ? 'Guardar cambios'
                    : 'Guardar pedido'}
                </button>

                <button
                  type="button"
                  onClick={cerrarFormulario}
                  className="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {selectedPedido && (
          <div className="mb-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-slate-900">
                Detalle del pedido
              </h2>
              <button
                onClick={() => setSelectedPedido(null)}
                className="rounded-xl px-3 py-2 text-sm text-slate-500 hover:bg-slate-100"
              >
                Cerrar
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Cliente</p>
                <p className="mt-1 font-semibold text-slate-900">
                  {selectedPedido.clientes?.nombre || '-'}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Producto</p>
                <p className="mt-1 font-semibold text-slate-900">
                  {selectedPedido.productos?.nombre || '-'}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Cantidad</p>
                <p className="mt-1 font-semibold text-slate-900">
                  {selectedPedido.cantidad ?? 0}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Fecha de entrega</p>
                <p className="mt-1 font-semibold text-slate-900">
                  {selectedPedido.fecha_entrega || '-'}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Estado</p>
                <p className="mt-1 font-semibold text-slate-900">
                  {selectedPedido.estado || '-'}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Prioridad</p>
                <span
                  className={`mt-1 inline-block rounded-full px-3 py-1 text-xs font-semibold ${colorPrioridad(
                    selectedPedido.prioridad
                  )}`}
                >
                  {selectedPedido.prioridad || '-'}
                </span>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4 md:col-span-2">
                <p className="text-sm text-slate-500">Observaciones</p>
                <p className="mt-1 whitespace-pre-wrap font-medium text-slate-900">
                  {selectedPedido.notas || 'Sin observaciones'}
                </p>
              </div>
            </div>
          </div>
        )}

        {loading && (
          <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <p className="text-slate-500">Cargando pedidos...</p>
          </div>
        )}

        {!loading && pedidosFiltrados.length === 0 && !error && (
          <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">
              No hay pedidos en este estado
            </h2>
            <p className="mt-2 text-slate-500">
              Prueba otro filtro o añade un nuevo pedido.
            </p>
          </div>
        )}

        {!loading && pedidosFiltrados.length > 0 && (
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left">
                <thead className="bg-slate-100 text-sm text-slate-600">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Cliente</th>
                    <th className="px-6 py-4 font-semibold">Producto</th>
                    <th className="px-6 py-4 font-semibold">Cantidad</th>
                    <th className="px-6 py-4 font-semibold">Estado</th>
                    <th className="px-6 py-4 font-semibold">Prioridad</th>
                    <th className="px-6 py-4 font-semibold">Entrega</th>
                    <th className="px-6 py-4 font-semibold">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                  {pedidosFiltrados.map((pedido) => (
                    <tr
                      key={pedido.id}
                      id={`pedido-${pedido.id}`}
                      className={`hover:bg-slate-50 ${
                        highlightedId === pedido.id ? 'bg-yellow-100' : ''
                      }`}
                    >
                      <td className="px-6 py-4 font-medium text-slate-900">
                        {pedido.clientes?.nombre || '-'}
                      </td>
                      <td className="px-6 py-4">
                        {pedido.productos?.nombre || '-'}
                      </td>
                      <td className="px-6 py-4">{pedido.cantidad ?? 0}</td>
                      <td className="px-6 py-4">{pedido.estado || '-'}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${colorPrioridad(
                            pedido.prioridad
                          )}`}
                        >
                          {pedido.prioridad || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4">{pedido.fecha_entrega || '-'}</td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => setSelectedPedido(pedido)}
                            className="rounded-xl bg-blue-100 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-200"
                          >
                            Ver
                          </button>
                          <button
                            onClick={() => abrirEdicion(pedido)}
                            className="rounded-xl bg-amber-100 px-3 py-2 text-xs font-semibold text-amber-700 hover:bg-amber-200"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => borrarPedido(pedido.id)}
                            className="rounded-xl bg-red-100 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-200"
                          >
                            Borrar
                          </button>
                        </div>
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