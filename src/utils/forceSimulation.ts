import type { GraphNode, GraphEdge } from './buildGraphData'

// ─── Force-directed layout simulation ────────────────────────────────────────
// A minimal but effective implementation of:
//   - Repulsion between all node pairs (Coulomb)
//   - Attraction along edges (Hooke's spring)
//   - Centering force
//   - Velocity damping

const REPULSION    = 4000
const SPRING_LEN   = 120
const SPRING_K     = 0.04
const CENTER_K     = 0.008
const DAMPING      = 0.82
const MIN_DIST     = 1

export function tickSimulation(
  nodes: GraphNode[],
  edges: GraphEdge[],
  width: number,
  height: number
): void {
  const cx = width / 2
  const cy = height / 2

  // Build edge lookup for O(1) neighbour check
  const edgeMap = new Map<string, Set<string>>()
  edges.forEach(e => {
    if (!edgeMap.has(e.source)) edgeMap.set(e.source, new Set())
    if (!edgeMap.has(e.target)) edgeMap.set(e.target, new Set())
    edgeMap.get(e.source)!.add(e.target)
    edgeMap.get(e.target)!.add(e.source)
  })

  // Repulsion: every pair
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i]
      const b = nodes[j]
      const dx = b.x - a.x
      const dy = b.y - a.y
      const dist = Math.max(Math.sqrt(dx * dx + dy * dy), MIN_DIST)
      const force = REPULSION / (dist * dist)
      const fx = (dx / dist) * force
      const fy = (dy / dist) * force
      a.vx -= fx
      a.vy -= fy
      b.vx += fx
      b.vy += fy
    }
  }

  // Spring attraction along edges
  edges.forEach(e => {
    const src = nodes.find(n => n.id === e.source)
    const tgt = nodes.find(n => n.id === e.target)
    if (!src || !tgt) return
    const dx = tgt.x - src.x
    const dy = tgt.y - src.y
    const dist = Math.max(Math.sqrt(dx * dx + dy * dy), MIN_DIST)
    const stretch = dist - SPRING_LEN
    const force = SPRING_K * stretch
    const fx = (dx / dist) * force
    const fy = (dy / dist) * force
    src.vx += fx
    src.vy += fy
    tgt.vx -= fx
    tgt.vy -= fy
  })

  // Centering force
  nodes.forEach(n => {
    n.vx += (cx - n.x) * CENTER_K
    n.vy += (cy - n.y) * CENTER_K
  })

  // Integrate + damp
  nodes.forEach(n => {
    n.vx *= DAMPING
    n.vy *= DAMPING
    n.x += n.vx
    n.y += n.vy
  })
}
