import { ReactNode } from 'react'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { isValidAdminSession } from '@/utils/adminAuth'
import AdminLayoutWrapper from '@/components/admin/AdminLayoutWrapper'

export const dynamic = 'force-dynamic'

export default async function AdminProtectedLayout({ children }: { children: ReactNode }) {
  const cookieStore = await cookies()
  const token = cookieStore.get('admin-token')?.value

  if (!isValidAdminSession(token)) {
    redirect('/admin/login')
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-black text-[#f8f5f0]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,rgba(201,161,77,0.12),transparent_52%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_85%_5%,rgba(68,54,24,0.18),transparent_55%)]"
      />
      
      <AdminLayoutWrapper>{children}</AdminLayoutWrapper>
    </div>
  )
}
