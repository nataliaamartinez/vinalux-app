import jsPDF from 'jspdf'

export async function generarPDF({
  negocio,
  telefono,
  email,
  cliente,
  producto,
  precio,
  fecha,
}: {
  negocio: string
  telefono: string
  email: string
  cliente: string
  producto: string
  precio: number
  fecha: string
}) {
  const doc = new jsPDF()

  // 🔹 Nombre negocio
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(20)
  doc.text(negocio || 'Vinalux', 20, 20)

  // 🔹 Datos negocio
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.text(`Tel: ${telefono || '-'}`, 20, 28)
  doc.text(`Email: ${email || '-'}`, 20, 34)

  // 🔹 Línea
  doc.setDrawColor(220, 220, 220)
  doc.line(15, 40, 195, 40)

  // 🔹 Título
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.text('PRESUPUESTO', 20, 55)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.text(`Fecha: ${fecha}`, 150, 55)

  // 🔹 Cliente
  doc.setFontSize(12)
  doc.text(`Cliente: ${cliente}`, 20, 75)

  // 🔹 Producto
  doc.text(`Producto: ${producto}`, 20, 85)

  // 🔹 Precio
  doc.text(`Importe: ${precio.toFixed(2)} €`, 20, 95)

  // 🔹 Total destacado
  doc.setFillColor(15, 23, 42)
  doc.rect(15, 110, 180, 20, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.text(`TOTAL: ${precio.toFixed(2)} €`, 20, 123)

  // 🔹 Reset color
  doc.setTextColor(0, 0, 0)

  // 🔹 Pie
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.text('Gracias por confiar en nosotros.', 15, 140)

  const nombreArchivo = `presupuesto-${cliente
    .toLowerCase()
    .replace(/\s+/g, '-')}.pdf`

  doc.save(nombreArchivo)
}