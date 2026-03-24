'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function SidebarLink({
  href,
  icon,
  children,
}: {
  href: string
  icon: React.ReactNode
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const isActive = pathname === href

  return (
    <Link
      href={href}
      className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition ${
        isActive
          ? 'bg-slate-900 text-white shadow-sm'
          : 'text-slate-700 hover:bg-slate-100'
      }`}
    >
      <span className={isActive ? 'text-white' : 'text-slate-500'}>{icon}</span>
      <span>{children}</span>
    </Link>
  )
}
