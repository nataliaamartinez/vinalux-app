'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import jsPDF from 'jspdf'

type Producto = {
  id: string
  nombre: string | null
  proveedor: string | null
  imagen_url: string | null
  precio_venta: number | null
  tipo_grabado?: string | null
}

export default function VentaPublicoPage() {
  const [productos, setProductos] = useState<Producto[]>([])
  const [generando, setGenerando] = useState(false)

  useEffect(() => {
    cargarProductos()
  }, [])

  async function cargarProductos() {
    const { data, error } = await supabase
      .from('productos')
      .select('id, nombre, proveedor, imagen_url, precio_venta, tipo_grabado')
      .order('nombre', { ascending: true })

    if (error) {
      console.error(error)
      alert('Error cargando productos')
      return
    }

    setProductos(data || [])
  }

  async function imagenADataURL(url: string): Promise<string | null> {
    try {
      const response = await fetch(url)
      const blob = await response.blob()

      return await new Promise((resolve) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve(reader.result as string)
        reader.onerror = () => resolve(null)
        reader.readAsDataURL(blob)
      })
    } catch (error) {
      console.error('Error cargando imagen:', error)
      return null
    }
  }

  function nuevaPaginaSiHaceFalta(pdf: jsPDF, y: number, altoCard: number) {
    const pageHeight = pdf.internal.pageSize.getHeight()

    if (y + altoCard > pageHeight - 10) {
      pdf.addPage()
      return 15
    }

    return y
  }

  async function sacarPdfVenta() {
    try {
      setGenerando(true)

      const pdf = new jsPDF('p', 'mm', 'a4')
      const pageWidth = pdf.internal.pageSize.getWidth()

      let y = 15
      const margen = 12
      const cardWidth = pageWidth - margen * 2
      const imgSize = 45
      const cardHeight = 62

      pdf.setFontSize(20)
      pdf.setFont('helvetica', 'bold')
      pdf.text('Venta al público', margen, y)
      y += 12

      for (const producto of productos) {
        y = nuevaPaginaSiHaceFalta(pdf, y, cardHeight)

        pdf.setDrawColor(220)
        pdf.roundedRect(margen, y, cardWidth, cardHeight, 3, 3)

        if (producto.imagen_url) {
          const imagen = await imagenADataURL(producto.imagen_url)

          if (imagen) {
            pdf.addImage(imagen, 'JPEG', margen + 5, y + 7, imgSize, imgSize)
          }
        }

        const textX = margen + 58
        let textY = y + 12

        pdf.setFontSize(13)
        pdf.setFont('helvetica', 'bold')
        pdf.text(producto.nombre || 'Sin nombre', textX, textY, {
          maxWidth: cardWidth - 65,
        })

        textY += 8
        pdf.setFontSize(10)
        pdf.setFont('helvetica', 'normal')
        pdf.text(`Proveedor: ${producto.proveedor || 'Sin proveedor'}`, textX, textY)

        textY += 7
        pdf.text(
          `Tipo de grabado: ${producto.tipo_grabado || 'No indicado'}`,
          textX,
          textY
        )

        textY += 10
        pdf.setFontSize(15)
        pdf.setFont('helvetica', 'bold')
        pdf.text(
          producto.precio_venta != null
            ? `${producto.precio_venta.toFixed(2)} €`
            : 'Sin precio',
          textX,
          textY
        )

        y += cardHeight + 8
      }

      pdf.save('venta-publico.pdf')
    } catch (error) {
      console.error(error)
      alert('No se pudo generar el PDF de venta')
    } finally {
      setGenerando(false)
    }
  }

  async function hacerCatalogo() {
    try {
      setGenerando(true)

      const pdf = new jsPDF('p', 'mm', 'a4')
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()

      const margen = 12
      const gap = 8
      const columnas = 2
      const cardWidth = (pageWidth - margen * 2 - gap) / columnas
      const cardHeight = 82
      const imgHeight = 55

      let x = margen
      let y = 15
      let columna = 0

      pdf.setFontSize(20)
      pdf.setFont('helvetica', 'bold')
      pdf.text('Catálogo de productos', margen, y)
      y += 12

      for (const producto of productos) {
        if (y + cardHeight > pageHeight - 10) {
          pdf.addPage()
          y = 15
          x = margen
          columna = 0
        }

        pdf.setDrawColor(220)
        pdf.roundedRect(x, y, cardWidth, cardHeight, 3, 3)

        if (producto.imagen_url) {
          const imagen = await imagenADataURL(producto.imagen_url)

          if (imagen) {
            pdf.addImage(imagen, 'JPEG', x + 5, y + 5, cardWidth - 10, imgHeight)
          }
        }

        pdf.setFontSize(12)
        pdf.setFont('helvetica', 'bold')
        pdf.text(producto.nombre || 'Sin nombre', x + 5, y + 68, {
          maxWidth: cardWidth - 10,
          align: 'center',
        })

        columna++

        if (columna === columnas) {
          columna = 0
          x = margen
          y += cardHeight + gap
        } else {
          x += cardWidth + gap
        }
      }

      pdf.save('catalogo-productos.pdf')
    } catch (error) {
      console.error(error)
      alert('No se pudo generar el catálogo')
    } finally {
      setGenerando(false)
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Venta al público
          </h1>
          <p className="text-gray-500">
            Productos disponibles para venta
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={sacarPdfVenta}
            disabled={generando}
            className="rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
          >
            {generando ? 'Generando...' : 'Sacar PDF de venta'}
          </button>

          <button
            onClick={hacerCatalogo}
            disabled={generando}
            className="rounded-xl bg-pink-600 px-4 py-2 text-sm font-semibold text-white hover:bg-pink-700 disabled:opacity-50"
          >
            {generando ? 'Generando...' : 'Hacer catálogo'}
          </button>
        </div>
      </div>

      <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {productos.map((producto) => (
          <article
            key={producto.id}
            className="overflow-hidden rounded-2xl bg-white shadow-sm"
          >
            <div className="h-56 bg-gray-100">
              {producto.imagen_url ? (
                <img
                  src={producto.imagen_url}
                  alt={producto.nombre || 'Producto'}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-gray-400">
                  Sin imagen
                </div>
              )}
            </div>

            <div className="space-y-2 p-5">
              <h2 className="text-xl font-bold text-gray-900">
                {producto.nombre}
              </h2>

              <p className="text-sm text-gray-500">
                Proveedor: {producto.proveedor || 'Sin proveedor'}
              </p>

              <p className="text-sm text-gray-500">
                Tipo de grabado: {producto.tipo_grabado || 'No indicado'}
              </p>

              <p className="text-2xl font-bold text-pink-600">
                {producto.precio_venta != null
                  ? `${producto.precio_venta.toFixed(2)} €`
                  : 'Sin precio'}
              </p>
            </div>
          </article>
        ))}
      </section>
    </main>
  )
}