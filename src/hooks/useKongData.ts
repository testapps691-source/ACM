// ─── Kong Data Hooks ──────────────────────────────────────────────────────────
// Reads from the KongConfigContext (user-entered URL + token).
// Falls back to mock data when no config is saved or a fetch fails.
// Re-fetches automatically whenever the config changes.

import { useState, useEffect, useCallback } from 'react'
import type { Consumer, Role, RoleAssignment, ConnectorRegistryEntry, AuditLogEntry } from '../types/domain'
import {
  fetchConsumersWithAcls,
  fetchKongStatus,
  fetchKongInfo,
  KongApiError,
  type KongClientConfig,
} from '../api/kongClient'
import {
  toConsumer,
  toRoleAssignments,
  toConnectorRegistryEntry,
  toAuditLog,
  toConnectorStatusExtended,
  type ConnectorStatusExtended,
} from '../api/kongTransformers'
import { useKongConfig } from '../utils/kongConfigContext'

// Mock fallbacks
import { mockConsumers } from '../mock/mockConsumers'
import { mockRoleAssignments } from '../mock/mockRoleAssignments'
import { mockRoles } from '../mock/mockRoles'
import { connectorStatusBySystem } from '../mock/mockConnectorStatus'
import { mockConnectorRegistry } from '../mock/mockConnectorRegistry'
import { mockAuditLog } from '../mock/mockAuditLog'

export type { ConnectorStatusExtended }

// ─── Shared types ─────────────────────────────────────────────────────────────

export type FetchState = 'idle' | 'loading' | 'success' | 'error'

export interface AsyncState<T> {
  data: T
  state: FetchState
  error: string | null
  isLive: boolean
  refetch: () => void
}

// ─── useKongRoleAssignments ───────────────────────────────────────────────────

export function useKongRoleAssignments(): AsyncState<RoleAssignment[]> {
  const { config } = useKongConfig()
  const [data, setData] = useState<RoleAssignment[]>(mockRoleAssignments)
  const [state, setState] = useState<FetchState>('idle')
  const [error, setError] = useState<string | null>(null)
  const [isLive, setIsLive] = useState(false)

  const fetch = useCallback(async (cfg: KongClientConfig) => {
    setState('loading')
    setError(null)
    try {
      const withAcls = await fetchConsumersWithAcls(cfg)

      const aclGroupCounts = new Map<string, number>()
      for (const { acls } of withAcls) {
        for (const acl of acls) {
          aclGroupCounts.set(acl.group, (aclGroupCounts.get(acl.group) ?? 0) + 1)
        }
      }

      const assignments: RoleAssignment[] = []
      for (const { consumer: raw, acls } of withAcls) {
        const consumer = toConsumer(raw)
        assignments.push(...toRoleAssignments(consumer, acls, aclGroupCounts))
      }

      setData(assignments)
      setIsLive(true)
      setState('success')
    } catch (err) {
      const msg = err instanceof KongApiError
        ? `Kong API ${err.status}: ${err.statusText}`
        : err instanceof Error ? err.message : 'Unknown error'
      setError(msg)
      setState('error')
      setData(mockRoleAssignments)
      setIsLive(false)
    }
  }, [])

  useEffect(() => {
    if (config.enabled && config.baseUrl) {
      fetch({ baseUrl: config.baseUrl, apiKey: config.apiKey })
    } else {
      setData(mockRoleAssignments)
      setIsLive(false)
      setState('idle')
    }
  }, [config.enabled, config.baseUrl, config.apiKey, fetch])

  return {
    data,
    state,
    error,
    isLive,
    refetch: () => {
      if (config.enabled && config.baseUrl) {
        fetch({ baseUrl: config.baseUrl, apiKey: config.apiKey })
      }
    },
  }
}

// ─── useKongConsumers ─────────────────────────────────────────────────────────

export function useKongConsumers(): AsyncState<Consumer[]> {
  const assignments = useKongRoleAssignments()
  const consumers: Consumer[] = assignments.isLive
    ? Array.from(
        new Map(
          assignments.data
            .filter(a => a.consumer)
            .map(a => [a.consumer!.id, a.consumer!]),
        ).values(),
      )
    : mockConsumers

  return {
    data: consumers,
    state: assignments.state,
    error: assignments.error,
    isLive: assignments.isLive,
    refetch: assignments.refetch,
  }
}

// ─── useKongRoles ─────────────────────────────────────────────────────────────

export function useKongRoles(): AsyncState<Role[]> {
  const assignments = useKongRoleAssignments()
  const roles: Role[] = assignments.isLive
    ? Array.from(
        new Map(
          assignments.data
            .filter(a => a.role.system === 'kong')
            .map(a => [a.role.id, a.role]),
        ).values(),
      )
    : mockRoles

  return {
    data: roles,
    state: assignments.state,
    error: assignments.error,
    isLive: assignments.isLive,
    refetch: assignments.refetch,
  }
}

// ─── useKongConnectorStatus ───────────────────────────────────────────────────

export function useKongConnectorStatus(): AsyncState<ConnectorStatusExtended> {
  const { config } = useKongConfig()
  const [data, setData] = useState<ConnectorStatusExtended>(connectorStatusBySystem['kong'])
  const [state, setState] = useState<FetchState>('idle')
  const [error, setError] = useState<string | null>(null)
  const [isLive, setIsLive] = useState(false)

  const fetch = useCallback(async (cfg: KongClientConfig) => {
    setState('loading')
    setError(null)
    const start = Date.now()
    try {
      const [status, info] = await Promise.all([fetchKongStatus(cfg), fetchKongInfo(cfg)])
      const durationMs = Date.now() - start
      setData(toConnectorStatusExtended(status, info, new Date().toISOString(), durationMs))
      setIsLive(true)
      setState('success')
    } catch (err) {
      const msg = err instanceof KongApiError
        ? `Kong API ${err.status}: ${err.statusText}`
        : err instanceof Error ? err.message : 'Unknown error'
      setError(msg)
      setState('error')
      setData({
        health: 'unhealthy',
        lastSyncAt: new Date().toISOString(),
        lastSyncDurationMs: 0,
        pendingSyncItems: 0,
        errorMessage: msg,
        system: 'kong',
      })
      setIsLive(true)
    }
  }, [])

  useEffect(() => {
    if (config.enabled && config.baseUrl) {
      fetch({ baseUrl: config.baseUrl, apiKey: config.apiKey })
    } else {
      setData(connectorStatusBySystem['kong'])
      setIsLive(false)
      setState('idle')
    }
  }, [config.enabled, config.baseUrl, config.apiKey, fetch])

  return {
    data,
    state,
    error,
    isLive,
    refetch: () => {
      if (config.enabled && config.baseUrl) {
        fetch({ baseUrl: config.baseUrl, apiKey: config.apiKey })
      }
    },
  }
}

// ─── useKongConnectorRegistry ─────────────────────────────────────────────────

export function useKongConnectorRegistry(): AsyncState<ConnectorRegistryEntry> {
  const { config } = useKongConfig()
  const [data, setData] = useState<ConnectorRegistryEntry>(
    mockConnectorRegistry.find(c => c.system === 'kong')!,
  )
  const [state, setState] = useState<FetchState>('idle')
  const [error, setError] = useState<string | null>(null)
  const [isLive, setIsLive] = useState(false)

  const fetch = useCallback(async (cfg: KongClientConfig) => {
    setState('loading')
    setError(null)
    const start = Date.now()
    try {
      const [info, status, withAcls] = await Promise.all([
        fetchKongInfo(cfg),
        fetchKongStatus(cfg),
        fetchConsumersWithAcls(cfg, 5),
      ])
      const durationMs = Date.now() - start

      const aclGroups = new Set<string>()
      for (const { acls } of withAcls) {
        for (const acl of acls) aclGroups.add(acl.group)
      }

      setData(
        toConnectorRegistryEntry(
          info,
          status,
          cfg.baseUrl,
          withAcls.length,
          aclGroups.size,
          new Date().toISOString(),
          durationMs,
        ),
      )
      setIsLive(true)
      setState('success')
    } catch (err) {
      const msg = err instanceof KongApiError
        ? `Kong API ${err.status}: ${err.statusText}`
        : err instanceof Error ? err.message : 'Unknown error'
      setError(msg)
      setState('error')
    }
  }, [])

  useEffect(() => {
    if (config.enabled && config.baseUrl) {
      fetch({ baseUrl: config.baseUrl, apiKey: config.apiKey })
    } else {
      setData(mockConnectorRegistry.find(c => c.system === 'kong')!)
      setIsLive(false)
      setState('idle')
    }
  }, [config.enabled, config.baseUrl, config.apiKey, fetch])

  return {
    data,
    state,
    error,
    isLive,
    refetch: () => {
      if (config.enabled && config.baseUrl) {
        fetch({ baseUrl: config.baseUrl, apiKey: config.apiKey })
      }
    },
  }
}

// ─── useKongAuditLog ──────────────────────────────────────────────────────────

export function useKongAuditLog(): AsyncState<AuditLogEntry[]> {
  const { config } = useKongConfig()
  const [data, setData] = useState<AuditLogEntry[]>(mockAuditLog)
  const [state, setState] = useState<FetchState>('idle')
  const [error, setError] = useState<string | null>(null)
  const [isLive, setIsLive] = useState(false)

  const fetch = useCallback(async (cfg: KongClientConfig) => {
    setState('loading')
    setError(null)
    const start = Date.now()
    try {
      const [withAcls, info] = await Promise.all([
        fetchConsumersWithAcls(cfg),
        fetchKongInfo(cfg),
      ])
      const durationMs = Date.now() - start
      const consumers = withAcls.map(w => w.consumer)
      const liveEntries = toAuditLog(consumers, withAcls, info, durationMs)
      // Merge: live Kong entries first, then mock entries for other systems
      const mockNonKong = mockAuditLog.filter(e => e.system && e.system !== 'kong')
      setData([...liveEntries, ...mockNonKong])
      setIsLive(true)
      setState('success')
    } catch (err) {
      const msg = err instanceof KongApiError
        ? `Kong API ${err.status}: ${err.statusText}`
        : err instanceof Error ? err.message : 'Unknown error'
      setError(msg)
      setState('error')
      setData(mockAuditLog)
      setIsLive(false)
    }
  }, [])

  useEffect(() => {
    if (config.enabled && config.baseUrl) {
      fetch({ baseUrl: config.baseUrl, apiKey: config.apiKey })
    } else {
      setData(mockAuditLog)
      setIsLive(false)
      setState('idle')
    }
  }, [config.enabled, config.baseUrl, config.apiKey, fetch])

  return {
    data,
    state,
    error,
    isLive,
    refetch: () => {
      if (config.enabled && config.baseUrl) {
        fetch({ baseUrl: config.baseUrl, apiKey: config.apiKey })
      }
    },
  }
}

// ─── useKongPrincipals ────────────────────────────────────────────────────────
// Returns the merged list of principals (enterprise users + Kong consumers)
// with live Kong consumers replacing mock ones when connected.

export function useKongPrincipals() {
  const assignments = useKongRoleAssignments()
  return {
    liveConsumers: assignments.isLive
      ? Array.from(
          new Map(
            assignments.data
              .filter(a => a.consumer)
              .map(a => [a.consumer!.id, a.consumer!]),
          ).values(),
        )
      : null,
    isLive: assignments.isLive,
    state: assignments.state,
    error: assignments.error,
    refetch: assignments.refetch,
  }
}

// ─── useKongEdition ───────────────────────────────────────────────────────────
// Detects whether the connected Kong instance is OSS or Enterprise.

import { detectEdition, fetchRbacUsers, fetchRbacRoles, fetchAuditRequests, fetchAuditObjects, fetchServices, fetchRoutes, fetchConsumerGroups, fetchPlugins } from '../api/kongClient'
import { auditRequestsToLog } from '../api/kongTransformers'
import type { KongService, KongRoute, KongConsumerGroup, KongPlugin } from '../api/kongClient'

export type KongEdition = 'enterprise' | 'oss' | 'unknown'

export function useKongEdition(): AsyncState<KongEdition> {
  const { config } = useKongConfig()
  const [data, setData] = useState<KongEdition>('unknown')
  const [state, setState] = useState<FetchState>('idle')
  const [error, setError] = useState<string | null>(null)
  const [isLive, setIsLive] = useState(false)

  const fetch = useCallback(async (cfg: KongClientConfig) => {
    setState('loading')
    try {
      const edition = await detectEdition(cfg)
      setData(edition)
      setIsLive(true)
      setState('success')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setState('error')
    }
  }, [])

  useEffect(() => {
    if (config.enabled && config.baseUrl) {
      fetch({ baseUrl: config.baseUrl, apiKey: config.apiKey })
    } else {
      setData('unknown')
      setIsLive(false)
      setState('idle')
    }
  }, [config.enabled, config.baseUrl, config.apiKey, fetch])

  return { data, state, error, isLive, refetch: () => { if (config.enabled) fetch({ baseUrl: config.baseUrl, apiKey: config.apiKey }) } }
}

// ─── useKongServices ──────────────────────────────────────────────────────────

export function useKongServices(): AsyncState<KongService[]> {
  const { config } = useKongConfig()
  const [data, setData] = useState<KongService[]>([])
  const [state, setState] = useState<FetchState>('idle')
  const [error, setError] = useState<string | null>(null)
  const [isLive, setIsLive] = useState(false)

  const fetch = useCallback(async (cfg: KongClientConfig) => {
    setState('loading')
    setError(null)
    try {
      const services = await fetchServices(cfg)
      setData(services)
      setIsLive(true)
      setState('success')
    } catch (err) {
      const msg = err instanceof KongApiError ? `Kong API ${err.status}: ${err.statusText}` : err instanceof Error ? err.message : 'Unknown error'
      setError(msg)
      setState('error')
    }
  }, [])

  useEffect(() => {
    if (config.enabled && config.baseUrl) fetch({ baseUrl: config.baseUrl, apiKey: config.apiKey })
    else { setData([]); setIsLive(false); setState('idle') }
  }, [config.enabled, config.baseUrl, config.apiKey, fetch])

  return { data, state, error, isLive, refetch: () => { if (config.enabled) fetch({ baseUrl: config.baseUrl, apiKey: config.apiKey }) } }
}

// ─── useKongRoutes ────────────────────────────────────────────────────────────

export function useKongRoutes(): AsyncState<KongRoute[]> {
  const { config } = useKongConfig()
  const [data, setData] = useState<KongRoute[]>([])
  const [state, setState] = useState<FetchState>('idle')
  const [error, setError] = useState<string | null>(null)
  const [isLive, setIsLive] = useState(false)

  const fetch = useCallback(async (cfg: KongClientConfig) => {
    setState('loading')
    setError(null)
    try {
      const routes = await fetchRoutes(cfg)
      setData(routes)
      setIsLive(true)
      setState('success')
    } catch (err) {
      const msg = err instanceof KongApiError ? `Kong API ${err.status}: ${err.statusText}` : err instanceof Error ? err.message : 'Unknown error'
      setError(msg)
      setState('error')
    }
  }, [])

  useEffect(() => {
    if (config.enabled && config.baseUrl) fetch({ baseUrl: config.baseUrl, apiKey: config.apiKey })
    else { setData([]); setIsLive(false); setState('idle') }
  }, [config.enabled, config.baseUrl, config.apiKey, fetch])

  return { data, state, error, isLive, refetch: () => { if (config.enabled) fetch({ baseUrl: config.baseUrl, apiKey: config.apiKey }) } }
}

// ─── useKongConsumerGroups ────────────────────────────────────────────────────

export function useKongConsumerGroups(): AsyncState<KongConsumerGroup[]> {
  const { config } = useKongConfig()
  const [data, setData] = useState<KongConsumerGroup[]>([])
  const [state, setState] = useState<FetchState>('idle')
  const [error, setError] = useState<string | null>(null)
  const [isLive, setIsLive] = useState(false)

  const fetch = useCallback(async (cfg: KongClientConfig) => {
    setState('loading')
    setError(null)
    try {
      const groups = await fetchConsumerGroups(cfg)
      setData(groups)
      setIsLive(true)
      setState('success')
    } catch (err) {
      const msg = err instanceof KongApiError ? `Kong API ${err.status}: ${err.statusText}` : err instanceof Error ? err.message : 'Unknown error'
      setError(msg)
      setState('error')
    }
  }, [])

  useEffect(() => {
    if (config.enabled && config.baseUrl) fetch({ baseUrl: config.baseUrl, apiKey: config.apiKey })
    else { setData([]); setIsLive(false); setState('idle') }
  }, [config.enabled, config.baseUrl, config.apiKey, fetch])

  return { data, state, error, isLive, refetch: () => { if (config.enabled) fetch({ baseUrl: config.baseUrl, apiKey: config.apiKey }) } }
}

// ─── useKongPlugins ───────────────────────────────────────────────────────────

export function useKongPlugins(): AsyncState<KongPlugin[]> {
  const { config } = useKongConfig()
  const [data, setData] = useState<KongPlugin[]>([])
  const [state, setState] = useState<FetchState>('idle')
  const [error, setError] = useState<string | null>(null)
  const [isLive, setIsLive] = useState(false)

  const fetch = useCallback(async (cfg: KongClientConfig) => {
    setState('loading')
    setError(null)
    try {
      const plugins = await fetchPlugins(cfg)
      setData(plugins)
      setIsLive(true)
      setState('success')
    } catch (err) {
      const msg = err instanceof KongApiError ? `Kong API ${err.status}: ${err.statusText}` : err instanceof Error ? err.message : 'Unknown error'
      setError(msg)
      setState('error')
    }
  }, [])

  useEffect(() => {
    if (config.enabled && config.baseUrl) fetch({ baseUrl: config.baseUrl, apiKey: config.apiKey })
    else { setData([]); setIsLive(false); setState('idle') }
  }, [config.enabled, config.baseUrl, config.apiKey, fetch])

  return { data, state, error, isLive, refetch: () => { if (config.enabled) fetch({ baseUrl: config.baseUrl, apiKey: config.apiKey }) } }
}

// ─── useKongRbac (EE only) ────────────────────────────────────────────────────
// Returns RBAC users + roles. Returns null data when on OSS.

export interface KongRbacData {
  users: import('../api/kongClient').KongRbacUser[]
  roles: import('../api/kongClient').KongRbacRole[]
  isEnterprise: boolean
}

export function useKongRbac(): AsyncState<KongRbacData | null> {
  const { config } = useKongConfig()
  const [data, setData] = useState<KongRbacData | null>(null)
  const [state, setState] = useState<FetchState>('idle')
  const [error, setError] = useState<string | null>(null)
  const [isLive, setIsLive] = useState(false)

  const fetch = useCallback(async (cfg: KongClientConfig) => {
    setState('loading')
    setError(null)
    try {
      const [users, roles] = await Promise.all([
        fetchRbacUsers(cfg),
        fetchRbacRoles(cfg),
      ])
      if (users === null || roles === null) {
        setData({ users: [], roles: [], isEnterprise: false })
      } else {
        setData({ users, roles, isEnterprise: true })
      }
      setIsLive(true)
      setState('success')
    } catch (err) {
      const msg = err instanceof KongApiError ? `Kong API ${err.status}: ${err.statusText}` : err instanceof Error ? err.message : 'Unknown error'
      setError(msg)
      setState('error')
    }
  }, [])

  useEffect(() => {
    if (config.enabled && config.baseUrl) fetch({ baseUrl: config.baseUrl, apiKey: config.apiKey })
    else { setData(null); setIsLive(false); setState('idle') }
  }, [config.enabled, config.baseUrl, config.apiKey, fetch])

  return { data, state, error, isLive, refetch: () => { if (config.enabled) fetch({ baseUrl: config.baseUrl, apiKey: config.apiKey }) } }
}

// ─── useKongRealAuditLog (EE only, falls back to derived log) ─────────────────

export function useKongRealAuditLog(): AsyncState<AuditLogEntry[]> & { isEnterprise: boolean } {
  const { config } = useKongConfig()
  const [data, setData] = useState<AuditLogEntry[]>(mockAuditLog)
  const [state, setState] = useState<FetchState>('idle')
  const [error, setError] = useState<string | null>(null)
  const [isLive, setIsLive] = useState(false)
  const [isEnterprise, setIsEnterprise] = useState(false)

  const fetch = useCallback(async (cfg: KongClientConfig) => {
    setState('loading')
    setError(null)
    const start = Date.now()
    try {
      // Try EE audit endpoints first
      const [auditReqs, auditObjs, withAcls, info] = await Promise.all([
        fetchAuditRequests(cfg),
        fetchAuditObjects(cfg),
        fetchConsumersWithAcls(cfg),
        fetchKongInfo(cfg),
      ])

      if (auditReqs !== null) {
        // EE: real audit log
        const liveEntries = auditRequestsToLog(auditReqs, auditObjs ?? [])
        const mockNonKong = mockAuditLog.filter(e => e.system && e.system !== 'kong')
        setData([...liveEntries, ...mockNonKong])
        setIsEnterprise(true)
      } else {
        // OSS: derive from consumer/ACL sync
        const durationMs = Date.now() - start
        const consumers = withAcls.map(w => w.consumer)
        const liveEntries = toAuditLog(consumers, withAcls, info, durationMs)
        const mockNonKong = mockAuditLog.filter(e => e.system && e.system !== 'kong')
        setData([...liveEntries, ...mockNonKong])
        setIsEnterprise(false)
      }
      setIsLive(true)
      setState('success')
    } catch (err) {
      const msg = err instanceof KongApiError ? `Kong API ${err.status}: ${err.statusText}` : err instanceof Error ? err.message : 'Unknown error'
      setError(msg)
      setState('error')
      setData(mockAuditLog)
      setIsLive(false)
    }
  }, [])

  useEffect(() => {
    if (config.enabled && config.baseUrl) fetch({ baseUrl: config.baseUrl, apiKey: config.apiKey })
    else { setData(mockAuditLog); setIsLive(false); setState('idle') }
  }, [config.enabled, config.baseUrl, config.apiKey, fetch])

  return {
    data, state, error, isLive, isEnterprise,
    refetch: () => { if (config.enabled) fetch({ baseUrl: config.baseUrl, apiKey: config.apiKey }) },
  }
}
