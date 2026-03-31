import { ref, computed, shallowRef } from 'vue'
import { averageColorFromDataUrl } from '../utils/tileImage.js'

/** 默认块库（新建地图时的初始 palette） */
export const DEFAULT_TILE_TYPES = [
  {
    id: 0,
    name: '空',
    color: null,
    imageDataUrl: null,
    collisionType: 'none',
    transparentColor: null,
    textureWidth: null,
    textureHeight: null,
    colorDepthMode: 'rgba8',
  },
  {
    id: 1,
    name: '草地',
    color: '#6ebf4a',
    imageDataUrl: null,
    collisionType: 'none',
    transparentColor: null,
    textureWidth: null,
    textureHeight: null,
    colorDepthMode: 'rgba8',
  },
  {
    id: 2,
    name: '水',
    color: '#3b8fd9',
    imageDataUrl: null,
    collisionType: 'none',
    transparentColor: null,
    textureWidth: null,
    textureHeight: null,
    colorDepthMode: 'rgba8',
  },
  {
    id: 3,
    name: '沙地',
    color: '#d4c4a8',
    imageDataUrl: null,
    collisionType: 'none',
    transparentColor: null,
    textureWidth: null,
    textureHeight: null,
    colorDepthMode: 'rgba8',
  },
  {
    id: 4,
    name: '石砖',
    color: '#8a8a8a',
    imageDataUrl: null,
    collisionType: 'none',
    transparentColor: null,
    textureWidth: null,
    textureHeight: null,
    colorDepthMode: 'rgba8',
  },
  {
    id: 5,
    name: '木',
    color: '#a67c52',
    imageDataUrl: null,
    collisionType: 'none',
    transparentColor: null,
    textureWidth: null,
    textureHeight: null,
    colorDepthMode: 'rgba8',
  },
]

/** 无地图时仅保留「空」类型，表示尚未载入任何块库 */
function cloneEmptyOnlyPalette() {
  return cloneTileTypes([DEFAULT_TILE_TYPES[0]])
}

/**
 * 与地图属性中的 tileSize 对齐的纹理像素边长（与 addTileTypeFromImage 一致）
 */
function clampMapTileTexSize(ts) {
  return Math.max(
    8,
    Math.min(128, Math.floor(Number(ts)) || DEFAULT_TILE_SIZE)
  )
}

/**
 * 新建地图时的默认块表：草地/水等纯色块的 texture 宽高与当前地图瓦片边长一致（与后续导入块相同规则）
 */
function cloneDefaultPaletteForMapTileSize(ts) {
  const tex = clampMapTileTexSize(ts)
  const rows = cloneTileTypes()
  return rows.map((t) => ({
    ...t,
    textureWidth:
      t.textureWidth != null && Number.isFinite(Number(t.textureWidth))
        ? Math.max(8, Math.min(128, Math.floor(Number(t.textureWidth))))
        : tex,
    textureHeight:
      t.textureHeight != null && Number.isFinite(Number(t.textureHeight))
        ? Math.max(8, Math.min(128, Math.floor(Number(t.textureHeight))))
        : tex,
  }))
}

/**
 * 地图 tileSize 变更时：无贴图且纹理边长仍等于旧 tileSize 的块（含默认纯色块）与新 tileSize 对齐
 */
function syncPlainTileTextureDimsToMapTileSize(oldTs, newTs) {
  const ot = clampMapTileTexSize(oldTs)
  const nt = clampMapTileTexSize(newTs)
  if (ot === nt) return
  tileTypes.value = tileTypes.value.map((t) => {
    if (t.imageDataUrl) return t
    const tw = t.textureWidth
    const th = t.textureHeight
    const followedMap =
      (tw == null && th == null) || (tw === ot && th === ot)
    if (!followedMap) return t
    return { ...t, textureWidth: nt, textureHeight: nt }
  })
}

function cloneTileTypes(source = DEFAULT_TILE_TYPES) {
  return source.map((t) => ({
    id: t.id,
    name: t.name,
    color: t.color,
    imageDataUrl: t.imageDataUrl ?? null,
    collisionType: t.collisionType === 'block' ? 'block' : 'none',
    transparentColor:
      t.transparentColor != null &&
      t.transparentColor !== '' &&
      /^#[0-9a-fA-F]{6}$/.test(String(t.transparentColor).trim())
        ? String(t.transparentColor).trim().toUpperCase()
        : null,
    textureWidth:
      t.textureWidth != null && Number.isFinite(Number(t.textureWidth))
        ? Math.max(8, Math.min(128, Math.floor(Number(t.textureWidth))))
        : null,
    textureHeight:
      t.textureHeight != null && Number.isFinite(Number(t.textureHeight))
        ? Math.max(8, Math.min(128, Math.floor(Number(t.textureHeight))))
        : null,
    colorDepthMode:
      t.colorDepthMode === 'indexed8' ? 'indexed8' : 'rgba8',
  }))
}

const MAP_VERSION = 3
const MAP_VERSION_LEGACY = 1
const MAP_VERSION_V2 = 2
const DEFAULT_TILE_SIZE = 32
const DEFAULT_W = 32
const DEFAULT_H = 24

let layerSeq = 0
function createEmptyTiles(width, height) {
  return Array.from({ length: height }, () => Array(width).fill(0))
}

function createLayer(name, width, height, kind = 'tile') {
  return {
    id: ++layerSeq,
    name,
    visible: true,
    kind,
    tiles: createEmptyTiles(width, height),
  }
}

function resizeTilesGrid(oldTiles, oldW, oldH, newW, newH) {
  const out = createEmptyTiles(newW, newH)
  const maxY = Math.min(oldH, newH)
  const maxX = Math.min(oldW, newW)
  for (let y = 0; y < maxY; y++) {
    for (let x = 0; x < maxX; x++) {
      out[y][x] = oldTiles[y][x]
    }
  }
  return out
}

function validateTilesGrid(rows, tw, th, maxTileTypeCount) {
  if (!Array.isArray(rows) || rows.length !== th) return 'tiles 行数与 height 不符'
  for (let y = 0; y < th; y++) {
    const row = rows[y]
    if (!Array.isArray(row) || row.length !== tw) return `第 ${y} 行列数与 width 不符`
    for (let x = 0; x < tw; x++) {
      const v = row[x]
      if (!Number.isInteger(v) || v < 0 || v >= maxTileTypeCount) {
        return `非法瓦片 id：(${x},${y})`
      }
    }
  }
  return null
}

function normalizeLayerKind(k) {
  if (k === 'image') return 'image'
  if (k === 'area') return 'area'
  return 'tile'
}

function normalizeSelectionCells(cells, w, h) {
  const m = new Map()
  for (const c of cells) {
    const gx = Math.floor(Number(c.gx))
    const gy = Math.floor(Number(c.gy))
    if (!Number.isFinite(gx) || !Number.isFinite(gy)) continue
    if (gx < 0 || gy < 0 || gx >= w || gy >= h) continue
    m.set(`${gx},${gy}`, { gx, gy })
  }
  return [...m.values()]
}

export function useTileMap() {
  const tileTypes = ref(cloneEmptyOnlyPalette())

  const width = ref(DEFAULT_W)
  const height = ref(DEFAULT_H)
  const tileSize = ref(DEFAULT_TILE_SIZE)
  /** 尚未「新建/打开」过地图时为 false，图层列表为空 */
  const hasMap = ref(false)
  const layers = shallowRef([])
  const activeLayerIndex = ref(0)
  const selectedTileId = ref(0)
  const activeTool = ref('fill')
  /** 画布上选中的格（多选/框选）；用于高亮与填充/擦除范围 */
  const selectedCells = ref([])
  const zoom = ref(1)
  const lastError = ref('')
  const cursorCell = ref(null)

  const minZoom = 0.25
  const maxZoom = 4

  /** 当前编辑层（绘制目标）的 tiles，与旧 API 对齐 */
  const tiles = computed(() => {
    const L = layers.value[activeLayerIndex.value]
    return L ? L.tiles : []
  })

  function setError(msg) {
    lastError.value = msg
  }

  function clearError() {
    lastError.value = ''
  }

  function isValidTileId(id) {
    const n = Number(id)
    return Number.isInteger(n) && n >= 0 && n < tileTypes.value.length
  }

  function setSelectedTileId(id) {
    const n = Number(id)
    if (!isValidTileId(n)) return
    selectedTileId.value = n
  }

  function setActiveTool(tool) {
    const t = String(tool ?? '')
    if (
      t !== 'select' &&
      t !== 'pick' &&
      t !== 'fill' &&
      t !== 'eraser'
    ) {
      return
    }
    if (t === 'eraser') selectedCells.value = []
    activeTool.value = t
  }

  function setSelection(cells) {
    selectedCells.value = normalizeSelectionCells(
      cells,
      width.value,
      height.value,
    )
  }

  function toggleCellInSelection(gx, gy) {
    const w = width.value
    const h = height.value
    if (gx < 0 || gy < 0 || gx >= w || gy >= h) return
    const cur = selectedCells.value
    const idx = cur.findIndex((c) => c.gx === gx && c.gy === gy)
    if (idx >= 0) {
      selectedCells.value = cur.filter((_, i) => i !== idx)
    } else {
      selectedCells.value = [...cur, { gx, gy }]
    }
  }

  function addCellsToSelection(cells) {
    const norm = normalizeSelectionCells(cells, width.value, height.value)
    const m = new Map(selectedCells.value.map((c) => [`${c.gx},${c.gy}`, c]))
    for (const c of norm) m.set(`${c.gx},${c.gy}`, c)
    selectedCells.value = [...m.values()]
  }

  function clearSelection() {
    selectedCells.value = []
  }

  /** 一次写入多格（填充/擦除选区） */
  function fillCells(cells, tileId) {
    if (!activeLayerIsTile()) return
    if (!isValidTileId(tileId)) return
    const idx = activeLayerIndex.value
    const L = layers.value[idx]
    if (!L) return
    const w = width.value
    const h = height.value
    const list = normalizeSelectionCells(cells, w, h)
    if (list.length === 0) return
    const nextTiles = L.tiles.map((row) => row.slice())
    for (const c of list) {
      nextTiles[c.gy][c.gx] = tileId
    }
    const nextLayers = layers.value.slice()
    nextLayers[idx] = { ...L, tiles: nextTiles }
    layers.value = nextLayers
  }

  function replaceLayers(nextLayers, activeIx = 0) {
    layers.value = nextLayers
    activeLayerIndex.value = Math.max(
      0,
      Math.min(activeIx, nextLayers.length - 1)
    )
  }

  /**
   * @param {number|string} w
   * @param {number|string} h
   * @param {number|string|undefined} [ts] 瓦片像素边长；省略则保留当前 tileSize
   */
  function newMap(w, h, ts) {
    const cw = Math.max(1, Math.min(256, Math.floor(Number(w)) || DEFAULT_W))
    const ch = Math.max(1, Math.min(256, Math.floor(Number(h)) || DEFAULT_H))
    const cts =
      ts !== undefined && ts !== null && ts !== ''
        ? Math.max(8, Math.min(128, Math.floor(Number(ts)) || DEFAULT_TILE_SIZE))
        : tileSize.value
    width.value = cw
    height.value = ch
    tileSize.value = cts
    replaceLayers([createLayer('地面', cw, ch, 'tile')], 0)
    hasMap.value = true
    tileTypes.value = cloneDefaultPaletteForMapTileSize(cts)
    selectedTileId.value = 1
    clearSelection()
    clearError()
  }

  /**
   * 修改地图宽高与 tileSize，保留各层数据并按新尺寸裁剪/扩展
   */
  function applyMapSettings(w, h, ts) {
    if (!hasMap.value || layers.value.length === 0) return
    const cw = Math.max(1, Math.min(256, Math.floor(Number(w)) || DEFAULT_W))
    const ch = Math.max(1, Math.min(256, Math.floor(Number(h)) || DEFAULT_H))
    const cts = Math.max(8, Math.min(128, Math.floor(Number(ts)) || DEFAULT_TILE_SIZE))
    const oldW = width.value
    const oldH = height.value
    const oldTileSize = tileSize.value
    width.value = cw
    height.value = ch
    tileSize.value = cts
    syncPlainTileTextureDimsToMapTileSize(oldTileSize, cts)
    const nextLayers = layers.value.map((L) => ({
      ...L,
      tiles: resizeTilesGrid(L.tiles, oldW, oldH, cw, ch),
    }))
    layers.value = nextLayers
    clearSelection()
    clearError()
  }

  function setZoom(z) {
    if (!Number.isFinite(z)) return
    zoom.value = Math.min(maxZoom, Math.max(minZoom, z))
  }

  function clearMap() {
    if (!hasMap.value) return
    const w = width.value
    const h = height.value
    replaceLayers(
      layers.value.map((L) => ({
        ...L,
        tiles: createEmptyTiles(w, h),
      })),
      activeLayerIndex.value
    )
    clearSelection()
    clearError()
  }

  function activeLayerIsTile() {
    const L = layers.value[activeLayerIndex.value]
    if (!L) return false
    const k = L.kind || 'tile'
    return k === 'tile' || k === 'area'
  }

  function setTile(gx, gy, id) {
    if (!activeLayerIsTile()) return
    if (gx < 0 || gy < 0 || gx >= width.value || gy >= height.value) return
    if (!isValidTileId(id)) return
    const idx = activeLayerIndex.value
    const L = layers.value[idx]
    if (!L) return
    const row = L.tiles[gy].slice()
    row[gx] = id
    const nextTiles = L.tiles.slice()
    nextTiles[gy] = row
    const nextLayers = layers.value.slice()
    nextLayers[idx] = { ...L, tiles: nextTiles }
    layers.value = nextLayers
  }

  function applyZoom(delta) {
    const oldZ = zoom.value
    const factor = delta > 0 ? 0.9 : 1.1
    let z = oldZ * factor
    z = Math.min(maxZoom, Math.max(minZoom, z))
    if (z === oldZ) return false
    zoom.value = z
    return true
  }

  /**
   * @param {{ kind?: 'tile'|'image'|'area', insert: 'above'|'below'|'top'|'bottom' }} options
   */
  function insertLayer(options) {
    if (!hasMap.value) return
    const kind = normalizeLayerKind(options?.kind)
    const insert = String(options?.insert ?? 'above')
    const w = width.value
    const h = height.value
    const list = layers.value.slice()
    const n = list.length + 1
    const name =
      kind === 'image'
        ? `Sprite ${n}`
        : kind === 'area'
          ? `Area ${n}`
          : `Tile ${n}`
    const layer = createLayer(name, w, h, kind)
    const ai = activeLayerIndex.value
    let insertAt = 0
    if (insert === 'top') insertAt = list.length
    else if (insert === 'bottom') insertAt = 0
    else if (insert === 'above') insertAt = ai + 1
    else if (insert === 'below') insertAt = ai
    else insertAt = ai + 1
    insertAt = Math.max(0, Math.min(insertAt, list.length))
    list.splice(insertAt, 0, layer)
    layers.value = list
    activeLayerIndex.value = insertAt
  }

  function moveLayer(fromIndex, toIndex) {
    const list = layers.value.slice()
    const fi = Math.max(0, Math.min(fromIndex, list.length - 1))
    const ti = Math.max(0, Math.min(toIndex, list.length - 1))
    if (fi === ti) return
    const activeId = layers.value[activeLayerIndex.value]?.id
    const [item] = list.splice(fi, 1)
    list.splice(ti, 0, item)
    layers.value = list
    if (activeId != null) {
      const ix = list.findIndex((L) => L.id === activeId)
      activeLayerIndex.value = ix >= 0 ? ix : 0
    }
  }

  function removeLayer(index) {
    if (layers.value.length <= 1) return
    const i = Math.max(0, Math.min(index, layers.value.length - 1))
    const next = layers.value.filter((_, j) => j !== i)
    let nextActive = activeLayerIndex.value
    if (nextActive === i) nextActive = Math.max(0, i - 1)
    else if (nextActive > i) nextActive -= 1
    replaceLayers(next, nextActive)
  }

  function setActiveLayer(index) {
    if (layers.value.length === 0) return
    const i = Math.max(0, Math.min(index, layers.value.length - 1))
    if (i !== activeLayerIndex.value) clearSelection()
    activeLayerIndex.value = i
  }

  function setLayerVisible(index, visible) {
    const i = Math.max(0, Math.min(index, layers.value.length - 1))
    const L = layers.value[i]
    if (!L || L.visible === visible) return
    const next = layers.value.slice()
    next[i] = { ...L, visible }
    layers.value = next
  }

  function setLayerName(index, name) {
    const i = Math.max(0, Math.min(index, layers.value.length - 1))
    const L = layers.value[i]
    if (!L) return
    const nextName = String(name ?? '').trim() || L.name
    const next = layers.value.slice()
    next[i] = { ...L, name: nextName }
    layers.value = next
  }

  function exportMap() {
    if (!hasMap.value) return null
    const body = {
      version: MAP_VERSION,
      tileSize: tileSize.value,
      width: width.value,
      height: height.value,
      activeLayerIndex: activeLayerIndex.value,
      tileTypes: tileTypes.value.map((t) => ({
        name: t.name,
        color: t.color,
        imageDataUrl: t.imageDataUrl ?? null,
        collisionType: t.collisionType === 'block' ? 'block' : 'none',
        transparentColor: t.transparentColor ?? null,
        textureWidth: t.textureWidth ?? null,
        textureHeight: t.textureHeight ?? null,
        colorDepthMode: t.colorDepthMode === 'indexed8' ? 'indexed8' : 'rgba8',
      })),
      layers: layers.value.map((L) => ({
        name: L.name,
        visible: L.visible,
        kind: normalizeLayerKind(L.kind),
        tiles: L.tiles.map((row) => row.slice()),
      })),
    }
    return JSON.stringify(body, null, 2)
  }

  function parseLayersFromData(data, tw, th, maxId) {
    const layerList = data.layers
    if (!Array.isArray(layerList) || layerList.length < 1) {
      return 'layers 无效或为空'
    }
    const parsed = []
    for (let li = 0; li < layerList.length; li++) {
      const raw = layerList[li]
      if (!raw || typeof raw !== 'object') return `第 ${li} 层无效`
      const name = String(raw.name ?? `图层 ${li + 1}`).trim() || `图层 ${li + 1}`
      const visible = raw.visible !== false
      const kind = normalizeLayerKind(raw.kind)
      const err = validateTilesGrid(raw.tiles, tw, th, maxId)
      if (err) return `层 «${name}»：${err}`
      parsed.push({
        id: ++layerSeq,
        name,
        visible,
        kind,
        tiles: raw.tiles.map((r) => r.slice()),
      })
    }
    return parsed
  }

  /**
   * 与 importTileTypesJson 同结构的块数组，写入 tileTypes
   * @returns {string|null} 错误信息或 null
   */
  function applyTileTypesFromJsonArray(arr) {
    if (!Array.isArray(arr) || arr.length < 1) {
      return 'tile类型数组无效'
    }
    if (arr.length > 256) return '块类型数量过多（≤256）'
    const next = []
    for (let i = 0; i < arr.length; i++) {
      const raw = arr[i]
      if (!raw || typeof raw !== 'object') return `第 ${i} 项无效`
      const name = String(raw.name ?? '').trim() || `块 ${i}`
      let color = raw.color
      if (i === 0) {
        color = null
      } else {
        if (color === undefined || color === null || color === '') {
          color = '#888888'
        } else {
          color = String(color).trim()
          if (!/^#[0-9a-fA-F]{6}$/.test(color)) {
            return `第 ${i} 项颜色须为 #RRGGBB`
          }
        }
      }
      let imageDataUrl = null
      if (i !== 0 && raw.imageDataUrl != null && raw.imageDataUrl !== '') {
        imageDataUrl = String(raw.imageDataUrl)
        if (!imageDataUrl.startsWith('data:image/')) {
          return `第 ${i} 项 imageDataUrl 须为 data:image/*`
        }
      }
      const collisionType = raw.collisionType === 'block' ? 'block' : 'none'
      let transparentColor = null
      if (
        i !== 0 &&
        raw.transparentColor != null &&
        raw.transparentColor !== ''
      ) {
        const tc = String(raw.transparentColor).trim()
        if (!/^#[0-9a-fA-F]{6}$/.test(tc)) {
          return `第 ${i} 项 transparentColor 须为 #RRGGBB 或留空`
        }
        transparentColor = tc.toUpperCase()
      }
      let textureWidth = null
      let textureHeight = null
      if (raw.textureWidth != null && raw.textureWidth !== '') {
        const tw = Math.floor(Number(raw.textureWidth))
        if (!Number.isFinite(tw) || tw < 8 || tw > 128) {
          return `第 ${i} 项 textureWidth 须在 8～128`
        }
        textureWidth = tw
      }
      if (raw.textureHeight != null && raw.textureHeight !== '') {
        const th = Math.floor(Number(raw.textureHeight))
        if (!Number.isFinite(th) || th < 8 || th > 128) {
          return `第 ${i} 项 textureHeight 须在 8～128`
        }
        textureHeight = th
      }
      const colorDepthMode =
        raw.colorDepthMode === 'indexed8' ? 'indexed8' : 'rgba8'
      next.push({
        id: i,
        name,
        color,
        imageDataUrl,
        collisionType,
        transparentColor,
        textureWidth,
        textureHeight,
        colorDepthMode,
      })
    }
    tileTypes.value = next
    remapTilesToPaletteLength(next.length)
    if (selectedTileId.value >= next.length) {
      selectedTileId.value = Math.max(0, next.length - 1)
    }
    return null
  }

  function validateAndLoad(data) {
    const ver = Number(data.version)
    const tw = Number(data.width)
    const th = Number(data.height)
    const ts = Number(data.tileSize)
    if (!Number.isInteger(tw) || tw < 1 || tw > 256) return 'width 无效'
    if (!Number.isInteger(th) || th < 1 || th > 256) return 'height 无效'
    if (!Number.isInteger(ts) || ts < 8 || ts > 128) return 'tileSize 无效'

    if (Array.isArray(data.tileTypes) && data.tileTypes.length > 0) {
      const terr = applyTileTypesFromJsonArray(data.tileTypes)
      if (terr) return `tileTypes：${terr}`
    }

    const maxId = tileTypes.value.length

    if (ver === MAP_VERSION || ver === MAP_VERSION_V2) {
      const r = parseLayersFromData(data, tw, th, maxId)
      if (typeof r === 'string') return r
      let ai = Number(data.activeLayerIndex)
      if (!Number.isInteger(ai) || ai < 0 || ai >= r.length) ai = 0
      width.value = tw
      height.value = th
      tileSize.value = ts
      replaceLayers(r, ai)
      hasMap.value = true
      clearSelection()
      clearError()
      return null
    }

    if (ver === MAP_VERSION_LEGACY) {
      const err = validateTilesGrid(data.tiles, tw, th, maxId)
      if (err) return err
      width.value = tw
      height.value = th
      tileSize.value = ts
      replaceLayers(
        [
          {
            id: ++layerSeq,
            name: '地面',
            visible: true,
            kind: 'tile',
            tiles: data.tiles.map((r) => r.slice()),
          },
        ],
        0
      )
      hasMap.value = true
      clearSelection()
      clearError()
      return null
    }

    return `版本不匹配：需要 ${MAP_VERSION} / ${MAP_VERSION_V2} / ${MAP_VERSION_LEGACY}，实际 ${ver}`
  }

  function importMapJson(text) {
    let data
    try {
      data = JSON.parse(text)
    } catch {
      return 'JSON 解析失败'
    }
    return validateAndLoad(data)
  }

  function importMapObject(data) {
    return validateAndLoad(data)
  }

  function remapTilesToPaletteLength(newLen) {
    const clamp = (v) => {
      if (!Number.isInteger(v) || v < 0) return 0
      if (v >= newLen) return 0
      return v
    }
    layers.value = layers.value.map((L) => ({
      ...L,
      tiles: L.tiles.map((row) => row.map(clamp)),
    }))
  }

  /**
   * 从 JSON 导入块库。支持顶层数组，或 `{ "types": [...] }`。
   * 每项：`{ name, color, imageDataUrl? }`，首项为「空」。
   */
  function importTileTypesJson(text) {
    if (!hasMap.value) return '请先创建或打开地图'
    let data
    try {
      data = JSON.parse(text)
    } catch {
      return 'JSON 解析失败'
    }
    const arr = Array.isArray(data) ? data : data?.types
    if (!Array.isArray(arr) || arr.length < 1) {
      return '需要 JSON 数组，或包含 types 数组的对象'
    }
    const err = applyTileTypesFromJsonArray(arr)
    if (err) return err
    clearError()
    return null
  }

  /** 从图片 data URL 追加一种块类型 */
  async function addTileTypeFromImage(name, dataUrl) {
    if (!hasMap.value) return '请先创建或打开地图'
    if (tileTypes.value.length >= 256) return '块类型过多（≤256）'
    const baseName = String(name ?? '').trim() || `块 ${tileTypes.value.length}`
    let color
    try {
      color = await averageColorFromDataUrl(dataUrl)
    } catch {
      return '图片解析失败'
    }
    const id = tileTypes.value.length
    const defTex = Math.max(
      8,
      Math.min(128, Math.floor(tileSize.value) || DEFAULT_TILE_SIZE)
    )
    tileTypes.value = [
      ...tileTypes.value,
      {
        id,
        name: baseName,
        color,
        imageDataUrl: dataUrl,
        collisionType: 'none',
        transparentColor: null,
        textureWidth: defTex,
        textureHeight: defTex,
        colorDepthMode: 'rgba8',
      },
    ]
    selectedTileId.value = id
    clearError()
    return null
  }

  /**
   * @param {number} id
   * @param {{
   *   name?: string,
   *   color?: string | null,
   *   imageDataUrl?: string | null,
   *   collisionType?: 'none' | 'block',
   *   transparentColor?: string | null,
   *   textureWidth?: number | null,
   *   textureHeight?: number | null,
   *   colorDepthMode?: 'rgba8' | 'indexed8',
   * }} patch
   */
  function updateTileType(id, patch) {
    if (id < 0 || id >= tileTypes.value.length) return '无效的块 id'
    const t = tileTypes.value[id]
    const name = patch.name != null ? String(patch.name).trim() : t.name
    if (!name) return '名称不能为空'
    let color = t.color
    let imageDataUrl = t.imageDataUrl ?? null
    let collisionType = t.collisionType === 'block' ? 'block' : 'none'
    let transparentColor = t.transparentColor ?? null
    let textureWidth =
      t.textureWidth != null && Number.isFinite(t.textureWidth)
        ? t.textureWidth
        : null
    let textureHeight =
      t.textureHeight != null && Number.isFinite(t.textureHeight)
        ? t.textureHeight
        : null
    let colorDepthMode = t.colorDepthMode === 'indexed8' ? 'indexed8' : 'rgba8'
    if (id === 0) {
      color = null
      imageDataUrl = null
    } else {
      if (patch.color !== undefined) {
        const c =
          patch.color === null || patch.color === ''
            ? '#888888'
            : String(patch.color).trim()
        if (!/^#[0-9a-fA-F]{6}$/.test(c)) return '颜色须为 #RRGGBB'
        color = c
      }
      if (patch.imageDataUrl !== undefined) {
        if (patch.imageDataUrl === null || patch.imageDataUrl === '') {
          imageDataUrl = null
        } else {
          const u = String(patch.imageDataUrl)
          if (!u.startsWith('data:image/')) return 'imageDataUrl 须为 data:image/*'
          imageDataUrl = u
        }
      }
      if (patch.collisionType !== undefined) {
        const c = patch.collisionType
        if (c !== 'none' && c !== 'block') return 'collisionType 须为 none 或 block'
        collisionType = c
      }
      if (patch.transparentColor !== undefined) {
        if (patch.transparentColor === null || patch.transparentColor === '') {
          transparentColor = null
        } else {
          const tc = String(patch.transparentColor).trim()
          if (!/^#[0-9a-fA-F]{6}$/.test(tc)) return 'transparentColor 须为 #RRGGBB'
          transparentColor = tc.toUpperCase()
        }
      }
      if (patch.textureWidth !== undefined) {
        if (patch.textureWidth === null || patch.textureWidth === '') {
          textureWidth = null
        } else {
          const tw = Math.floor(Number(patch.textureWidth))
          if (!Number.isFinite(tw) || tw < 8 || tw > 128) {
            return 'textureWidth 须在 8～128 或留空'
          }
          textureWidth = tw
        }
      }
      if (patch.textureHeight !== undefined) {
        if (patch.textureHeight === null || patch.textureHeight === '') {
          textureHeight = null
        } else {
          const th = Math.floor(Number(patch.textureHeight))
          if (!Number.isFinite(th) || th < 8 || th > 128) {
            return 'textureHeight 须在 8～128 或留空'
          }
          textureHeight = th
        }
      }
      if (patch.colorDepthMode !== undefined) {
        const m = patch.colorDepthMode
        if (m !== 'rgba8' && m !== 'indexed8') {
          return 'colorDepthMode 须为 rgba8 或 indexed8'
        }
        colorDepthMode = m
      }
    }
    const next = tileTypes.value.slice()
    next[id] = {
      ...t,
      id,
      name,
      color,
      imageDataUrl,
      collisionType,
      transparentColor,
      textureWidth,
      textureHeight,
      colorDepthMode,
    }
    tileTypes.value = next
    clearError()
    return null
  }

  /** 删除指定 id 的块类型（id 0 不可删）；图层中该 id 置空，更大 id 减一。 */
  function deleteTileType(id) {
    if (id === 0) return '不能删除「空」类型'
    const n = tileTypes.value.length
    if (id < 0 || id >= n) return '无效的块 id'
    if (n <= 1) return '至少保留一个类型'
    const next = tileTypes.value
      .filter((_, i) => i !== id)
      .map((t, i) => ({ ...t, id: i }))
    tileTypes.value = next
    const removed = id
    layers.value = layers.value.map((L) => ({
      ...L,
      tiles: L.tiles.map((row) =>
        row.map((v) => {
          if (v === removed) return 0
          if (v > removed) return v - 1
          return v
        })
      ),
    }))
    if (selectedTileId.value === removed) {
      selectedTileId.value = Math.min(removed, next.length - 1)
    } else if (selectedTileId.value > removed) {
      selectedTileId.value--
    }
    clearError()
    return null
  }

  const zoomPercent = computed(() => Math.round(zoom.value * 100))

  const activeLayerName = computed(() => {
    const L = layers.value[activeLayerIndex.value]
    return L?.name ?? ''
  })

  return {
    hasMap,
    tileTypes,
    importTileTypesJson,
    addTileTypeFromImage,
    updateTileType,
    deleteTileType,
    width,
    height,
    tileSize,
    layers,
    activeLayerIndex,
    tiles,
    selectedTileId,
    setSelectedTileId,
    selectedCells,
    setSelection,
    toggleCellInSelection,
    addCellsToSelection,
    clearSelection,
    fillCells,
    activeTool,
    setActiveTool,
    zoom,
    minZoom,
    maxZoom,
    lastError,
    cursorCell,
    zoomPercent,
    activeLayerName,
    newMap,
    clearMap,
    setTile,
    applyZoom,
    setZoom,
    applyMapSettings,
    exportMap,
    importMapJson,
    importMapObject,
    insertLayer,
    moveLayer,
    removeLayer,
    setActiveLayer,
    setLayerVisible,
    setLayerName,
    setError,
    clearError,
    activeLayerIsTile,
  }
}
