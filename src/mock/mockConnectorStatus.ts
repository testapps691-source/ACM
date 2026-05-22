import type { ConnectorStatus } from '../types/domain'

const minsAgo = (m: number) => new Date(Date.now() - m * 60000).toISOString()

export const mockConnectorStatus: ConnectorStatus = {
  health: 'healthy',
  lastSyncAt: minsAgo(4),
  lastSyncDurationMs: 1240,
  pendingSyncItems: 0,
  system: 'kong',
}

export const mockConnectorStatusDegraded: ConnectorStatus = {
  health: 'degraded',
  lastSyncAt: minsAgo(18),
  lastSyncDurationMs: 8500,
  pendingSyncItems: 3,
  errorMessage: 'Partial sync: 3 consumers could not be retrieved (HTTP 429 rate limit).',
  system: 'kong',
}

export const mockConnectorStatusUnhealthy: ConnectorStatus = {
  health: 'unhealthy',
  lastSyncAt: minsAgo(45),
  lastSyncDurationMs: 0,
  pendingSyncItems: 0,
  errorMessage: 'Connection refused: Kong Admin API unreachable at https://kong-admin.acme.com:8001',
  system: 'kong',
}

// ─── Per-system connector statuses ───────────────────────────────────────────

export const connectorStatusBySystem: Record<string, ConnectorStatus> = {
  'kong': {
    health: 'healthy',
    lastSyncAt: minsAgo(4),
    lastSyncDurationMs: 1240,
    pendingSyncItems: 0,
    system: 'kong',
  },
  'azure-ad': {
    health: 'healthy',
    lastSyncAt: minsAgo(2),
    lastSyncDurationMs: 980,
    pendingSyncItems: 0,
    system: 'azure-ad',
  },
  'sap-btp': {
    health: 'degraded',
    lastSyncAt: minsAgo(18),
    lastSyncDurationMs: 8500,
    pendingSyncItems: 3,
    errorMessage: 'Elevated latency: SAP BTP API responding slowly (HTTP 429 rate limit on 3 requests)',
    system: 'sap-btp',
  },
  'ado-pipelines': {
    health: 'healthy',
    lastSyncAt: minsAgo(6),
    lastSyncDurationMs: 1560,
    pendingSyncItems: 0,
    system: 'ado-pipelines',
  },
}
