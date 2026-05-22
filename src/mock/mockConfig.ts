import type { KongConfig } from '../types/domain'

export const mockCurrentUser = {
  username: 'alice@acme.com',
  role: 'admin' as 'admin' | 'viewer',
}

export const mockConfigs: KongConfig[] = [
  {
    id: 'cfg-1',
    baseUrl: 'https://kong-admin.acme.com:8001',
    authMethod: 'api-key',
    credential: '••••••••••••••••',
    tlsEnabled: true,
    endpointMappings: [
      { resource: 'consumers', path: '/consumers' },
      { resource: 'acls', path: '/acls' },
      { resource: 'plugins', path: '/plugins' },
    ],
    savedAt: '2026-03-01T10:00:00Z',
    savedBy: 'alice@acme.com',
  },
  {
    id: 'cfg-2',
    baseUrl: 'https://kong-admin.acme.com:8001',
    authMethod: 'api-key',
    credential: '••••••••••••••••',
    tlsEnabled: true,
    endpointMappings: [
      { resource: 'consumers', path: '/consumers' },
      { resource: 'acls', path: '/acls' },
      { resource: 'plugins', path: '/plugins' },
    ],
    savedAt: '2026-04-01T14:00:00Z',
    savedBy: 'bob@acme.com',
  },
  {
    id: 'cfg-3',
    baseUrl: 'https://kong-admin-v2.acme.com:8001',
    authMethod: 'bearer-token',
    credential: '••••••••••••••••',
    tlsEnabled: true,
    endpointMappings: [
      { resource: 'consumers', path: '/consumers' },
      { resource: 'acls', path: '/acls' },
      { resource: 'plugins', path: '/plugins' },
    ],
    savedAt: '2026-05-01T09:00:00Z',
    savedBy: 'alice@acme.com',
  },
]
