import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export type Theme = 'default' | 'tech'

export const useThemeStore = defineStore('theme', () => {
  const currentTheme = ref<Theme>('default')
  
  const themes = {
    default: {
      name: '默认主题',
      cssClass: 'theme-default'
    },
    tech: {
      name: '科技风格',
      cssClass: 'theme-tech'
    }
  }

  const setTheme = (theme: Theme) => {
    currentTheme.value = theme
    document.body.className = themes[theme].cssClass
    localStorage.setItem('app-theme', theme)
  }

  const initTheme = () => {
    const savedTheme = localStorage.getItem('app-theme') as Theme | null
    if (savedTheme && themes[savedTheme]) {
      setTheme(savedTheme)
    } else {
      setTheme('default')
    }
  }

  return {
    currentTheme,
    themes,
    setTheme,
    initTheme
  }
})