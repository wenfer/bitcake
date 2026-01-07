import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import dayjs from 'dayjs'
import * as api from '@/api/torrents'
import type { SessionStats, SessionConfig } from '@/types/transmission'
import type { Torrent } from '@/types/transmission'
import { TorrentStatusEnum } from '@/types/transmission'

const POLL_INTERVAL = 3000

// 统计所需的最小字段集，减少数据传输
const STATS_FIELDS = [
  'id',
  'status',
  'error',
  'errorString',
  'rateDownload',
  'rateUpload',
]

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
      const [stats, config, torrentsResult] = await Promise.all([
        api.getSessionStats(),
        api.getSession(),
        api.getTorrents(STATS_FIELDS),
      ])
      sessionStats.value = stats
      sessionConfig.value = config

      // 更新种子列表用于统计（只在没有完整数据时更新）
      // 如果 HomeView 已经加载了完整数据，这里的数据会被覆盖
      if (torrentsResult.torrents) {
        // 合并数据：保留现有种子的完整字段，只更新统计相关字段
        const existingMap = new Map(torrents.value.map(t => [t.id, t]))
        const updatedTorrents = torrentsResult.torrents.map(newT => {
          const existing = existingMap.get(newT.id)
          if (existing) {
            // 更新统计相关字段
            return {
              ...existing,
              status: newT.status,
              error: newT.error,
              errorString: newT.errorString,
              rateDownload: newT.rateDownload,
              rateUpload: newT.rateUpload,
            }
          }
          return newT
        })
        torrents.value = updatedTorrents
      }

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