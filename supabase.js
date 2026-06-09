// supabase.js — Supabase client wrapper
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'
import CONFIG from './config.js'

const supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY)

export const auth = {
  onAuthChange(cb) {
    return supabase.auth.onAuthStateChange(cb)
  },
  async signIn(email, password) {
    return supabase.auth.signInWithPassword({ email, password })
  },
  async signOut() {
    return supabase.auth.signOut()
  },
  async getUser() {
    const { data } = await supabase.auth.getUser()
    return data.user
  },
}

export default supabase
