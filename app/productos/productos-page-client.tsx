'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import * as XLSX from 'xlsx'

type Producto = {
  id: string
  nombre: string
  categoria: string | null
  proveedor: string | null
  referencia: string | null
  imagen_url: string | null
  precio_compra: number | null
  precio_venta: number | null
  stock: number | null
  stock_minimo: number | null
}

type FormDataType = {
  nombre: string
  categoria: string
  proveedor: string
  referencia: string
  precio_compra: string
  precio_venta: string
  stock: string
  stock_minimo: string
}

type ToastType = {
  message: string
  type: 'success' | 'error'
} | null

type ProductoImportado = {
  nombre: string
  categoria: string | null
  proveedor: string | null
  referencia: string | null
  imagen_url: string | null
  precio_compra: number
  precio_venta: number
  stock: number
  stock_minimo: number
}

type ProveedorExcel = 'Makito' | 'Raffashop'

const initialFormData: FormDataType = {
  nombre: '',
  categoria: '',
  proveedor: '',
  referencia: '',
  precio_compra: '',
  precio_venta: '',
  stock: '',
  stock_minimo: '',
}

const categoriasDisponibles = [
  'Taza',
  'Botellas',
  'Botellas vino',
  'Pulseras Extremadura',
  'Bolsos',
  'Neceseres',
  'Llaveros',
  'Vinilos sueltos',
  'Camisetas',
  'Sudaderas',
]

const proveedoresDisponibles = ['Shein y Temu', 'Raffashop', 'Makito']

function normalizarTexto(texto: string | null | undefined) {
  return (texto || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

function normalizarCategoria(categoria: string | null | undefined) {
  const valor = normalizarTexto(categoria)

  if (!valor) return ''

  if (valor.includes('taza')) return 'taza'
  if (
    valor.includes('botellas vino') ||
    valor.includes('botella vino') ||
    valor.includes('vino')
  ) {
    return 'botellas vino'
  }
  if (valor.includes('botella')) return 'botellas'
  if (valor.includes('pulsera') && valor.includes('extremadura')) {
    return 'pulseras extremadura'
  }
  if (valor.includes('bolso')) return 'bolsos'
  if (valor.includes('neceser')) return 'neceseres'
  if (valor.includes('llavero')) return 'llaveros'
  if (valor.includes('vinilo') && valor.includes('suelto')) {
    return 'vinilos sueltos'
  }
  if (valor.includes('camiseta')) return 'camisetas'
  if (valor.includes('sudadera')) return 'sudaderas'

  return valor
}

function extraerNumero(valor: unknown): number {
  if (valor === null || valor === undefined || valor === '') return 0
  if (typeof valor === 'number') return valor

  const texto = String(valor)
    .trim()
    .replace(/€/g, '')
    .replace(/\s/g, '')
    .replace(',', '.')

  const match = texto.match(/-?\d+(\.\d+)?/)
  return match ? Number(match[0]) : 0
}

function obtenerString(valor: unknown) {
  return String(valor ?? '').trim()
}

function leerProductosMakito(data: ArrayBuffer): ProductoImportado[] {
  const workbook = XLSX.read(data)
  const sheetName = workbook.SheetNames[0]
  const sheet = workbook.Sheets[sheetName]

  const filas = XLSX.utils.sheet_to_json<(string | number | null)[]>(sheet, {
    header: 1,
    defval: '',
  })

  return filas
    .slice(2)
    .map((fila) => {
      const nombre = obtenerString(fila[0])
      const referencia = obtenerString(fila[1])
      const precioCompra = extraerNumero(fila[3])

      return {
        nombre,
        categoria: null,
        proveedor: 'Makito',
        referencia: referencia || null,
        imagen_url: null,
        precio_compra: precioCompra,
        precio_venta: 0,
        stock: 0,
        stock_minimo: 0,
      }
    })
    .filter((item) => item.nombre && item.nombre.toLowerCase() !== 'producto')
}

function leerProductosRaffashop(data: ArrayBuffer): ProductoImportado[] {
  const workbook = XLSX.read(data)
  const sheetName = workbook.SheetNames[0]
  const sheet = workbook.Sheets[sheetName]

  const filas = XLSX.utils.sheet_to_json<(string | number | null)[]>(sheet, {
    header: 1,
    defval: '',
  })

  const referenciasYaMetidas = new Set<string>()

  const productos = filas
    .map((fila) => {
      const nombre = obtenerString(fila[1]) // columna B
      const referencia = obtenerString(fila[2]) // columna C
      const precioCompra = extraerNumero(fila[3]) // columna D

      return {
        nombre,
        categoria: null,
        proveedor: 'Raffashop',
        referencia: referencia || null,
        imagen_url: null,
        precio_compra: precioCompra,
        precio_venta: 0,
        stock: 0,
        stock_minimo: 0,
      }
    })
    .filter((item) => {
      if (!item.nombre) return false
      if (!item.referencia) return false
      if (!item.precio_compra) return false

      const nombreNormalizado = normalizarTexto(item.nombre)

      if (
        nombreNormalizado.includes('articulos') ||
        nombreNormalizado.includes('artículos') ||
        nombreNormalizado.includes('ropa de alta visibilidad')
      ) {
        return false
      }

      if (referenciasYaMetidas.has(item.referencia)) return false
      referenciasYaMetidas.add(item.referencia)

      return true
    })

  return productos
}

export default function ProductosPageClient() {
  const searchParams = useSearchParams()
  const highlightedId = searchParams.get('id')
  const fileExcelRef = useRef<HTMLInputElement | null>(null)

  const [productos, setProductos] = useState<Producto[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingText, setLoadingText] = useState('Cargando productos...')
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [busqueda, setBusqueda] = useState('')
  const [categoriaFiltro, setCategoriaFiltro] = useState('')
  const [formData, setFormData] = useState<FormDataType>(initialFormData)
  const [proveedorExcel, setProveedorExcel] = useState<ProveedorExcel>('Makito')

  const [toast, setToast] = useState<ToastType>(null)
  const [deleteTarget, setDeleteTarget] = useState<Producto | null>(null)
  const [deleting, setDeleting] = useState(false)

  const [imagenFile, setImagenFile] = useState<File | null>(null)
  const [imagenPreview, setImagenPreview] = useState<string>('')

  async function cargarProductos(showRefreshingMessage = false) {
    setLoading(true)
    setError(null)

    setLoadingText(
      showRefreshingMessage ? 'Actualizando productos...' : 'Cargando productos...'
    )

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

  function mostrarToast(message: string, type: 'success' | 'error') {
    setToast({ message, type })
  }

  useEffect(() => {
    cargarProductos(false)
  }, [])

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 2500)
    return () => clearTimeout(timer)
  }, [toast])

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

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  function abrirNuevoProducto() {
    setEditingId(null)
    setFormData(initialFormData)
    setImagenFile(null)
    setImagenPreview('')
    setShowForm(true)
    setError(null)
  }

  function abrirEdicion(producto: Producto) {
    const categoriaNormalizada = normalizarCategoria(producto.categoria)

    const categoriaFormulario =
      categoriasDisponibles.find(
        (cat) => normalizarCategoria(cat) === categoriaNormalizada
      ) || ''

    setEditingId(producto.id)
    setFormData({
      nombre: producto.nombre || '',
      categoria: categoriaFormulario,
      proveedor: producto.proveedor || '',
      referencia: producto.referencia || '',
      precio_compra:
        producto.precio_compra !== null ? String(producto.precio_compra) : '',
      precio_venta:
        producto.precio_venta !== null ? String(producto.precio_venta) : '',
      stock: producto.stock !== null ? String(producto.stock) : '',
      stock_minimo:
        producto.stock_minimo !== null ? String(producto.stock_minimo) : '',
    })
    setImagenFile(null)
    setImagenPreview(producto.imagen_url || '')
    setShowForm(true)
    setError(null)
  }

  function cerrarFormulario() {
    setShowForm(false)
    setEditingId(null)
    setFormData(initialFormData)
    setImagenFile(null)
    setImagenPreview('')
  }

  function limpiarFiltros() {
    setBusqueda('')
    setCategoriaFiltro('')
  }

  function handleImagenChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setImagenFile(file)
    setImagenPreview(URL.createObjectURL(file))
  }

  async function subirImagen(file: File) {
    const extension = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}.${extension}`

    const filePath = `productos/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('productos')
      .upload(filePath, file, {
        upsert: false,
      })

    if (uploadError) {
      throw new Error(uploadError.message)
    }

    const { data } = supabase.storage.from('productos').getPublicUrl(filePath)

    return data.publicUrl
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    try {
      let imagenUrl = imagenPreview || null

      if (imagenFile) {
        imagenUrl = await subirImagen(imagenFile)
      }

      const payload = {
        nombre: formData.nombre.trim(),
        categoria: formData.categoria.trim() || null,
        proveedor: formData.proveedor.trim() || null,
        referencia: formData.referencia.trim() || null,
        imagen_url: imagenUrl,
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
      const isEditing = Boolean(editingId)

      if (editingId) {
        result = await supabase
          .from('productos')
          .update(payload)
          .eq('id', editingId)
      } else {
        result = await supabase.from('productos').insert([payload])
      }

      if (result.error) {
        throw new Error(result.error.message)
      }

      cerrarFormulario()
      await cargarProductos(true)

      mostrarToast(
        isEditing
          ? 'Producto actualizado correctamente.'
          : 'Producto guardado correctamente.',
        'success'
      )
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Error al guardar el producto.'
      setError(message)
      mostrarToast('Ha ocurrido un error al guardar el producto.', 'error')
    } finally {
      setSaving(false)
    }
  }

  function pedirConfirmacionBorrado(producto: Producto) {
    setDeleteTarget(producto)
  }

  function cerrarModalBorrado() {
    if (deleting) return
    setDeleteTarget(null)
  }

  async function confirmarBorrado() {
    if (!deleteTarget) return

    setDeleting(true)
    setError(null)

    const { error } = await supabase
      .from('productos')
      .delete()
      .eq('id', deleteTarget.id)

    if (error) {
      setError(error.message)
      mostrarToast('No se pudo borrar el producto.', 'error')
      setDeleting(false)
      return
    }

    const nombreBorrado = deleteTarget.nombre
    setDeleteTarget(null)
    setDeleting(false)

    await cargarProductos(true)
    mostrarToast(`Producto "${nombreBorrado}" borrado correctamente.`, 'success')
  }

  async function importarExcel(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setLoading(true)
      setError(null)
      setLoadingText('Importando productos desde Excel...')

      const data = await file.arrayBuffer()

      let productosParaInsertar: ProductoImportado[] = []

      if (proveedorExcel === 'Makito') {
        productosParaInsertar = leerProductosMakito(data)
      }

      if (proveedorExcel === 'Raffashop') {
        productosParaInsertar = leerProductosRaffashop(data)
      }

      if (productosParaInsertar.length === 0) {
        throw new Error('El Excel no contiene productos válidos.')
      }

      const { error } = await supabase
        .from('productos')
        .insert(productosParaInsertar)

      if (error) {
        throw new Error(error.message)
      }

      await cargarProductos(true)
      mostrarToast(
        `${productosParaInsertar.length} productos importados correctamente.`,
        'success'
      )
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Error al importar el Excel.'
      setError(message)
      mostrarToast('No se pudo importar el Excel.', 'error')
    } finally {
      setLoading(false)
      if (fileExcelRef.current) {
        fileExcelRef.current.value = ''
      }
    }
  }

  const productosFiltrados = useMemo(() => {
    const texto = normalizarTexto(busqueda)
    const categoriaSeleccionada = normalizarCategoria(categoriaFiltro)

    return productos.filter((producto) => {
      const nombre = normalizarTexto(producto.nombre)
      const categoriaOriginal = normalizarTexto(producto.categoria)
      const categoriaNormalizada = normalizarCategoria(producto.categoria)
      const proveedor = normalizarTexto(producto.proveedor)
      const referencia = normalizarTexto(producto.referencia)

      const coincideBusqueda =
        !texto ||
        nombre.includes(texto) ||
        categoriaOriginal.includes(texto) ||
        proveedor.includes(texto) ||
        referencia.includes(texto)

      const coincideCategoria =
        !categoriaSeleccionada || categoriaNormalizada === categoriaSeleccionada

      return coincideBusqueda && coincideCategoria
    })
  }, [busqueda, categoriaFiltro, productos])

  return (
    <main className="min-h-screen bg-slate-50 p-6 md:p-10">
      <div className="mx-auto max-w-7xl">
        {toast && (
          <div className="fixed right-4 top-4 z-50">
            <div
              className={`rounded-2xl border px-4 py-3 text-sm font-medium shadow-lg ${
                toast.type === 'success'
                  ? 'border-green-200 bg-green-50 text-green-700'
                  : 'border-red-200 bg-red-50 text-red-700'
              }`}
            >
              {toast.message}
            </div>
          </div>
        )}

        {deleteTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl">
              <h3 className="text-xl font-bold text-slate-900">
                Confirmar borrado
              </h3>
              <p className="mt-3 text-slate-600">
                ¿Seguro que quieres borrar el producto{' '}
                <span className="font-semibold text-slate-900">
                  "{deleteTarget.nombre}"
                </span>
                ?
              </p>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={cerrarModalBorrado}
                  disabled={deleting}
                  className="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancelar
                </button>

                <button
                  onClick={confirmarBorrado}
                  disabled={deleting}
                  className="rounded-2xl bg-red-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
                >
                  {deleting ? 'Borrando...' : 'Sí, borrar'}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Vinalux</p>
            <h1 className="text-3xl font-bold text-slate-900">Productos</h1>
            <p className="mt-1 text-slate-500">
              Gestiona tu catálogo de productos personalizados.
            </p>
          </div>

          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <input
              ref={fileExcelRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={importarExcel}
              className="hidden"
            />

            <select
              value={proveedorExcel}
              onChange={(e) =>
                setProveedorExcel(e.target.value as ProveedorExcel)
              }
              className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            >
              <option value="Makito">Makito</option>
              <option value="Raffashop">Raffashop</option>
            </select>

            <button
              type="button"
              onClick={() => fileExcelRef.current?.click()}
              className="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Importar Excel
            </button>

            <button
              onClick={abrirNuevoProducto}
              className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:scale-[1.01] hover:bg-slate-800"
            >
              + Nuevo producto
            </button>
          </div>
        </div>

        <div className="mb-6 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Filtrar por categoría
              </label>
              <select
                value={categoriaFiltro}
                onChange={(e) => setCategoriaFiltro(e.target.value)}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-black outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              >
                <option value="">Todas las categorías</option>
                {categoriasDisponibles.map((categoria) => (
                  <option key={categoria} value={categoria}>
                    {categoria}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Buscar producto
              </label>
              <input
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar por nombre, categoría, proveedor o referencia..."
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-black outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              />
            </div>

            <div className="flex flex-col justify-end">
              <button
                onClick={limpiarFiltros}
                type="button"
                className="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Limpiar filtros
              </button>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
            <span className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-700">
              Total: {productos.length}
            </span>
            <span className="rounded-full bg-slate-900 px-3 py-1 font-medium text-white">
              Mostrando: {productosFiltrados.length}
            </span>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        {showForm && (
          <div className="mb-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm ring-1 ring-slate-100">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-slate-900">
                {editingId ? 'Editar producto' : 'Nuevo producto'}
              </h2>
              <button
                onClick={cerrarFormulario}
                className="rounded-xl px-3 py-2 text-sm text-slate-500 transition hover:bg-slate-100"
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
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-black outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                  placeholder="Ej. Taza personalizada"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Categoría
                </label>
                <select
                  name="categoria"
                  value={formData.categoria}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-black outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                >
                  <option value="">Selecciona una categoría</option>
                  {categoriasDisponibles.map((categoria) => (
                    <option key={categoria} value={categoria}>
                      {categoria}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Proveedor
                </label>
                <select
                  name="proveedor"
                  value={formData.proveedor}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-black outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                >
                  <option value="">Selecciona un proveedor</option>
                  {proveedoresDisponibles.map((proveedor) => (
                    <option key={proveedor} value={proveedor}>
                      {proveedor}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Referencia
                </label>
                <input
                  name="referencia"
                  value={formData.referencia}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-black outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                  placeholder="Ej. SH-2458"
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
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-black outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
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
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-black outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
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
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-black outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
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
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-black outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                  placeholder="Ej. 2"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Foto del producto
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImagenChange}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-black"
                />

                {imagenPreview && (
                  <div className="mt-4">
                    <img
                      src={imagenPreview}
                      alt="Vista previa"
                      className="h-40 w-40 rounded-2xl object-cover border border-slate-200"
                    />
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-2 md:col-span-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:scale-[1.01] hover:bg-slate-800 disabled:opacity-50"
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
          <div className="rounded-3xl border border-slate-200 bg-white p-10 shadow-sm">
            <div className="flex flex-col items-center justify-center gap-4 text-center">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-slate-800" />
              <div>
                <p className="text-base font-semibold text-slate-900">
                  {loadingText}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Espera un momento mientras cargamos la información.
                </p>
              </div>
            </div>
          </div>
        )}

        {!loading && productosFiltrados.length === 0 && !error && (
          <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">
              No hay productos que coincidan
            </h2>
            <p className="mt-2 text-slate-500">
              Prueba con otra búsqueda o ajusta los filtros.
            </p>
          </div>
        )}

        {!loading && productosFiltrados.length > 0 && (
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left">
                <thead className="bg-slate-100 text-sm text-slate-600">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Foto</th>
                    <th className="px-6 py-4 font-semibold">Nombre</th>
                    <th className="px-6 py-4 font-semibold">Categoría</th>
                    <th className="px-6 py-4 font-semibold">Proveedor</th>
                    <th className="px-6 py-4 font-semibold">Referencia</th>
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
                      <td className="px-6 py-4">
                        {producto.imagen_url ? (
                          <img
                            src={producto.imagen_url}
                            alt={producto.nombre}
                            className="h-14 w-14 rounded-xl object-cover border border-slate-200"
                          />
                        ) : (
                          <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-slate-200 bg-slate-100 text-xs text-slate-400">
                            Sin foto
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-900">
                        {producto.nombre || '-'}
                      </td>
                      <td className="px-6 py-4">{producto.categoria || '-'}</td>
                      <td className="px-6 py-4">{producto.proveedor || '-'}</td>
                      <td className="px-6 py-4">{producto.referencia || '-'}</td>
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
                            className="rounded-xl bg-amber-100 px-3 py-2 text-xs font-semibold text-amber-700 transition hover:bg-amber-200"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => pedirConfirmacionBorrado(producto)}
                            className="rounded-xl bg-red-100 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-200"
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