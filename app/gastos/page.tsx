'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import {
  Receipt,
  Plus,
  Search,
  CalendarDays,
  TrendingDown,
  Wallet,
  Trash2,
  Pencil,
  X,
} from 'lucide-react'

type Gasto = {
  id: string
  concepto: string | null
  categoria: string | null
  importe: number | null
  estado: string | null
  fecha: string | null
  proveedor: string | null
  metodo_pago: string | null
  created_at: string | null
}

type FormDataType = {
  concepto: string
  categoria: string
  importe: string
  estado: string
  fecha: string
  proveedor: string
  metodo_pago: string
}

const initialFormData: FormDataType = {
  concepto: '',
  categoria: '',
  importe: '',
  estado: 'completado',
  fecha: new Date().toISOString().split('T')[0],
  proveedor: '',
  metodo_pago: '',
}

export default function GastosPage() {
  const [gastos, setGastos] = useState<Gasto[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [selectedGasto, setSelectedGasto] = useState<Gasto | null>(null)

  const [busqueda, setBusqueda] = useState('')
  const [mesSeleccionado, setMesSeleccionado] = useState('todos')
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('todas')

  const [formData, setFormData] = useState<FormDataType>(initialFormData)

  async function cargarGastos() {
    setLoading(true)
    setError(null)

    const { data, error } = await supabase
      .from('gastos')
      .select(
        `
        id,
        concepto,
        categoria,
        importe,
        estado,
        fecha,
        proveedor,
        metodo_pago,
        created_at
      `
      )
      .order('fecha', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setGastos((data as Gasto[]) || [])
    setLoading(false)
  }

  useEffect(() => {
    cargarGastos()
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

  function abrirNuevoGasto() {
    setEditingId(null)
    setFormData({
      ...initialFormData,
      fecha: new Date().toISOString().split('T')[0],
    })
    setShowForm(true)
    setError(null)
  }

  function abrirEdicion(gasto: Gasto) {
    setEditingId(gasto.id)
    setFormData({
      concepto: gasto.concepto || '',
      categoria: gasto.categoria || '',
      importe: gasto.importe !== null ? String(gasto.importe) : '',
      estado: gasto.estado || 'completado',
      fecha: gasto.fecha || new Date().toISOString().split('T')[0],
      proveedor: gasto.proveedor || '',
      metodo_pago: gasto.metodo_pago || '',
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

    const importeNumero = formData.importe ? Number(formData.importe) : 0

    if (!formData.concepto.trim()) {
      setError('El concepto es obligatorio.')
      setSaving(false)
      return
    }

    if (importeNumero <= 0) {
      setError('El importe debe ser mayor que 0.')
      setSaving(false)
      return
    }

    const payload = {
      concepto: formData.concepto.trim(),
      categoria: formData.categoria.trim() || null,
      importe: importeNumero,
      estado: formData.estado || 'completado',
      fecha: formData.fecha || new Date().toISOString().split('T')[0],
      proveedor: formData.proveedor.trim() || null,
      metodo_pago: formData.metodo_pago.trim() || null,
    }

    if (!editingId) {
      const { error } = await supabase.from('gastos').insert([payload])

      if (error) {
        setError(error.message)
        setSaving(false)
        return
      }
    } else {
      const { error } = await supabase
        .from('gastos')
        .update(payload)
        .eq('id', editingId)

      if (error) {
        setError(error.message)
        setSaving(false)
        return
      }
    }

    cerrarFormulario()
    setSaving(false)
    await cargarGastos()
  }

  async function borrarGasto(id: string) {
    const confirmado = window.confirm('¿Seguro que quieres borrar este gasto?')
    if (!confirmado) return

    const { error } = await supabase.from('gastos').delete().eq('id', id)

    if (error) {
      setError(error.message)
      return
    }

    if (selectedGasto?.id === id) {
      setSelectedGasto(null)
    }

    await cargarGastos()
  }

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

  function obtenerClaveMes(fecha: string | null) {
    if (!fecha) return 'sin-fecha'
    const date = new Date(fecha)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    return `${year}-${month}`
  }

  function obtenerNombreMes(clave: string) {
    if (clave === 'sin-fecha') return 'Sin fecha'
    const [year, month] = clave.split('-')
    const date = new Date(Number(year), Number(month) - 1, 1)
    return date.toLocaleDateString('es-ES', {
      month: 'long',
      year: 'numeric',
    })
  }

  function colorEstado(estado: string | null) {
    if (estado === 'completado') return 'bg-emerald-100 text-emerald-700'
    if (estado === 'pendiente') return 'bg-yellow-100 text-yellow-700'
    if (estado === 'anulado') return 'bg-slate-200 text-slate-700'
    return 'bg-slate-100 text-slate-600'
  }

  const opcionesMes = useMemo(() => {
    const claves = Array.from(
      new Set(gastos.map((gasto) => obtenerClaveMes(gasto.fecha)))
    ).sort((a, b) => (a < b ? 1 : -1))

    return claves.map((clave) => ({
      value: clave,
      label: obtenerNombreMes(clave),
    }))
  }, [gastos])

  const opcionesCategoria = useMemo(() => {
    const categorias = Array.from(
      new Set(gastos.map((gasto) => gasto.categoria).filter(Boolean))
    ).sort()

    return categorias as string[]
  }, [gastos])

  const gastosFiltrados = useMemo(() => {
    return gastos.filter((gasto) => {
      const coincideMes =
        mesSeleccionado === 'todos'
          ? true
          : obtenerClaveMes(gasto.fecha) === mesSeleccionado

      const coincideCategoria =
        categoriaSeleccionada === 'todas'
          ? true
          : (gasto.categoria || '') === categoriaSeleccionada

      const textoBusqueda = busqueda.trim().toLowerCase()

      const coincideBusqueda =
        textoBusqueda === ''
          ? true
          : [gasto.concepto, gasto.categoria, gasto.proveedor, gasto.metodo_pago, gasto.estado]
              .filter(Boolean)
              .some((valor) =>
                String(valor).toLowerCase().includes(textoBusqueda)
              )

      return coincideMes && coincideCategoria && coincideBusqueda
    })
  }, [gastos, mesSeleccionado, categoriaSeleccionada, busqueda])

  const resumen = useMemo(() => {
    const totalGastos = gastosFiltrados.reduce((acc, gasto) => {
      return acc + (gasto.importe ?? 0)
    }, 0)

    const totalCompletados = gastosFiltrados.filter(
      (gasto) => gasto.estado === 'completado'
    ).length

    const totalPendientes = gastosFiltrados.filter(
      (gasto) => gasto.estado === 'pendiente'
    ).length

    return {
      totalMovimientos: gastosFiltrados.length,
      totalGastos,
      totalCompletados,
      totalPendientes,
    }
  }, [gastosFiltrados])

  return (
    <main className="min-h-screen bg-slate-50 p-6 md:p-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Vinalux</p>
            <h1 className="text-3xl font-bold text-slate-900">Gastos</h1>
            <p className="mt-1 text-slate-500">
              Registra y controla todos los gastos del negocio.
            </p>
          </div>

          <button
            onClick={abrirNuevoGasto}
            className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
          >
            <Plus className="h-4 w-4" />
            Nuevo gasto
          </button>
        </div>

        <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-red-100 p-3">
                <TrendingDown className="h-5 w-5 text-red-700" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Total gastos</p>
                <p className="mt-2 text-3xl font-bold text-red-600">
                  {formatearEuros(resumen.totalGastos)}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-sky-100 p-3">
                <Receipt className="h-5 w-5 text-sky-700" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Movimientos</p>
                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {resumen.totalMovimientos}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-emerald-100 p-3">
                <Wallet className="h-5 w-5 text-emerald-700" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Completados</p>
                <p className="mt-2 text-3xl font-bold text-emerald-600">
                  {resumen.totalCompletados}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-yellow-100 p-3">
                <CalendarDays className="h-5 w-5 text-yellow-700" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Pendientes</p>
                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {resumen.totalPendientes}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Buscar
              </label>
              <div className="flex items-center gap-2 rounded-2xl border border-slate-300 bg-white px-4 py-3">
                <Search className="h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  placeholder="Concepto, categoría, proveedor..."
                  className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Mes
              </label>
              <select
                value={mesSeleccionado}
                onChange={(e) => setMesSeleccionado(e.target.value)}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none"
              >
                <option value="todos">Todos los meses</option>
                {opcionesMes.map((opcion) => (
                  <option key={opcion.value} value={opcion.value}>
                    {opcion.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Categoría
              </label>
              <select
                value={categoriaSeleccionada}
                onChange={(e) => setCategoriaSeleccionada(e.target.value)}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none"
              >
                <option value="todas">Todas</option>
                {opcionesCategoria.map((categoria) => (
                  <option key={categoria} value={categoria}>
                    {categoria}
                  </option>
                ))}
              </select>
            </div>
          </div>
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
                {editingId ? 'Editar gasto' : 'Nuevo gasto'}
              </h2>
              <button
                onClick={cerrarFormulario}
                className="rounded-xl px-3 py-2 text-sm text-slate-500 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Concepto
                </label>
                <input
                  name="concepto"
                  value={formData.concepto}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-black outline-none focus:border-slate-500"
                  placeholder="Ej. Compra de material"
                  required
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
                  placeholder="Ej. Material, envío, herramientas..."
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Importe
                </label>
                <input
                  name="importe"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.importe}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-black outline-none focus:border-slate-500"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Fecha
                </label>
                <input
                  name="fecha"
                  type="date"
                  value={formData.fecha}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-black outline-none focus:border-slate-500"
                  required
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
                  <option value="completado">Completado</option>
                  <option value="pendiente">Pendiente</option>
                  <option value="anulado">Anulado</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Método de pago
                </label>
                <select
                  name="metodo_pago"
                  value={formData.metodo_pago}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-black outline-none focus:border-slate-500"
                >
                  <option value="">Selecciona un método</option>
                  <option value="efectivo">Efectivo</option>
                  <option value="tarjeta">Tarjeta</option>
                  <option value="transferencia">Transferencia</option>
                  <option value="bizum">Bizum</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Proveedor
                </label>
                <input
                  name="proveedor"
                  value={formData.proveedor}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-black outline-none focus:border-slate-500"
                  placeholder="Nombre del proveedor"
                />
              </div>

              <div className="rounded-2xl bg-slate-50 p-4 md:col-span-2">
                <p className="text-sm text-slate-500">Importe del gasto</p>
                <p className="mt-1 text-2xl font-bold text-red-600">
                  {formatearEuros(Number(formData.importe) || 0)}
                </p>
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
                    : 'Guardar gasto'}
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

        {selectedGasto && (
          <div className="mb-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-slate-900">
                Detalle del gasto
              </h2>
              <button
                onClick={() => setSelectedGasto(null)}
                className="rounded-xl px-3 py-2 text-sm text-slate-500 hover:bg-slate-100"
              >
                Cerrar
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Concepto</p>
                <p className="mt-1 font-semibold text-slate-900">
                  {selectedGasto.concepto || '-'}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Categoría</p>
                <p className="mt-1 font-semibold text-slate-900">
                  {selectedGasto.categoria || '-'}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Importe</p>
                <p className="mt-1 font-semibold text-red-600">
                  {formatearEuros(selectedGasto.importe ?? 0)}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Fecha</p>
                <p className="mt-1 font-semibold text-slate-900">
                  {formatearFecha(selectedGasto.fecha)}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Estado</p>
                <span
                  className={`mt-1 inline-block rounded-full px-3 py-1 text-xs font-semibold ${colorEstado(
                    selectedGasto.estado
                  )}`}
                >
                  {selectedGasto.estado || '-'}
                </span>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Método de pago</p>
                <p className="mt-1 font-semibold text-slate-900">
                  {selectedGasto.metodo_pago || '-'}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4 md:col-span-2">
                <p className="text-sm text-slate-500">Proveedor</p>
                <p className="mt-1 font-semibold text-slate-900">
                  {selectedGasto.proveedor || '-'}
                </p>
              </div>
            </div>
          </div>
        )}

        {loading && (
          <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <p className="text-slate-500">Cargando gastos...</p>
          </div>
        )}

        {!loading && gastosFiltrados.length === 0 && !error && (
          <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">
              No hay gastos
            </h2>
            <p className="mt-2 text-slate-500">
              Prueba con otros filtros o añade un nuevo gasto.
            </p>
          </div>
        )}

        {!loading && gastosFiltrados.length > 0 && (
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left">
                <thead className="bg-slate-100 text-sm text-slate-600">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Concepto</th>
                    <th className="px-6 py-4 font-semibold">Categoría</th>
                    <th className="px-6 py-4 font-semibold">Proveedor</th>
                    <th className="px-6 py-4 font-semibold">Fecha</th>
                    <th className="px-6 py-4 font-semibold">Estado</th>
                    <th className="px-6 py-4 font-semibold">Método pago</th>
                    <th className="px-6 py-4 font-semibold">Importe</th>
                    <th className="px-6 py-4 font-semibold">Acciones</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                  {gastosFiltrados.map((gasto) => (
                    <tr key={gasto.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 font-medium text-slate-900">
                        {gasto.concepto || '-'}
                      </td>
                      <td className="px-6 py-4">{gasto.categoria || '-'}</td>
                      <td className="px-6 py-4">{gasto.proveedor || '-'}</td>
                      <td className="px-6 py-4">{formatearFecha(gasto.fecha)}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${colorEstado(
                            gasto.estado
                          )}`}
                        >
                          {gasto.estado || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4">{gasto.metodo_pago || '-'}</td>
                      <td className="px-6 py-4 font-semibold text-red-600">
                        {formatearEuros(gasto.importe ?? 0)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => setSelectedGasto(gasto)}
                            className="rounded-xl bg-blue-100 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-200"
                          >
                            Ver
                          </button>
                          <button
                            onClick={() => abrirEdicion(gasto)}
                            className="inline-flex items-center gap-1 rounded-xl bg-amber-100 px-3 py-2 text-xs font-semibold text-amber-700 hover:bg-amber-200"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            Editar
                          </button>
                          <button
                            onClick={() => borrarGasto(gasto.id)}
                            className="inline-flex items-center gap-1 rounded-xl bg-red-100 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-200"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
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