import type { KongConfig } from '../types/domain'

export function saveConfig(history: KongConfig[], newConfig: KongConfig): KongConfig[] {
  return [...history, newConfig]
}

export function rollbackConfig(history: KongConfig[], index: number): KongConfig {
  if (index < 0 || index >= history.length) {
    throw new Error(`Invalid history index: ${index}`)
  }
  return history[index]
}
