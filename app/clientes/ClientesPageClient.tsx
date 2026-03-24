'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type Cliente = {
  id: string
  nombre: string
  telefono: string | null
  email: string | null
  direccion: string | null
}

type FormDataType = {
  nombre: string
  telefono: string
  email: string
  direccion: string
}

const initialFormData: FormDataType = {
  nombre: '',
  telefono: '',
  email: '',
  direccion: '',
}

export default function ClientesPageClient() {
  const searchParams = useSearchParams()
  const highlightedId = searchParams.get('id')

  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const [formData, setFormData] = useState<FormDataType>(initialFormData)

  async function cargarClientes() {
    setLoading(true)
    setError(null)

    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      setError(error.message)
      setClientes([])
    } else {
      setClientes((data as Cliente[]) || [])
    }

    setLoading(false)
  }

  useEffect(() => {
    cargarClientes()
  }, [])

  useEffect(() => {
    if (!highlightedId) return

    const timer = setTimeout(() => {
      const element = document.getElementById(`cliente-${highlightedId}`)
      element?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 300)

    return () => clearTimeout(timer)
  }, [highlightedId, clientes])

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  function abrirNuevoCliente() {
    setEditingId(null)
    setFormData(initialFormData)
    setShowForm(true)
    setError(null)
  }

  function abrirEdicion(cliente: Cliente) {
    setEditingId(cliente.id)
    setFormData({
      nombre: cliente.nombre || '',
      telefono: cliente.telefono || '',
      email: cliente.email || '',
      direccion: cliente.direccion || '',
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
      telefono: formData.telefono || null,
      email: formData.email || null,
      direccion: formData.direccion || null,
    }

    let result

    if (editingId) {
      result = await supabase.from('clientes').update(payload).eq('id', editingId)
    } else {
      result = await supabase.from('clientes').insert([payload])
    }

    if (result.error) {
      setError(result.error.message)
      setSaving(false)
      return
    }

    cerrarFormulario()
    setSaving(false)
    await cargarClientes()
  }

  async function borrarCliente(id: string, nombre: string) {
    const confirmado = window.confirm(
      `¿Seguro que quieres borrar al cliente "${nombre}"?`
    )

    if (!confirmado) return

    setError(null)

    const { error } = await supabase.from('clientes').delete().eq('id', id)

    if (error) {
      setError(error.message)
      return
    }

    await cargarClientes()
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6 md:p-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Vinalux</p>
            <h1 className="text-3xl font-bold text-slate-900">Clientes</h1>
            <p className="mt-1 text-slate-500">
              Gestiona tu base de datos de clientes.
            </p>
          </div>

          <button
            onClick={abrirNuevoCliente}
            className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
          >
            + Nuevo cliente
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
                {editingId ? 'Editar cliente' : 'Nuevo cliente'}
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
                  placeholder="Ej. Marta Ruiz"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Teléfono
                </label>
                <input
                  name="telefono"
                  value={formData.telefono}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-black outline-none focus:border-slate-500"
                  placeholder="Ej. 600123456"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Email
                </label>
                <input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-black outline-none focus:border-slate-500"
                  placeholder="Ej. cliente@email.com"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Dirección
                </label>
                <input
                  name="direccion"
                  value={formData.direccion}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-black outline-none focus:border-slate-500"
                  placeholder="Ej. Calle Mayor 10"
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
                      : 'Guardar cliente'}
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
            <p className="text-slate-500">Cargando clientes...</p>
          </div>
        )}

        {!loading && clientes.length === 0 && !error && (
          <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">
              No hay clientes todavía
            </h2>
            <p className="mt-2 text-slate-500">
              Añade tu primer cliente desde el botón superior.
            </p>
          </div>
        )}

        {!loading && clientes.length > 0 && (
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left">
                <thead className="bg-slate-100 text-sm text-slate-600">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Nombre</th>
                    <th className="px-6 py-4 font-semibold">Teléfono</th>
                    <th className="px-6 py-4 font-semibold">Email</th>
                    <th className="px-6 py-4 font-semibold">Dirección</th>
                    <th className="px-6 py-4 font-semibold">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                  {clientes.map((cliente) => (
                    <tr
                      key={cliente.id}
                      id={`cliente-${cliente.id}`}
                      className={`hover:bg-slate-50 ${
                        highlightedId === cliente.id ? 'bg-yellow-100' : ''
                      }`}
                    >
                      <td className="px-6 py-4 font-medium text-slate-900">
                        {cliente.nombre || '-'}
                      </td>
                      <td className="px-6 py-4">{cliente.telefono || '-'}</td>
                      <td className="px-6 py-4">{cliente.email || '-'}</td>
                      <td className="px-6 py-4">{cliente.direccion || '-'}</td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => abrirEdicion(cliente)}
                            className="rounded-xl bg-amber-100 px-3 py-2 text-xs font-semibold text-amber-700 hover:bg-amber-200"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() =>
                              borrarCliente(cliente.id, cliente.nombre)
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