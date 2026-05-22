// ─── Kong Config Context ──────────────────────────────────────────────────────
// Stores the user-provided Kong Admin API URL and token at runtime.
// Persisted to localStorage so it survives page refreshes.
// All hooks read from this context — no rebuild required when config changes.

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

export interface KongRuntimeConfig {
  baseUrl: string      // e.g. http://localhost:8001  or  /kong-api
  apiKey: string       // Bearer token or API key — empty if unsecured
  enabled: boolean     // true once the user has saved a valid config
}

const STORAGE_KEY = 'acmp_kong_config'

const DEFAULT_CONFIG: KongRuntimeConfig = {
  baseUrl: '',
  apiKey: '',
  enabled: false,
}

function loadFromStorage(): KongRuntimeConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return { ...DEFAULT_CONFIG, ...JSON.parse(raw) }
  } catch { /* ignore */ }
  return DEFAULT_CONFIG
}

function saveToStorage(cfg: KongRuntimeConfig) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg))
  } catch { /* ignore */ }
}

// ─── Context ──────────────────────────────────────────────────────────────────

interface KongConfigContextValue {
  config: KongRuntimeConfig
  saveConfig: (baseUrl: string, apiKey: string) => void
  clearConfig: () => void
  testConfig: (baseUrl: string, apiKey: string) => Promise<{ ok: boolean; message: string; version?: string }>
}

const KongConfigContext = createContext<KongConfigContextValue | null>(null)

export function KongConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<KongRuntimeConfig>(loadFromStorage)

  const saveConfig = useCallback((baseUrl: string, apiKey: string) => {
    const cfg: KongRuntimeConfig = {
      baseUrl: baseUrl.replace(/\/$/, ''), // strip trailing slash
      apiKey,
      enabled: true,
    }
    setConfig(cfg)
    saveToStorage(cfg)
  }, [])

  const clearConfig = useCallback(() => {
    setConfig(DEFAULT_CONFIG)
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  const testConfig = useCallback(async (
    baseUrl: string,
    apiKey: string,
  ): Promise<{ ok: boolean; message: string; version?: string }> => {
    const url = baseUrl.replace(/\/$/, '')
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(apiKey ? { apikey: apiKey } : {}),
    }
    try {
      const res = await fetch(`${url}/`, { headers })
      if (!res.ok) {
        return { ok: false, message: `HTTP ${res.status} ${res.statusText}` }
      }
      const data = await res.json()
      return {
        ok: true,
        message: `Connected — Kong v${data.version} on ${data.hostname}`,
        version: data.version,
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      return { ok: false, message: `Connection failed: ${msg}` }
    }
  }, [])

  return (
    <KongConfigContext.Provider value={{ config, saveConfig, clearConfig, testConfig }}>
      {children}
    </KongConfigContext.Provider>
  )
}

export function useKongConfig(): KongConfigContextValue {
  const ctx = useContext(KongConfigContext)
  if (!ctx) throw new Error('useKongConfig must be used inside KongConfigProvider')
  return ctx
}
