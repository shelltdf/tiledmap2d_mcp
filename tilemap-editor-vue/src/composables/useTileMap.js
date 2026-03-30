import { ref, computed, shallowRef } from 'vue'

export const TILE_TYPES = [
  { id: 0, name: '空', color: null },
  { id: 1, name: '草地', color: '#6ebf4a' },
  { id: 2, name: '水', color: '#3b8fd9' },
  { id: 3, name: '沙地', color: '#d4c4a8' },
  { id: 4, name: '石砖', color: '#8a8a8a' },
  { id: 5, name: '木', color: '#a67c52' },
]

const MAP_VERSION = 1
const DEFAULT_TILE_SIZE = 32
const DEFAULT_W = 32
const DEFAULT_H = 24

function createEmptyTiles(width, height) {
  return Array.from({ length: height }, () => Array(width).fill(0))
}

export function useTileMap() {
  const width = ref(DEFAULT_W)
  const height = ref(DEFAULT_H)
  const tileSize = ref(DEFAULT_TILE_SIZE)
  const tiles = shallowRef(createEmptyTiles(DEFAULT_W, DEFAULT_H))
  const selectedTileId = ref(1)
  const zoom = ref(1)
  const lastError = ref('')
  const cursorCell = ref(null)

  const minZoom = 0.25
  const maxZoom = 4

  function setError(msg) {
    lastError.value = msg
  }

  function clearError() {
    lastError.value = ''
  }

  function newMap(w, h) {
    const cw = Math.max(1, Math.min(256, Math.floor(Number(w)) || DEFAULT_W))
    const ch = Math.max(1, Math.min(256, Math.floor(Number(h)) || DEFAULT_H))
    width.value = cw
    height.value = ch
    tiles.value = createEmptyTiles(cw, ch)
    clearError()
  }

  function clearMap() {
    tiles.value = createEmptyTiles(width.value, height.value)
    clearError()
  }

  function setTile(gx, gy, id) {
    if (gx < 0 || gy < 0 || gx >= width.value || gy >= height.value) return
    if (!TILE_TYPES.some((t) => t.id === id)) return
    const row = tiles.value[gy].slice()
    row[gx] = id
    const next = tiles.value.slice()
    next[gy] = row
    tiles.value = next
  }

  function applyZoom(delta, centerX, centerY, rectWidth, rectHeight) {
    const oldZ = zoom.value
    const factor = delta > 0 ? 0.9 : 1.1
    let z = oldZ * factor
    z = Math.min(maxZoom, Math.max(minZoom, z))
    if (z === oldZ) return
    zoom.value = z
  }

  function exportMap() {
    const body = {
      version: MAP_VERSION,
      tileSize: tileSize.value,
      width: width.value,
      height: height.value,
      tiles: tiles.value.map((row) => row.slice()),
    }
    return JSON.stringify(body, null, 2)
  }

  function validateAndLoad(data) {
    if (data.version !== MAP_VERSION) {
      return `版本不匹配：需要 ${MAP_VERSION}，实际 ${data.version}`
    }
    const tw = Number(data.width)
    const th = Number(data.height)
    const ts = Number(data.tileSize)
    if (!Number.isInteger(tw) || tw < 1 || tw > 256) return 'width 无效'
    if (!Number.isInteger(th) || th < 1 || th > 256) return 'height 无效'
    if (!Number.isInteger(ts) || ts < 8 || ts > 128) return 'tileSize 无效'
    const rows = data.tiles
    if (!Array.isArray(rows) || rows.length !== th) return 'tiles 行数与 height 不符'
    for (let y = 0; y < th; y++) {
      const row = rows[y]
      if (!Array.isArray(row) || row.length !== tw) return `第 ${y} 行列数与 width 不符`
      for (let x = 0; x < tw; x++) {
        const v = row[x]
        if (!Number.isInteger(v) || v < 0 || v >= TILE_TYPES.length) return `非法瓦片 id：(${x},${y})`
      }
    }
    width.value = tw
    height.value = th
    tileSize.value = ts
    tiles.value = rows.map((r) => r.slice())
    clearError()
    return null
  }

  function importMapJson(text) {
    let data
    try {
      data = JSON.parse(text)
    } catch {
      return 'JSON 解析失败'
    }
    const err = validateAndLoad(data)
    return err
  }

  const zoomPercent = computed(() => Math.round(zoom.value * 100))

  return {
    TILE_TYPES,
    width,
    height,
    tileSize,
    tiles,
    selectedTileId,
    zoom,
    minZoom,
    maxZoom,
    lastError,
    cursorCell,
    zoomPercent,
    newMap,
    clearMap,
    setTile,
    applyZoom,
    exportMap,
    importMapJson,
    setError,
    clearError,
  }
}
