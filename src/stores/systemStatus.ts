import { defineStore } from 'pinia'
import { ref, shallowRef, computed } from 'vue'
import dayjs from 'dayjs'
import * as api from '@/api/torrents'
import type { SessionStats, SessionConfig } from '@/types/transmission'
import type { Torrent } from '@/types/transmission'
import { TorrentStatusEnum } from '@/types/transmission'
import { AdaptivePoller, SingleFlightExecutor } from '@/utils/polling'
import { isTorrentError } from '@/utils/torrentStatus'

const POLL_INTERVAL = 3000
const CONFIG_REFRESH_INTERVAL = 30_000
const FREE_SPACE_REFRESH_INTERVAL = 15_000

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
  // Torrent objects can contain large nested tracker/file structures. The store
  // only replaces the array and reads top-level statistics, so deep proxies add
  // cost without providing value.
  const torrents = shallowRef<Torrent[]>([])
  let externalTorrentSourceCount = 0
  let lastConfigRefreshAt = 0
  let lastFreeSpaceRefreshAt = 0

  const setTorrents = (newTorrents: Torrent[]) => {
    torrents.value = newTorrents
  }

  const registerTorrentSource = () => {
    externalTorrentSourceCount += 1
    let released = false
    return () => {
      if (released) return
      released = true
      externalTorrentSourceCount = Math.max(0, externalTorrentSourceCount - 1)
    }
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

      // Count error torrents（tracker 的正常响应如 `ook` 不计入错误）
      if (isTorrentError(torrent)) {
        counts.error = (counts.error || 0) + 1
      }
    })

    return counts
  })

  const performLoad = async (forceDetails = false): Promise<void> => {
    const now = Date.now()
    const shouldRefreshConfig =
      forceDetails ||
      !sessionConfig.value ||
      now - lastConfigRefreshAt >= CONFIG_REFRESH_INTERVAL
    const [stats, config, torrentsResult] = await Promise.all([
      api.getSessionStats(),
      shouldRefreshConfig
        ? api.getSession()
        : Promise.resolve(sessionConfig.value),
      externalTorrentSourceCount > 0
        ? Promise.resolve(null)
        : api.getTorrents(STATS_FIELDS),
    ])
    sessionStats.value = stats
    if (shouldRefreshConfig) {
      sessionConfig.value = config
      lastConfigRefreshAt = now
    }

    // 合并精简统计字段，保留其他页面写入 Store 的完整种子信息。
    if (externalTorrentSourceCount === 0 && torrentsResult?.torrents) {
      const existingMap = new Map(torrents.value.map(t => [t.id, t]))
      torrents.value = torrentsResult.torrents.map(newT => {
        const existing = existingMap.get(newT.id)
        if (existing) {
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
    }

    const downloadDir = config?.['download-dir']
    const shouldRefreshFreeSpace =
      forceDetails ||
      lastFreeSpaceRefreshAt === 0 ||
      now - lastFreeSpaceRefreshAt >= FREE_SPACE_REFRESH_INTERVAL
    if (downloadDir && shouldRefreshFreeSpace) {
      // Throttle failures as well, otherwise an unavailable disk endpoint
      // would be retried on every fast statistics poll.
      lastFreeSpaceRefreshAt = now
      try {
        const freeSpace = await api.getFreeSpace(downloadDir)
        freeSpaceBytes.value = freeSpace['size-bytes']
      } catch {
        freeSpaceBytes.value = null
      }
    } else if (!downloadDir) {
      freeSpaceBytes.value = null
    }

    lastUpdated.value = dayjs().format('YYYY-MM-DD HH:mm:ss')
  }

  const loader = new SingleFlightExecutor<void>()
  const load = async (options: LoadOptions = {}): Promise<boolean> => {
    if (!options.silent) loading.value = true
    try {
      await loader.run(() => performLoad(!options.silent))
      return true
    } catch (error) {
      if (options.silent) {
        console.error('刷新系统状态失败', error)
        return false
      }
      throw error
    } finally {
      if (!options.silent) loading.value = false
    }
  }

  const poller = new AdaptivePoller(
    () => load({ silent: true }),
    {
      intervalMs: POLL_INTERVAL,
      maxIntervalMs: 30_000,
      shouldRun: () => document.visibilityState !== 'hidden',
    }
  )

  const start = () => {
    if (typeof window === 'undefined') return
    poller.start()
  }

  const stop = () => {
    poller.stop()
  }

  return {
    sessionStats,
    sessionConfig,
    freeSpaceBytes,
    lastUpdated,
    loading,
    torrents,
    setTorrents,
    registerTorrentSource,
    torrentCounts,
    load,
    start,
    stop,
  }
})
