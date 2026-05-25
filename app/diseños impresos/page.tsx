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

  useEffect(() => {
    cargar()
  }, [])

  async function cargar() {
    setLoading(true)

    const { data, error } = await supabase
      .from('disenos_impresos')
      .select('id, nombre, imagen_url, created_at')
      .order('created_at', { ascending: false })

    if (!error) {
      setDisenos((data as Diseno[]) || [])
    }

    setLoading(false)
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
                  className="h-full w-full object-cover transition group-hover:scale-105"
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
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}