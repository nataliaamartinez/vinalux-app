'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type Producto = {
  id: string
  nombre: string
  categoria: string | null
  proveedor: string | null
  precio_compra: number | null
  precio_venta: number | null
  stock: number | null
  stock_minimo: number | null
}

type FormDataType = {
  nombre: string
  categoria: string
  proveedor: string
  precio_compra: string
  precio_venta: string
  stock: string
  stock_minimo: string
}

const initialFormData: FormDataType = {
  nombre: '',
  categoria: '',
  proveedor: '',
  precio_compra: '',
  precio_venta: '',
  stock: '',
  stock_minimo: '',
}

export default function Home() {
  const searchParams = useSearchParams()
  const highlightedId = searchParams.get('id')

  const [productos, setProductos] = useState<Producto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [busqueda, setBusqueda] = useState('')

  const [formData, setFormData] = useState<FormDataType>(initialFormData)

  async function cargarProductos() {
    setLoading(true)
    setError(null)

    const { data, error } = await supabase
      .from('productos')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      setError(error.message)
      setProductos([])
    } else {
      setProductos((data as Producto[]) || [])
    }

    setLoading(false)
  }

  useEffect(() => {
    cargarProductos()
  }, [])

  useEffect(() => {
    if (!highlightedId) return

    const timer = setTimeout(() => {
      const element = document.getElementById(`producto-${highlightedId}`)
      element?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 300)

    return () => clearTimeout(timer)
  }, [highlightedId, productos])

  useEffect(() => {
    if (!highlightedId || productos.length === 0) return

    const producto = productos.find((item) => item.id === highlightedId)
    if (!producto) return

    abrirEdicion(producto)
  }, [highlightedId, productos])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  function abrirNuevoProducto() {
    setEditingId(null)
    setFormData(initialFormData)
    setShowForm(true)
    setError(null)
  }

  function abrirEdicion(producto: Producto) {
    setEditingId(producto.id)
    setFormData({
      nombre: producto.nombre || '',
      categoria: producto.categoria || '',
      proveedor: producto.proveedor || '',
      precio_compra:
        producto.precio_compra !== null ? String(producto.precio_compra) : '',
      precio_venta:
        producto.precio_venta !== null ? String(producto.precio_venta) : '',
      stock: producto.stock !== null ? String(producto.stock) : '',
      stock_minimo:
        producto.stock_minimo !== null ? String(producto.stock_minimo) : '',
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
      nombre: formData.nombre,
      categoria: formData.categoria || null,
      proveedor: formData.proveedor || null,
      precio_compra: formData.precio_compra
        ? Number(formData.precio_compra)
        : 0,
      precio_venta: formData.precio_venta ? Number(formData.precio_venta) : 0,
      stock: formData.stock ? Number(formData.stock) : 0,
      stock_minimo: formData.stock_minimo
        ? Number(formData.stock_minimo)
        : 0,
    }

    let result

    if (editingId) {
      result = await supabase
        .from('productos')
        .update(payload)
        .eq('id', editingId)
    } else {
      result = await supabase.from('productos').insert([payload])
    }

    if (result.error) {
      setError(result.error.message)
      setSaving(false)
      return
    }

    cerrarFormulario()
    setSaving(false)
    await cargarProductos()
  }

  async function borrarProducto(id: string, nombre: string) {
    const confirmado = window.confirm(
      `¿Seguro que quieres borrar el producto "${nombre}"?`
    )

    if (!confirmado) return

    setError(null)

    const { error } = await supabase.from('productos').delete().eq('id', id)

    if (error) {
      setError(error.message)
      return
    }

    await cargarProductos()
  }

  const productosFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase()

    if (!texto) return productos

    return productos.filter((producto) => {
      const nombre = producto.nombre?.toLowerCase() || ''
      const categoria = producto.categoria?.toLowerCase() || ''
      const proveedor = producto.proveedor?.toLowerCase() || ''

      return (
        nombre.includes(texto) ||
        categoria.includes(texto) ||
        proveedor.includes(texto)
      )
    })
  }, [busqueda, productos])

  return (
    <main className="min-h-screen bg-slate-50 p-6 md:p-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Vinalux</p>
            <h1 className="text-3xl font-bold text-slate-900">Productos</h1>
            <p className="mt-1 text-slate-500">
              Gestiona tu catálogo de productos personalizados.
            </p>
          </div>

          <button
            onClick={abrirNuevoProducto}
            className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
          >
            + Nuevo producto
          </button>
        </div>

        <div className="mb-6 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Buscar producto
          </label>
          <input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre, categoría o proveedor..."
            className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-black outline-none focus:border-slate-500"
          />
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
                {editingId ? 'Editar producto' : 'Nuevo producto'}
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
                  Nombre
                </label>
                <input
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  required
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-black outline-none focus:border-slate-500"
                  placeholder="Ej. Taza personalizada"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Categoría
                </label>
                <input
                  name="categoria"
                  value={formData.categoria}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-black outline-none focus:border-slate-500"
                  placeholder="Ej. Tazas"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Proveedor
                </label>
                <input
                  name="proveedor"
                  value={formData.proveedor}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-black outline-none focus:border-slate-500"
                  placeholder="Ej. Proveedor A"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Precio compra
                </label>
                <input
                  name="precio_compra"
                  type="number"
                  step="0.01"
                  value={formData.precio_compra}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-black outline-none focus:border-slate-500"
                  placeholder="Ej. 3.50"
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
                  placeholder="Ej. 12.00"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Stock
                </label>
                <input
                  name="stock"
                  type="number"
                  value={formData.stock}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-black outline-none focus:border-slate-500"
                  placeholder="Ej. 10"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Stock mínimo
                </label>
                <input
                  name="stock_minimo"
                  type="number"
                  value={formData.stock_minimo}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-black outline-none focus:border-slate-500"
                  placeholder="Ej. 2"
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
                    : 'Guardar producto'}
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

        {loading && (
          <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <p className="text-slate-500">Cargando productos...</p>
          </div>
        )}

        {!loading && productosFiltrados.length === 0 && !error && (
          <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">
              No hay productos que coincidan
            </h2>
            <p className="mt-2 text-slate-500">
              Prueba con otra búsqueda o añade un nuevo producto.
            </p>
          </div>
        )}

        {!loading && productosFiltrados.length > 0 && (
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left">
                <thead className="bg-slate-100 text-sm text-slate-600">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Nombre</th>
                    <th className="px-6 py-4 font-semibold">Categoría</th>
                    <th className="px-6 py-4 font-semibold">Proveedor</th>
                    <th className="px-6 py-4 font-semibold">Precio compra</th>
                    <th className="px-6 py-4 font-semibold">Precio venta</th>
                    <th className="px-6 py-4 font-semibold">Stock</th>
                    <th className="px-6 py-4 font-semibold">Stock mínimo</th>
                    <th className="px-6 py-4 font-semibold">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                  {productosFiltrados.map((producto) => (
                    <tr
                      key={producto.id}
                      id={`producto-${producto.id}`}
                      className={`hover:bg-slate-50 ${
                        highlightedId === producto.id ? 'bg-yellow-100' : ''
                      }`}
                    >
                      <td className="px-6 py-4 font-medium text-slate-900">
                        {producto.nombre || '-'}
                      </td>
                      <td className="px-6 py-4">{producto.categoria || '-'}</td>
                      <td className="px-6 py-4">{producto.proveedor || '-'}</td>
                      <td className="px-6 py-4">
                        {producto.precio_compra ?? 0} €
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-900">
                        {producto.precio_venta ?? 0} €
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            (producto.stock ?? 0) <=
                            (producto.stock_minimo ?? 0)
                              ? 'bg-red-100 text-red-700'
                              : 'bg-green-100 text-green-700'
                          }`}
                        >
                          {producto.stock ?? 0}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {producto.stock_minimo ?? 0}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => abrirEdicion(producto)}
                            className="rounded-xl bg-amber-100 px-3 py-2 text-xs font-semibold text-amber-700 hover:bg-amber-200"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() =>
                              borrarProducto(producto.id, producto.nombre)
                            }
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