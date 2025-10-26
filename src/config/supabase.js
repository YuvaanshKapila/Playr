import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://hcqhvotngjtpmqbowavd.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhjcWh2b3RuZ2p0cG1xYm93YXZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0MTk3ODksImV4cCI6MjA3Njk5NTc4OX0.ByPxNE4ZiiSmLB3j76lA_zBPKgJc4NBsGat8m58gGYc'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
})
