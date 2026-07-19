import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://rirzrcqzullzmqzjdkhj.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpcnpyY3F6dWxsem1xempka2hqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI5Mjk2MzYsImV4cCI6MjA5ODUwNTYzNn0.XSY10hw6Lv7QTuVbG9lmj07k45LIRHKgGIvFA6s5aws'

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase environment variables are missing.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
