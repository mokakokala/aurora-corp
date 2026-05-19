import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

let _code: string | null = null
let _promise: Promise<string | null> | null = null

export async function fetchAdminCode(): Promise<string | null> {
  if (_code) return _code
  if (!_promise) {
    _promise = Promise.resolve(
      supabase.from('admin_config').select('value').eq('key', 'first_code').single()
    ).then(({ data }) => {
      _code = (data as { value: string } | null)?.value ?? null
      return _code
    })
  }
  return _promise
}

export function useAdminCode(): string | null {
  const [code, setCode] = useState<string | null>(_code)
  useEffect(() => { fetchAdminCode().then(setCode) }, [])
  return code
}
