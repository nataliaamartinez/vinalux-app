'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
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
  const [imagenSeleccionada, setImagenSeleccionada] = useState<string | null>(null)
  const [subiendo, setSubiendo] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [nombre, setNombre] = useState('')

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

  async function subirDiseno() {
    if (!file) return

    setSubiendo(true)

    const fileName = `${Date.now()}-${file.name}`

    const { error: uploadError } = await supabase.storage
      .from('disenos')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      })

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
    const doc = new jsPDF()

    doc.setFontSize(18)
    doc.text('Catálogo de Diseños Impresos', 14, 15)

    let x = 14
    let y = 25

    const maxWidth = 85
    const maxHeight = 70
    let column = 0

    for (const d of disenos) {
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

    doc.save('catalogo-disenos-impresos.pdf')
  }

  if (loading) {
    return <div className="p-10 text-slate-400">Cargando diseños...</div>
  }

  return (
    <main className="p-6 md:p-10">
      <h1 className="text-3xl font-bold text-white">Diseños impresos</h1>

      <p className="mt-2 text-slate-400">
        Catálogo visual de todos los diseños disponibles para impresión.
      </p>

      {/* SUBIDA */}
      <div className="mt-6 space-y-3">
        <input
          type="text"
          placeholder="Nombre del diseño"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          className="w-full rounded-xl p-2"
        />

        <input
          type="file"
          accept="image/*"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />

        <button
          onClick={subirDiseno}
          disabled={subiendo}
          className="rounded-xl bg-sky-500 px-4 py-2 text-white"
        >
          {subiendo ? 'Subiendo...' : 'Subir diseño'}
        </button>

        <button
          onClick={generarPDF}
          className="ml-3 rounded-xl bg-blue-600 px-4 py-2 text-white"
        >
          Generar PDF 📄
        </button>
      </div>

      {/* GALERÍA */}
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {disenos.map((d) => (
          <div
            key={d.id}
            className="group overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-lg backdrop-blur"
          >
            <div className="aspect-square bg-slate-800">
              {d.imagen_url ? (
                <img
                  src={d.imagen_url}
                  onClick={() => setImagenSeleccionada(d.imagen_url)}
                  className="h-full w-full cursor-pointer object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-slate-400">
                  Sin imagen
                </div>
              )}
            </div>

            <div className="p-4">
              <p className="font-semibold text-white">{d.nombre}</p>
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
            className="max-h-full max-w-full rounded-2xl"
          />
        </div>
      )}
    </main>
  )
}
