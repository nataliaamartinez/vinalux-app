import jsPDF from 'jspdf'

type ProductoPDF = {
  nombre: string
  cantidad: number
  precio: number
  imagen_url: string | null
  material_estampado: string
  tipo_estampado: string
  tipo_estampacion: string
}

type GenerarPDFParams =
  | {
      negocio: string
      telefono: string
      email: string
      cliente: string
      fecha: string
      productos: ProductoPDF[]
      total: number
    }
  | {
      negocio: string
      telefono: string
      email: string
      cliente: string
      fecha: string
      producto: string
      precio: number
    }

async function convertirImagenABase64(url: string): Promise<string | null> {
  try {
    const response = await fetch(url)
    const blob = await response.blob()

    return await new Promise((resolve) => {
      const reader = new FileReader()

      reader.onloadend = () => {
        resolve(reader.result as string)
      }

      reader.onerror = () => {
        resolve(null)
      }

      reader.readAsDataURL(blob)
    })
  } catch (error) {
    console.error('Error cargando imagen:', error)
    return null
  }
}

export async function generarPDF(params: GenerarPDFParams) {
  const doc = new jsPDF()

  const negocio = params.negocio || 'Vinalux'
  const telefono = params.telefono || '-'
  const email = params.email || '-'
  const cliente = params.cliente || 'Cliente'
  const fecha = params.fecha

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(20)
  doc.text(negocio, 20, 20)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.text(`Tel: ${telefono}`, 20, 28)
  doc.text(`Email: ${email}`, 20, 34)

  doc.setDrawColor(220, 220, 220)
  doc.line(15, 40, 195, 40)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.text('PRESUPUESTO', 20, 55)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.text(`Fecha: ${fecha}`, 150, 55)

  doc.setFontSize(12)
  doc.text(`Cliente: ${cliente}`, 20, 75)

  let y = 90

  if ('productos' in params) {
    for (const producto of params.productos) {
      if (y > 240) {
        doc.addPage()
        y = 25
      }

      const subtotal = producto.cantidad * producto.precio

      if (producto.imagen_url) {
        const imagenBase64 = await convertirImagenABase64(producto.imagen_url)

        if (imagenBase64) {
          doc.addImage(imagenBase64, 'JPEG', 20, y, 30, 30)
        }
      }

      doc.setTextColor(0, 0, 0)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(12)
      doc.text(producto.nombre, 60, y + 5)

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      doc.text(`Cantidad: ${producto.cantidad}`, 60, y + 12)
      doc.text(`Precio unitario: ${producto.precio.toFixed(2)} €`, 60, y + 18)
      doc.text(`Material: ${producto.material_estampado}`, 60, y + 24)
      doc.text(`Tamaño: ${producto.tipo_estampado}`, 60, y + 30)
      doc.text(`Estampación: ${producto.tipo_estampacion}`, 60, y + 36)
      doc.text(`Subtotal: ${subtotal.toFixed(2)} €`, 60, y + 42)

      y += 55
    }

    if (y > 260) {
      doc.addPage()
      y = 25
    }

    doc.setFillColor(15, 23, 42)
    doc.rect(15, y, 180, 20, 'F')

    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(14)
    doc.text(`TOTAL: ${params.total.toFixed(2)} €`, 20, y + 13)
  } else {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(12)
    doc.text(`Producto: ${params.producto}`, 20, 85)
    doc.text(`Importe: ${params.precio.toFixed(2)} €`, 20, 95)

    doc.setFillColor(15, 23, 42)
    doc.rect(15, 110, 180, 20, 'F')

    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(14)
    doc.text(`TOTAL: ${params.precio.toFixed(2)} €`, 20, 123)

    y = 140
  }

  doc.setTextColor(0, 0, 0)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.text('Gracias por confiar en nosotros.', 15, y + 35)

  const nombreArchivo = `presupuesto-${cliente
    .toLowerCase()
    .replace(/\s+/g, '-')}.pdf`

  doc.save(nombreArchivo)
}