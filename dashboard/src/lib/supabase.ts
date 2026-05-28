import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!url || !key) {
  console.warn('[kairo] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY not set')
}

export const supabase: SupabaseClient = url && key
  ? createClient(url, key)
  : createClient('https://placeholder.supabase.co', 'placeholder')
