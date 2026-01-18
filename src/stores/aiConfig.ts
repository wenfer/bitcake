import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { AIConfig } from '@/types/agent'

const STORAGE_KEY = 'bitcake_ai_config'

export const useAIConfigStore = defineStore('aiConfig', () => {
  // 状态
  const endpoint = ref<string>('')
  const apiKey = ref<string>('')
  const model = ref<string>('gpt-3.5-turbo')

  // 计算属性：检查配置是否完整
  const isConfigured = computed(() => {
    return endpoint.value.trim() !== '' && apiKey.value.trim() !== ''
  })

  // 获取完整配置
  const getConfig = computed((): AIConfig => ({
    endpoint: endpoint.value,
    apiKey: apiKey.value,
    model: model.value
  }))

  // 保存配置
  const saveConfig = (config: AIConfig) => {
    endpoint.value = config.endpoint
    apiKey.value = config.apiKey
    if (config.model) {
      model.value = config.model
    }

    // 持久化到 localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      endpoint: endpoint.value,
      apiKey: apiKey.value,
      model: model.value
    }))
  }

  // 加载配置
  const loadConfig = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const config = JSON.parse(stored) as AIConfig
        endpoint.value = config.endpoint || ''
        apiKey.value = config.apiKey || ''
        model.value = config.model || 'gpt-3.5-turbo'
      }
    } catch (error) {
      console.error('Failed to load AI config:', error)
    }
  }

  // 清除配置
  const clearConfig = () => {
    endpoint.value = ''
    apiKey.value = ''
    model.value = 'gpt-3.5-turbo'
    localStorage.removeItem(STORAGE_KEY)
  }

  // 初始化时加载配置
  loadConfig()

  return {
    endpoint,
    apiKey,
    model,
    isConfigured,
    getConfig,
    saveConfig,
    loadConfig,
    clearConfig
  }
})
