Users,
Package,
FileText,
  Calendar,
  Settings,
Search,
Menu,
Sparkles,
@@ -19,28 +17,23 @@ import SidebarLink from '@/components/sidebar-link'
export const metadata: Metadata = {
title: 'Vinalux',
description: 'Panel de gestión de Vinalux',

  // 🔥 IMPORTANTE PARA APP EN IPAD/IPHONE
applicationName: 'Vinalux',

appleWebApp: {
capable: true,
    statusBarStyle: 'default',
    statusBarStyle: 'black-translucent',
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
  themeColor: '#020617',
}

export default function RootLayout({
@@ -50,26 +43,29 @@ export default function RootLayout({
}) {
return (
<html lang="es">
      <body className="bg-slate-900 text-slate-900">
      <body className="min-h-screen bg-[#0b1120] text-slate-100 antialiased">
<div className="min-h-screen md:flex">
          <aside className="w-full border-b border-slate-700 bg-purple-900 md:min-h-screen md:w-72 md:border-b-0 md:border-r">
            <div className="flex items-center justify-between p-4 md:block md:p-6">
          <aside className="w-full border-b border-white/10 bg-[#020617]/95 backdrop-blur md:min-h-screen md:w-72 md:border-b-0 md:border-r">
            <div className="flex items-center justify-between p-4 md:p-6">
<div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-fuchsia-500 via-sky-500 to-emerald-400 shadow-lg">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-fuchsia-500 via-sky-500 to-cyan-400 shadow-[0_10px_30px_rgba(14,165,233,0.25)]">
<Sparkles size={20} className="text-white" />
</div>

<div>
                  <h1 className="text-xl font-bold text-white">Vinalux</h1>
                  <h1 className="text-xl font-semibold tracking-tight text-white">
                    Vinalux
                  </h1>
<p className="text-sm text-slate-400">Panel de gestión</p>
</div>
</div>

              <details className="md:hidden">
                <summary className="flex cursor-pointer list-none items-center justify-center rounded-xl border border-slate-700 p-2 text-white hover:bg-slate-800">
              <details className="relative md:hidden">
                <summary className="flex cursor-pointer list-none items-center justify-center rounded-xl border border-white/10 bg-white/5 p-2 text-white transition hover:bg-white/10">
<Menu size={20} />
</summary>

                <nav className="mt-3 flex flex-col gap-2">
                <nav className="absolute right-0 z-50 mt-3 flex w-56 flex-col gap-2 rounded-2xl border border-white/10 bg-[#0f172a]/95 p-3 shadow-2xl backdrop-blur">
<SidebarLink href="/" icon={<LayoutDashboard size={18} />}>
Dashboard
</SidebarLink>
@@ -94,42 +90,46 @@ export default function RootLayout({
<SidebarLink href="/presupuestos" icon={<FileText size={18} />}>
Presupuestos
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
              
            </nav>
            <div className="hidden px-4 pb-6 md:block md:px-5">
              <div className="mb-4 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

              <nav className="flex flex-col gap-2">
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
              </nav>
            </div>
</aside>

          <main className="flex-1 bg-slate-900 p-4 md:p-8">
            {children}
          <main className="flex-1 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.08),_transparent_30%),linear-gradient(to_bottom,_#0b1120,_#111827)] p-4 md:p-8">
            <div className="mx-auto w-full max-w-7xl">
              {children}
            </div>
</main>
</div>
</body>