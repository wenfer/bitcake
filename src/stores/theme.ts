import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  ACCENT_STORAGE_KEY,
  MODE_STORAGE_KEY,
  applyThemeToRoot,
  normalizeAccent,
  prefersDark,
  resolveStoredMode,
  type ThemeAccent,
  type ThemeModeType,
} from '@/utils/themeBoot'

// 对外保持原有类型名，MainLayout 等处无需改动
export type ThemeType = ThemeAccent
export type ThemeMode = ThemeModeType

export const useThemeStore = defineStore('theme', () => {
  const currentTheme = ref<ThemeType>('green')
  const currentMode = ref<ThemeMode>(prefersDark() ? 'dark' : 'light')

  /** 把主题写入 <html>，Element Plus 与自定义样式都从这里取值 */
  const applyTheme = () => {
    applyThemeToRoot(currentTheme.value, currentMode.value)
  }

  const loadTheme = () => {
    let savedAccent: string | null = null
    try {
      savedAccent = localStorage.getItem(ACCENT_STORAGE_KEY)
    } catch {
      savedAccent = null
    }

    currentTheme.value = normalizeAccent(savedAccent)
    currentMode.value = resolveStoredMode()
    applyTheme()
  }

  const setTheme = (theme: ThemeType) => {
    currentTheme.value = theme
    try {
      localStorage.setItem(ACCENT_STORAGE_KEY, theme)
    } catch {
      /* localStorage 不可用时仅更新内存状态 */
    }
    applyTheme()
  }

  const setMode = (mode: ThemeMode) => {
    currentMode.value = mode
    try {
      localStorage.setItem(MODE_STORAGE_KEY, mode)
    } catch {
      /* localStorage 不可用时仅更新内存状态 */
    }
    applyTheme()
  }

  const toggleMode = () => {
    setMode(currentMode.value === 'dark' ? 'light' : 'dark')
  }

  // 首次进入时立即应用，避免出现主题闪烁
  loadTheme()

  return {
    currentTheme,
    currentMode,
    loadTheme,
    setTheme,
    setMode,
    toggleMode,
  }
})
