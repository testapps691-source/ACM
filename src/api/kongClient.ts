// ─── Kong Admin API Client ────────────────────────────────────────────────────
// Supports two config sources (in priority order):
//   1. Runtime config — URL + token entered by the user in App Config UI
//   2. Build-time env vars — VITE_KONG_API_URL / VITE_KONG_API_KEY in .env.local
//
// EE-only endpoints (RBAC, Audit, Workspaces) are called with tryEE=true and
// return null instead of throwing when the endpoint returns 404/403.

export interface KongClientConfig {
  baseUrl: string
  apiKey: string
}

function getEnvConfig(): KongClientConfig {
  return {
    baseUrl: (import.meta.env.VITE_KONG_API_URL as string | undefined) ?? '/kong-api',
    apiKey: (import.meta.env.VITE_KONG_API_KEY as string | undefined) ?? '',
  }
}

// ─── Fetch helpers ────────────────────────────────────────────────────────────

async function kongFetch<T>(
  path: string,
  cfg?: KongClientConfig,
  options?: RequestInit,
): Promise<T> {
  const { baseUrl, apiKey } = cfg ?? getEnvConfig()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(apiKey ? { apikey: apiKey } : {}),
  }
  const res = await fetch(`${baseUrl}${path}`, { ...options, headers })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new KongApiError(res.status, res.statusText, text)
  }
  return res.json() as Promise<T>
}

/** Like kongFetch but returns null for 404/403 (EE-only endpoints on OSS). */
async function kongFetchOptional<T>(
  path: string,
  cfg?: KongClientConfig,
): Promise<T | null> {
  try {
    return await kongFetch<T>(path, cfg)
  } catch (err) {
    if (err instanceof KongApiError && (err.status === 404 || err.status === 403)) {
      return null
    }
    throw err
  }
}

export class KongApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly statusText: string,
    public readonly body: string,
  ) {
    super(`Kong API ${status} ${statusText}`)
    this.name = 'KongApiError'
  }
}

interface KongPage<T> {
  data: T[]
  next: string | null
  offset?: string
}

async function fetchAllPages<T>(
  path: string,
  cfg?: KongClientConfig,
  pageSize = 100,
): Promise<T[]> {
  const { baseUrl } = cfg ?? getEnvConfig()
  const results: T[] = []
  let url = `${path}?size=${pageSize}`
  while (url) {
    const page = await kongFetch<KongPage<T>>(url, cfg)
    results.push(...page.data)
    url = page.next ? page.next.replace(baseUrl, '') : ''
  }
  return results
}

async function fetchAllPagesOptional<T>(
  path: string,
  cfg?: KongClientConfig,
  pageSize = 100,
): Promise<T[] | null> {
  try {
    return await fetchAllPages<T>(path, cfg, pageSize)
  } catch (err) {
    if (err instanceof KongApiError && (err.status === 404 || err.status === 403)) {
      return null
    }
    throw err
  }
}

// ─── Response types ───────────────────────────────────────────────────────────

export interface KongConsumer {
  id: string
  username: string
  custom_id?: string
  created_at: number
  tags?: string[]
}

export interface KongAcl {
  id: string
  group: string
  consumer: { id: string }
  created_at: number
  tags?: string[]
}

export interface KongConsumerGroup {
  id: string
  name: string
  created_at: number
  tags?: string[]
}

export interface KongConsumerGroupMember {
  id: string
  username: string
  custom_id?: string
  created_at: number
}

export interface KongPlugin {
  id: string
  name: string
  enabled: boolean
  service?: { id: string; name?: string }
  route?: { id: string; name?: string }
  consumer?: { id: string }
  config: Record<string, unknown>
  tags?: string[]
  created_at: number
}

export interface KongService {
  id: string
  name: string
  host: string
  port: number
  protocol: string
  path?: string
  enabled: boolean
  tags?: string[]
  created_at: number
}

export interface KongRoute {
  id: string
  name?: string
  paths?: string[]
  methods?: string[]
  hosts?: string[]
  service?: { id: string }
  tags?: string[]
  created_at: number
}

export interface KongUpstream {
  id: string
  name: string
  algorithm: string
  slots: number
  tags?: string[]
  created_at: number
}

export interface KongTarget {
  id: string
  target: string
  weight: number
  upstream: { id: string }
  created_at: number
}

export interface KongNodeStatus {
  database: { reachable: boolean }
  server: {
    connections_active: number
    connections_accepted: number
    connections_handled: number
    connections_reading: number
    connections_writing: number
    connections_waiting: number
    total_requests: number
  }
  memory: {
    workers_lua_vms: Record<string, { http_allocated_gc: string; pid: number }>
    lua_shared_dicts: Record<string, { capacity: string; allocated_slabs: string }>
  }
}

export interface KongNodeInfo {
  version: string
  hostname: string
  node_id: string
  lua_version: string
  plugins: { available_on_server: Record<string, unknown>; enabled_in_cluster: string[] }
  configuration: Record<string, unknown>
}

// ─── EE-only types ────────────────────────────────────────────────────────────

export interface KongRbacUser {
  id: string
  name: string
  user_token: string
  enabled: boolean
  comment?: string
  created_at: number
}

export interface KongRbacRole {
  id: string
  name: string
  comment?: string
  is_default: boolean
  created_at: number
}

export interface KongRbacUserRole {
  user: { id: string; name: string }
  role: { id: string; name: string }
  workspace: string
  created_at: number
}

export interface KongRbacEndpointPermission {
  role: { id: string }
  workspace: string
  endpoint: string
  actions: string[]
  negative: boolean
  created_at: number
}

export interface KongAuditRequest {
  request_id: string
  client_ip: string
  method: string
  path: string
  payload?: string
  status: number
  rbac_user_id?: string
  workspace?: string
  signature?: string
  ttl?: number
  removed_from_payload?: Record<string, unknown>
  created_at: number
}

export interface KongAuditObject {
  id: string
  request_id?: string
  entity_key: string
  dao_name: string
  operation: 'create' | 'update' | 'delete'
  entity?: Record<string, unknown>
  rbac_user_id?: string
  workspace?: string
  created_at: number
}

export interface KongWorkspace {
  id: string
  name: string
  comment?: string
  created_at: number
  meta?: {
    counts?: Record<string, number>
  }
}

// ─── OSS endpoints ────────────────────────────────────────────────────────────

export async function fetchKongInfo(cfg?: KongClientConfig): Promise<KongNodeInfo> {
  return kongFetch<KongNodeInfo>('/', cfg)
}

export async function fetchKongStatus(cfg?: KongClientConfig): Promise<KongNodeStatus> {
  return kongFetch<KongNodeStatus>('/status', cfg)
}

export async function fetchConsumers(cfg?: KongClientConfig): Promise<KongConsumer[]> {
  return fetchAllPages<KongConsumer>('/consumers', cfg)
}

export async function fetchConsumer(id: string, cfg?: KongClientConfig): Promise<KongConsumer> {
  return kongFetch<KongConsumer>(`/consumers/${encodeURIComponent(id)}`, cfg)
}

export async function fetchConsumerAcls(
  consumerId: string,
  cfg?: KongClientConfig,
): Promise<KongAcl[]> {
  const page = await kongFetch<KongPage<KongAcl>>(
    `/consumers/${encodeURIComponent(consumerId)}/acls`,
    cfg,
  )
  return page.data
}

/** Fetch all ACLs in one call — faster than per-consumer fetches. */
export async function fetchAllAcls(cfg?: KongClientConfig): Promise<KongAcl[]> {
  return fetchAllPages<KongAcl>('/acls', cfg)
}

/** Fetch consumers + ACLs efficiently using the global /acls endpoint. */
export async function fetchConsumersWithAcls(
  cfg?: KongClientConfig,
  batchSize = 10,
): Promise<{ consumer: KongConsumer; acls: KongAcl[] }[]> {
  const [consumers, allAcls] = await Promise.all([
    fetchConsumers(cfg),
    fetchAllAcls(cfg).catch(() => null), // fallback to per-consumer if /acls unavailable
  ])

  if (allAcls) {
    // Group ACLs by consumer ID — O(n) single pass
    const aclMap = new Map<string, KongAcl[]>()
    for (const acl of allAcls) {
      const list = aclMap.get(acl.consumer.id) ?? []
      list.push(acl)
      aclMap.set(acl.consumer.id, list)
    }
    return consumers.map(consumer => ({
      consumer,
      acls: aclMap.get(consumer.id) ?? [],
    }))
  }

  // Fallback: per-consumer ACL fetch in batches
  const results: { consumer: KongConsumer; acls: KongAcl[] }[] = []
  for (let i = 0; i < consumers.length; i += batchSize) {
    const batch = consumers.slice(i, i + batchSize)
    const batchResults = await Promise.all(
      batch.map(async consumer => ({
        consumer,
        acls: await fetchConsumerAcls(consumer.id, cfg).catch(() => []),
      })),
    )
    results.push(...batchResults)
  }
  return results
}

export async function fetchConsumerGroups(
  cfg?: KongClientConfig,
): Promise<KongConsumerGroup[]> {
  return fetchAllPages<KongConsumerGroup>('/consumer_groups', cfg)
}

export async function fetchConsumerGroupMembers(
  groupId: string,
  cfg?: KongClientConfig,
): Promise<KongConsumerGroupMember[]> {
  const page = await kongFetch<KongPage<KongConsumerGroupMember>>(
    `/consumer_groups/${encodeURIComponent(groupId)}/consumers`,
    cfg,
  )
  return page.data
}

export async function fetchPlugins(cfg?: KongClientConfig): Promise<KongPlugin[]> {
  return fetchAllPages<KongPlugin>('/plugins', cfg)
}

export async function fetchServices(cfg?: KongClientConfig): Promise<KongService[]> {
  return fetchAllPages<KongService>('/services', cfg)
}

export async function fetchRoutes(cfg?: KongClientConfig): Promise<KongRoute[]> {
  return fetchAllPages<KongRoute>('/routes', cfg)
}

export async function fetchUpstreams(cfg?: KongClientConfig): Promise<KongUpstream[]> {
  return fetchAllPages<KongUpstream>('/upstreams', cfg)
}

export async function fetchTargets(
  upstreamId: string,
  cfg?: KongClientConfig,
): Promise<KongTarget[]> {
  return fetchAllPages<KongTarget>(`/upstreams/${encodeURIComponent(upstreamId)}/targets`, cfg)
}

// ─── EE-only endpoints (return null on OSS) ───────────────────────────────────

export async function fetchRbacUsers(
  cfg?: KongClientConfig,
): Promise<KongRbacUser[] | null> {
  return fetchAllPagesOptional<KongRbacUser>('/rbac/users', cfg)
}

export async function fetchRbacRoles(
  cfg?: KongClientConfig,
): Promise<KongRbacRole[] | null> {
  return fetchAllPagesOptional<KongRbacRole>('/rbac/roles', cfg)
}

export async function fetchRbacUserRoles(
  userId: string,
  cfg?: KongClientConfig,
): Promise<KongRbacUserRole[] | null> {
  const res = await kongFetchOptional<{ roles: KongRbacUserRole[] }>(
    `/rbac/users/${encodeURIComponent(userId)}/roles`,
    cfg,
  )
  return res?.roles ?? null
}

export async function fetchRbacRoleEndpoints(
  roleId: string,
  cfg?: KongClientConfig,
): Promise<KongRbacEndpointPermission[] | null> {
  const res = await kongFetchOptional<{ endpoints: KongRbacEndpointPermission[] }>(
    `/rbac/roles/${encodeURIComponent(roleId)}/endpoints`,
    cfg,
  )
  return res?.endpoints ?? null
}

export async function fetchAuditRequests(
  cfg?: KongClientConfig,
): Promise<KongAuditRequest[] | null> {
  return fetchAllPagesOptional<KongAuditRequest>('/audit/requests', cfg)
}

export async function fetchAuditObjects(
  cfg?: KongClientConfig,
): Promise<KongAuditObject[] | null> {
  return fetchAllPagesOptional<KongAuditObject>('/audit/objects', cfg)
}

export async function fetchWorkspaces(
  cfg?: KongClientConfig,
): Promise<KongWorkspace[] | null> {
  return fetchAllPagesOptional<KongWorkspace>('/workspaces', cfg)
}

/** Detect whether the connected instance is Enterprise edition. */
export async function detectEdition(
  cfg?: KongClientConfig,
): Promise<'enterprise' | 'oss'> {
  const result = await kongFetchOptional<unknown>('/rbac/users', cfg)
  return result !== null ? 'enterprise' : 'oss'
}
