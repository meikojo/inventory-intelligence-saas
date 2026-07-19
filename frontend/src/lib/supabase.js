import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://drqecfankcyfdocrlzle.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRycWVjZmFua2N5ZmRvY3JsemxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ0ODIyMDEsImV4cCI6MjEwMDA1ODIwMX0.VP9oxLgS-DcKZbB6dCKNAvTDtZbDjIJLZNQUR_RQJZM';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase environment variables are missing.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
