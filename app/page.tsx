'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import {
  Box,
  Wallet,
  ShoppingCart,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Scale,
  ArrowRight,
} from 'lucide-react'

type Pedido = {
  id: string
  numero_pedido: string | null
  cantidad: number | null
  precio_venta: number | null
  estado: string | null
  estado_pago: string | null
  fecha_entrega: string | null
  created_at: string | null
  clientes: { nombre: string } | null
  productos: { nombre: string } | null
}

type MovimientoFinanza = {
  id: string
  tipo: 'ingreso' | 'gasto' | null
  importe: number | null
  fecha: string | null
  descripcion: string | null
  referencia: string | null
  cliente_proveedor: string | null
  estado: string | null
  created_at: string | null
}

type Producto = {
  id: string
  nombre: string | null
  stock: number | null
  stock_minimo: number | null
}

export default function DashboardPage() {
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [finanzas, setFinanzas] = useState<MovimientoFinanza[]>([])
  const [productos, setProductos] = useState<Producto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function cargarDatos() {
    setLoading(true)
    setError(null)

    const [pedidosRes, finanzasRes, productosRes] = await Promise.all([
      supabase
        .from('pedidos')
        .select(`
          id,
          numero_pedido,
          cantidad,
          precio_venta,
          estado,
          estado_pago,
          fecha_entrega,
          created_at,
          clientes(nombre),
          productos(nombre)
        `)
        .order('created_at', { ascending: false })
        .limit(8),

      supabase
        .from('finanzas')
        .select(`
          id,
          tipo,
          importe,
          fecha,
          descripcion,
          referencia,
          cliente_proveedor,
          estado,
          created_at
        `)
        .order('fecha', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(8),

      supabase
        .from('productos')
        .select('id, nombre, stock, stock_minimo')
        .order('nombre'),
    ])

    // ✅ PEDIDOS
    if (pedidosRes.error) {
      setError(pedidosRes.error.message)
    } else {
      const pedidosFormateados: Pedido[] = ((pedidosRes.data as any[]) || []).map(
        (item: any) => ({
          id: item.id,
          numero_pedido: item.numero_pedido ?? null,
          cantidad: item.cantidad ?? null,
          precio_venta: item.precio_venta ?? null,
          estado: item.estado ?? null,
          estado_pago: item.estado_pago ?? null,
          fecha_entrega: item.fecha_entrega ?? null,
          created_at: item.created_at ?? null,
          clientes: item.clientes ? { nombre: item.clientes.nombre } : null,
          productos: item.productos ? { nombre: item.productos.nombre } : null,
        })
      )
      setPedidos(pedidosFormateados)
    }

    // ✅ FINANZAS
    if (finanzasRes.error) {
      setError(finanzasRes.error.message)
    } else {
      const finanzasFormateadas: MovimientoFinanza[] = ((finanzasRes.data as any[]) || []).map(
        (item: any) => ({
          id: item.id,
          tipo: item.tipo ?? null,
          importe: item.importe ?? null,
          fecha: item.fecha ?? null,
          descripcion: item.descripcion ?? null,
          referencia: item.referencia ?? null,
          cliente_proveedor: item.cliente_proveedor ?? null,
          estado: item.estado ?? null,
          created_at: item.created_at ?? null,
        })
      )
      setFinanzas(finanzasFormateadas)
    }

    // ✅ PRODUCTOS
    if (productosRes.error) {
      setError(productosRes.error.message)
    } else {
      const productosFormateados: Producto[] = ((productosRes.data as any[]) || []).map(
        (item: any) => ({
          id: item.id,
          nombre: item.nombre ?? null,
          stock: item.stock ?? null,
          stock_minimo: item.stock_minimo ?? null,
        })
      )
      setProductos(productosFormateados)
    }

    setLoading(false)
  }

  useEffect(() => {
    cargarDatos()
  }, [])

  function formatearEuros(valor: number) {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
    }).format(valor)
  }

  function formatearFecha(fecha: string | null) {
    if (!fecha) return '-'
    return new Date(fecha).toLocaleDateString('es-ES')
  }

  function calcularTotalPedido(
    cantidad: number | null,
    precioVenta: number | null
  ) {
    return (cantidad ?? 0) * (precioVenta ?? 0)
  }

  const resumen = useMemo(() => {
    const totalPedidos = pedidos.length

    const pedidosPendientes = pedidos.filter(
      (pedido) => pedido.estado === 'pendiente'
    ).length

    const ingresos = finanzas
      .filter((movimiento) => movimiento.tipo === 'ingreso')
      .reduce((acc, movimiento) => acc + (movimiento.importe ?? 0), 0)

    const gastos = finanzas
      .filter((movimiento) => movimiento.tipo === 'gasto')
      .reduce((acc, movimiento) => acc + (movimiento.importe ?? 0), 0)

    const beneficioNeto = ingresos - gastos

    const productosStockBajo = productos.filter((producto) => {
      const stock = producto.stock ?? 0
      const stockMinimo = producto.stock_minimo ?? 0
      return stock <= stockMinimo
    }).length

    return {
      totalPedidos,
      pedidosPendientes,
      ingresos,
      gastos,
      beneficioNeto,
      productosStockBajo,
    }
  }, [pedidos, finanzas, productos])

  const productosConStockBajo = useMemo(() => {
    return productos
      .filter((producto) => {
        const stock = producto.stock ?? 0
        const stockMinimo = producto.stock_minimo ?? 0
        return stock <= stockMinimo
      })
      .sort((a, b) => (a.stock ?? 0) - (b.stock ?? 0))
      .slice(0, 6)
  }, [productos])

  return (
    <main className="min-h-screen bg-slate-50 p-6 md:p-10">
      <div className="mx-auto max-w-7xl">
        <h1 className="text-3xl font-bold text-slate-900 mb-6">Dashboard</h1>

        {/* RESUMEN */}
        <div className="grid gap-4 md:grid-cols-3">
          <div className="bg-white p-5 rounded-2xl shadow">
            <p>Pedidos</p>
            <h2>{resumen.totalPedidos}</h2>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow">
            <p>Ingresos</p>
            <h2>{formatearEuros(resumen.ingresos)}</h2>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow">
            <p>Beneficio</p>
            <h2>{formatearEuros(resumen.beneficioNeto)}</h2>
          </div>
        </div>
      </div>
    </main>
  )
}