'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function SubirDisenosPage() {
  const [loading, setLoading] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [titulo, setTitulo] = useState('')

  // 📤 Subir imagen a Storage
  const uploadImage = async (file: File) => {
    const fileName = `${Date.now()}-${file.name}`

    const { error: uploadError } = await supabase.storage
      .from('disenos')
      .upload(fileName, file)

    if (uploadError) {
      console.error('Error subiendo imagen:', uploadError)
      return null
    }

    const { data } = supabase.storage
      .from('disenos')
      .getPublicUrl(fileName)

    return data.publicUrl
  }

  // 💾 Guardar en base de datos
  const guardarDiseno = async () => {
    if (!file) return

    setLoading(true)

    const url = await uploadImage(file)

    if (!url) {
      setLoading(false)
      return
    }

    const { error } = await supabase
      .from('disenos_publicados')
      .insert({
        imagen_url: url,
        titulo: titulo || 'Sin título'
      })

    if (error) {
      console.error('Error guardando diseño:', error)
    } else {
      alert('Diseño subido correctamente ✅')
      setFile(null)
      setTitulo('')
    }

    setLoading(false)
  }

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">
        Subir diseño publicado 🎨
      </h1>

      {/* TÍTULO */}
      <input
        type="text"
        placeholder="Título del diseño"
        value={titulo}
        onChange={(e) => setTitulo(e.target.value)}
        className="w-full border p-2 rounded mb-4"
      />

      {/* INPUT FILE */}
      <input
        type="file"
        accept="image/*"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) setFile(f)
        }}
        className="mb-4"
      />

      {/* PREVIEW */}
      {file && (
        <img
          src={URL.createObjectURL(file)}
          alt="preview"
          className="w-full rounded mb-4"
        />
      )}

      {/* BOTÓN */}
      <button
        onClick={guardarDiseno}
        disabled={loading || !file}
        className="bg-black text-white px-4 py-2 rounded w-full disabled:opacity-50"
      >
        {loading ? 'Subiendo...' : 'Subir diseño'}
      </button>
    </div>
  )
}