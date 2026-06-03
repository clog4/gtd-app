import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseKey)

// ── INBOX ──────────────────────────────────────────────
export async function getInbox() {
  const { data, error } = await supabase
    .from('inbox')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function addInboxItem(text) {
  const { data, error } = await supabase
    .from('inbox')
    .insert({ text })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteInboxItem(id) {
  const { error } = await supabase.from('inbox').delete().eq('id', id)
  if (error) throw error
}

// ── PROJECTS ───────────────────────────────────────────
export async function getProjects() {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: true })
  if (error) throw error
  return data
}

export async function addProject(project) {
  const { data, error } = await supabase
    .from('projects')
    .insert(project)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateProject(id, updates) {
  const { data, error } = await supabase
    .from('projects')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteProject(id) {
  const { error } = await supabase.from('projects').delete().eq('id', id)
  if (error) throw error
}

// ── SOMEDAY ────────────────────────────────────────────
export async function getSomeday() {
  const { data, error } = await supabase
    .from('someday')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function addSomedayItem(text) {
  const { data, error } = await supabase
    .from('someday')
    .insert({ text })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteSomedayItem(id) {
  const { error } = await supabase.from('someday').delete().eq('id', id)
  if (error) throw error
}
