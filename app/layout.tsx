import './globals.css'
import type { Metadata, Viewport } from 'next'
import {
  LayoutDashboard,
  Box,
  Users,
  Package,
  FileText,
  Calendar,
  Settings,
  Search,
  Menu,
  Sparkles,
  Wallet,
  Receipt,
} from 'lucide-react'
import SidebarLink from '@/components/sidebar-link'

export const metadata: Metadata = {
  title: 'Vinalux',
  description: 'Panel de gestión de Vinalux',

  // 🔥 IMPORTANTE PARA APP EN IPAD/IPHONE
  applicationName: 'Vinalux',

  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Vinalux',
  },

  formatDetection: {
    telephone: false,
  },

  icons: {
    icon: '/icon-192.png',
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#0f172a',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className="bg-slate-900 text-slate-900">
        <div className="min-h-screen md:flex">
          <aside className="w-full border-b border-slate-700 bg-slate-950 md:min-h-screen md:w-72 md:border-b-0 md:border-r">
            <div className="flex items-center justify-between p-4 md:block md:p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-fuchsia-500 via-sky-500 to-emerald-400 shadow-lg">
                  <Sparkles size={20} className="text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">Vinalux</h1>
                  <p className="text-sm text-slate-400">Panel de gestión</p>
                </div>
              </div>

              <details className="md:hidden">
                <summary className="flex cursor-pointer list-none items-center justify-center rounded-xl border border-slate-700 p-2 text-white hover:bg-slate-800">
                  <Menu size={20} />
                </summary>

                <nav className="mt-3 flex flex-col gap-2">
                  <SidebarLink href="/" icon={<LayoutDashboard size={18} />}>
                    Dashboard
                  </SidebarLink>
                  <SidebarLink href="/buscar" icon={<Search size={18} />}>
                    Buscar
                  </SidebarLink>
                  <SidebarLink href="/productos" icon={<Box size={18} />}>
                    Productos
                  </SidebarLink>
                  <SidebarLink href="/clientes" icon={<Users size={18} />}>
                    Clientes
                  </SidebarLink>
                  <SidebarLink href="/pedidos" icon={<Package size={18} />}>
                    Pedidos
                  </SidebarLink>
                  <SidebarLink href="/finanzas" icon={<Wallet size={18} />}>
                    Finanzas
                  </SidebarLink>
                  <SidebarLink href="/gastos" icon={<Receipt size={18} />}>
                    Gastos
                  </SidebarLink>
                  <SidebarLink href="/presupuestos" icon={<FileText size={18} />}>
                    Presupuestos
                  </SidebarLink>
                  <SidebarLink href="/calendario" icon={<Calendar size={18} />}>
                    Calendario
                  </SidebarLink>
                  <SidebarLink href="/ajustes" icon={<Settings size={18} />}>
                    Ajustes
                  </SidebarLink>
                </nav>
              </details>
            </div>

            <nav className="hidden px-4 pb-6 md:flex md:flex-col md:gap-2 md:px-6">
              <SidebarLink href="/" icon={<LayoutDashboard size={18} />}>
                Dashboard
              </SidebarLink>
              <SidebarLink href="/buscar" icon={<Search size={18} />}>
                Buscar
              </SidebarLink>
              <SidebarLink href="/productos" icon={<Box size={18} />}>
                Productos
              </SidebarLink>
              <SidebarLink href="/clientes" icon={<Users size={18} />}>
                Clientes
              </SidebarLink>
              <SidebarLink href="/pedidos" icon={<Package size={18} />}>
                Pedidos
              </SidebarLink>
              <SidebarLink href="/finanzas" icon={<Wallet size={18} />}>
                Finanzas
              </SidebarLink>
              <SidebarLink href="/gastos" icon={<Receipt size={18} />}>
                Gastos
              </SidebarLink>
              <SidebarLink href="/presupuestos" icon={<FileText size={18} />}>
                Presupuestos
              </SidebarLink>
              <SidebarLink href="/calendario" icon={<Calendar size={18} />}>
                Calendario
              </SidebarLink>
              <SidebarLink href="/ajustes" icon={<Settings size={18} />}>
                Ajustes
              </SidebarLink>
            </nav>
          </aside>

          <main className="flex-1 bg-slate-900 p-4 md:p-8">
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}