'use client'

import { useEffect, useState } from 'react'
import { generarPDF } from '@/lib/pdf'
import { supabase } from '@/lib/supabase'

type Cliente = {
  id: string
  nombre: string
}

type Producto = {
  id: string
  nombre: string
  precio_venta: number | null
}

type Ajustes = {
  nombre_negocio: string | null
  telefono: string | null
  email: string | null
}

type Presupuesto = {
  id: string
  cliente_id: string | null
  producto_id: string | null
  cantidad: number | null
  precio: number | null
  estado: string | null
  notas: string | null
  created_at?: string | null
  clientes: { nombre: string } | null
  productos: { nombre: string } | null
}

type FormDataType = {
  cliente_id: string
  producto_id: string
  cantidad: string
  precio: string
  estado: string
  notas: string
}

const initialFormData: FormDataType = {
  cliente_id: '',
  producto_id: '',
  cantidad: '1',
  precio: '',
  estado: 'borrador',
  notas: '',
}

export default function PresupuestosPage() {
  const [presupuestos, setPresupuestos] = useState<Presupuesto[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [productos, setProductos] = useState<Producto[]>([])
  const [ajustes, setAjustes] = useState<Ajustes | null>(null)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [selectedPresupuesto, setSelectedPresupuesto] =
    useState<Presupuesto | null>(null)
  const [convertingId, setConvertingId] = useState<string | null>(null)

  const [formData, setFormData] = useState<FormDataType>(initialFormData)

  async function cargarDatos() {
    setLoading(true)
    setError(null)

    try {
      const [presupuestosRes, clientesRes, productosRes, ajustesRes] =
        await Promise.all([
          supabase
            .from('presupuestos')
            .select(
              `
              *,
              clientes(nombre),
              productos(nombre)
            `
            )
            .order('created_at', { ascending: false }),

          supabase.from('clientes').select('id, nombre').order('nombre'),

          supabase
            .from('productos')
            .select('id, nombre, precio_venta')
            .order('nombre'),

          supabase.from('ajustes').select('*').limit(1),
        ])

      if (presupuestosRes.error) {
        setError(presupuestosRes.error.message)
      } else {
        setPresupuestos((presupuestosRes.data as Presupuesto[]) || [])
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

      if (ajustesRes.error) {
        setError(ajustesRes.error.message)
      } else if (ajustesRes.data && ajustesRes.data.length > 0) {
        setAjustes(ajustesRes.data[0] as Ajustes)
      } else {
        setAjustes(null)
      }
    } catch (err) {
      console.error(err)
      setError('Ha ocurrido un error al cargar los datos.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarDatos()
  }, [])

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
          precio:
            producto.precio_venta !== null ? String(producto.precio_venta) : '',
        }))
      }
    }
  }

  function abrirNuevoPresupuesto() {
    setEditingId(null)
    setFormData(initialFormData)
    setShowForm(true)
    setError(null)
  }

  function abrirEdicion(presupuesto: Presupuesto) {
    setEditingId(presupuesto.id)
    setFormData({
      cliente_id: presupuesto.cliente_id || '',
      producto_id: presupuesto.producto_id || '',
      cantidad:
        presupuesto.cantidad !== null ? String(presupuesto.cantidad) : '1',
      precio: presupuesto.precio !== null ? String(presupuesto.precio) : '',
      estado: presupuesto.estado || 'borrador',
      notas: presupuesto.notas || '',
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
      precio: formData.precio ? Number(formData.precio) : 0,
      estado: formData.estado || 'borrador',
      notas: formData.notas || null,
    }

    let result

    if (editingId) {
      result = await supabase
        .from('presupuestos')
        .update(payload)
        .eq('id', editingId)
    } else {
      result = await supabase.from('presupuestos').insert([payload])
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

  async function borrarPresupuesto(id: string) {
    const confirmado = window.confirm(
      '¿Seguro que quieres borrar este presupuesto?'
    )
    if (!confirmado) return

    const { error } = await supabase.from('presupuestos').delete().eq('id', id)

    if (error) {
      setError(error.message)
      return
    }

    await cargarDatos()
  }

  async function convertirEnPedido(presupuesto: Presupuesto) {
    const confirmado = window.confirm(
      '¿Quieres convertir este presupuesto en un pedido?'
    )
    if (!confirmado) return

    setError(null)
    setConvertingId(presupuesto.id)

    const pedidoPayload = {
      cliente_id: presupuesto.cliente_id,
      producto_id: presupuesto.producto_id,
      cantidad: presupuesto.cantidad ?? 1,
      precio_venta: presupuesto.precio ?? 0,
      coste: 0,
      estado: 'pendiente',
      prioridad: 'media',
      fecha_entrega: null,
      notas: presupuesto.notas
        ? `Creado desde presupuesto:\n${presupuesto.notas}`
        : 'Creado desde presupuesto',
    }

    const pedidoRes = await supabase.from('pedidos').insert([pedidoPayload])

    if (pedidoRes.error) {
      setError(pedidoRes.error.message)
      setConvertingId(null)
      return
    }

    const updateRes = await supabase
      .from('presupuestos')
      .update({ estado: 'aceptado' })
      .eq('id', presupuesto.id)

    if (updateRes.error) {
      setError(updateRes.error.message)
      setConvertingId(null)
      return
    }

    setConvertingId(null)
    await cargarDatos()
    alert('Presupuesto convertido en pedido correctamente.')
  }

  function enviarWhatsApp(presupuesto: Presupuesto) {
    const cliente = presupuesto.clientes?.nombre || 'Cliente'
    const producto = presupuesto.productos?.nombre || 'Producto'
    const total = (presupuesto.cantidad ?? 0) * (presupuesto.precio ?? 0)
    const negocio = ajustes?.nombre_negocio || 'Vinalux'

    const mensaje = `Hola ${cliente}, te envío el presupuesto:

Producto: ${producto}
Total: ${total.toFixed(2)} €

Gracias por confiar en ${negocio}.`

    const url = `https://wa.me/?text=${encodeURIComponent(mensaje)}`
    window.open(url, '_blank')
  }

  function colorEstado(estado: string | null) {
    if (estado === 'aceptado') return 'bg-green-100 text-green-700'
    if (estado === 'enviado') return 'bg-blue-100 text-blue-700'
    if (estado === 'rechazado') return 'bg-red-100 text-red-700'
    return 'bg-yellow-100 text-yellow-700'
  }

  const totalCalculado =
    (Number(formData.cantidad) || 0) * (Number(formData.precio) || 0)

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Vinalux</p>
            <h1 className="mt-2 text-4xl font-bold text-slate-900">
              Presupuestos
            </h1>
            <p className="mt-3 text-slate-600">
              Crea y gestiona presupuestos para tus clientes.
            </p>
          </div>

          <button
            onClick={abrirNuevoPresupuesto}
            className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
          >
            + Nuevo presupuesto
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
                {editingId ? 'Editar presupuesto' : 'Nuevo presupuesto'}
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
                  Precio unitario
                </label>
                <input
                  name="precio"
                  type="number"
                  step="0.01"
                  value={formData.precio}
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
                  <option value="borrador">Borrador</option>
                  <option value="enviado">Enviado</option>
                  <option value="aceptado">Aceptado</option>
                  <option value="rechazado">Rechazado</option>
                </select>
              </div>

              <div className="rounded-2xl bg-slate-100 p-4">
                <p className="text-sm text-slate-500">Total calculado</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">
                  {totalCalculado.toFixed(2)} €
                </p>
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
                  placeholder="Detalles del presupuesto..."
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
                    : 'Guardar presupuesto'}
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

        {selectedPresupuesto && (
          <div className="mb-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-slate-900">
                Detalle del presupuesto
              </h2>
              <button
                onClick={() => setSelectedPresupuesto(null)}
                className="rounded-xl px-3 py-2 text-sm text-slate-500 hover:bg-slate-100"
              >
                Cerrar
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Cliente</p>
                <p className="mt-1 font-semibold text-slate-900">
                  {selectedPresupuesto.clientes?.nombre || '-'}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Producto</p>
                <p className="mt-1 font-semibold text-slate-900">
                  {selectedPresupuesto.productos?.nombre || '-'}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Cantidad</p>
                <p className="mt-1 font-semibold text-slate-900">
                  {selectedPresupuesto.cantidad ?? 0}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Precio unitario</p>
                <p className="mt-1 font-semibold text-slate-900">
                  {selectedPresupuesto.precio ?? 0} €
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Estado</p>
                <span
                  className={`mt-1 inline-block rounded-full px-3 py-1 text-xs font-semibold ${colorEstado(
                    selectedPresupuesto.estado
                  )}`}
                >
                  {selectedPresupuesto.estado || '-'}
                </span>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Total</p>
                <p className="mt-1 text-xl font-bold text-slate-900">
                  {(
                    (selectedPresupuesto.cantidad ?? 0) *
                    (selectedPresupuesto.precio ?? 0)
                  ).toFixed(2)}{' '}
                  €
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4 md:col-span-2">
                <p className="text-sm text-slate-500">Observaciones</p>
                <p className="mt-1 whitespace-pre-wrap font-medium text-slate-900">
                  {selectedPresupuesto.notas || 'Sin observaciones'}
                </p>
              </div>
            </div>
          </div>
        )}

        {loading && (
          <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <p className="text-slate-500">Cargando presupuestos...</p>
          </div>
        )}

        {!loading && presupuestos.length === 0 && !error && (
          <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">
              No hay presupuestos todavía
            </h2>
            <p className="mt-2 text-slate-500">
              Añade tu primer presupuesto desde el botón superior.
            </p>
          </div>
        )}

        {!loading && presupuestos.length > 0 && (
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left">
                <thead className="bg-slate-100 text-sm text-slate-600">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Cliente</th>
                    <th className="px-6 py-4 font-semibold">Producto</th>
                    <th className="px-6 py-4 font-semibold">Cantidad</th>
                    <th className="px-6 py-4 font-semibold">Precio</th>
                    <th className="px-6 py-4 font-semibold">Estado</th>
                    <th className="px-6 py-4 font-semibold">Total</th>
                    <th className="px-6 py-4 font-semibold">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                  {presupuestos.map((presupuesto) => (
                    <tr key={presupuesto.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 font-medium text-slate-900">
                        {presupuesto.clientes?.nombre || '-'}
                      </td>
                      <td className="px-6 py-4">
                        {presupuesto.productos?.nombre || '-'}
                      </td>
                      <td className="px-6 py-4">{presupuesto.cantidad ?? 0}</td>
                      <td className="px-6 py-4">{presupuesto.precio ?? 0} €</td>
                      <td className="px-6 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${colorEstado(
                            presupuesto.estado
                          )}`}
                        >
                          {presupuesto.estado || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-900">
                        {(
                          (presupuesto.cantidad ?? 0) *
                          (presupuesto.precio ?? 0)
                        ).toFixed(2)}{' '}
                        €
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => setSelectedPresupuesto(presupuesto)}
                            className="rounded-xl bg-blue-100 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-200"
                          >
                            Ver
                          </button>
                          <button
                            onClick={async () =>
                              await generarPDF({
                                negocio: ajustes?.nombre_negocio || 'Vinalux',
                                telefono: ajustes?.telefono || '',
                                email: ajustes?.email || '',
                                cliente:
                                  presupuesto.clientes?.nombre || 'Cliente',
                                producto:
                                  presupuesto.productos?.nombre || 'Producto',
                                precio:
                                  (presupuesto.cantidad ?? 0) *
                                  (presupuesto.precio ?? 0),
                                fecha: new Date().toLocaleDateString(),
                              })
                            }
                            className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                          >
                            PDF
                          </button>
                          <button
                            onClick={() => enviarWhatsApp(presupuesto)}
                            className="rounded-xl bg-green-100 px-3 py-2 text-xs font-semibold text-green-700 hover:bg-green-200"
                          >
                            WhatsApp
                          </button>
                          <button
                            onClick={() => abrirEdicion(presupuesto)}
                            className="rounded-xl bg-amber-100 px-3 py-2 text-xs font-semibold text-amber-700 hover:bg-amber-200"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => convertirEnPedido(presupuesto)}
                            disabled={convertingId === presupuesto.id}
                            className="rounded-xl bg-emerald-100 px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-200 disabled:opacity-50"
                          >
                            {convertingId === presupuesto.id
                              ? 'Convirtiendo...'
                              : 'Convertir'}
                          </button>
                          <button
                            onClick={() => borrarPresupuesto(presupuesto.id)}
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