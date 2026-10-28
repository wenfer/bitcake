// 主题共享逻辑：存储 key、解析规则与写 DOM 的唯一实现。
// stores/theme.ts（运行时切换）与 applyStoredTheme()（首屏防闪烁）都从这里取值，
// 避免「存储 key / 兼容规则」在两处各自维护后漂移。

export type ThemeAccent = 'green' | 'blue' | 'pink'
export type ThemeModeType = 'light' | 'dark'

export const ACCENT_STORAGE_KEY = 'app-theme'
export const MODE_STORAGE_KEY = 'app-theme-mode'

export const THEME_ACCENTS: ThemeAccent[] = ['green', 'blue', 'pink']

export const prefersDark = (): boolean =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-color-scheme: dark)').matches

/** 兼容旧版本主题名（'fresh' / 'default'），非法值统一回退 green */
export const normalizeAccent = (saved: string | null): ThemeAccent => {
  if (saved === 'fresh' || saved === 'default') return 'green'
  return THEME_ACCENTS.includes(saved as ThemeAccent) ? (saved as ThemeAccent) : 'green'
}

/** 解析深浅模式：优先取存储值，否则跟随系统偏好 */
export const resolveStoredMode = (): ThemeModeType => {
  try {
    const savedMode = localStorage.getItem(MODE_STORAGE_KEY)
    if (savedMode === 'light' || savedMode === 'dark') return savedMode
  } catch {
    /* localStorage 不可用时保持系统偏好 */
  }
  return prefersDark() ? 'dark' : 'light'
}

/** 把主题写入 <html>，Element Plus 与自定义样式都从这里取值 */
export const applyThemeToRoot = (accent: ThemeAccent, mode: ThemeModeType): void => {
  const root = document.documentElement
  root.setAttribute('data-theme', accent)
  root.setAttribute('data-bc-mode', mode)
  root.classList.toggle('dark', mode === 'dark')
}

/**
 * 在 Vue 挂载前把主题写到 <html>，避免首屏主题闪烁。
 * 在 main.ts 中于 createApp 之前调用。
 */
export function applyStoredTheme(): void {
  if (typeof document === 'undefined') return

  let saved: string | null = null
  try {
    saved = localStorage.getItem(ACCENT_STORAGE_KEY)
  } catch {
    saved = null
  }

  applyThemeToRoot(normalizeAccent(saved), resolveStoredMode())
}
