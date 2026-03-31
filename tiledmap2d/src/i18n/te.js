import { messages } from './messages.js'
import { appLocale } from './appLocale.js'

/**
 * 按路径取当前语言文案；支持函数值（带插值参数）。
 * @param {string} path 如 `errors.tileMap.invalidTileId` 或 `palette.grass`
 * @param {...unknown} args
 */
export function te(path, ...args) {
  const loc = appLocale.value === 'en' ? 'en' : 'zh'
  let cur = messages[loc]
  for (const p of path.split('.')) {
    cur = cur?.[p]
  }
  if (typeof cur === 'function') return cur(...args)
  if (typeof cur === 'string') return cur
  let fb = messages.zh
  for (const p of path.split('.')) {
    fb = fb?.[p]
  }
  if (typeof fb === 'function') return fb(...args)
  return typeof fb === 'string' ? fb : path
}
