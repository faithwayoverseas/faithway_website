'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin', 'layout')
  redirect('/admin')
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/admin/login')
}

export async function updateInquiryStatus(id: string, status: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('inquiries')
    .update({ status })
    .eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath(`/admin/inquiries/${id}`)
  revalidatePath('/admin/inquiries')
}

export async function addInquiryNote(id: string, notes: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('inquiries')
    .update({ notes })
    .eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath(`/admin/inquiries/${id}`)
}
