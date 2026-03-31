/**
 * 从图片 data URL 计算平均色（忽略近透明像素）
 * @param {string} dataUrl
 * @returns {Promise<string>} #RRGGBB
 */
export function averageColorFromDataUrl(dataUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      try {
        const w = img.naturalWidth || 1
        const h = img.naturalHeight || 1
        const c = document.createElement('canvas')
        c.width = w
        c.height = h
        const ctx = c.getContext('2d')
        if (!ctx) {
          resolve('#888888')
          return
        }
        ctx.drawImage(img, 0, 0)
        const { data } = ctx.getImageData(0, 0, w, h)
        let r = 0
        let g = 0
        let b = 0
        let n = 0
        for (let i = 0; i < data.length; i += 4) {
          if (data[i + 3] < 8) continue
          r += data[i]
          g += data[i + 1]
          b += data[i + 2]
          n++
        }
        if (n === 0) {
          resolve('#888888')
          return
        }
        const toHex = (x) =>
          Math.min(255, Math.round(x))
            .toString(16)
            .padStart(2, '0')
        resolve(
          `#${toHex(r / n)}${toHex(g / n)}${toHex(b / n)}`.toUpperCase(),
        )
      } catch {
        resolve('#888888')
      }
    }
    img.onerror = () => reject(new Error('图片加载失败'))
    img.src = dataUrl
  })
}
