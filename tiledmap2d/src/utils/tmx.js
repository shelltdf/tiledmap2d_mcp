import pako from 'pako'

/** Tiled GID 翻转标志（正交地图） */
const FLIPPED_HORIZONTALLY_FLAG = 0x80000000
const FLIPPED_VERTICALLY_FLAG = 0x40000000
const FLIPPED_DIAGONALLY_FLAG = 0x20000000

export function stripGidFlags(gid) {
  return (
    gid &
    ~(FLIPPED_HORIZONTALLY_FLAG | FLIPPED_VERTICALLY_FLAG | FLIPPED_DIAGONALLY_FLAG)
  )
}

function escapeXmlText(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function layerDataXml(name, layerId, tw, th, tiles, visibleAttr) {
  const rows = []
  for (let gy = 0; gy < th; gy++) {
    rows.push(tiles[gy].join(','))
  }
  const csv = `${rows.join(',\n')}\n`
  const vis = visibleAttr === false ? '0' : '1'
  return ` <layer id="${layerId}" name="${escapeXmlText(name)}" width="${tw}" height="${th}" visible="${vis}">
  <data encoding="csv">
${csv}  </data>
 </layer>`
}

/**
 * 导出 TMX（正交、多图层、与内置块库兼容：firstgid=1，gid 0 为空，gid 1..5 对应瓦片 id 1..5）
 * 每个图层为 CSV。tileset 引用同目录 tilemap-palette.png（5×1 瓦片图块）。
 */
export function exportTmx({
  width,
  height,
  tileSize,
  layers,
  paletteFileName = 'tilemap-palette.png',
}) {
  const tw = width
  const th = height
  const ts = tileSize
  const tilecount = 5
  const imgW = tilecount * ts
  const imgH = ts
  const list = Array.isArray(layers) && layers.length > 0 ? layers : []
  const nextlayerid = list.length + 1

  let body = ''
  const emptyGrid = () =>
    Array.from({ length: th }, () => Array.from({ length: tw }, () => 0))
  for (let i = 0; i < list.length; i++) {
    const L = list[i]
    const name = L.name ?? `Layer ${i + 1}`
    const vis = L.visible !== false
    const tiles =
      L.kind === 'image' ? emptyGrid() : L.tiles
    body += layerDataXml(String(name), i + 1, tw, th, tiles, vis)
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<map version="1.10" tiledversion="1.10.2" orientation="orthogonal" renderorder="right-down" width="${tw}" height="${th}" tilewidth="${ts}" tileheight="${ts}" infinite="0" nextlayerid="${nextlayerid}" nextobjectid="1">
 <tileset firstgid="1" name="editor-palette" tilewidth="${ts}" tileheight="${ts}" spacing="0" margin="0" tilecount="${tilecount}" columns="${tilecount}">
  <image source="${escapeXmlText(paletteFileName)}" width="${imgW}" height="${imgH}"/>
 </tileset>${body}
</map>
`
}

function parseCsvGids(text) {
  const flat = text
    .replace(/\r\n/g, '\n')
    .trim()
    .split(/[,\n]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => parseInt(s, 10))
  return flat
}

function parseBase64ZlibGids(base64Text, expectedCount) {
  const binary = atob(base64Text.replace(/\s/g, ''))
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  const inflated = pako.inflate(bytes)
  if (inflated.length !== expectedCount * 4) {
    throw new Error(`解压后长度 ${inflated.length}，期望 ${expectedCount * 4}`)
  }
  const dv = new DataView(
    inflated.buffer,
    inflated.byteOffset,
    inflated.byteLength
  )
  const gids = []
  for (let i = 0; i < expectedCount; i++) {
    gids.push(dv.getUint32(i * 4, true))
  }
  return gids
}

/**
 * 将 GID 转为编辑器瓦片 id（0 空；firstgid 起为第 1 类瓦片）
 */
export function gidToEditorTileId(gid, firstGid) {
  const g = stripGidFlags(gid >>> 0)
  if (g === 0) return 0
  return g - firstGid + 1
}

function parseLayerDataElement(dataEl, width, height, firstGid, maxTileTypeCount) {
  const encoding = dataEl.getAttribute('encoding') ?? ''
  const compression = dataEl.getAttribute('compression') ?? ''
  const expected = width * height
  let flat

  if (encoding === 'csv') {
    const text = dataEl.textContent ?? ''
    flat = parseCsvGids(text)
  } else if (encoding === 'base64') {
    const raw = (dataEl.textContent ?? '').replace(/\s/g, '')
    if (compression === 'zlib' || compression === '') {
      try {
        flat = parseBase64ZlibGids(raw, expected)
      } catch (e) {
        throw new Error(`解析 base64/zlib 失败：${e.message ?? e}`)
      }
    } else {
      throw new Error(`不支持的 compression：${compression || '无'}`)
    }
  } else {
    throw new Error(`不支持的 data encoding：${encoding || '无'}（支持 csv、base64+zlib）`)
  }

  if (flat.length !== expected) {
    throw new Error(`图层格子数 ${flat.length} 与 width*height=${expected} 不符`)
  }

  const tiles = []
  for (let gy = 0; gy < height; gy++) {
    const row = []
    for (let gx = 0; gx < width; gx++) {
      const gid = flat[gy * width + gx]
      const id = gidToEditorTileId(gid, firstGid)
      if (!Number.isInteger(id) || id < 0 || id >= maxTileTypeCount) {
        throw new Error(`非法瓦片 id（${gx},${gy}）：gid=${gid} → ${id}`)
      }
      row.push(id)
    }
    tiles.push(row)
  }
  return tiles
}

/**
 * 解析 TMX XML，返回 { version: 2, width, height, tileSize, layers, activeLayerIndex } 或错误串
 */
export function parseTmxToMapPayload(xmlText, maxTileTypeCount) {
  const parser = new DOMParser()
  const doc = parser.parseFromString(xmlText, 'application/xml')
  const err = doc.querySelector('parsererror')
  if (err) {
    return 'TMX XML 解析失败'
  }
  const mapEl = doc.querySelector('map')
  if (!mapEl) return '缺少 map 元素'

  if (mapEl.getAttribute('orientation') !== 'orthogonal') {
    return '仅支持 orientation=orthogonal'
  }
  if (mapEl.getAttribute('infinite') === '1') {
    return '不支持 infinite=1 地图'
  }

  const width = parseInt(mapEl.getAttribute('width') ?? '', 10)
  const height = parseInt(mapEl.getAttribute('height') ?? '', 10)
  const tileSize = parseInt(mapEl.getAttribute('tilewidth') ?? '', 10)
  const th = parseInt(mapEl.getAttribute('tileheight') ?? '', 10)
  if (!Number.isInteger(width) || width < 1 || width > 256) return 'map width 无效'
  if (!Number.isInteger(height) || height < 1 || height > 256) return 'map height 无效'
  if (!Number.isInteger(tileSize) || tileSize < 8 || tileSize > 128) return 'tilewidth 无效'
  if (!Number.isInteger(th) || th !== tileSize) return 'tilewidth 与 tileheight 须一致'

  const tilesetEl = doc.querySelector('tileset')
  const firstGid = parseInt(tilesetEl?.getAttribute('firstgid') ?? '1', 10)
  if (!Number.isInteger(firstGid) || firstGid < 1) return 'tileset firstgid 无效'

  const layerEls = Array.from(mapEl.children).filter((n) => n.tagName === 'layer')
  if (layerEls.length === 0) return '未找到 tile layer'

  const layersOut = []
  for (let li = 0; li < layerEls.length; li++) {
    const layerEl = layerEls[li]
    const dataEl = layerEl.querySelector('data')
    if (!dataEl) return `图层 ${li + 1} 缺少 data`
    const name = layerEl.getAttribute('name') ?? `图层 ${li + 1}`
    const visible = layerEl.getAttribute('visible') !== '0'
    try {
      const tiles = parseLayerDataElement(
        dataEl,
        width,
        height,
        firstGid,
        maxTileTypeCount
      )
      layersOut.push({
        name,
        visible,
        tiles,
      })
    } catch (e) {
      return `图层 «${name}»：${e.message ?? e}`
    }
  }

  return {
    version: 2,
    tileSize,
    width,
    height,
    activeLayerIndex: 0,
    layers: layersOut,
  }
}
