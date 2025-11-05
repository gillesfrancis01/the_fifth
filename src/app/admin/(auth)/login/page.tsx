import LoginForm from '@/components/admin/LoginForm'
import { isValidAdminSession } from '@/utils/adminAuth'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export default function AdminLoginPage() {
  const token = cookies().get('admin-token')?.value

  if (isValidAdminSession(token)) {
    redirect('/admin')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-black px-4 py-24">
      <LoginForm />
    </div>
  )
}
