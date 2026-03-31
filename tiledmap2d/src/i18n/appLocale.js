import { ref } from 'vue'

/** 与界面语言同步，供 useTileMap 等无法在 setup 中 inject 的模块使用 */
export const appLocale = ref('zh')
