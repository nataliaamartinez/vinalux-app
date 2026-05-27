'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Diseno = {
  id: string
  imagen_url: string
  titulo: string | null
}

export default function DisenosPage() {
  const [disenos, setDisenos] = useState<Diseno[]>([])
  const [loading, setLoading] = useState(true)

  const fetchDisenos = async () => {
    const { data, error } = await supabase
      .from('disenos_publicados')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error(error)
    } else {
      setDisenos(data || [])
    }

    setLoading(false)
  }

  useEffect(() => {
    fetchDisenos()
  }, [])

  if (loading) return <p className="p-6">Cargando...</p>

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Diseños publicados 🎨</h1>

      {/* PINTEREST LAYOUT */}
      <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
        {disenos.map((d) => (
          <div key={d.id} className="mb-4 break-inside-avoid">
            <img
              src={d.imagen_url}
              className="w-full rounded-xl hover:scale-[1.02] transition"
            />
            {d.titulo && (
              <p className="text-sm mt-1 text-gray-600">{d.titulo}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}