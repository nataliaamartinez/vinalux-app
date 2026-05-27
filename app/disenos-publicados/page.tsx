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
    console.log('CLICK botón')

    if (!file) {
      alert('No has seleccionado ninguna imagen')
      return
    }

    setLoading(true)

    try {
      const url = await uploadImage(file)

      if (!url) {
        throw new Error('No se pudo obtener la URL')
      }

      const { error } = await supabase
        .from('disenos_publicados')
        .insert({
          imagen_url: url,
          titulo: titulo || 'Sin título'
        })

      if (error) {
        console.error('Error guardando diseño:', error)
        alert('Error al guardar en base de datos')
      } else {
        alert('Diseño subido correctamente ✅')

        setFile(null)
        setTitulo('')
      }
    } catch (err) {
      console.error(err)
      alert('Error subiendo diseño')
    }

    setLoading(false)
  }

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6" style="
    color:white;"
>
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
          console.log('FILE seleccionado:', f)
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
        type="button"
        onClick={guardarDiseno}
        disabled={loading}
        className="bg-black text-white px-4 py-2 rounded w-full disabled:opacity-50"
      >
        {loading ? 'Subiendo...' : 'Subir diseño'}
      </button>
    </div>
  )
}