'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function submitInquiry(formData: FormData) {
  const supabase = await createClient()

  const name = formData.get('name') as string
  const email = formData.get('email') as string
  const service = formData.get('service') as string
  const details = formData.get('details') as string

  const { error } = await supabase
    .from('inquiries')
    .insert([
      { name, email, service, details, status: 'New' }
    ])

  if (error) {
    console.error('Submission error:', error)
    return { error: 'Failed to submit inquiry. Please try again.' }
  }

  revalidatePath('/admin/inquiries')
  return { success: true }
}
