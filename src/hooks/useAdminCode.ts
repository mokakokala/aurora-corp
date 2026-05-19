import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

// Cache for countdown override code (rotates hourly)
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

// Cache for dashboard first code (fixed, never rotated)
let _dashCode: string | null = null
let _dashPromise: Promise<string | null> | null = null

export async function fetchDashboardCode(): Promise<string | null> {
  if (_dashCode) return _dashCode
  if (!_dashPromise) {
    _dashPromise = Promise.resolve(
      supabase.from('admin_config').select('value').eq('key', 'dashboard_code').single()
    ).then(({ data }) => {
      _dashCode = (data as { value: string } | null)?.value ?? null
      return _dashCode
    })
  }
  return _dashPromise
}

export function useDashboardCode(): string | null {
  const [code, setCode] = useState<string | null>(_dashCode)
  useEffect(() => { fetchDashboardCode().then(setCode) }, [])
  return code
}
