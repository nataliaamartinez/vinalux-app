'use client'

import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

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

  const ventaRef = useRef<HTMLDivElement>(null)
  const catalogoRef = useRef<HTMLDivElement>(null)

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

  async function descargarPDF(
    ref: React.RefObject<HTMLDivElement | null>,
    nombreArchivo: string
  ) {
    try {
      if (!ref.current) {
        alert('No se encontró el contenido para generar el PDF')
        return
      }

      setGenerando(true)

      await new Promise((resolve) => setTimeout(resolve, 500))

      const canvas = await html2canvas(ref.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#f9fafb',
      })

      const imgData = canvas.toDataURL('image/png')

      const pdf = new jsPDF('p', 'mm', 'a4')
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()

      const imgWidth = pageWidth
      const imgHeight = (canvas.height * imgWidth) / canvas.width

      let heightLeft = imgHeight
      let position = 0

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight

      while (heightLeft > 0) {
        position = heightLeft - imgHeight
        pdf.addPage()
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
        heightLeft -= pageHeight
      }

      pdf.save(nombreArchivo)
    } catch (error) {
      console.error(error)
      alert('No se pudo generar el PDF. Revisa la consola del navegador.')
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
            onClick={() => descargarPDF(ventaRef, 'venta-publico.pdf')}
            disabled={generando}
            className="rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
          >
            {generando ? 'Generando...' : 'Sacar PDF de venta'}
          </button>

          <button
            onClick={() => descargarPDF(catalogoRef, 'catalogo-productos.pdf')}
            disabled={generando}
            className="rounded-xl bg-pink-600 px-4 py-2 text-sm font-semibold text-white hover:bg-pink-700 disabled:opacity-50"
          >
            {generando ? 'Generando...' : 'Hacer catálogo'}
          </button>
        </div>
      </div>

      {/* PDF VENTA */}
      <div ref={ventaRef} className="bg-gray-50 p-4">
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
                    crossOrigin="anonymous"
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
      </div>

      {/* PDF CATÁLOGO OCULTO */}
      <div
        ref={catalogoRef}
        className="fixed left-[-9999px] top-0 w-[1200px] bg-gray-50 p-4"
      >
        <section className="grid grid-cols-4 gap-6">
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
                    crossOrigin="anonymous"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-gray-400">
                    Sin imagen
                  </div>
                )}
              </div>

              <div className="p-5 text-center">
                <h2 className="text-xl font-bold text-gray-900">
                  {producto.nombre}
                </h2>
              </div>
            </article>
          ))}
        </section>
      </div>
    </main>
  )
}