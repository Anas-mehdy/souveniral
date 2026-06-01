import { redirect } from 'next/navigation'
import { isAdminAuthenticated } from '@/lib/auth'

export default async function AdminRootPage() {
  const authenticated = await isAdminAuthenticated()
  if (authenticated) {
    redirect('/admin/dashboard')
  } else {
    redirect('/admin/login')
  }
}
