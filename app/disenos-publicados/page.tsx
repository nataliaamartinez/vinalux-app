'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

type Diseno = {
  id: string
  imagen_url: string
  titulo: string | null
}

type Producto = {
  nombre: string
  categoria: string | null
  referencia: string | null
  precio: number | null
}

export default function SubirDisenosPage() {
  const [loading, setLoading] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [titulo, setTitulo] = useState('')
  const [disenos, setDisenos] = useState<Diseno[]>([])

  const router = useRouter()

  // 📡 TRAER DISEÑOS
  const fetchDisenos = async () => {
    const { data, error } = await supabase
      .from('disenos_publicados')
      .select('*')
      .order('created_at', { ascending: false })

    if (!error) setDisenos(data || [])
  }

  useEffect(() => {
    fetchDisenos()
  }, [])

  // 📄 PDF
 const generarPDF = async () => {
  const { data: disenos, error } = await supabase
    .from('disenos_publicados')
    .select('*')

  if (error || !disenos) {
    alert('Error cargando diseños')
    return
  }

  const doc = new jsPDF()

  doc.setFontSize(18)
  doc.text('Catálogo de Diseños', 14, 15)

  let x = 14
  let y = 25

  const imgWidth = 85
  const imgHeight = 60
  const gapX = 10
  const gapY = 10

  let column = 0

  for (let i = 0; i < disenos.length; i++) {
    const d = disenos[i]

    try {
      // convertir imagen a base64
      const img = await fetch(d.imagen_url)
      const blob = await img.blob()

      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve(reader.result as string)
        reader.readAsDataURL(blob)
      })

      const posX = column === 0 ? 14 : 110

      doc.addImage(base64, 'JPEG', posX, y, imgWidth, imgHeight)

      // título debajo
      doc.setFontSize(10)
      doc.text(
        d.titulo || 'Sin título',
        posX,
        y + imgHeight + 5
      )

      column++

      // cambio de fila
      if (column === 2) {
        column = 0
        y += imgHeight + gapY + 10
      }

      // nueva página
      if (y > 250) {
        doc.addPage()
        y = 25
        column = 0
      }

    } catch (err) {
      console.error('Error procesando imagen:', err)
    }
  }

  doc.save('catalogo-disenos.pdf')
}

  // 📤 SUBIR A STORAGE
  const uploadImage = async (file: File) => {
    const fileName = `${Date.now()}-${file.name}`

    const { error } = await supabase.storage
      .from('disenos')
      .upload(fileName, file)

    if (error) {
      console.error(error)
      return null
    }

    const { data } = supabase.storage
      .from('disenos')
      .getPublicUrl(fileName)

    return data.publicUrl
  }

  // 💾 GUARDAR EN DB
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

    if (!error) {
      setFile(null)
      setTitulo('')
      fetchDisenos()
    }

    setLoading(false)
  }

  return (
    <div className="max-w-5xl mx-auto p-6">

      {/* 🔘 BOTONES ARRIBA */}
      <div className="flex gap-3 mb-6">
        <button
          onClick={() => router.push('/disenos')}
          className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded w-full"
        >
          Ver galería 🖼️
        </button>

        <button
          onClick={generarPDF}
          className="bg-blue-600 text-white px-4 py-2 rounded w-full"
        >
          Sacar PDF 📄
        </button>
      </div>

      <h1 className="text-2xl font-bold mb-6">
        Subir diseño publicado 🎨
      </h1>

      {/* FORMULARIO */}
      <input
        type="text"
        placeholder="Título del diseño"
        value={titulo}
        onChange={(e) => setTitulo(e.target.value)}
        className="w-full border p-2 rounded mb-4"
      />

      <input
        type="file"
        accept="image/*"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) setFile(f)
        }}
        className="mb-4"
      />

      {file && (
        <img
          src={URL.createObjectURL(file)}
          className="w-full rounded mb-4"
        />
      )}

      <button
        onClick={guardarDiseno}
        disabled={loading}
        className="bg-black text-white px-4 py-2 rounded w-full mb-10 disabled:opacity-50"
      >
        {loading ? 'Subiendo...' : 'Subir diseño'}
      </button>

      {/* 🖼 GALERÍA */}
      <h2 className="text-xl font-bold mb-4 text-white">
        Diseños publicados
      </h2>

      <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
        {disenos.map((d) => (
          <div key={d.id} className="mb-4 break-inside-avoid">
            <img
              src={d.imagen_url}
              className="w-full rounded-xl hover:scale-[1.02] transition"
            />
            {d.titulo && (
              <p className="text-sm mt-1">{d.titulo}</p>
            )}
          </div>
        ))}
      </div>

    </div>
  )
}