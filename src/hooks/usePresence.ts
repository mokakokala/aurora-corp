import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export function usePresence() {
  const [count, setCount] = useState(0)

  useEffect(() => {
    const channel = supabase.channel('aurora-presence')

    channel
      .on('presence', { event: 'sync' }, () => {
        setCount(Object.keys(channel.presenceState()).length)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ joined_at: Date.now() })
        }
      })

    return () => { supabase.removeChannel(channel) }
  }, [])

  return count
}
