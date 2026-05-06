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
  const [modoCatalogo, setModoCatalogo] = useState(false)
  const contenidoRef = useRef<HTMLDivElement>(null)

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
      return
    }

    setProductos(data || [])
  }

  async function sacarPdfVenta() {
    if (!contenidoRef.current) return

    const canvas = await html2canvas(contenidoRef.current, {
      scale: 2,
      useCORS: true,
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

    pdf.save(modoCatalogo ? 'catalogo-productos.pdf' : 'venta-publico.pdf')
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
            className="rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800"
          >
            Sacar PDF de {modoCatalogo ? 'catálogo' : 'venta'}
          </button>

          <button
            onClick={() => setModoCatalogo((actual) => !actual)}
            className="rounded-xl bg-pink-600 px-4 py-2 text-sm font-semibold text-white hover:bg-pink-700"
          >
            {modoCatalogo ? 'Ver venta' : 'Hacer catálogo'}
          </button>
        </div>
      </div>

      <div ref={contenidoRef}>
        {modoCatalogo ? (
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {productos.map((producto) => (
              <div
                key={producto.id}
                className="rounded-2xl bg-white p-5 text-center shadow-sm"
              >
                <h2 className="text-lg font-semibold text-gray-900">
                  {producto.nombre}
                </h2>
              </div>
            ))}
          </section>
        ) : (
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
                    Tipo de grabado:{' '}
                    {producto.tipo_grabado || 'No indicado'}
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
        )}
      </div>
    </main>
  )
}