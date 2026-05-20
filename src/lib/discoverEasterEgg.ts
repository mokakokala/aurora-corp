import { supabase } from './supabase'

export async function discoverEasterEgg(eggId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  const { error } = await supabase
    .from('user_discoveries')
    .upsert(
      [{ auth_id: user.id, easter_egg_id: eggId }],
      { onConflict: 'auth_id,easter_egg_id', ignoreDuplicates: true }
    )
  if (error) console.error('discoverEasterEgg error:', error)
}
