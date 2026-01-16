import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { setLocale, getLocale, type LocaleType } from '@/i18n'

export const useLocaleStore = defineStore('locale', () => {
  const currentLocale = ref<LocaleType>(getLocale())

  const isZhCN = computed(() => currentLocale.value === 'zh-CN')
  const isEnUS = computed(() => currentLocale.value === 'en-US')

  const localeOptions = [
    { value: 'zh-CN' as LocaleType, label: '简体中文' },
    { value: 'en-US' as LocaleType, label: 'English' },
  ]

  function switchLocale(locale: LocaleType) {
    currentLocale.value = locale
    setLocale(locale)
    // Element Plus 不支持动态切换语言，需要刷新页面
    // 为了更好的用户体验，我们在这里刷新页面
    window.location.reload()
  }

  function toggleLocale() {
    const newLocale = currentLocale.value === 'zh-CN' ? 'en-US' : 'zh-CN'
    switchLocale(newLocale)
  }

  return {
    currentLocale,
    isZhCN,
    isEnUS,
    localeOptions,
    switchLocale,
    toggleLocale,
  }
})
