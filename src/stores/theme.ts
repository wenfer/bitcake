import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export type ThemeType = 'default' | 'blue'

export const useThemeStore = defineStore('theme', () => {
  const currentTheme = ref<ThemeType>('default')

  // 从 localStorage 加载主题
  const loadTheme = () => {
    const savedTheme = localStorage.getItem('app-theme') as ThemeType | 'fresh'
    // 兼容旧的 'fresh' 主题名称，转换为新的 'default'
    if (savedTheme === 'fresh') {
      currentTheme.value = 'default'
      localStorage.setItem('app-theme', 'default')
    } else if (savedTheme === 'default' || savedTheme === 'blue') {
      currentTheme.value = savedTheme
      applyTheme(savedTheme)
    }
  }

  // 应用主题到 HTML 根元素
  const applyTheme = (theme: ThemeType) => {
    document.documentElement.setAttribute('data-theme', theme)
  }

  // 切换主题
  const setTheme = (theme: ThemeType) => {
    currentTheme.value = theme
    localStorage.setItem('app-theme', theme)
    applyTheme(theme)
  }

  // 监听主题变化
  watch(currentTheme, (newTheme) => {
    applyTheme(newTheme)
  })

  return {
    currentTheme,
    loadTheme,
    setTheme,
  }
})
