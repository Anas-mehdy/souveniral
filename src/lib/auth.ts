import { cookies } from 'next/headers'
import { supabaseAdmin } from './supabase'

export async function isAdminAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies()
  const token = cookieStore.get('admin_token')?.value
  if (!token) return false
  const { data } = await supabaseAdmin
    .from('admin_sessions')
    .select('expires_at')
    .eq('token', token)
    .single()
  if (!data) return false
  return new Date(data.expires_at) > new Date()
}
