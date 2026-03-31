<script setup>
import { ref, watch, onMounted, onUnmounted, nextTick } from 'vue'
import CanvasToolsBar from './CanvasToolsBar.vue'
import CanvasDisplayPanel from './CanvasDisplayPanel.vue'

const panning = ref(false)

const props = defineProps({
  /** 已创建或打开过地图；为 false 时画布区仅显示提示，不响应绘制 */
  mapReady: { type: Boolean, default: true },
  layers: { type: Array, required: true },
  width: { type: Number, required: true },
  height: { type: Number, required: true },
  tileSize: { type: Number, required: true },
  zoom: { type: Number, required: true },
  selectedTileId: { type: Number, required: true },
  activeTool: { type: String, required: true },
  activeLayerIndex: { type: Number, required: true },
  /** 画布选中的格（多选/框选） */
  selectedCells: { type: Array, default: () => [] },
  tileTypes: { type: Array, required: true },
  /** 为 true 时绘制棋盘格底色；为 false 时不铺底，空白格透明以透出视口背景（「网格」即指此棋盘格） */
  showGridOverlay: { type: Boolean, default: true },
  /** 原点格描边 + (0,0) 与 (1,1) 坐标文字 */
  showOriginMarker: { type: Boolean, default: false },
  /** 为 true 时在碰撞为「阻断」的格子上绘制碰撞体积叠加 */
  showCollisionVolume: { type: Boolean, default: true },
})

const emit = defineEmits([
  'cursor',
  'zoom-wheel',
  'tool',
  'set-zoom',
  'clear-map',
  'selection-change',
  'selection-add',
  'selection-toggle',
  'apply-tiles',
  'pick-tile',
  'selection-clear',
  'update:showGridOverlay',
  'update:showOriginMarker',
  'update:showCollisionVolume',
])

const canvasRef = ref(null)
const innerRef = ref(null)
const wrapRef = ref(null)
/** 画布在视口内的平移（px），与缩放无关；不依赖 scroll，可任意方向无限平移 */
const panX = ref(0)
const panY = ref(0)
let lastPanX = 0
let lastPanY = 0
/** 选择工具：框选/点选手势 */
let selectGesture = null
/** 框选预览终点（pointermove 更新） */
const boxSelectPreview = ref(null)
/** 选择拖动过程中最后一次落在地图上的格（指针抬起在网格外时用） */
let selectLastCell = null
/** 无选区时填充/橡皮擦：拖动经过的所有格子 */
let fillDrag = null
/** 中键仅用于平移（button===1）；选择工具下也不再支持中键点选 */
let middlePanState = 'idle'
let toolBeforeSpace = null
let spaceHoldListener = false
/** 按住 Alt 临时吸取：松开后恢复的工具 */
let toolBeforeAlt = null
/** 是否已由 Alt 切入临时吸取（与左右 Alt 键计数配合） */
let altHoldListener = false
/** 当前仍按下的 Alt 键数量（左+右可同时按，需全松才恢复工具） */
let altPhysicalKeyCount = 0
let wrapResizeObserver = null

const MIDDLE_BUTTONS_MASK = 4

const KEY_SCROLL_STEP = 48
/** 适应窗口时，可视区与地图之间的最小边距（px） */
const VIEW_SCROLL_MARGIN_MIN = 64

/** data URL -> HTMLImageElement，避免重复解码 */
const tileTextureCache = new Map()

function colorForTileId(id) {
  const t = props.tileTypes.find((x) => x.id === id)
  return t?.color ?? '#ccc'
}

/** 块类型为「阻断」时参与碰撞体积显示 */
function tileTypeBlocksCollision(tid) {
  if (tid == null || tid === 0) return false
  const t = props.tileTypes[tid]
  return t?.collisionType === 'block'
}

/** 任一可见瓦片层在 (gx,gy) 上放置了带碰撞的块 */
function cellHasBlockingCollision(gx, gy) {
  for (const layer of props.layers) {
    if (!layer?.visible) continue
    if (layerKind(layer) !== 'tile' || !layer.tiles) continue
    const tid = layer.tiles[gy]?.[gx] ?? 0
    if (tileTypeBlocksCollision(tid)) return true
  }
  return false
}

function layerKind(layer) {
  return layer?.kind === 'image' ? 'image' : 'tile'
}

/**
 * 格线对齐：每列/行右边界用 round(i*cell) 累加，相邻格共享整数像素边界，避免浮点 cell 造成块间 1px 缝。
 */
function getTileLayout() {
  const cell = props.tileSize * props.zoom
  const tw = props.width
  const th = props.height
  const xs = []
  const ys = []
  for (let i = 0; i <= tw; i++) xs.push(Math.round(i * cell))
  for (let j = 0; j <= th; j++) ys.push(Math.round(j * cell))
  return { cell, xs, ys, cw: xs[tw], ch: ys[th] }
}

/** 每个纹理像素在屏幕上至少占 1 个 CSS 像素时用最近邻；否则用平滑缩小（抗锯齿） */
function setImageSmoothingForScale(ctx, destW, destH, srcW, srcH) {
  if (srcW <= 0 || srcH <= 0) {
    ctx.imageSmoothingEnabled = true
    if ('imageSmoothingQuality' in ctx) ctx.imageSmoothingQuality = 'high'
    return
  }
  const pxPerSrcX = destW / srcW
  const pxPerSrcY = destH / srcH
  const pxPerSrc = Math.min(pxPerSrcX, pxPerSrcY)
  if (pxPerSrc >= 1) {
    ctx.imageSmoothingEnabled = false
    if ('imageSmoothingQuality' in ctx) ctx.imageSmoothingQuality = 'low'
  } else {
    ctx.imageSmoothingEnabled = true
    if ('imageSmoothingQuality' in ctx) ctx.imageSmoothingQuality = 'high'
  }
}

function draw() {
  const canvas = canvasRef.value
  if (!canvas) return
  const dpr = window.devicePixelRatio || 1
  const { xs, ys, cw, ch } = getTileLayout()
  canvas.width = Math.max(1, Math.floor(cw * dpr))
  canvas.height = Math.max(1, Math.floor(ch * dpr))
  canvas.style.width = `${cw}px`
  canvas.style.height = `${ch}px`
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, cw, ch)

  const light = '#fafafa'
  const dark = '#e8e8e8'
  if (props.showGridOverlay) {
    for (let gy = 0; gy < props.height; gy++) {
      for (let gx = 0; gx < props.width; gx++) {
        const x = xs[gx]
        const y = ys[gy]
        const w = xs[gx + 1] - xs[gx]
        const h = ys[gy + 1] - ys[gy]
        const odd = (gx + gy) % 2 === 0
        ctx.fillStyle = odd ? light : dark
        ctx.fillRect(x, y, w, h)
      }
    }
  }
  /* 关闭网格时不铺浅色整块底，空白格保持透明，与 .viewport-shell 的 win-canvas-bg 一致，避免出现「大白块」 */

  for (const layer of props.layers) {
    if (!layer?.visible) continue
    if (layerKind(layer) === 'image') {
      ctx.fillStyle = 'rgba(100, 140, 255, 0.14)'
      ctx.fillRect(0, 0, cw, ch)
      continue
    }
    if (!layer.tiles) continue
    for (let gy = 0; gy < props.height; gy++) {
      for (let gx = 0; gx < props.width; gx++) {
        const tid = layer.tiles[gy]?.[gx] ?? 0
        if (tid === 0) continue
        const x = xs[gx]
        const y = ys[gy]
        const w = xs[gx + 1] - xs[gx]
        const h = ys[gy + 1] - ys[gy]
        const tp = props.tileTypes[tid]
        const url = tp?.imageDataUrl
        if (url) {
          let img = tileTextureCache.get(url)
          if (!img) {
            img = new Image()
            img.onload = () => draw()
            tileTextureCache.set(url, img)
            img.src = url
          }
          if (img.complete && img.naturalWidth > 0) {
            setImageSmoothingForScale(
              ctx,
              w,
              h,
              img.naturalWidth,
              img.naturalHeight,
            )
            ctx.drawImage(img, x, y, w, h)
          } else {
            ctx.fillStyle = colorForTileId(tid)
            ctx.fillRect(x, y, w, h)
          }
        } else {
          ctx.fillStyle = colorForTileId(tid)
          ctx.fillRect(x, y, w, h)
        }
      }
    }
  }

  /* 开启「显示 → 碰撞体积」且块为「阻断」时叠加示意 */
  if (props.showCollisionVolume) {
    for (let gy = 0; gy < props.height; gy++) {
      for (let gx = 0; gx < props.width; gx++) {
        if (!cellHasBlockingCollision(gx, gy)) continue
        const x = xs[gx]
        const y = ys[gy]
        const w = xs[gx + 1] - xs[gx]
        const h = ys[gy + 1] - ys[gy]
        ctx.fillStyle = 'rgba(255, 120, 40, 0.2)'
        ctx.fillRect(x, y, w, h)
        ctx.strokeStyle = 'rgba(200, 70, 0, 0.75)'
        ctx.lineWidth = 1
        ctx.setLineDash([3, 2])
        ctx.strokeRect(x + 0.5, y + 0.5, Math.max(0, w - 1), Math.max(0, h - 1))
        ctx.setLineDash([])
      }
    }
  }

  if (props.showOriginMarker && props.width > 0 && props.height > 0) {
    const c0w = xs[1] - xs[0]
    const c0h = ys[1] - ys[0]
    ctx.strokeStyle = '#c42b1c'
    ctx.lineWidth = 2
    ctx.strokeRect(1.5, 1.5, c0w - 3, c0h - 3)
    ctx.font = `${Math.max(10, Math.min(14, c0w * 0.35))}px Segoe UI, system-ui, sans-serif`
    ctx.fillStyle = 'rgba(0,0,0,0.55)'
    ctx.textBaseline = 'top'
    ctx.fillText('(0,0)', 4, 3)
    if (props.width >= 2 && props.height >= 2) {
      ctx.fillText('(1,1)', xs[1] + 4, ys[1] + 3)
    }
  }

  const showSel =
    props.activeTool === 'select' ||
    props.activeTool === 'pick' ||
    props.activeTool === 'fill' ||
    props.activeTool === 'eraser'
  if (showSel && props.selectedCells?.length) {
    ctx.strokeStyle = '#0067c0'
    ctx.lineWidth = 2
    for (const p of props.selectedCells) {
      const gx = p.gx
      const gy = p.gy
      if (gx < 0 || gy < 0 || gx >= props.width || gy >= props.height) continue
      const x = xs[gx]
      const y = ys[gy]
      const w = xs[gx + 1] - xs[gx]
      const h = ys[gy + 1] - ys[gy]
      ctx.strokeRect(x + 1.5, y + 1.5, w - 3, h - 3)
    }
  }

  const bx = boxSelectPreview.value
  if (bx && props.activeTool === 'select') {
    const gx0 = Math.min(bx.gx0, bx.gx1)
    const gx1 = Math.max(bx.gx0, bx.gx1)
    const gy0 = Math.min(bx.gy0, bx.gy1)
    const gy1 = Math.max(bx.gy0, bx.gy1)
    const x = xs[gx0]
    const y = ys[gy0]
    const rw = xs[gx1 + 1] - xs[gx0]
    const rh = ys[gy1 + 1] - ys[gy0]
    ctx.strokeStyle = '#0067c0'
    ctx.lineWidth = 1
    ctx.setLineDash([4, 3])
    ctx.strokeRect(x + 0.5, y + 0.5, Math.max(0, rw - 1), Math.max(0, rh - 1))
    ctx.setLineDash([])
  }
}

function eventToCell(e) {
  const canvas = canvasRef.value
  if (!canvas) return null
  const rect = canvas.getBoundingClientRect()
  const { xs, ys } = getTileLayout()
  const px = e.clientX - rect.left
  const py = e.clientY - rect.top
  if (px < 0 || py < 0 || px >= xs[props.width] || py >= ys[props.height]) {
    return null
  }
  let gx = 0
  while (gx < props.width && px >= xs[gx + 1]) gx++
  let gy = 0
  while (gy < props.height && py >= ys[gy + 1]) gy++
  if (gx < 0 || gy < 0 || gx >= props.width || gy >= props.height) return null
  return { gx, gy }
}

function tileIdAtActiveLayer(cell) {
  const L = props.layers[props.activeLayerIndex]
  if (!cell || !L) return 0
  if (layerKind(L) !== 'tile') return 0
  return L.tiles?.[cell.gy]?.[cell.gx] ?? 0
}

function cellsInInclusiveRect(gx0, gy0, gx1, gy1, w, h) {
  const xa = Math.min(gx0, gx1)
  const xb = Math.max(gx0, gx1)
  const ya = Math.min(gy0, gy1)
  const yb = Math.max(gy0, gy1)
  const out = []
  for (let gy = ya; gy <= yb; gy++) {
    for (let gx = xa; gx <= xb; gx++) {
      if (gx >= 0 && gx < w && gy >= 0 && gy < h) out.push({ gx, gy })
    }
  }
  return out
}

/** 线段经过的格子（含端点），整数网格 Bresenham，用于拖动时补全跳过的格 */
function cellsAlongLine(gx0, gy0, gx1, gy1) {
  const out = []
  let x0 = gx0
  let y0 = gy0
  const x1 = gx1
  const y1 = gy1
  const dx = Math.abs(x1 - x0)
  const dy = Math.abs(y1 - y0)
  const sx = x0 < x1 ? 1 : -1
  const sy = y0 < y1 ? 1 : -1
  let err = dx - dy
  for (;;) {
    out.push({ gx: x0, gy: y0 })
    if (x0 === x1 && y0 === y1) break
    const e2 = 2 * err
    if (e2 > -dy) {
      err -= dy
      x0 += sx
    }
    if (e2 < dx) {
      err += dx
      y0 += sy
    }
  }
  return out
}

function applyMiddlePanDelta(dx, dy) {
  panX.value += dx
  panY.value += dy
}

function typingTarget(el) {
  if (!el || typeof el !== 'object') return false
  const t = el.tagName
  if (t === 'INPUT' || t === 'TEXTAREA' || t === 'SELECT') return true
  if (el.isContentEditable) return true
  return false
}

function onPointerDown(e) {
  if (!props.mapReady) return
  wrapRef.value?.focus()
  if (e.button === 2 && props.activeTool === 'select') {
    e.preventDefault()
    emit('selection-clear')
    return
  }
  if (e.button === 1) {
    e.preventDefault()
    lastPanX = e.clientX
    lastPanY = e.clientY
    innerRef.value?.setPointerCapture(e.pointerId)
    middlePanState = 'active'
    panning.value = true
    return
  }
  e.preventDefault()
  innerRef.value?.setPointerCapture(e.pointerId)
  const cell = eventToCell(e)
  emit('cursor', cell)

  if (props.activeTool === 'pick' && e.button === 0) {
    if (cell) {
      const tileId = tileIdAtActiveLayer(cell)
      emit('pick-tile', { tileId })
    }
    return
  }

  if (props.activeTool === 'select' && e.button === 0) {
    selectLastCell = cell
    selectGesture = {
      startX: e.clientX,
      startY: e.clientY,
      startCell: cell,
      ctrlKey: e.ctrlKey || e.metaKey,
      shiftKey: e.shiftKey,
      pointerId: e.pointerId,
      dragged: false,
    }
    boxSelectPreview.value = null
    return
  }

  if (
    (props.activeTool === 'fill' || props.activeTool === 'eraser') &&
    (e.button === 0 || e.button === 2)
  ) {
    const tileId =
      props.activeTool === 'eraser' || e.button === 2 ? 0 : props.selectedTileId
    let cells
    if (props.selectedCells.length > 0) {
      fillDrag = null
      /** 有选区时：必须点在选中的格子上才生效，点在选区外忽略 */
      if (!cell) return
      const onSelection = props.selectedCells.some(
        (c) => c.gx === cell.gx && c.gy === cell.gy,
      )
      if (!onSelection) return
      cells = props.selectedCells
    } else {
      if (!cell) return
      cells = [{ gx: cell.gx, gy: cell.gy }]
      fillDrag = {
        button: e.button,
        tileId,
        lastGx: cell.gx,
        lastGy: cell.gy,
        pointerId: e.pointerId,
      }
    }
    if (cells.length === 0) return
    emit('apply-tiles', { cells, tileId })
  }
}

function onPointerMove(e) {
  if (!props.mapReady) return
  if (middlePanState === 'active' && (e.buttons & MIDDLE_BUTTONS_MASK)) {
    e.preventDefault()
    const dx = e.clientX - lastPanX
    const dy = e.clientY - lastPanY
    applyMiddlePanDelta(dx, dy)
    lastPanX = e.clientX
    lastPanY = e.clientY
    return
  }
  const cell = eventToCell(e)
  emit('cursor', cell)

  if (
    fillDrag &&
    (props.activeTool === 'fill' || props.activeTool === 'eraser') &&
    (fillDrag.button === 0 ? e.buttons & 1 : e.buttons & 2)
  ) {
    if (!cell) return
    if (cell.gx === fillDrag.lastGx && cell.gy === fillDrag.lastGy) return
    const line = cellsAlongLine(fillDrag.lastGx, fillDrag.lastGy, cell.gx, cell.gy)
    const toFill = line.slice(1)
    if (toFill.length === 0) return
    fillDrag.lastGx = cell.gx
    fillDrag.lastGy = cell.gy
    emit('apply-tiles', { cells: toFill, tileId: fillDrag.tileId })
    return
  }

  if (props.activeTool === 'select' && selectGesture && e.buttons === 1) {
    if (cell) selectLastCell = cell
    const dx = e.clientX - selectGesture.startX
    const dy = e.clientY - selectGesture.startY
    if (dx * dx + dy * dy > 25) selectGesture.dragged = true
    const end = cell ?? selectLastCell
    if (selectGesture.dragged && selectGesture.startCell && end) {
      boxSelectPreview.value = {
        gx0: selectGesture.startCell.gx,
        gy0: selectGesture.startCell.gy,
        gx1: end.gx,
        gy1: end.gy,
      }
      draw()
    }
  }
}

function finishSelectGesture(e) {
  const g = selectGesture
  selectGesture = null
  boxSelectPreview.value = null
  if (!g) return
  const endCell = eventToCell(e) ?? selectLastCell
  selectLastCell = null
  const dx = e.clientX - g.startX
  const dy = e.clientY - g.startY
  const dist2 = dx * dx + dy * dy
  const w = props.width
  const h = props.height

  if (g.dragged && g.startCell && endCell) {
    const cells = cellsInInclusiveRect(
      g.startCell.gx,
      g.startCell.gy,
      endCell.gx,
      endCell.gy,
      w,
      h,
    )
    if (g.shiftKey) {
      emit('selection-add', { cells })
    } else {
      emit('selection-change', { cells })
    }
    draw()
    return
  }

  if (dist2 <= 25 && g.startCell) {
    if (g.ctrlKey) {
      emit('selection-toggle', {
        cell: g.startCell,
      })
    } else {
      emit('selection-change', {
        cells: [{ gx: g.startCell.gx, gy: g.startCell.gy }],
      })
    }
    draw()
  }
}

function onPointerUp(e) {
  if (e.button === 1) {
    e.preventDefault()
    middlePanState = 'idle'
    panning.value = false
    try {
      if (e?.pointerId != null) {
        innerRef.value?.releasePointerCapture(e.pointerId)
      }
    } catch {
      /* noop */
    }
    return
  }
  if (fillDrag && e.button === fillDrag.button) {
    fillDrag = null
  }
  if (props.activeTool === 'select' && e.button === 0) {
    finishSelectGesture(e)
  }
  try {
    if (e?.pointerId != null) {
      innerRef.value?.releasePointerCapture(e.pointerId)
    }
  } catch {
    /* noop */
  }
}

/** 中键平移时指针可能移出画布矩形，不要用 leave 结束拖拽（否则像无法自由平移） */
function onPointerLeave(e) {
  if (middlePanState === 'active') return
  fillDrag = null
  onPointerUp(e)
}

function onPointerCancel(e) {
  middlePanState = 'idle'
  panning.value = false
  fillDrag = null
  selectGesture = null
  boxSelectPreview.value = null
  try {
    if (e?.pointerId != null) {
      innerRef.value?.releasePointerCapture(e.pointerId)
    }
  } catch {
    /* noop */
  }
}

function onWheel(e) {
  if (!props.mapReady) return
  e.preventDefault()
  const canvas = canvasRef.value
  const wrap = wrapRef.value
  if (!canvas || !wrap) return
  const oldZ = props.zoom
  const cellOld = props.tileSize * oldZ
  const cr = canvas.getBoundingClientRect()
  /** 缩放前指针下点在「格坐标」中的位置（可越界） */
  const anchorGx = (e.clientX - cr.left) / cellOld
  const anchorGy = (e.clientY - cr.top) / cellOld

  emit('zoom-wheel', e.deltaY)
  nextTick(() => {
    const newZ = props.zoom
    if (newZ === oldZ) return
    const cellNew = props.tileSize * newZ
    const wr = wrap.getBoundingClientRect()
    /**
     * 直接解算 pan，避免缩放后再读 canvas.getBoundingClientRect 做增量（双 rAF + 布局读数易亚像素抖动）。
     * 条件：指针下地图点在新格尺寸下仍落在 (e.clientX, e.clientY)；
     * 画布左上在视口内坐标为 (panX, panY)，故 wr.left + panX + anchorGx*cellNew = e.clientX。
     */
    panX.value = e.clientX - wr.left - anchorGx * cellNew
    panY.value = e.clientY - wr.top - anchorGy * cellNew
  })
}

function onWindowSpaceUp(e) {
  if (e.code !== 'Space') return
  e.preventDefault()
  window.removeEventListener('keyup', onWindowSpaceUp, true)
  spaceHoldListener = false
  emit('tool', toolBeforeSpace ?? 'fill')
  toolBeforeSpace = null
}

function onWindowAltDown(e) {
  if (!props.mapReady) return
  if (typingTarget(e.target)) return
  if (e.code !== 'AltLeft' && e.code !== 'AltRight') return
  if (e.repeat) return
  e.preventDefault()
  /** 与空格临时选择互斥，避免工具状态打架 */
  if (spaceHoldListener) return
  altPhysicalKeyCount += 1
  if (altPhysicalKeyCount !== 1) return
  if (altHoldListener) return
  altHoldListener = true
  toolBeforeAlt = props.activeTool
  emit('tool', 'pick')
}

function onWindowAltUp(e) {
  if (e.code !== 'AltLeft' && e.code !== 'AltRight') return
  e.preventDefault()
  altPhysicalKeyCount = Math.max(0, altPhysicalKeyCount - 1)
  if (altPhysicalKeyCount > 0) return
  if (!altHoldListener) return
  altHoldListener = false
  const restore = toolBeforeAlt
  toolBeforeAlt = null
  emit('tool', restore ?? 'fill')
}

function onWindowBlurRestoreAlt() {
  altPhysicalKeyCount = 0
  if (!altHoldListener) return
  altHoldListener = false
  const restore = toolBeforeAlt
  toolBeforeAlt = null
  emit('tool', restore ?? 'fill')
}

function fitView() {
  if (!props.mapReady) return
  const wrap = wrapRef.value
  if (!wrap) return
  const m = VIEW_SCROLL_MARGIN_MIN
  const tw = props.width
  const th = props.height
  const ts = props.tileSize
  const vw = wrap.clientWidth
  const vh = wrap.clientHeight
  if (vw <= 0 || vh <= 0) return
  const availW = Math.max(1, vw - 2 * m)
  const availH = Math.max(1, vh - 2 * m)
  const zx = availW / (tw * ts)
  const zy = availH / (th * ts)
  const z = Math.min(zx, zy)
  emit('set-zoom', z)
  nextTick(() => {
    requestAnimationFrame(() => centerViewport())
  })
}

/** 1:1：zoom=1，且以视口中心为锚缩放（中心点下地图格位置不变） */
function actualSizeView() {
  if (!props.mapReady) return
  const wrap = wrapRef.value
  if (!wrap) return
  const vw = wrap.clientWidth
  const vh = wrap.clientHeight
  if (vw <= 0 || vh <= 0) return
  const oldZ = props.zoom
  const cellOld = props.tileSize * oldZ
  const cx = vw / 2 - panX.value
  const cy = vh / 2 - panY.value
  const anchorGx = cx / cellOld
  const anchorGy = cy / cellOld

  emit('set-zoom', 1)
  nextTick(() => {
    const cellNew = props.tileSize * props.zoom
    panX.value = vw / 2 - anchorGx * cellNew
    panY.value = vh / 2 - anchorGy * cellNew
  })
}

/** 将地图几何中心对齐到视口中心（任意缩放下成立） */
function centerViewport() {
  const wrap = wrapRef.value
  if (!wrap) return
  const { cw, ch } = getTileLayout()
  const vw = wrap.clientWidth
  const vh = wrap.clientHeight
  if (vw <= 0 || vh <= 0) return
  panX.value = (vw - cw) / 2
  panY.value = (vh - ch) / 2
}

function scheduleCenter() {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => centerViewport())
  })
}

function cursorForTool() {
  if (!props.mapReady) return 'default'
  if (panning.value) return 'grabbing'
  if (props.activeTool === 'select') return 'default'
  if (props.activeTool === 'pick') return 'crosshair'
  if (props.activeTool === 'eraser') return 'cell'
  if (props.activeTool === 'fill') return 'crosshair'
  return 'crosshair'
}

/** 与原先 scrollLeft += dx 等价：视口「往内容右侧看」时 pan 减少 */
function panViewportBy(dx, dy) {
  panX.value -= dx
  panY.value -= dy
}

function onWrapKeyDown(e) {
  if (!props.mapReady) return
  const wrap = wrapRef.value
  if (!wrap || document.activeElement !== wrap) return

  if (e.code === 'Space') {
    e.preventDefault()
    if (e.repeat) return
    /** 与 Alt 临时吸取互斥 */
    if (altHoldListener) return
    if (!spaceHoldListener) {
      spaceHoldListener = true
      toolBeforeSpace = props.activeTool
      emit('tool', 'select')
      window.addEventListener('keyup', onWindowSpaceUp, true)
    }
    return
  }

  let dx = 0
  let dy = 0
  if (e.key === 'ArrowLeft') dx = -KEY_SCROLL_STEP
  else if (e.key === 'ArrowRight') dx = KEY_SCROLL_STEP
  else if (e.key === 'ArrowUp') dy = -KEY_SCROLL_STEP
  else if (e.key === 'ArrowDown') dy = KEY_SCROLL_STEP
  else return
  e.preventDefault()
  panViewportBy(dx, dy)
}

watch(
  () => [
    props.mapReady,
    props.layers,
    props.tileTypes,
    props.width,
    props.height,
    props.tileSize,
    props.zoom,
    props.selectedCells,
    boxSelectPreview,
    props.activeTool,
    props.activeLayerIndex,
    props.showGridOverlay,
    props.showOriginMarker,
    props.showCollisionVolume,
  ],
  () => draw(),
  { deep: true }
)

watch(
  () => [props.width, props.height, props.tileSize],
  async () => {
    await nextTick()
    scheduleCenter()
  }
)

function onWindowResize() {
  draw()
}

onMounted(async () => {
  draw()
  window.addEventListener('resize', onWindowResize)
  window.addEventListener('keydown', onWindowAltDown, true)
  window.addEventListener('keyup', onWindowAltUp, true)
  window.addEventListener('blur', onWindowBlurRestoreAlt)
  await nextTick()
  if (wrapRef.value) {
    wrapResizeObserver = new ResizeObserver(() => {
      draw()
    })
    wrapResizeObserver.observe(wrapRef.value)
  }
  scheduleCenter()
})

onUnmounted(() => {
  wrapResizeObserver?.disconnect()
  wrapResizeObserver = null
  window.removeEventListener('resize', onWindowResize)
  window.removeEventListener('keyup', onWindowSpaceUp, true)
  window.removeEventListener('keydown', onWindowAltDown, true)
  window.removeEventListener('keyup', onWindowAltUp, true)
  window.removeEventListener('blur', onWindowBlurRestoreAlt)
  fillDrag = null
  altPhysicalKeyCount = 0
  if (altHoldListener) {
    altHoldListener = false
    toolBeforeAlt = null
  }
})
</script>

<template>
  <div class="viewport-shell">
    <div
      ref="wrapRef"
      class="viewport-scroll viewport-scroll--hide-scrollbar"
      tabindex="0"
      @keydown="onWrapKeyDown"
    >
      <!-- 平移用 transform（panX/Y），不依赖 scroll，任意缩放下可无界平移；裁剪由 overflow:hidden 完成 -->
      <div
        ref="innerRef"
        class="viewport-inner"
        :class="{ 'is-panning': panning, 'is-no-map': !mapReady }"
        :style="{ cursor: cursorForTool() }"
        @pointerdown="onPointerDown"
        @pointermove="onPointerMove"
        @pointerup="onPointerUp"
        @pointercancel="onPointerCancel"
        @pointerleave="onPointerLeave"
        @contextmenu.prevent
        @wheel="onWheel"
      >
        <div
          class="viewport-pan"
          :style="{
            transform: `translate3d(${panX}px, ${panY}px, 0)`,
          }"
        >
          <canvas ref="canvasRef" class="tile-canvas" tabindex="-1" />
        </div>
        <div
          v-if="!mapReady"
          class="viewport-no-map"
          aria-live="polite"
        >
          <p class="viewport-no-map-title">当前没有地图</p>
          <p class="viewport-no-map-hint">
            创建或打开地图后，将显示地图层与块库（块表由地图文件定义）。
          </p>
        </div>
      </div>
    </div>
    <!-- 覆盖层不参与滚动：工具栏与「显示」共用一个父节点，左右分列 -->
    <div class="viewport-ui" aria-hidden="false">
      <div class="viewport-chrome">
        <div class="viewport-chrome-left">
          <CanvasToolsBar
            :active-tool="activeTool"
            :map-ready="mapReady"
            @select="(t) => emit('tool', t)"
            @clear-map="emit('clear-map')"
            @fit-view="fitView"
            @actual-size="actualSizeView"
          />
        </div>
        <div class="viewport-chrome-spacer" aria-hidden="true" />
        <div class="viewport-chrome-right" aria-label="显示辅助">
          <CanvasDisplayPanel
            :show-grid="showGridOverlay"
            :show-origin="showOriginMarker"
            :show-collision-volume="showCollisionVolume"
            @update:show-grid="emit('update:showGridOverlay', $event)"
            @update:show-origin="emit('update:showOriginMarker', $event)"
            @update:show-collision-volume="
              emit('update:showCollisionVolume', $event)
            "
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.viewport-shell {
  flex: 1;
  min-height: 0;
  min-width: 0;
  width: 100%;
  position: relative;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--win-border-strong);
  border-radius: var(--win-radius-panel);
  background: var(--win-canvas-bg);
  box-shadow: inset 1px 1px 0 rgba(255, 255, 255, 0.35);
  /* 滚动在 viewport-scroll 内完成，避免画布像素变高时把外壳撑出主窗口 */
  overflow: hidden;
  isolation: isolate;
}
.viewport-scroll {
  flex: 1;
  min-height: 0;
  min-width: 0;
  overflow: hidden;
  outline: none;
  overscroll-behavior: contain;
  contain: paint;
  position: relative;
  display: block;
}
.viewport-inner {
  position: absolute;
  inset: 0;
  overflow: hidden;
  touch-action: none;
}
.viewport-pan {
  position: absolute;
  left: 0;
  top: 0;
  will-change: transform;
}
.viewport-inner.is-panning {
  cursor: grabbing !important;
}
.viewport-no-map {
  position: absolute;
  inset: 0;
  z-index: 3;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 16px;
  text-align: center;
  background: rgba(240, 240, 240, 0.92);
  color: var(--win-text-secondary);
  font-size: 13px;
  pointer-events: none;
}
.viewport-no-map-title {
  margin: 0;
  font-weight: 600;
  color: var(--win-text);
  font-size: 14px;
}
.viewport-no-map-hint {
  margin: 0;
  max-width: 280px;
  line-height: 1.45;
}
.viewport-scroll:focus-visible {
  outline: 2px solid var(--win-accent);
  outline-offset: 1px;
}
.viewport-scroll--hide-scrollbar {
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.viewport-scroll--hide-scrollbar::-webkit-scrollbar {
  width: 0;
  height: 0;
}
.viewport-ui {
  position: absolute;
  inset: 0;
  z-index: 5;
  padding: 10px;
  pointer-events: none;
}
.viewport-chrome {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  width: 100%;
  pointer-events: none;
}
.viewport-chrome-left,
.viewport-chrome-right {
  flex-shrink: 0;
  pointer-events: none;
}
.viewport-chrome-left :deep(.ctb),
.viewport-chrome-right :deep(.dtb) {
  pointer-events: auto;
}
.viewport-chrome-spacer {
  flex: 1;
  min-width: 0;
  align-self: stretch;
  pointer-events: none;
}
.viewport-chrome-right {
  max-width: min(168px, calc(100% - 20px));
}
.tile-canvas {
  display: block;
  vertical-align: top;
  touch-action: none;
  /* 插值策略在 draw 内按缩放切换；此处不强制整画布像素化，避免与缩小平滑冲突 */
  image-rendering: auto;
}
</style>
