import {
  useRef, useEffect, useCallback, useState, type MouseEvent, type WheelEvent,
} from 'react'
import type { GraphData, GraphNode, GraphEdge } from '../../utils/buildGraphData'
import { NODE_COLORS, EDGE_COLORS, NODE_RADIUS } from '../../utils/buildGraphData'
import { tickSimulation } from '../../utils/forceSimulation'

interface TooltipState {
  x: number
  y: number
  node: GraphNode
}

interface AccessGraphProps {
  data: GraphData
  width?: number
  height?: number
}

const TICK_LIMIT = 300   // stop simulating after N ticks (graph has settled)
const LABEL_MIN_ZOOM = 0.55

export function AccessGraph({ data, width = 900, height = 600 }: AccessGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const nodesRef  = useRef<GraphNode[]>([])
  const edgesRef  = useRef<GraphEdge[]>([])
  const rafRef    = useRef<number>(0)
  const tickRef   = useRef(0)

  // Pan / zoom state
  const offsetRef = useRef({ x: 0, y: 0 })
  const zoomRef   = useRef(1)
  const dragging  = useRef<{ startX: number; startY: number; ox: number; oy: number } | null>(null)
  const dragNode  = useRef<GraphNode | null>(null)

  const [tooltip, setTooltip] = useState<TooltipState | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [simDone, setSimDone] = useState(false)

  // ── Initialise nodes from props ──────────────────────────────────────────
  useEffect(() => {
    // Deep-copy so simulation mutations don't affect original data
    nodesRef.current = data.nodes.map(n => ({ ...n }))
    edgesRef.current = data.edges
    tickRef.current = 0
    setSimDone(false)
    setSelectedId(null)
    setTooltip(null)
    // Centre initial positions around canvas centre
    const cx = width / 2
    const cy = height / 2
    nodesRef.current.forEach(n => {
      n.x += cx
      n.y += cy
    })
  }, [data, width, height])

  // ── Canvas draw ──────────────────────────────────────────────────────────
  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const { x: ox, y: oy } = offsetRef.current
    const zoom = zoomRef.current

    ctx.clearRect(0, 0, width, height)
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, width, height)

    ctx.save()
    ctx.translate(ox, oy)
    ctx.scale(zoom, zoom)

    const nodes = nodesRef.current
    const edges = edgesRef.current

    // Build node lookup
    const nodeMap = new Map(nodes.map(n => [n.id, n]))

    // ── Draw edges ──────────────────────────────────────────────────────
    edges.forEach(edge => {
      const src = nodeMap.get(edge.source)
      const tgt = nodeMap.get(edge.target)
      if (!src || !tgt) return

      const isHighlighted = selectedId === src.id || selectedId === tgt.id
      const isSod = edge.type === 'sod_conflict'

      ctx.beginPath()
      ctx.moveTo(src.x, src.y)
      ctx.lineTo(tgt.x, tgt.y)
      ctx.strokeStyle = isHighlighted
        ? EDGE_COLORS[edge.type]
        : isSod
          ? 'rgba(239,68,68,0.6)'
          : 'rgba(148,163,184,0.55)'
      ctx.lineWidth = isHighlighted ? (isSod ? 2.5 : 1.8) : (isSod ? 1.5 : 1)
      if (isSod) {
        ctx.setLineDash([5, 4])
      } else {
        ctx.setLineDash([])
      }
      ctx.stroke()
      ctx.setLineDash([])

      // Arrow head
      if (edge.type !== 'sod_conflict') {
        const angle = Math.atan2(tgt.y - src.y, tgt.x - src.x)
        const r = NODE_RADIUS[nodeMap.get(edge.target)?.type ?? 'role'] + 2
        const ax = tgt.x - Math.cos(angle) * r
        const ay = tgt.y - Math.sin(angle) * r
        ctx.beginPath()
        ctx.moveTo(ax, ay)
        ctx.lineTo(ax - Math.cos(angle - 0.4) * 8, ay - Math.sin(angle - 0.4) * 8)
        ctx.lineTo(ax - Math.cos(angle + 0.4) * 8, ay - Math.sin(angle + 0.4) * 8)
        ctx.closePath()
        ctx.fillStyle = isHighlighted ? EDGE_COLORS[edge.type] : 'rgba(148,163,184,0.5)'
        ctx.fill()
      }

      // Edge label (only when zoomed in enough)
      if (zoom >= LABEL_MIN_ZOOM && edge.label && isHighlighted) {
        const mx = (src.x + tgt.x) / 2
        const my = (src.y + tgt.y) / 2
        ctx.font = '9px Inter, sans-serif'
        ctx.fillStyle = isSod ? '#ef4444' : '#64748b'
        ctx.textAlign = 'center'
        ctx.fillText(edge.label, mx, my - 4)
      }
    })

    // ── Draw nodes ──────────────────────────────────────────────────────
    nodes.forEach(node => {
      const r = NODE_RADIUS[node.type]
      const isSelected = selectedId === node.id
      const color = NODE_COLORS[node.type]

      // Glow for selected
      if (isSelected) {
        ctx.beginPath()
        ctx.arc(node.x, node.y, r + 6, 0, Math.PI * 2)
        ctx.fillStyle = color + '33'
        ctx.fill()
      }

      // High-privilege ring
      if (node.meta.isHighPrivilege) {
        ctx.beginPath()
        ctx.arc(node.x, node.y, r + 3, 0, Math.PI * 2)
        ctx.strokeStyle = '#a855f7'
        ctx.lineWidth = 2
        ctx.stroke()
      }

      // Node circle
      ctx.beginPath()
      ctx.arc(node.x, node.y, r, 0, Math.PI * 2)
      ctx.fillStyle = color
      ctx.fill()
      ctx.strokeStyle = isSelected ? '#fff' : color + 'aa'
      ctx.lineWidth = isSelected ? 2.5 : 1
      ctx.stroke()

      // Icon inside node
      ctx.font = `${Math.max(8, r * 0.9)}px sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillStyle = '#fff'
      const icons: Record<string, string> = {
        consumer: '👤', role: '🔑', aclGroup: '🔒', environment: '🌐', system: '⚡',
      }
      ctx.fillText(icons[node.type] ?? '●', node.x, node.y)

      // Label
      if (zoom >= LABEL_MIN_ZOOM) {
        ctx.font = `${Math.max(9, Math.min(11, r))}px Inter, sans-serif`
        ctx.fillStyle = isSelected ? '#1e293b' : '#334155'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'top'
        // Truncate long labels
        const maxLen = 18
        const label = node.label.length > maxLen ? node.label.slice(0, maxLen) + '…' : node.label
        ctx.fillText(label, node.x, node.y + r + 3)
      }
    })

    ctx.restore()
  }, [width, height, selectedId])

  // ── Animation loop ───────────────────────────────────────────────────────
  useEffect(() => {
    function loop() {
      if (tickRef.current < TICK_LIMIT) {
        tickSimulation(nodesRef.current, edgesRef.current, width, height)
        tickRef.current++
        if (tickRef.current >= TICK_LIMIT) setSimDone(true)
      }
      draw()
      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafRef.current)
  }, [draw, width, height])

  // ── Hit test ─────────────────────────────────────────────────────────────
  function canvasToWorld(cx: number, cy: number) {
    const { x: ox, y: oy } = offsetRef.current
    const zoom = zoomRef.current
    return { x: (cx - ox) / zoom, y: (cy - oy) / zoom }
  }

  function hitNode(wx: number, wy: number): GraphNode | null {
    for (const n of nodesRef.current) {
      const r = NODE_RADIUS[n.type] + 4
      const dx = wx - n.x
      const dy = wy - n.y
      if (dx * dx + dy * dy <= r * r) return n
    }
    return null
  }

  // ── Mouse handlers ───────────────────────────────────────────────────────
  function getCanvasXY(e: MouseEvent<HTMLCanvasElement>) {
    const rect = canvasRef.current!.getBoundingClientRect()
    return { cx: e.clientX - rect.left, cy: e.clientY - rect.top }
  }

  function onMouseDown(e: MouseEvent<HTMLCanvasElement>) {
    const { cx, cy } = getCanvasXY(e)
    const { x: wx, y: wy } = canvasToWorld(cx, cy)
    const hit = hitNode(wx, wy)
    if (hit) {
      dragNode.current = hit
      setSelectedId(hit.id)
      setTooltip({ x: cx, y: cy, node: hit })
    } else {
      dragNode.current = null
      dragging.current = { startX: cx, startY: cy, ox: offsetRef.current.x, oy: offsetRef.current.y }
      setTooltip(null)
    }
  }

  function onMouseMove(e: MouseEvent<HTMLCanvasElement>) {
    const { cx, cy } = getCanvasXY(e)
    if (dragNode.current) {
      const { x: wx, y: wy } = canvasToWorld(cx, cy)
      dragNode.current.x = wx
      dragNode.current.y = wy
      dragNode.current.vx = 0
      dragNode.current.vy = 0
      setTooltip({ x: cx, y: cy, node: dragNode.current })
      return
    }
    if (dragging.current) {
      offsetRef.current = {
        x: dragging.current.ox + (cx - dragging.current.startX),
        y: dragging.current.oy + (cy - dragging.current.startY),
      }
      return
    }
    // Hover tooltip
    const { x: wx, y: wy } = canvasToWorld(cx, cy)
    const hit = hitNode(wx, wy)
    if (hit) {
      setTooltip({ x: cx, y: cy, node: hit })
    } else {
      setTooltip(null)
    }
  }

  function onMouseUp() {
    dragNode.current = null
    dragging.current = null
  }

  function onWheel(e: WheelEvent<HTMLCanvasElement>) {
    e.preventDefault()
    const { cx, cy } = getCanvasXY(e as unknown as MouseEvent<HTMLCanvasElement>)
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    const newZoom = Math.max(0.2, Math.min(4, zoomRef.current * delta))
    // Zoom towards cursor
    offsetRef.current = {
      x: cx - (cx - offsetRef.current.x) * (newZoom / zoomRef.current),
      y: cy - (cy - offsetRef.current.y) * (newZoom / zoomRef.current),
    }
    zoomRef.current = newZoom
  }

  function resetView() {
    offsetRef.current = { x: 0, y: 0 }
    zoomRef.current = 1
  }

  function rerunSim() {
    tickRef.current = 0
    setSimDone(false)
  }

  return (
    <div className="relative select-none" style={{ width, height }}>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="rounded-xl border border-gray-200 bg-white cursor-grab active:cursor-grabbing"
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onWheel={onWheel}
      />

      {/* Controls */}
      <div className="absolute top-3 right-3 flex flex-col gap-1.5">
        <button
          onClick={() => { zoomRef.current = Math.min(4, zoomRef.current * 1.2) }}
          className="w-8 h-8 bg-white/90 text-gray-700 border border-gray-200 rounded-lg text-sm hover:bg-gray-100 flex items-center justify-center shadow-sm"
          title="Zoom in"
        >+</button>
        <button
          onClick={() => { zoomRef.current = Math.max(0.2, zoomRef.current * 0.8) }}
          className="w-8 h-8 bg-white/90 text-gray-700 border border-gray-200 rounded-lg text-sm hover:bg-gray-100 flex items-center justify-center shadow-sm"
          title="Zoom out"
        >−</button>
        <button
          onClick={resetView}
          className="w-8 h-8 bg-white/90 text-gray-700 border border-gray-200 rounded-lg text-xs hover:bg-gray-100 flex items-center justify-center shadow-sm"
          title="Reset view"
        >⌂</button>
        <button
          onClick={rerunSim}
          className="w-8 h-8 bg-white/90 text-gray-700 border border-gray-200 rounded-lg text-xs hover:bg-gray-100 flex items-center justify-center shadow-sm"
          title="Re-run layout"
        >↺</button>
      </div>

      {/* Sim status */}
      {!simDone && (
        <div className="absolute bottom-3 left-3 text-xs text-gray-500 bg-white/80 border border-gray-200 px-2 py-1 rounded-md shadow-sm">
          Laying out graph…
        </div>
      )}

      {/* Tooltip */}
      {tooltip && (
        <NodeTooltip tooltip={tooltip} canvasWidth={width} canvasHeight={height} />
      )}
    </div>
  )
}

// ─── Tooltip ──────────────────────────────────────────────────────────────────

function NodeTooltip({
  tooltip,
  canvasWidth,
  canvasHeight,
}: {
  tooltip: TooltipState
  canvasWidth: number
  canvasHeight: number
}) {
  const { x, y, node } = tooltip
  const TOOLTIP_W = 220
  const TOOLTIP_H = 140
  const left = x + 14 + TOOLTIP_W > canvasWidth ? x - TOOLTIP_W - 14 : x + 14
  const top  = y + TOOLTIP_H > canvasHeight ? y - TOOLTIP_H : y

  const typeLabels: Record<string, string> = {
    consumer: 'Consumer', role: 'Role', aclGroup: 'ACL Group',
    environment: 'Environment', system: 'System',
  }

  return (
    <div
      className="absolute z-10 pointer-events-none bg-white border border-gray-200 rounded-xl shadow-xl p-3 text-xs text-gray-700"
      style={{ left, top, width: TOOLTIP_W }}
    >
      <div className="flex items-center gap-2 mb-2">
        <span
          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
          style={{ background: NODE_COLORS[node.type as keyof typeof NODE_COLORS] }}
        />
        <span className="font-semibold text-gray-900 truncate">{node.label}</span>
      </div>
      <div className="text-gray-400 mb-2">{typeLabels[node.type]}</div>
      <div className="space-y-1">
        {Object.entries(node.meta).map(([k, v]) => (
          v !== '' && v !== undefined ? (
            <div key={k} className="flex justify-between gap-2">
              <span className="text-gray-400 capitalize">{k.replace(/([A-Z])/g, ' $1')}</span>
              <span className={`font-medium truncate max-w-[110px] ${
                k === 'isHighPrivilege' && v ? 'text-purple-600' :
                k === 'owner' && v === 'Unowned' ? 'text-orange-500' : 'text-gray-700'
              }`}>
                {String(v)}
              </span>
            </div>
          ) : null
        ))}
      </div>
    </div>
  )
}
