import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import dayjs from 'dayjs'
import * as api from '@/api/torrents'
import type { SessionStats, SessionConfig } from '@/types/transmission'
import type { Torrent } from '@/types/transmission'
import { TorrentStatusEnum } from '@/types/transmission'

const POLL_INTERVAL = 3000

interface LoadOptions {
  silent?: boolean
}

export const useSystemStatusStore = defineStore('systemStatus', () => {
  const sessionStats = ref<SessionStats | null>(null)
  const sessionConfig = ref<SessionConfig | null>(null)
  const freeSpaceBytes = ref<number | null>(null)
  const lastUpdated = ref('')
  const loading = ref(false)
  const torrents = ref<Torrent[]>([])
  let refreshTimer: number | undefined

  const setTorrents = (newTorrents: Torrent[]) => {
    torrents.value = newTorrents
  }

  const torrentCounts = computed(() => {
    const counts: Record<string, number> = {
      all: torrents.value.length,
      active: 0,
      error: 0,
      queued: 0,
      downloading: 0,
      paused: 0,
      checking: 0,
      seeding: 0,
    }

    torrents.value.forEach(torrent => {
      // Count by specific statuses
      if (torrent.status === TorrentStatusEnum.DOWNLOAD) {
        counts.downloading = (counts.downloading || 0) + 1
        // Active count includes torrents with non-zero speed
        if ((torrent.rateDownload > 0) || (torrent.rateUpload > 0)) {
          counts.active = (counts.active || 0) + 1
        }
      } else if (torrent.status === TorrentStatusEnum.STOPPED) {
        counts.paused = (counts.paused || 0) + 1
      } else if (torrent.status === TorrentStatusEnum.CHECK) {
        counts.checking = (counts.checking || 0) + 1
      } else if (torrent.status === TorrentStatusEnum.SEED) {
        counts.seeding = (counts.seeding || 0) + 1
        // Active count includes torrents with non-zero speed
        if ((torrent.rateDownload > 0) || (torrent.rateUpload > 0)) {
          counts.active = (counts.active || 0) + 1
        }
      } else if ([TorrentStatusEnum.CHECK_WAIT, TorrentStatusEnum.DOWNLOAD_WAIT, TorrentStatusEnum.SEED_WAIT].includes(torrent.status)) {
        counts.queued = (counts.queued || 0) + 1
      }
      
      // Count error torrents
      if ((torrent.error ?? 0) > 0 || !!torrent.errorString) {
        counts.error = (counts.error || 0) + 1
      }
    })
    
    return counts
  })

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
    torrents,
    setTorrents,
    torrentCounts,
    load,
    start,
    stop,
  }
})