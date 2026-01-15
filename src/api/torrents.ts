import type { ServerConfig } from '@/stores/connection'
import type {
  FreeSpaceResult,
  PortTestResult,
  SessionConfig,
  SessionStats,
} from '@/types/transmission'
import type { Torrent, TorrentFile, TorrentFileStat, TorrentStatus } from '@/types/torrent'
import { TorrentStatusEnum } from '@/types/torrent'
import { transmissionClient } from './client'
import { qbittorrentClient } from './qbittorrentClient'
import { isTransmission, torrentApiBase } from '@/config/torrentClient'

interface GetTorrentsOptions {
  ids?: number[] | 'recently-active'
}

export interface AddTorrentPayload {
  magnet?: string
  file?: File | null
  downloadDir?: string
  paused?: boolean
}

const defaultConnection: ServerConfig = {
  url: torrentApiBase,
  username: '',
  password: '',
}

let currentConnection: ServerConfig = { ...defaultConnection }
let qbAuthenticated = false

const configureConnectionInternal = (config: Partial<ServerConfig>) => {
  currentConnection = { ...currentConnection, ...config }
  if (isTransmission) {
    console.log(currentConnection)
    console.log(transmissionClient)
    if (currentConnection.username || currentConnection.password) {
      transmissionClient.setAuth(currentConnection.username, currentConnection.password)
    } else {
      transmissionClient.clearAuth()
    }
  } else {
    if (currentConnection.url) {
      qbittorrentClient.setBaseUrl(currentConnection.url)
    }
    qbAuthenticated = false
  }
}

export const configureConnection = (config: Partial<ServerConfig>) => {
  configureConnectionInternal(config)
}

const encodeFileToBase64 = async (file: File) => {
  const buffer = await file.arrayBuffer()
  const bytes = new Uint8Array(buffer)
  let binary = ''
  const chunkSize = 0x8000
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize)
    binary += String.fromCharCode(...chunk)
  }
  return btoa(binary)
}

interface TorrentService {
  getTorrents(fields?: string[], options?: GetTorrentsOptions): Promise<{ torrents: Torrent[]; removed?: number[] }>
  addTorrent(payload: AddTorrentPayload): Promise<void>
  startTorrents(ids: number[]): Promise<void>
  stopTorrents(ids: number[]): Promise<void>
  removeTorrents(ids: number[], deleteLocalData?: boolean): Promise<void>
  verifyTorrents(ids: number[]): Promise<void>
  reannounceTorrents(ids: number[]): Promise<void>
  setTorrentLocation(ids: number[], location: string, move?: boolean): Promise<void>
  setTorrents(ids: number[], params: Record<string, any>): Promise<void>
  replaceTrackers(ids: number[], oldUrl: string, newUrl: string): Promise<void>
  setTorrentCategory?(ids: number[], category: string): Promise<void>
  getCategories?(): Promise<string[]>
  getSessionStats(): Promise<SessionStats>
  getSession(): Promise<SessionConfig>
  setSession(config: Partial<SessionConfig>): Promise<void>
  getFreeSpace(path: string): Promise<FreeSpaceResult>
  testPort(): Promise<PortTestResult>
  testConnection(): Promise<void>
}

const transmissionService: TorrentService = {
  getTorrents(fields, options) {
    const defaultFields = [
      'id',
      'name',
      'status',
      'totalSize',
      'percentDone',
      'recheckProgress',
      'haveValid',
      'haveUnchecked',
      'sizeWhenDone',
      'leftUntilDone',
      'rateDownload',
      'rateUpload',
      'uploadRatio',
      'eta',
      'peersConnected',
      'peersSendingToUs',
      'peersGettingFromUs',
      'addedDate',
      'doneDate',
      'error',
      'errorString',
      'downloadDir',
      'hashString',
      'trackers',
      'trackerStats',
      'uploadedEver',
      'downloadedEver',
      'activityDate',
      'labels',
      'peers',
      'comment',
    ]

    const payload: Record<string, any> = {
      fields: fields || defaultFields,
    }

    if (options?.ids) {
      payload.ids = options.ids
    }

    return transmissionClient.request<{ torrents: Torrent[]; removed?: number[] }>('torrent-get', payload).then(result => {
      // 为每个种子计算流行度并提取分类信息
      if (result.torrents) {
        result.torrents.forEach(torrent => {
          torrent.popularity = calculatePopularity(
            torrent.uploadRatio,
            torrent.addedDate,
            torrent.activityDate
          )

          // 修正进度计算：包括已下载但未验证的数据
          // percentDone 应该反映实际下载进度，而不仅仅是已验证的数据
          if (torrent.sizeWhenDone && torrent.sizeWhenDone > 0) {
            const haveValid = torrent.haveValid || 0
            const haveUnchecked = torrent.haveUnchecked || 0
            const totalHave = haveValid + haveUnchecked
            torrent.percentDone = totalHave / torrent.sizeWhenDone
          }

          // 从标签中提取分类信息（使用 "category:" 前缀）
          if (torrent.labels && torrent.labels.length > 0) {
            const categoryLabel = torrent.labels.find(label => label.startsWith('category:'))
            if (categoryLabel) {
              torrent.category = categoryLabel.substring('category:'.length)
            }
          }
        })
      }
      return result
    })
  },

  async addTorrent(payload) {
    const params: Record<string, any> = {
      paused: payload.paused ?? false,
    }
    if (payload.downloadDir) {
      params['download-dir'] = payload.downloadDir
    }
    if (payload.magnet) {
      params.filename = payload.magnet
    } else if (payload.file) {
      params.metainfo = await encodeFileToBase64(payload.file)
    } else {
      throw new Error('未提供种子来源')
    }
    await transmissionClient.request('torrent-add', params)
  },

  startTorrents(ids) {
    return transmissionClient.request('torrent-start', { ids })
  },

  stopTorrents(ids) {
    return transmissionClient.request('torrent-stop', { ids })
  },

  removeTorrents(ids, deleteLocalData = false) {
    return transmissionClient.request('torrent-remove', {
      ids,
      'delete-local-data': deleteLocalData,
    })
  },

  verifyTorrents(ids) {
    return transmissionClient.request('torrent-verify', { ids })
  },

  reannounceTorrents(ids) {
    return transmissionClient.request('torrent-reannounce', { ids })
  },

  setTorrentLocation(ids, location, move = false) {
    return transmissionClient.request('torrent-set-location', {
      ids,
      location,
      move,
    })
  },

  setTorrents(ids, params) {
    return transmissionClient.request('torrent-set', {
      ids,
      ...params,
    })
  },

  async replaceTrackers(ids, oldUrl, newUrl) {
    // 获取种子详情以获取完整的tracker列表
    const response = await transmissionClient.request<{ torrents: Torrent[] }>('torrent-get', {
      ids,
      fields: ['id', 'trackers'],
    })

    const torrents = response.torrents || []

    // 对每个种子进行tracker替换
    for (const torrent of torrents) {
      const trackers = torrent.trackers || []

      for (const tracker of trackers) {
        if (tracker.announce.includes(oldUrl)) {
          const updatedUrl = tracker.announce.replace(oldUrl, newUrl)

          // 先删除旧tracker
          await transmissionClient.request('trackerRemove', {
            ids: [torrent.id],
            trackerRemove: [tracker.announce],
          })

          // 再添加新tracker
          await transmissionClient.request('trackerAdd', {
            ids: [torrent.id],
            trackerAdd: [updatedUrl],
          })
        }
      }
    }
  },

  getSessionStats() {
    return transmissionClient.request<SessionStats>('session-stats')
  },

  getSession() {
    return transmissionClient.request<SessionConfig>('session-get')
  },

  setSession(params) {
    return transmissionClient.request('session-set', params)
  },

  getFreeSpace(path) {
    return transmissionClient.request<FreeSpaceResult>('free-space', { path })
  },

  testPort() {
    return transmissionClient.request<PortTestResult>('port-test')
  },

  async testConnection() {
    await transmissionClient.request('session-get')
  },

  async setTorrentCategory(ids, category) {
    console.log('[Transmission] setTorrentCategory called:', { ids, category })

    // 获取当前种子的 ID 和标签
    const result = await transmissionClient.request<{ torrents: Torrent[] }>('torrent-get', {
      ids,
      fields: ['id', 'labels']
    })

    console.log('[Transmission] Current torrents:', result.torrents.map(t => ({
      id: t.id,
      labels: t.labels
    })))

    for (const torrent of result.torrents) {
      // 移除旧的分类标签
      const newLabels = (torrent.labels || []).filter(label => !label.startsWith('category:'))
      // 添加新的分类标签（如果category不为空）
      if (category) {
        newLabels.push(`category:${category}`)
      }

      console.log('[Transmission] Updating torrent:', {
        id: torrent.id,
        oldLabels: torrent.labels,
        newLabels
      })

      // 更新标签
      await transmissionClient.request('torrent-set', {
        ids: [torrent.id],
        labels: newLabels
      })
    }

    console.log('[Transmission] Category update complete')
  },

  async getCategories() {
    const result = await transmissionClient.request<{ torrents: Torrent[] }>('torrent-get', {
      fields: ['labels']
    })
    const categories = new Set<string>()
    result.torrents.forEach(torrent => {
      if (torrent.labels) {
        torrent.labels.forEach(label => {
          if (label.startsWith('category:')) {
            categories.add(label.substring('category:'.length))
          }
        })
      }
    })
    return Array.from(categories)
  },
}

interface QBTorrentInfo {
  hash: string
  name: string
  total_size: number
  size: number
  progress: number
  dlspeed: number
  upspeed: number
  ratio: number
  downloaded: number
  uploaded: number
  added_on: number
  completed: number
  completion_on: number
  state: string
  save_path: string
  eta: number
  last_activity: number
  category?: string
  tags?: string
  num_seeds?: number
  num_leechs?: number
  num_complete?: number
  num_incomplete?: number
  tracker?: string
  dl_limit?: number
  up_limit?: number
}

interface QBTorrentFile {
  name: string
  size: number
  progress: number
  priority: number
}

interface QBTracker {
  url: string
  status: number
  tier: number
  num_peers: number
  num_seeds: number
  num_leeches: number
  num_downloaded: number
  msg: string
}

interface QBTorrentProperties {
  save_path?: string
  creation_date?: number
  piece_size?: number
  comment?: string
  total_wasted?: number
  total_uploaded?: number
  total_uploaded_session?: number
  total_downloaded?: number
  total_downloaded_session?: number
  up_limit?: number
  dl_limit?: number
  time_elapsed?: number
  seeding_time?: number
  nb_connections?: number
  nb_connections_limit?: number
  share_ratio?: number
}

interface QBTransferInfo {
  dl_info_speed: number
  up_info_speed: number
  dl_info_data: number
  up_info_data: number
  dl_rate_limit: number
  up_rate_limit: number
  alltime_dl?: number
  alltime_ul?: number
}

interface QBMainData {
  torrents: Record<string, QBTorrentInfo>
  server_state?: {
    free_space_on_disk?: number
  }
}

interface QBPreferences {
  save_path?: string
  temp_path?: string
  temp_path_enabled?: boolean
  incomplete_files_ext?: boolean
  add_paused_enabled?: boolean
  dl_limit?: number
  up_limit?: number
  alt_dl_limit?: number
  alt_up_limit?: number
  dl_limit_enabled?: boolean
  up_limit_enabled?: boolean
  max_connec?: number
  max_connec_per_torrent?: number
  max_uploads?: number
  max_uploads_per_torrent?: number
  listen_port?: number
  random_port?: boolean
  upnp?: boolean
  dht?: boolean
  lsd?: boolean
  pex?: boolean
  uTP?: boolean
  queueing_enabled?: boolean
  max_active_downloads?: number
  max_active_uploads?: number
  max_active_torrents?: number
  dont_count_slow_torrents?: boolean
  slow_torrent_dl_rate_threshold?: number
  slow_torrent_ul_rate_threshold?: number
  slow_torrent_inactive_timer?: number
  max_ratio?: number
  max_seeding_time?: number
  lsd_enabled?: boolean
  encryption?: number
  scheduler_enabled?: boolean
  schedule_from_hour?: number
  schedule_from_min?: number
  schedule_to_hour?: number
  schedule_to_min?: number
  scheduler_days?: number
  web_ui_username?: string
  web_ui_address?: string
  web_ui_port?: number
  web_ui_session_timeout?: number
  bypass_local_auth?: boolean
  web_ui_csrf_protection_enabled?: boolean
  web_ui_secure_cookie_enabled?: boolean
  web_ui_max_auth_fail_count?: number
  web_ui_ban_duration?: number
  alternative_webui_enabled?: boolean
  alternative_webui_path?: string
}

const QB_KB = 1024
const SECONDS_PER_MONTH = 30 * 24 * 60 * 60 // 30 days
const qbHashToId = new Map<string, number>()
const qbIdToHash = new Map<number, string>()

/**
 * 计算种子流行度
 * 公式: Popularity = Ratio / (activeTime in months)
 * 参考: https://github.com/qbittorrent/qBittorrent/pull/20180
 *
 * @param ratio 上传/下载比率
 * @param addedDate 添加时间戳 (秒)
 * @param activityDate 最后活动时间戳 (秒)
 * @returns 流行度值，如果无法计算则返回 0
 */
const calculatePopularity = (ratio: number, addedDate: number, activityDate?: number): number => {
  const now = Math.floor(Date.now() / 1000)
  const lastActivity = activityDate || now

  // 计算活跃时间（从添加到最后活动的时间差）
  const activeTimeSeconds = lastActivity - addedDate

  // 如果活跃时间小于 1 秒，返回 0
  if (activeTimeSeconds < 1) return 0

  // 转换为月份
  const activeTimeMonths = activeTimeSeconds / SECONDS_PER_MONTH

  // 如果月份数小于 0.01（约 26 分钟），避免除以过小的数导致流行度过高
  if (activeTimeMonths < 0.01) return 0

  // 计算流行度
  return ratio / activeTimeMonths
}

const registerQbHash = (hash: string) => {
  if (qbHashToId.has(hash)) {
    return qbHashToId.get(hash)!
  }
  const parsed = Number.parseInt(hash.slice(0, 12), 16)
  const numericId = Number.isNaN(parsed) ? Math.floor(Math.random() * Number.MAX_SAFE_INTEGER) : parsed
  qbHashToId.set(hash, numericId)
  qbIdToHash.set(numericId, hash)
  return numericId
}

// qBittorrent 状态映射
// 参考: https://github.com/qbittorrent/qBittorrent/wiki/WebUI-API-(qBittorrent-4.1)#get-torrent-list
const qbStateMap: Record<string, TorrentStatus> = {
  // 错误和停止状态
  error: TorrentStatusEnum.STOPPED,
  missingFiles: TorrentStatusEnum.STOPPED,
  unknown: TorrentStatusEnum.STOPPED,
  pausedDL: TorrentStatusEnum.STOPPED,
  pausedUP: TorrentStatusEnum.STOPPED,

  // 检查状态
  checkingDL: TorrentStatusEnum.CHECK,
  checkingUP: TorrentStatusEnum.CHECK,
  checkingResumeData: TorrentStatusEnum.CHECK,

  // 等待状态
  queuedDL: TorrentStatusEnum.DOWNLOAD_WAIT,
  queuedUP: TorrentStatusEnum.SEED_WAIT,
  metaDL: TorrentStatusEnum.DOWNLOAD_WAIT,  // 获取元数据，准备下载
  allocating: TorrentStatusEnum.DOWNLOAD_WAIT,
  moving: TorrentStatusEnum.DOWNLOAD_WAIT,

  // 下载状态 (包括停滞的下载)
  downloading: TorrentStatusEnum.DOWNLOAD,
  stalledDL: TorrentStatusEnum.DOWNLOAD,  // 正在下载但无连接 → 仍然是下载中
  forcedDL: TorrentStatusEnum.DOWNLOAD,

  // 做种状态 (包括停滞的做种)
  uploading: TorrentStatusEnum.SEED,
  stalledUP: TorrentStatusEnum.SEED,  // 正在做种但无连接 → 仍然是做种中
  forcedUP: TorrentStatusEnum.SEED,
}

const resolveQbStatus = (state: string): TorrentStatus => {
  // 调试：输出原始状态
  // 优先处理暂停/停止等显式状态

  // 精确匹配
  if (qbStateMap[state]) {
    const mapped = qbStateMap[state]
    return mapped
  }

  // 模糊匹配（兼容未来可能的新状态）
  const lowerState = state.toLowerCase()
  let result: TorrentStatus

  // 优先识别暂停/停止，避免 "pausedDL/pausedUP" 被误判为下载/做种
  if (lowerState.includes('paus') || lowerState.includes('stop')) {
    result = TorrentStatusEnum.STOPPED
  } else if (lowerState.includes('download') || lowerState.includes('dl')) {
    result = TorrentStatusEnum.DOWNLOAD
  } else if (lowerState.includes('upload') || lowerState.includes('up') || lowerState.includes('seed')) {
    result = TorrentStatusEnum.SEED
  } else if (lowerState.includes('check')) {
    result = TorrentStatusEnum.CHECK
  } else if (lowerState.includes('queue') || lowerState.includes('stall')) {
    result = TorrentStatusEnum.DOWNLOAD_WAIT
  } else {
    // 默认为停止
    console.warn(`Unknown qBittorrent state: ${state}`)
    result = TorrentStatusEnum.STOPPED
  }

  return result
}

const mapQBTorrent = (item: QBTorrentInfo, properties?: QBTorrentProperties): Torrent => {
  const id = registerQbHash(item.hash)
  const status = resolveQbStatus(item.state)
  const labels: string[] = []
  if (item.category) labels.push(item.category)
  if (item.tags) {
    labels.push(...item.tags.split(',').map((tag) => tag.trim()).filter(Boolean))
  }

  const trackers = item.tracker
    ? [
        {
          announce: item.tracker,
          tier: 0,
        },
      ]
    : undefined

  const downloadLimit = item.dl_limit ? Math.round(item.dl_limit / QB_KB) : 0
  const uploadLimit = item.up_limit ? Math.round(item.up_limit / QB_KB) : 0

  // 计算流行度
  const popularity = calculatePopularity(item.ratio, item.added_on, item.last_activity)

  return {
    id,
    name: item.name,
    status,
    totalSize: item.total_size || item.size,
    percentDone: item.progress,
    rateDownload: item.dlspeed,
    rateUpload: item.upspeed,
    uploadRatio: item.ratio,
    eta: item.eta,
    peersConnected: (item.num_seeds || 0) + (item.num_leechs || 0),
    peersSendingToUs: item.num_seeds,
    peersGettingFromUs: item.num_leechs,
    addedDate: item.added_on,
    doneDate: item.completion_on || 0,
    error: ['error', 'missingFiles'].includes(item.state) ? 1 : 0,
    errorString: ['error', 'missingFiles'].includes(item.state)
      ? `客户端状态：${item.state}`
      : '',
    downloadDir: item.save_path,
    hashString: item.hash,
    uploadedEver: item.uploaded,
    downloadedEver: item.downloaded,
    activityDate: item.last_activity,
    labels,
    category: item.category || undefined,
    trackers,
    trackerStats: item.num_complete !== undefined || item.num_incomplete !== undefined
      ? [
          {
            announce: item.tracker || '',
            seederCount: item.num_complete,
            leecherCount: item.num_incomplete,
          },
        ]
      : undefined,
    downloadLimit,
    uploadLimit,
    downloadLimited: downloadLimit > 0,
    uploadLimited: uploadLimit > 0,
    isPrivate: false,
    popularity,
    comment: properties?.comment || undefined,
  }
}

const qbEnsureAuth = async () => {
  // 先尝试获取传输信息，如果成功说明已经认证
  if (qbAuthenticated) return

  try {
    // 尝试调用一个简单的 API 来检查是否已登录
    await qbittorrentClient.get('/app/version')
    qbAuthenticated = true
    return
  } catch (error) {
    // 如果失败，说明未登录或会话过期，需要重新登录
  }

  // qBittorrent 必须提供用户名和密码
  if (!currentConnection.username || !currentConnection.password) {
    throw new Error('qBittorrent 需要提供用户名和密码')
  }

  const body = qbittorrentClient.buildFormData({
    username: currentConnection.username,
    password: currentConnection.password,
  })
  const result = await qbittorrentClient.post<string>('/auth/login', body, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  })

  if (typeof result === 'string' && result.toLowerCase().startsWith('ok')) {
    qbAuthenticated = true
    return
  }

  throw new Error('qBittorrent 认证失败：用户名或密码错误')
}

const qbResolveHashes = async (ids: number[]) => {
  const missing = ids.filter((id) => !qbIdToHash.has(id))
  if (missing.length) {
    const info = await qbittorrentClient.get<QBTorrentInfo[]>('/torrents/info')
    qbHashToId.clear()
    qbIdToHash.clear()
    info.forEach((item) => {
      registerQbHash(item.hash)
    })
  }
  return ids.map((id) => qbIdToHash.get(id)).filter((hash): hash is string => Boolean(hash))
}

const qbittorrentService: TorrentService = {
  async getTorrents(_fields, options) {
    await qbEnsureAuth()
    let torrents: QBTorrentInfo[] = []
    if (options?.ids && Array.isArray(options.ids) && options.ids.length) {
      const hashes = await qbResolveHashes(options.ids)
      if (!hashes.length) {
        return { torrents: [] }
      }
      const joined = hashes.map((hash) => encodeURIComponent(hash)).join('|')
      torrents = await qbittorrentClient.get<QBTorrentInfo[]>(
        `/torrents/info?hashes=${joined}`
      )
    } else {
      // qBittorrent 不支持 'recently-active'，退化为全量列表
      torrents = await qbittorrentClient.get<QBTorrentInfo[]>('/torrents/info')
      qbHashToId.clear()
      qbIdToHash.clear()
    }
    const mapped: Torrent[] = []
    for (const info of torrents) {
      let torrent: Torrent
      if (options?.ids?.length) {
        const [files, qbTrackers, properties] = await Promise.all([
          qbittorrentClient.get<QBTorrentFile[]>(
            `/torrents/files?hash=${encodeURIComponent(info.hash)}`
          ),
          qbittorrentClient.get<QBTracker[]>(
            `/torrents/trackers?hash=${encodeURIComponent(info.hash)}`
          ),
          qbittorrentClient.get<QBTorrentProperties>(
            `/torrents/properties?hash=${encodeURIComponent(info.hash)}`
          ),
        ])
        torrent = mapQBTorrent(info, properties)
        const torrentFiles: TorrentFile[] = files.map((file) => ({
          name: file.name,
          length: file.size,
          bytesCompleted: Math.round(file.size * file.progress),
        }))
        const fileStats: TorrentFileStat[] = files.map((file) => ({
          wanted: file.priority > 0,
          priority: file.priority,
          bytesCompleted: Math.round(file.size * file.progress),
        }))
        torrent.files = torrentFiles
        torrent.fileStats = fileStats

        // Map qBittorrent trackers to Transmission format
        if (qbTrackers?.length) {
          torrent.trackers = qbTrackers
            .filter((t) => t.url && !t.url.startsWith('**'))
            .map((t) => ({
              announce: t.url,
              tier: t.tier,
            }))
          torrent.trackerStats = qbTrackers
            .filter((t) => t.url && !t.url.startsWith('**'))
            .map((t) => ({
              announce: t.url,
              lastAnnounceSucceeded: t.status === 2,
              lastAnnounceTime: 0,
              seederCount: t.num_seeds,
              leecherCount: t.num_leeches,
            }))
        }
      } else {
        torrent = mapQBTorrent(info)
      }
      mapped.push(torrent)
    }
    return { torrents: mapped }
  },

  async addTorrent(payload) {
    await qbEnsureAuth()
    const formData = new FormData()
    if (payload.magnet) {
      formData.append('urls', payload.magnet)
    } else if (payload.file) {
      formData.append('torrents', payload.file)
    } else {
      throw new Error('未提供种子来源')
    }
    if (payload.downloadDir) {
      formData.append('savepath', payload.downloadDir)
      formData.append('autoTMM', 'false')
    }
    if (payload.paused) {
      formData.append('paused', 'true')
    }
    await qbittorrentClient.post('/torrents/add', formData)
  },

  async startTorrents(ids) {
    await qbEnsureAuth()
    const hashes = await qbResolveHashes(ids)
    if (!hashes.length) return
    const body = qbittorrentClient.buildFormData({ hashes: hashes.join('|') })
    await qbittorrentClient.post('/torrents/resume', body, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })
  },

  async stopTorrents(ids) {
    await qbEnsureAuth()
    const hashes = await qbResolveHashes(ids)
    if (!hashes.length) return
    const body = qbittorrentClient.buildFormData({ hashes: hashes.join('|') })
    await qbittorrentClient.post('/torrents/pause', body, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })
  },

  async removeTorrents(ids, deleteLocalData = false) {
    await qbEnsureAuth()
    const hashes = await qbResolveHashes(ids)
    if (!hashes.length) return
    const body = qbittorrentClient.buildFormData({
      hashes: hashes.join('|'),
      deleteFiles: deleteLocalData,
    })
    await qbittorrentClient.post('/torrents/delete', body, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })
  },

  async verifyTorrents(ids) {
    await qbEnsureAuth()
    const hashes = await qbResolveHashes(ids)
    if (!hashes.length) return
    const body = qbittorrentClient.buildFormData({ hashes: hashes.join('|') })
    await qbittorrentClient.post('/torrents/recheck', body, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })
  },

  async reannounceTorrents(ids) {
    await qbEnsureAuth()
    const hashes = await qbResolveHashes(ids)
    if (!hashes.length) return
    const body = qbittorrentClient.buildFormData({ hashes: hashes.join('|') })
    await qbittorrentClient.post('/torrents/reannounce', body, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })
  },

  async setTorrentLocation(ids, location) {
    await qbEnsureAuth()
    const hashes = await qbResolveHashes(ids)
    if (!hashes.length) return
    const body = qbittorrentClient.buildFormData({
      hashes: hashes.join('|'),
      location,
    })
    await qbittorrentClient.post('/torrents/setLocation', body, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })
  },

  async setTorrents(ids, params) {
    await qbEnsureAuth()
    const hashes = await qbResolveHashes(ids)
    if (!hashes.length) return
    if ('downloadLimited' in params || 'downloadLimit' in params) {
      const limited = params.downloadLimited !== false
      const limit = params.downloadLimit ? Number(params.downloadLimit) * QB_KB : 0
      const body = qbittorrentClient.buildFormData({
        hashes: hashes.join('|'),
        limit: limited ? limit : 0,
      })
      await qbittorrentClient.post('/torrents/setDownloadLimit', body, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      })
    }
    if ('uploadLimited' in params || 'uploadLimit' in params) {
      const limited = params.uploadLimited !== false
      const limit = params.uploadLimit ? Number(params.uploadLimit) * QB_KB : 0
      const body = qbittorrentClient.buildFormData({
        hashes: hashes.join('|'),
        limit: limited ? limit : 0,
      })
      await qbittorrentClient.post('/torrents/setUploadLimit', body, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      })
    }
    if (params['files-wanted']?.length || params['files-unwanted']?.length) {
      const targetHash = hashes[0]
      if (!targetHash) {
        return
      }
      if (params['files-wanted']?.length) {
        const body = qbittorrentClient.buildFormData({
          hash: targetHash,
          id: params['files-wanted'].join('|'),
          priority: 1,
        })
        await qbittorrentClient.post('/torrents/filePrio', body, {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        })
      }
      if (params['files-unwanted']?.length) {
        const body = qbittorrentClient.buildFormData({
          hash: targetHash,
          id: params['files-unwanted'].join('|'),
          priority: 0,
        })
        await qbittorrentClient.post('/torrents/filePrio', body, {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        })
      }
    }
  },

  async replaceTrackers(ids, oldUrl, newUrl) {
    await qbEnsureAuth()
    const torrentsData = await qbittorrentService.getTorrents()
    const targetTorrents = torrentsData.torrents.filter((t) => ids.includes(t.id))

    for (const torrent of targetTorrents) {
      const hash = torrent.hashString
      const trackers = torrent.trackers || []

      for (const tracker of trackers) {
        if (tracker.announce.includes(oldUrl)) {
          const updatedUrl = tracker.announce.replace(oldUrl, newUrl)
          const formData = qbittorrentClient.buildFormData({
            hash,
            origUrl: tracker.announce,
            newUrl: updatedUrl,
          })
          await qbittorrentClient.post('/torrents/editTracker', formData)
        }
      }
    }
  },

  async getSessionStats() {
    await qbEnsureAuth()
    const [transfer, maindata] = await Promise.all([
      qbittorrentClient.get<QBTransferInfo>('/transfer/info'),
      qbittorrentClient.get<QBMainData>('/sync/maindata'),
    ])
    const torrents = Object.values(maindata.torrents || {})
    const pausedCount = torrents.filter((item) => item.state?.startsWith('paused')).length
    const activeCount = torrents.length - pausedCount
    const totals = {
      uploadedBytes: transfer.alltime_ul || transfer.up_info_data || 0,
      downloadedBytes: transfer.alltime_dl || transfer.dl_info_data || 0,
      filesAdded: 0,
      sessionCount: 0,
      secondsActive: 0,
    }
    return {
      downloadSpeed: transfer.dl_info_speed,
      uploadSpeed: transfer.up_info_speed,
      activeTorrentCount: activeCount,
      pausedTorrentCount: pausedCount,
      torrentCount: torrents.length,
      'cumulative-stats': totals,
      'current-stats': totals,
    }
  },

  async getSession() {
    await qbEnsureAuth()
    const [preferences, version, speedModeRaw] = await Promise.all([
      qbittorrentClient.get<QBPreferences>('/app/preferences'),
      qbittorrentClient.get<string>('/app/version'),
      qbittorrentClient.get<string>('/transfer/speedLimitsMode'),
    ])
    const toKB = (value?: number) => (value ? Math.round(value / QB_KB) : 0)
    const encToString = (value?: number): 'required' | 'preferred' | 'tolerated' => {
      // qBittorrent: 0=Required, 1=Preferred, 2=Disabled(Allow plain), 映射到 Transmission 风格
      if (value === 0) return 'required'
      if (value === 2) return 'tolerated'
      return 'preferred'
    }
    const qbDaysToMask = (days?: number) => {
      switch (days) {
        case 0: return 127
        case 1: return 62
        case 2: return 65
        case 3: return 2
        case 4: return 4
        case 5: return 8
        case 6: return 16
        case 7: return 32
        case 8: return 64
        case 9: return 1
        default: return 0
      }
    }
    const scheduleBegin = ((preferences.schedule_from_hour || 0) * 60) + (preferences.schedule_from_min || 0)
    const scheduleEnd = ((preferences.schedule_to_hour || 0) * 60) + (preferences.schedule_to_min || 0)
    const speedMode = Number(speedModeRaw || '0')
    const config: SessionConfig = {
      'alt-speed-down': toKB(preferences.alt_dl_limit),
      'alt-speed-enabled': speedMode !== 0,
      'alt-speed-up': toKB(preferences.alt_up_limit),
      'alt-speed-time-begin': scheduleBegin,
      'alt-speed-time-enabled': !!preferences.scheduler_enabled,
      'alt-speed-time-end': scheduleEnd,
      'alt-speed-time-day': qbDaysToMask(preferences.scheduler_days),
      'download-dir': preferences.save_path || '',
      'incomplete-dir': preferences.temp_path || '',
      'incomplete-dir-enabled': !!preferences.temp_path_enabled,
      'rename-partial-files': !!preferences.incomplete_files_ext,
      'start-added-torrents': !preferences.add_paused_enabled,
      'speed-limit-down': toKB(preferences.dl_limit),
      'speed-limit-down-enabled': !!preferences.dl_limit_enabled,
      'speed-limit-up': toKB(preferences.up_limit),
      'speed-limit-up-enabled': !!preferences.up_limit_enabled,
      'seedRatioLimit': preferences.max_ratio || 0,
      'seedRatioLimited': (preferences.max_ratio || 0) > 0,
      'seedIdleLimit': preferences.max_seeding_time || 0,
      'seedIdleLimited': (preferences.max_seeding_time || 0) > 0,
      'peer-limit-per-torrent': preferences.max_connec_per_torrent || 0,
      'peer-limit-global': preferences.max_connec || 0,
      'upload-slots-global': preferences.max_uploads || 0,
      'upload-slots-per-torrent': preferences.max_uploads_per_torrent || 0,
      'peer-port': preferences.listen_port || 0,
      'peer-port-random-on-start': !!preferences.random_port,
      'port-forwarding-enabled': !!preferences.upnp,
      'dht-enabled': !!preferences.dht,
      'lpd-enabled': !!preferences.lsd,
      'pex-enabled': !!preferences.pex,
      'utp-enabled': !!preferences.uTP,
      encryption: encToString(preferences.encryption),
      'download-queue-size': preferences.max_active_downloads || 0,
      'download-queue-enabled': (preferences.max_active_downloads || 0) > 0,
      'seed-queue-size': preferences.max_active_uploads || 0,
      'seed-queue-enabled': (preferences.max_active_uploads || 0) > 0,
      'queue-stalled-enabled': !!preferences.queueing_enabled,
      'queue-stalled-minutes': 0,
      'max-active-torrents': preferences.max_active_torrents || 0,
      'dont-count-slow-torrents': !!preferences.dont_count_slow_torrents,
      'web-ui-username': preferences.web_ui_username || '',
      'web-ui-address': preferences.web_ui_address || '*',
      'web-ui-port': preferences.web_ui_port || 8080,
      'web-ui-session-timeout': preferences.web_ui_session_timeout || 3600,
      'bypass-local-auth': !!preferences.bypass_local_auth,
      'web-ui-csrf-protection': !!preferences.web_ui_csrf_protection_enabled,
      'web-ui-secure-cookie': !!preferences.web_ui_secure_cookie_enabled,
      'web-ui-max-auth-fail-count': preferences.web_ui_max_auth_fail_count || 5,
      'web-ui-ban-duration': preferences.web_ui_ban_duration || 3600,
      'alternative-webui-enabled': !!preferences.alternative_webui_enabled,
      'alternative-webui-path': preferences.alternative_webui_path || '',
      'rpc-version': 0,
      'rpc-version-minimum': 0,
      'rpc-version-semver': version,
      version,
      'rpc-whitelist-enabled': false,
      'rpc-whitelist': '*',
      'rpc-authentication-required': false,
      'rpc-username': currentConnection.username || '',
    }
    ;(config as any)['max-ratio-act'] = (preferences as any).max_ratio_act ?? 0
    ;(config as any)['slow-torrent-dl-rate-threshold'] = preferences.slow_torrent_dl_rate_threshold || 0
    ;(config as any)['slow-torrent-ul-rate-threshold'] = preferences.slow_torrent_ul_rate_threshold || 0
    ;(config as any)['slow-torrent-inactive-timer'] = preferences.slow_torrent_inactive_timer || 0
    return config
  },

  async setSession(params) {
    await qbEnsureAuth()
    const qbParams: Record<string, any> = {}
    const setSpeedMode = async () => {
      const body = qbittorrentClient.buildFormData({
        mode: (params['alt-speed-enabled'] ? 1 : 0)
      })
      await qbittorrentClient.post('/transfer/setSpeedLimitsMode', body, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      })
    }
    const minutesToHourMin = (mins?: number) => {
      const m = Math.max(0, Math.min(1439, mins || 0))
      return { h: Math.floor(m / 60), mi: m % 60 }
    }
    const maskToQbDays = (mask?: number) => {
      const v = mask || 0
      if (v === 127) return 0
      if (v === 62) return 1
      if (v === 65) return 2
      if (v === 2) return 3
      if (v === 4) return 4
      if (v === 8) return 5
      if (v === 16) return 6
      if (v === 32) return 7
      if (v === 64) return 8
      if (v === 1) return 9
      return 0
    }

    // 下载与文件设置
    if ('download-dir' in params) qbParams.save_path = params['download-dir']
    if ('incomplete-dir' in params) qbParams.temp_path = params['incomplete-dir']
    if ('incomplete-dir-enabled' in params) qbParams.temp_path_enabled = params['incomplete-dir-enabled']
    if ('rename-partial-files' in params) qbParams.incomplete_files_ext = !!params['rename-partial-files']
    if ('start-added-torrents' in params) qbParams.add_paused_enabled = !params['start-added-torrents']

    // 速度限制
    if ('speed-limit-down' in params) qbParams.dl_limit = (params['speed-limit-down'] || 0) * QB_KB
    if ('speed-limit-up' in params) qbParams.up_limit = (params['speed-limit-up'] || 0) * QB_KB
    if ('speed-limit-down-enabled' in params) qbParams.dl_limit_enabled = !!params['speed-limit-down-enabled']
    if ('speed-limit-up-enabled' in params) qbParams.up_limit_enabled = !!params['speed-limit-up-enabled']

    // 备用速度限制
    if ('alt-speed-enabled' in params) await setSpeedMode()
    if ('alt-speed-down' in params) qbParams.alt_dl_limit = (params['alt-speed-down'] || 0) * QB_KB
    if ('alt-speed-up' in params) qbParams.alt_up_limit = (params['alt-speed-up'] || 0) * QB_KB
    if ('alt-speed-time-enabled' in params) qbParams.scheduler_enabled = !!params['alt-speed-time-enabled']
    if ('alt-speed-time-begin' in params) {
      const t = minutesToHourMin(params['alt-speed-time-begin'])
      qbParams.schedule_from_hour = t.h
      qbParams.schedule_from_min = t.mi
    }
    if ('alt-speed-time-end' in params) {
      const t = minutesToHourMin(params['alt-speed-time-end'])
      qbParams.schedule_to_hour = t.h
      qbParams.schedule_to_min = t.mi
    }
    if ('alt-speed-time-day' in params) qbParams.scheduler_days = maskToQbDays(params['alt-speed-time-day'])

    // 分享率和做种设置
    if ('seedRatioLimit' in params) qbParams.max_ratio = params['seedRatioLimit']
    if ('seedRatioLimited' in params) qbParams.max_ratio_enabled = params['seedRatioLimited']
    if ('seedIdleLimit' in params) qbParams.max_seeding_time = params['seedIdleLimit']
    if ('seedIdleLimited' in params) qbParams.max_seeding_time_enabled = params['seedIdleLimited']

    // 连接设置
    if ('peer-limit-global' in params) qbParams.max_connec = params['peer-limit-global']
    if ('peer-limit-per-torrent' in params) qbParams.max_connec_per_torrent = params['peer-limit-per-torrent']
    if ('upload-slots-global' in params) qbParams.max_uploads = params['upload-slots-global']
    if ('upload-slots-per-torrent' in params) qbParams.max_uploads_per_torrent = params['upload-slots-per-torrent']
    if ('peer-port' in params) qbParams.listen_port = params['peer-port']
    if ('peer-port-random-on-start' in params) qbParams.random_port = params['peer-port-random-on-start']
    if ('port-forwarding-enabled' in params) qbParams.upnp = params['port-forwarding-enabled']

    // 协议设置
    if ('dht-enabled' in params) qbParams.dht = params['dht-enabled']
    if ('lpd-enabled' in params) qbParams.lsd = params['lpd-enabled']
    if ('pex-enabled' in params) qbParams.pex = params['pex-enabled']
    if ('utp-enabled' in params) qbParams.uTP = params['utp-enabled']

    // 队列设置
    if ('download-queue-size' in params) qbParams.max_active_downloads = params['download-queue-size']
    if ('seed-queue-size' in params) qbParams.max_active_uploads = params['seed-queue-size']
    if ('queue-stalled-enabled' in params) qbParams.queueing_enabled = params['queue-stalled-enabled']
    if ('max-active-torrents' in params) qbParams.max_active_torrents = params['max-active-torrents']
    if ('dont-count-slow-torrents' in params) qbParams.dont_count_slow_torrents = params['dont-count-slow-torrents']
    if ('slow-torrent-dl-rate-threshold' in params) qbParams.slow_torrent_dl_rate_threshold = params['slow-torrent-dl-rate-threshold']
    if ('slow-torrent-ul-rate-threshold' in params) qbParams.slow_torrent_ul_rate_threshold = params['slow-torrent-ul-rate-threshold']
    if ('slow-torrent-inactive-timer' in params) qbParams.slow_torrent_inactive_timer = params['slow-torrent-inactive-timer']
    if ('max-ratio-act' in params) qbParams.max_ratio_act = params['max-ratio-act']

    // WebUI 设置
    if ('web-ui-username' in params) qbParams.web_ui_username = params['web-ui-username']
    if ('web-ui-password' in params && params['web-ui-password']) {
      qbParams.web_ui_password = params['web-ui-password']
    }
    if ('web-ui-address' in params) qbParams.web_ui_address = params['web-ui-address']
    if ('web-ui-port' in params) qbParams.web_ui_port = params['web-ui-port']
    if ('web-ui-session-timeout' in params) qbParams.web_ui_session_timeout = params['web-ui-session-timeout']
    if ('bypass-local-auth' in params) qbParams.bypass_local_auth = params['bypass-local-auth']
    if ('web-ui-csrf-protection' in params) qbParams.web_ui_csrf_protection_enabled = params['web-ui-csrf-protection']
    if ('web-ui-secure-cookie' in params) qbParams.web_ui_secure_cookie_enabled = params['web-ui-secure-cookie']
    if ('web-ui-max-auth-fail-count' in params) qbParams.web_ui_max_auth_fail_count = params['web-ui-max-auth-fail-count']
    if ('web-ui-ban-duration' in params) qbParams.web_ui_ban_duration = params['web-ui-ban-duration']
    if ('alternative-webui-enabled' in params) qbParams.alternative_webui_enabled = params['alternative-webui-enabled']
    if ('alternative-webui-path' in params) qbParams.alternative_webui_path = params['alternative-webui-path']

    // 加密设置
    if ('encryption' in params) {
      const encMap: Record<string, number> = {
        'required': 0,
        'preferred': 1,
        'tolerated': 2,
      }
      qbParams.encryption = encMap[params.encryption as string] ?? 1
    }

    const body = qbittorrentClient.buildFormData({
      json: JSON.stringify(qbParams)
    })

    await qbittorrentClient.post('/app/setPreferences', body, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })
  },

  async getFreeSpace(path) {
    await qbEnsureAuth()
    const data = await qbittorrentClient.get<QBMainData>('/sync/maindata')
    return {
      path,
      'size-bytes': data.server_state?.free_space_on_disk ?? 0,
    }
  },

  async testPort() {
    throw new Error('qBittorrent 暂不支持端口测试')
  },

  async testConnection() {
    await qbEnsureAuth()
    await qbittorrentClient.get('/transfer/info')
  },

  async setTorrentCategory(ids, category) {
    await qbEnsureAuth()
    const hashes = await qbResolveHashes(ids)
    if (!hashes.length) return
    const body = qbittorrentClient.buildFormData({
      hashes: hashes.join('|'),
      category,
    })
    await qbittorrentClient.post('/torrents/setCategory', body, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })
  },

  async getCategories() {
    await qbEnsureAuth()
    const categories = await qbittorrentClient.get<Record<string, any>>('/torrents/categories')
    return Object.keys(categories || {})
  },
}

const activeService: TorrentService = isTransmission ? transmissionService : qbittorrentService

export const getTorrents = (fields?: string[], options?: GetTorrentsOptions) =>
  activeService.getTorrents(fields, options)

export const addTorrent = (payload: AddTorrentPayload) => activeService.addTorrent(payload)
export const startTorrents = (ids: number[]) => activeService.startTorrents(ids)
export const stopTorrents = (ids: number[]) => activeService.stopTorrents(ids)
export const removeTorrents = (ids: number[], deleteLocalData = false) =>
  activeService.removeTorrents(ids, deleteLocalData)
export const verifyTorrents = (ids: number[]) => activeService.verifyTorrents(ids)
export const reannounceTorrents = (ids: number[]) => activeService.reannounceTorrents(ids)
export const setTorrentLocation = (ids: number[], location: string, move = false) =>
  activeService.setTorrentLocation(ids, location, move)
export const setTorrents = (ids: number[], params: Record<string, any>) =>
  activeService.setTorrents(ids, params)
export const replaceTrackers = (ids: number[], oldUrl: string, newUrl: string) =>
  activeService.replaceTrackers(ids, oldUrl, newUrl)
export const getSessionStats = () => activeService.getSessionStats()
export const getSession = () => activeService.getSession()
export const setSession = (config: Partial<SessionConfig>) => activeService.setSession(config)
export const getFreeSpace = (path: string) => activeService.getFreeSpace(path)
export const testPort = () => activeService.testPort()
export const testConnection = async (config?: Partial<ServerConfig>) => {
  if (config) {
    configureConnectionInternal(config)
  }
  await activeService.testConnection()
}

export const setTorrentCategory = (ids: number[], category: string) =>
  activeService.setTorrentCategory?.(ids, category)

export const getCategories = () => activeService.getCategories?.()
