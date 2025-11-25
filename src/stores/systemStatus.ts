import { defineStore } from 'pinia'
import { ref } from 'vue'
import dayjs from 'dayjs'
import * as api from '@/api/transmission'
import type { SessionStats, SessionConfig } from '@/types/transmission'

const POLL_INTERVAL = 5000

interface LoadOptions {
  silent?: boolean
}

export const useSystemStatusStore = defineStore('systemStatus', () => {
  const sessionStats = ref<SessionStats | null>(null)
  const sessionConfig = ref<SessionConfig | null>(null)
  const freeSpaceBytes = ref<number | null>(null)
  const lastUpdated = ref('')
  const loading = ref(false)
  let refreshTimer: number | undefined

  const load = async (options: LoadOptions = {}) => {
    if (!options.silent) {
      loading.value = true
    }
    try {
      const [stats, config] = await Promise.all([
        api.getSessionStats(),
        api.getSession(),
      ])
      sessionStats.value = stats
      sessionConfig.value = config

      const downloadDir = config['download-dir']
      if (downloadDir) {
        try {
          const freeSpace = await api.getFreeSpace(downloadDir)
          freeSpaceBytes.value = freeSpace['size-bytes']
        } catch (error) {
          freeSpaceBytes.value = null
          if (!options.silent) {
            console.warn('获取可用空间失败', error)
          }
        }
      } else {
        freeSpaceBytes.value = null
      }

      lastUpdated.value = dayjs().format('YYYY-MM-DD HH:mm:ss')
    } catch (error) {
      if (options.silent) {
        console.error('刷新系统状态失败', error)
      } else {
        throw error
      }
    } finally {
      if (!options.silent) {
        loading.value = false
      }
    }
  }

  const start = () => {
    if (typeof window === 'undefined') return
    if (refreshTimer) return
    load({ silent: true })
    refreshTimer = window.setInterval(() => {
      load({ silent: true })
    }, POLL_INTERVAL)
  }

  const stop = () => {
    if (refreshTimer) {
      window.clearInterval(refreshTimer)
      refreshTimer = undefined
    }
  }

  return {
    sessionStats,
    sessionConfig,
    freeSpaceBytes,
    lastUpdated,
    loading,
    load,
    start,
    stop,
  }
})
