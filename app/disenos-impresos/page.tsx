'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import jsPDF from 'jspdf'

type Diseno = {
  id: string
  nombre: string
  imagen_url: string | null
  created_at: string | null
}

export default function DisenosImpresosPage() {
  const [disenos, setDisenos] = useState<Diseno[]>([])
  const [loading, setLoading] = useState(true)
  const [file, setFile] = useState<File | null>(null)
  const [nombre, setNombre] = useState('')
  const [subiendo, setSubiendo] = useState(false)
  const [imagenSeleccionada, setImagenSeleccionada] = useState<string | null>(null)

  const router = useRouter()

  useEffect(() => {
    cargar()
  }, [])

  async function cargar() {
    setLoading(true)

    const { data, error } = await supabase
      .from('disenos_impresos')
      .select('*')
      .order('created_at', { ascending: false })

    if (!error) {
      setDisenos(data || [])
    } else {
      alert(error.message)
    }

    setLoading(false)
  }

  async function subirDiseno() {
    if (!file) return

    setSubiendo(true)

    const fileName = `${Date.now()}-${file.name}`

    const { error: uploadError } = await supabase.storage
      .from('disenos')
      .upload(fileName, file)

    if (uploadError) {
      alert(uploadError.message)
      setSubiendo(false)
      return
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from('disenos').getPublicUrl(fileName)

    const { error: insertError } = await supabase
      .from('disenos_impresos')
      .insert([
        {
          nombre: nombre || file.name,
          imagen_url: publicUrl,
        },
      ])

    if (insertError) {
      alert(insertError.message)
      setSubiendo(false)
      return
    }

    setFile(null)
    setNombre('')
    await cargar()
    setSubiendo(false)
  }

  const generarPDF = async () => {
    const { data } = await supabase
      .from('disenos_impresos')
      .select('*')

    if (!data) return

    const doc = new jsPDF()

    doc.setFontSize(18)
    doc.text('Catálogo de Diseños Impresos', 14, 15)

    let y = 25
    let column = 0

    const maxWidth = 85
    const maxHeight = 70

    for (const d of data) {
      try {
        if (!d.imagen_url) continue

        const img = await fetch(d.imagen_url)
        const blob = await img.blob()

        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader()
          reader.onloadend = () => resolve(reader.result as string)
          reader.readAsDataURL(blob)
        })

        const image = new Image()
        image.src = base64

        await new Promise((res) => (image.onload = res))

        const ratio = image.width / image.height

        let width = maxWidth
        let height = maxWidth / ratio

        if (height > maxHeight) {
          height = maxHeight
          width = maxHeight * ratio
        }

        const posX = column === 0 ? 14 : 110

        doc.addImage(base64, 'JPEG', posX, y, width, height)
        doc.setFontSize(10)
        doc.text(d.nombre || 'Sin nombre', posX, y + height + 5)

        column++

        if (column === 2) {
          column = 0
          y += maxHeight + 20
        }

        if (y > 250) {
          doc.addPage()
          y = 25
          column = 0
        }
      } catch (err) {
        console.error(err)
      }
    }

    doc.save('catalogo-disenos.pdf')
  }

  if (loading) {
    return <div className="p-10 text-slate-400">Cargando diseños...</div>
  }

  return (
    <main className="p-6 md:p-10 max-w-6xl mx-auto">

      {/* BOTONES */}
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

      <h1 className="text-2xl font-bold mb-6 text-white">
        Diseños impresos 🎨
      </h1>

      {/* FORM */}
      <input
        type="text"
        placeholder="Nombre del diseño"
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
        className="w-full border p-2 rounded mb-4"
      />

      <input
        type="file"
        accept="image/*"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
        className="mb-4"
      />

      {file && (
        <img
          src={URL.createObjectURL(file)}
          className="w-full rounded mb-4"
        />
      )}

      <button
        onClick={subirDiseno}
        disabled={subiendo}
        className="bg-black text-white px-4 py-2 rounded w-full mb-10"
      >
        {subiendo ? 'Subiendo...' : 'Subir diseño'}
      </button>

      {/* GALERÍA (FIXED) */}
      <h2 className="text-xl font-bold mb-4 text-white">
        Diseños Impresos
      </h2>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {disenos.map((d) => (
          <div
            key={d.id}
            className="overflow-hidden rounded-xl border border-white/10 bg-white/5 shadow-lg"
          >
            <div className="aspect-square bg-slate-800">
              {d.imagen_url ? (
                <img
                  src={d.imagen_url}
                  onClick={() => setImagenSeleccionada(d.imagen_url)}
                  className="h-full w-full object-cover cursor-pointer transition hover:scale-105"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-slate-400">
                  Sin imagen
                </div>
              )}
            </div>

            <div className="p-3">
              <p className="text-white font-semibold text-sm">
                {d.nombre}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL */}
      {imagenSeleccionada && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 p-6"
          onClick={() => setImagenSeleccionada(null)}
        >
          <img
            src={imagenSeleccionada}
            className="max-h-full max-w-full rounded-2xl shadow-2xl"
          />
        </div>
      )}

    </main>
  )
}