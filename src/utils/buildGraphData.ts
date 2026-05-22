import type { RoleAssignment, Role, Consumer, EnterpriseUser, SystemType } from '../types/domain'

// ─── Node & Edge types ────────────────────────────────────────────────────────

export type NodeType =
  | 'consumer'
  | 'enterprise-user'
  | 'role'
  | 'aclGroup'
  | 'environment'
  | 'system'

export interface GraphNode {
  id: string
  label: string
  type: NodeType
  x: number
  y: number
  vx: number
  vy: number
  meta: Record<string, string | number | boolean>
}

export type EdgeType =
  | 'has_role'
  | 'maps_to'
  | 'sod_conflict'
  | 'belongs_to_env'
  | 'belongs_to_system'

export interface GraphEdge {
  id: string
  source: string
  target: string
  type: EdgeType
  label?: string
}

export interface GraphData {
  nodes: GraphNode[]
  edges: GraphEdge[]
}

// ─── Colour palette ───────────────────────────────────────────────────────────

export const SYSTEM_COLORS: Record<string, string> = {
  'kong':          '#f59e0b',
  'azure-ad':      '#0078d4',
  'sap-btp':       '#0070f2',
  'ado-pipelines': '#68217a',
  'custom':        '#6366f1',
}

export const NODE_COLORS: Record<NodeType, string> = {
  'consumer':        '#6366f1',
  'enterprise-user': '#10b981',
  'role':            '#8b5cf6',
  'aclGroup':        '#0ea5e9',
  'environment':     '#64748b',
  'system':          '#f59e0b',
}

export const EDGE_COLORS: Record<EdgeType, string> = {
  has_role:          '#6366f1',
  maps_to:           '#0ea5e9',
  sod_conflict:      '#ef4444',
  belongs_to_env:    '#94a3b8',
  belongs_to_system: '#f59e0b',
}

export const NODE_RADIUS: Record<NodeType, number> = {
  system:            24,
  environment:       16,
  aclGroup:          13,
  role:              12,
  'enterprise-user': 11,
  consumer:          10,
}

export const SYSTEM_LABELS: Record<string, string> = {
  'kong':          'Kong API GW',
  'azure-ad':      'Azure AD',
  'sap-btp':       'SAP BTP',
  'ado-pipelines': 'ADO Pipelines',
  'custom':        'Custom',
}

// ─── Builder ──────────────────────────────────────────────────────────────────

function rnd(min: number, max: number) {
  return min + Math.random() * (max - min)
}

export interface GraphBuildOptions {
  showEnvironmentNodes?: boolean
  showSystemNodes?: boolean
  showAclGroups?: boolean
  showSodEdges?: boolean
  filterPrincipal?: string
  filterRole?: string
  filterEnvironment?: string
  filterPrivilege?: string
  filterSystem?: SystemType | 'all'
  filterPrincipalType?: 'all' | 'consumer' | 'enterprise-user'
}

export function buildGraphData(
  assignments: RoleAssignment[],
  allRoles: Role[],
  _allConsumers: Consumer[],
  options: GraphBuildOptions = {}
): GraphData {
  const {
    showEnvironmentNodes = false,
    showSystemNodes = true,
    showAclGroups = false,
    showSodEdges = true,
    filterPrincipal = '',
    filterRole = '',
    filterEnvironment = 'all',
    filterPrivilege = 'all',
    filterSystem = 'all',
    filterPrincipalType = 'all',
  } = options

  const nodes = new Map<string, GraphNode>()
  const edges: GraphEdge[] = []
  const edgeSet = new Set<string>()

  function addNode(node: GraphNode) {
    if (!nodes.has(node.id)) nodes.set(node.id, node)
  }

  function addEdge(edge: GraphEdge) {
    const key = `${edge.source}→${edge.target}→${edge.type}`
    if (!edgeSet.has(key)) {
      edgeSet.add(key)
      edges.push(edge)
    }
  }

  // System nodes — one per connected system
  const systems: SystemType[] = ['kong', 'azure-ad', 'sap-btp', 'ado-pipelines']
  if (showSystemNodes) {
    systems.forEach((sys, i) => {
      if (filterSystem !== 'all' && sys !== filterSystem) return
      const angle = (i / systems.length) * Math.PI * 2
      addNode({
        id: `system:${sys}`,
        label: SYSTEM_LABELS[sys],
        type: 'system',
        x: Math.cos(angle) * 220, y: Math.sin(angle) * 220,
        vx: 0, vy: 0,
        meta: { system: sys, color: SYSTEM_COLORS[sys] },
      })
    })
  }

  // Environment nodes
  if (showEnvironmentNodes) {
    const envs = ['production', 'staging', 'development'] as const
    envs.forEach((env, i) => {
      const angle = (i / envs.length) * Math.PI * 2
      addNode({
        id: `env:${env}`,
        label: env,
        type: 'environment',
        x: Math.cos(angle) * 120, y: Math.sin(angle) * 120,
        vx: 0, vy: 0,
        meta: { environment: env },
      })
    })
  }

  // Filter assignments
  let filtered = assignments.filter(a => a.isActive || a.lifecycleStage === 'deprovisioned')
  if (filterEnvironment !== 'all') {
    filtered = filtered.filter(a => {
      const env = a.consumer?.environment ?? a.enterpriseUser?.environment
      return env === filterEnvironment
    })
  }
  if (filterPrivilege !== 'all') filtered = filtered.filter(a => a.role.privilegeLevel === filterPrivilege)
  if (filterSystem !== 'all') filtered = filtered.filter(a => a.role.system === filterSystem)
  if (filterPrincipalType !== 'all') filtered = filtered.filter(a => a.principalType === filterPrincipalType)
  if (filterPrincipal) {
    filtered = filtered.filter(a => {
      const name = a.consumer?.username ?? a.enterpriseUser?.displayName ?? ''
      return name.toLowerCase().includes(filterPrincipal.toLowerCase())
    })
  }
  if (filterRole) {
    filtered = filtered.filter(a => a.role.name.toLowerCase().includes(filterRole.toLowerCase()))
  }

  // Build nodes and edges
  filtered.forEach(a => {
    const { role } = a
    const principalNodeId = `principal:${a.principalId}`
    const roleSystem = role.system

    // Principal node
    if (a.principalType === 'enterprise-user' && a.enterpriseUser) {
      const eu: EnterpriseUser = a.enterpriseUser
      addNode({
        id: principalNodeId,
        label: eu.displayName,
        type: 'enterprise-user',
        x: rnd(-350, 350), y: rnd(-350, 350), vx: 0, vy: 0,
        meta: {
          id: eu.id,
          email: eu.email,
          department: eu.department,
          jobTitle: eu.jobTitle,
          userType: eu.userType,
          status: eu.status,
          environment: eu.environment,
        },
      })
    } else if (a.consumer) {
      const con: Consumer = a.consumer
      addNode({
        id: principalNodeId,
        label: con.username,
        type: 'consumer',
        x: rnd(-350, 350), y: rnd(-350, 350), vx: 0, vy: 0,
        meta: {
          id: con.id,
          system: con.system,
          environment: con.environment,
        },
      })
    }

    // Role node — colour hint stored in meta
    addNode({
      id: `role:${role.id}`,
      label: role.name,
      type: 'role',
      x: rnd(-250, 250), y: rnd(-250, 250), vx: 0, vy: 0,
      meta: {
        id: role.id,
        system: roleSystem,
        privilegeLevel: role.privilegeLevel,
        isHighPrivilege: role.isHighPrivilege,
        owner: role.owner ?? 'Unowned',
        environment: role.environment,
        assignmentCount: role.assignmentCount,
        description: role.description ?? '',
        systemColor: SYSTEM_COLORS[roleSystem],
      },
    })

    // Principal → Role
    addEdge({
      id: `has_role:${a.principalId}:${role.id}`,
      source: principalNodeId,
      target: `role:${role.id}`,
      type: 'has_role',
      label: a.severity,
    })

    // Role → System
    if (showSystemNodes && nodes.has(`system:${roleSystem}`)) {
      addEdge({
        id: `sys:${role.id}:${roleSystem}`,
        source: `role:${role.id}`,
        target: `system:${roleSystem}`,
        type: 'belongs_to_system',
      })
    }

    // ACL Group node
    if (showAclGroups) {
      addNode({
        id: `acl:${role.aclGroup}`,
        label: role.aclGroup,
        type: 'aclGroup',
        x: rnd(-150, 150), y: rnd(-150, 150), vx: 0, vy: 0,
        meta: { aclGroup: role.aclGroup, system: roleSystem },
      })
      addEdge({
        id: `maps_to:${role.id}:${role.aclGroup}`,
        source: `role:${role.id}`,
        target: `acl:${role.aclGroup}`,
        type: 'maps_to',
      })
    }

    // Principal → Environment
    if (showEnvironmentNodes) {
      const env = a.consumer?.environment ?? a.enterpriseUser?.environment
      if (env) {
        addEdge({
          id: `env:${a.principalId}:${env}`,
          source: principalNodeId,
          target: `env:${env}`,
          type: 'belongs_to_env',
        })
      }
    }
  })

  // SoD conflict edges
  if (showSodEdges) {
    allRoles.forEach(role => {
      if (!nodes.has(`role:${role.id}`)) return
      role.sodConflicts.forEach(conflict => {
        const targetId = `role:${conflict.roleB}`
        if (nodes.has(targetId)) {
          addEdge({
            id: `sod:${conflict.id}`,
            source: `role:${role.id}`,
            target: targetId,
            type: 'sod_conflict',
            label: conflict.classification,
          })
        }
      })
    })
  }

  return { nodes: Array.from(nodes.values()), edges }
}
