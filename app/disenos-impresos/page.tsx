'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Diseno = {
  id: string
  nombre: string
  imagen_url: string | null
  created_at: string | null
}

export default function DisenosImpresosPage() {
  const [disenos, setDisenos] = useState<Diseno[]>([])
  const [loading, setLoading] = useState(true)
  const [imagenSeleccionada, setImagenSeleccionada] = useState<string | null>(null)
  const [subiendo, setSubiendo] = useState(false)

  useEffect(() => {
    cargar()
  }, [])

  async function cargar() {
    setLoading(true)

    const { data, error } = await supabase
      .from('disenos_impresos')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.log(error)
      alert(error.message)
    } else {
      setDisenos(data || [])
    }

    setLoading(false)
  }

  async function subirDiseno(file: File) {
    setSubiendo(true)

    const fileName = `${Date.now()}-${file.name}`

    // SUBIR IMAGEN A STORAGE
    const { error: uploadError } = await supabase.storage
      .from('disenos')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (uploadError) {
      console.log(uploadError)
      alert(uploadError.message)
      setSubiendo(false)
      return
    }

    // OBTENER URL PÚBLICA
    const {
      data: { publicUrl },
    } = supabase.storage
      .from('disenos')
      .getPublicUrl(fileName)

    console.log(publicUrl)

    // GUARDAR EN TABLA
    const { error: insertError } = await supabase
      .from('disenos_impresos')
      .insert([
        {
          nombre: file.name,
          imagen_url: publicUrl,
        },
      ])

    if (insertError) {
      console.log(insertError)
      alert(insertError.message)
      setSubiendo(false)
      return
    }

    // RECARGAR GALERÍA
    await cargar()

    setSubiendo(false)
  }

  if (loading) {
    return (
      <div className="p-10 text-slate-400">
        Cargando diseños...
      </div>
    )
  }

  return (
    <main className="p-6 md:p-10">
      <h1 className="text-3xl font-bold text-white">
        Diseños impresos
      </h1>

      <p className="mt-2 text-slate-400">
        Catálogo visual de todos los diseños disponibles para impresión.
      </p>

      {/* BOTÓN SUBIR */}
      <div className="mt-6">
        <label className="inline-block cursor-pointer rounded-xl bg-sky-500 px-4 py-2 text-white hover:bg-sky-600">
          {subiendo ? 'Subiendo...' : 'Subir diseño'}

          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]

              if (file) {
                subirDiseno(file)
              }
            }}
          />
        </label>
      </div>

      {/* GALERÍA */}
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {disenos.map((d) => (
          <div
            key={d.id}
            className="group overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-lg backdrop-blur transition hover:scale-[1.02]"
          >
            <div className="aspect-square bg-slate-800">
              {d.imagen_url ? (
                <img
                  src={d.imagen_url}
                  alt={d.nombre}
                  onClick={() =>
                    setImagenSeleccionada(d.imagen_url)
                  }
                  className="h-full w-full cursor-pointer object-cover transition group-hover:scale-105"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-slate-400">
                  Sin imagen
                </div>
              )}
            </div>

            <div className="p-4">
              <p className="font-semibold text-white">
                {d.nombre}
              </p>

              {d.imagen_url && (
                <button
                  onClick={() =>
                    setImagenSeleccionada(d.imagen_url)
                  }
                  className="mt-2 text-xs text-sky-400 hover:underline"
                >
                  Ver grande
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* MODAL */}
      {imagenSeleccionada && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6"
          onClick={() => setImagenSeleccionada(null)}
        >
          <img
            src={imagenSeleccionada}
            alt="Diseño ampliado"
            className="max-h-full max-w-full rounded-2xl shadow-2xl"
          />
        </div>
      )}
    </main>
  )
}