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
  imagen_url: string | null
}

type Ajustes = {
  nombre_negocio: string | null
  telefono: string | null
  email: string | null
}

type PresupuestoItem = {
  id: string
  presupuesto_id: string
  producto_id: string | null
  cantidad: number | null
  precio: number | null
  material_estampado: 'dtf' | 'uv' | null
  tipo_estampado: 'grande' | 'pequeño' | null
  tipo_estampacion: 'simple' | 'doble' | null
  imagen_url: string | null
  productos: { nombre: string; imagen_url: string | null } | null
}

type Presupuesto = {
  id: string
  cliente_id: string | null
  estado: string | null
  notas: string | null
  created_at?: string | null
  clientes: { nombre: string } | null
  presupuesto_items: PresupuestoItem[]
}

type FormDataType = {
  cliente_id: string
  estado: string
  notas: string
}

type ItemFormType = {
  producto_id: string
  cantidad: string
  precio: string
  material_estampado: 'dtf' | 'uv'
  tipo_estampado: 'grande' | 'pequeño'
  tipo_estampacion: 'simple' | 'doble'
  imagen_url: string
}

const initialFormData: FormDataType = {
  cliente_id: '',
  estado: 'borrador',
  notas: '',
}

const initialItem: ItemFormType = {
  producto_id: '',
  cantidad: '1',
  precio: '',
  material_estampado: 'dtf',
  tipo_estampado: 'pequeño',
  tipo_estampacion: 'simple',
  imagen_url: '',
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
  const [items, setItems] = useState<ItemFormType[]>([initialItem])

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
              presupuesto_items(
                *,
                productos(nombre, imagen_url)
              )
            `
            )
            .order('created_at', { ascending: false }),

          supabase.from('clientes').select('id, nombre').order('nombre'),

          supabase
            .from('productos')
            .select('id, nombre, precio_venta, imagen_url')
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
  }

  function cambiarItem(index: number, campo: keyof ItemFormType, valor: string) {
    setItems((prev) => {
      const nuevos = [...prev]

      nuevos[index] = {
        ...nuevos[index],
        [campo]: valor,
      }

      if (campo === 'producto_id') {
        const producto = productos.find((p) => p.id === valor)

        nuevos[index].precio =
          producto?.precio_venta !== null && producto?.precio_venta !== undefined
            ? String(producto.precio_venta)
            : ''

        nuevos[index].imagen_url = producto?.imagen_url || ''
      }

      return nuevos
    })
  }

  function añadirProducto() {
    setItems((prev) => [...prev, { ...initialItem }])
  }

  function borrarItem(index: number) {
    setItems((prev) => {
      if (prev.length === 1) return prev
      return prev.filter((_, i) => i !== index)
    })
  }

  function abrirNuevoPresupuesto() {
    setEditingId(null)
    setFormData(initialFormData)
    setItems([{ ...initialItem }])
    setShowForm(true)
    setError(null)
  }

  function abrirEdicion(presupuesto: Presupuesto) {
    setEditingId(presupuesto.id)

    setFormData({
      cliente_id: presupuesto.cliente_id || '',
      estado: presupuesto.estado || 'borrador',
      notas: presupuesto.notas || '',
    })

    if (presupuesto.presupuesto_items?.length > 0) {
      setItems(
        presupuesto.presupuesto_items.map((item) => ({
          producto_id: item.producto_id || '',
          cantidad: item.cantidad !== null ? String(item.cantidad) : '1',
          precio: item.precio !== null ? String(item.precio) : '',
          material_estampado: item.material_estampado || 'dtf',
          tipo_estampado: item.tipo_estampado || 'pequeño',
          tipo_estampacion: item.tipo_estampacion || 'simple',
          imagen_url: item.imagen_url || item.productos?.imagen_url || '',
        }))
      )
    } else {
      setItems([{ ...initialItem }])
    }

    setShowForm(true)
    setError(null)
  }

  function cerrarFormulario() {
    setShowForm(false)
    setEditingId(null)
    setFormData(initialFormData)
    setItems([{ ...initialItem }])
  }

  const totalCalculado = items.reduce((total, item) => {
    return total + (Number(item.cantidad) || 0) * (Number(item.precio) || 0)
  }, 0)

  function totalPresupuesto(presupuesto: Presupuesto) {
    return presupuesto.presupuesto_items.reduce((total, item) => {
      return total + (item.cantidad ?? 0) * (item.precio ?? 0)
    }, 0)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const itemsValidos = items.filter((item) => item.producto_id)

    if (itemsValidos.length === 0) {
      setError('Añade al menos un producto al presupuesto.')
      setSaving(false)
      return
    }

    const presupuestoPayload = {
      cliente_id: formData.cliente_id || null,
      estado: formData.estado || 'borrador',
      notas: formData.notas || null,
    }

    let presupuestoId = editingId

    if (editingId) {
      const updateRes = await supabase
        .from('presupuestos')
        .update(presupuestoPayload)
        .eq('id', editingId)

      if (updateRes.error) {
        setError(updateRes.error.message)
        setSaving(false)
        return
      }

      const deleteItemsRes = await supabase
        .from('presupuesto_items')
        .delete()
        .eq('presupuesto_id', editingId)

      if (deleteItemsRes.error) {
        setError(deleteItemsRes.error.message)
        setSaving(false)
        return
      }
    } else {
      const insertRes = await supabase
        .from('presupuestos')
        .insert([presupuestoPayload])
        .select('id')
        .single()

      if (insertRes.error) {
        setError(insertRes.error.message)
        setSaving(false)
        return
      }

      presupuestoId = insertRes.data.id
    }

    const itemsPayload = itemsValidos.map((item) => ({
      presupuesto_id: presupuestoId,
      producto_id: item.producto_id,
      cantidad: Number(item.cantidad) || 1,
      precio: Number(item.precio) || 0,
      material_estampado: item.material_estampado,
      tipo_estampado: item.tipo_estampado,
      tipo_estampacion: item.tipo_estampacion,
      imagen_url: item.imagen_url || null,
    }))

    const itemsRes = await supabase.from('presupuesto_items').insert(itemsPayload)

    if (itemsRes.error) {
      setError(itemsRes.error.message)
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
      '¿Quieres convertir este presupuesto en pedido? Se creará un pedido por cada producto.'
    )
    if (!confirmado) return

    setError(null)
    setConvertingId(presupuesto.id)

const primerItem = presupuesto.presupuesto_items[0]

const total = presupuesto.presupuesto_items.reduce((acc, item) => {
  return acc + (item.cantidad ?? 0) * (item.precio ?? 0)
}, 0)

const resumenProductos = presupuesto.presupuesto_items
  .map((item, index) => {
    const nombre = item.productos?.nombre || 'Producto'
    const subtotal = (item.cantidad ?? 0) * (item.precio ?? 0)

    return `${index + 1}. ${nombre}
Cantidad: ${item.cantidad ?? 0}
Precio unitario: ${item.precio ?? 0} €
Material: ${item.material_estampado || '-'}
Tamaño: ${item.tipo_estampado || '-'}
Estampación: ${item.tipo_estampacion || '-'}
Subtotal: ${subtotal.toFixed(2)} €`
  })
  .join('\n\n')

const pedidoPayload = {
  cliente_id: presupuesto.cliente_id,
  producto_id: primerItem?.producto_id || null,
  cantidad: 1,
  precio_venta: total,
  coste: 0,
  estado: 'pendiente',
  prioridad: 'media',
  fecha_entrega: null,
  tipo_material: primerItem?.material_estampado || null,
  tipo_producto: 'varios',
  notas: presupuesto.notas
    ? `Creado desde presupuesto:\n${presupuesto.notas}\n\nProductos:\n${resumenProductos}`
    : `Creado desde presupuesto\n\nProductos:\n${resumenProductos}`,
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
    const negocio = ajustes?.nombre_negocio || 'Vinalux'
    const total = totalPresupuesto(presupuesto)

    const productosTexto = presupuesto.presupuesto_items
      .map((item) => {
        const nombre = item.productos?.nombre || 'Producto'
        const subtotal = (item.cantidad ?? 0) * (item.precio ?? 0)

        return `- ${nombre}
Cantidad: ${item.cantidad ?? 0}
Precio unitario: ${item.precio ?? 0} €
Material: ${item.material_estampado || '-'}
Tamaño: ${item.tipo_estampado || '-'}
Estampación: ${item.tipo_estampacion || '-'}
Subtotal: ${subtotal.toFixed(2)} €`
      })
      .join('\n\n')

    const mensaje = `Hola ${cliente}, te envío el presupuesto:

${productosTexto}

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

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Vinalux</p>
            <h1 className="mt-2 text-4xl font-bold text-white">
              Presupuestos
            </h1>
            <p className="mt-3 text-slate-600">
              Crea y gestiona presupuestos para tus clientes.
            </p>
          </div>

          <button
            onClick={abrirNuevoPresupuesto}
            className="rounded-2xl bg-red px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
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

              <div className="md:col-span-2 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-slate-900">
                    Productos del presupuesto
                  </h3>

                  <button
                    type="button"
                    onClick={añadirProducto}
                    className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                  >
                    + Añadir producto
                  </button>
                </div>

                {items.map((item, index) => (
                  <div
                    key={index}
                    className="grid gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-3"
                  >
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700">
                        Producto
                      </label>
                      <select
                        value={item.producto_id}
                        onChange={(e) =>
                          cambiarItem(index, 'producto_id', e.target.value)
                        }
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
                        type="number"
                        value={item.cantidad}
                        onChange={(e) =>
                          cambiarItem(index, 'cantidad', e.target.value)
                        }
                        className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-black outline-none focus:border-slate-500"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700">
                        Precio venta
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={item.precio}
                        onChange={(e) =>
                          cambiarItem(index, 'precio', e.target.value)
                        }
                        className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-black outline-none focus:border-slate-500"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700">
                        Material estampado
                      </label>
                      <select
                        value={item.material_estampado}
                        onChange={(e) =>
                          cambiarItem(
                            index,
                            'material_estampado',
                            e.target.value
                          )
                        }
                        className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-black outline-none focus:border-slate-500"
                      >
                        <option value="dtf">DTF</option>
                        <option value="uv">UV</option>
                      </select>
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700">
                        Tipo de estampado
                      </label>
                      <select
                        value={item.tipo_estampado}
                        onChange={(e) =>
                          cambiarItem(index, 'tipo_estampado', e.target.value)
                        }
                        className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-black outline-none focus:border-slate-500"
                      >
                        <option value="pequeño">Pequeño</option>
                        <option value="grande">Grande</option>
                      </select>
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700">
                        Tipo de estampación
                      </label>
                      <select
                        value={item.tipo_estampacion}
                        onChange={(e) =>
                          cambiarItem(index, 'tipo_estampacion', e.target.value)
                        }
                        className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-black outline-none focus:border-slate-500"
                      >
                        <option value="simple">Simple</option>
                        <option value="doble">Doble</option>
                      </select>
                    </div>

                    {item.imagen_url && (
                      <div className="md:col-span-2">
                        <p className="mb-2 text-sm font-medium text-slate-700">
                          Foto del producto
                        </p>
                        <img
                          src={item.imagen_url}
                          alt="Foto del producto"
                          className="h-24 w-24 rounded-xl object-cover"
                        />
                      </div>
                    )}

                    <div className="flex items-end justify-between gap-3 md:col-span-3">
                      <p className="text-sm font-semibold text-slate-900">
                        Subtotal:{' '}
                        {(
                          (Number(item.cantidad) || 0) *
                          (Number(item.precio) || 0)
                        ).toFixed(2)}{' '}
                        €
                      </p>

                      <button
                        type="button"
                        onClick={() => borrarItem(index)}
                        className="rounded-xl bg-red-100 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-200"
                      >
                        Quitar producto
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="rounded-2xl bg-slate-100 p-4 md:col-span-2">
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

            <div className="mb-4 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Cliente</p>
                <p className="mt-1 font-semibold text-slate-900">
                  {selectedPresupuesto.clientes?.nombre || '-'}
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
            </div>

            <div className="space-y-4">
              {selectedPresupuesto.presupuesto_items.map((item) => (
                <div
                  key={item.id}
                  className="grid gap-4 rounded-2xl bg-slate-50 p-4 md:grid-cols-4"
                >
                  {item.imagen_url && (
                    <img
                      src={item.imagen_url}
                      alt="Producto"
                      className="h-24 w-24 rounded-xl object-cover"
                    />
                  )}

                  <div>
                    <p className="text-sm text-slate-500">Producto</p>
                    <p className="font-semibold text-slate-900">
                      {item.productos?.nombre || '-'}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-slate-500">Cantidad</p>
                    <p className="font-semibold text-slate-900">
                      {item.cantidad ?? 0}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-slate-500">Precio</p>
                    <p className="font-semibold text-slate-900">
                      {item.precio ?? 0} €
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-slate-500">Material</p>
                    <p className="font-semibold text-slate-900">
                      {item.material_estampado || '-'}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-slate-500">Tamaño</p>
                    <p className="font-semibold text-slate-900">
                      {item.tipo_estampado || '-'}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-slate-500">Estampación</p>
                    <p className="font-semibold text-slate-900">
                      {item.tipo_estampacion || '-'}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-slate-500">Subtotal</p>
                    <p className="font-bold text-slate-900">
                      {((item.cantidad ?? 0) * (item.precio ?? 0)).toFixed(2)} €
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 rounded-2xl bg-slate-100 p-4">
              <p className="text-sm text-slate-500">Total</p>
              <p className="text-2xl font-bold text-slate-900">
                {totalPresupuesto(selectedPresupuesto).toFixed(2)} €
              </p>
            </div>

            <div className="mt-4 rounded-2xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Observaciones</p>
              <p className="mt-1 whitespace-pre-wrap font-medium text-slate-900">
                {selectedPresupuesto.notas || 'Sin observaciones'}
              </p>
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
                    <th className="px-6 py-4 font-semibold">Productos</th>
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
                        {presupuesto.presupuesto_items.length > 0
                          ? presupuesto.presupuesto_items
                              .map((item) => item.productos?.nombre || 'Producto')
                              .join(', ')
                          : '-'}
                      </td>

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
                        {totalPresupuesto(presupuesto).toFixed(2)} €
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
                                  presupuesto.presupuesto_items
                                    .map(
                                      (item) =>
                                        item.productos?.nombre || 'Producto'
                                    )
                                    .join(', ') || 'Producto',
                                precio: totalPresupuesto(presupuesto),
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