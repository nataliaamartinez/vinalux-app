'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Ajustes = {
  id?: string
  nombre_negocio: string | null
  telefono: string | null
  email: string | null
  direccion: string | null
  logo: string | null
}

export default function AjustesPage() {
  const [form, setForm] = useState<Ajustes>({
    nombre_negocio: '',
    telefono: '',
    email: '',
    direccion: '',
    logo: '',
  })

  const [ajusteId, setAjusteId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // 🔹 Cargar datos existentes
  async function cargarAjustes() {
    const { data, error } = await supabase
      .from('ajustes')
      .select('*')
      .limit(1)

    if (error) {
      console.error(error.message)
    }

    if (data && data.length > 0) {
      const ajuste = data[0]

      setForm({
        nombre_negocio: ajuste.nombre_negocio || '',
        telefono: ajuste.telefono || '',
        email: ajuste.email || '',
        direccion: ajuste.direccion || '',
        logo: ajuste.logo || '',
      })

      setAjusteId(ajuste.id)
    }

    setLoading(false)
  }

  useEffect(() => {
    cargarAjustes()
  }, [])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  // 🔹 Guardar
  async function guardar(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    if (ajusteId) {
      // actualizar
      const { error } = await supabase
        .from('ajustes')
        .update(form)
        .eq('id', ajusteId)

      if (error) {
        alert(error.message)
      }
    } else {
      // insertar primera vez
      const { data, error } = await supabase
        .from('ajustes')
        .insert([form])
        .select()

      if (error) {
        alert(error.message)
      }

      if (data && data.length > 0) {
        setAjusteId(data[0].id)
      }
    }

    setSaving(false)
    alert('Ajustes guardados correctamente')
  }

  if (loading) {
    return (
      <main className="min-h-screen p-10">
        <p className="text-white">Cargando ajustes...</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen p-8">
      <div className="mx-auto max-w-3xl">

        <h1 className="text-3xl font-bold text-white mb-8">
          Ajustes del negocio
        </h1>

        <form
          onSubmit={guardar}
          className="rounded-3xl bg-white p-6 shadow-sm grid gap-4"
        >
          <input
            name="nombre_negocio"
            value={form.nombre_negocio || ''}
            onChange={handleChange}
            placeholder="Nombre del negocio"
            className="border p-3 rounded text-black"
          />

          <input
            name="telefono"
            value={form.telefono || ''}
            onChange={handleChange}
            placeholder="Teléfono"
            className="border p-3 rounded text-black"
          />

          <input
            name="email"
            value={form.email || ''}
            onChange={handleChange}
            placeholder="Email"
            className="border p-3 rounded text-black"
          />

          <input
            name="direccion"
            value={form.direccion || ''}
            onChange={handleChange}
            placeholder="Dirección"
            className="border p-3 rounded text-black"
          />

          <input
            name="logo"
            value={form.logo || ''}
            onChange={handleChange}
            placeholder="Logo o nombre corto"
            className="border p-3 rounded text-black"
          />

          <button
            disabled={saving}
            className="bg-slate-900 text-white py-3 rounded font-semibold"
          >
            {saving ? 'Guardando...' : 'Guardar ajustes'}
          </button>
        </form>

      </div>
    </main>
  )
}