// Transmission RPC 类型定义

export interface RpcRequest {
  method: string
  arguments?: Record<string, any>
  tag?: number
}

export interface RpcResponse<T = any> {
  result: string
  arguments?: T
  tag?: number
}

// 种子状态枚举
export const TorrentStatusEnum = {
  STOPPED: 0,
  CHECK_WAIT: 1,
  CHECK: 2,
  DOWNLOAD_WAIT: 3,
  DOWNLOAD: 4,
  SEED_WAIT: 5,
  SEED: 6,
} as const

export type TorrentStatus = (typeof TorrentStatusEnum)[keyof typeof TorrentStatusEnum]

// 种子信息接口
export interface Torrent {
  id: number
  name: string
  status: TorrentStatus
  totalSize: number
  percentDone: number
  rateDownload: number
  rateUpload: number
  uploadRatio: number
  eta: number
  peersConnected: number
  peersSendingToUs?: number
  peersGettingFromUs?: number
  addedDate: number
  doneDate: number
  error: number
  errorString: string
  downloadDir: string
  hashString: string
  uploadedEver: number
  downloadedEver: number
  activityDate: number
  labels?: string[]
  trackers?: TorrentTracker[]
  trackerStats?: TorrentTrackerStat[]
  comment?: string
  creator?: string
  pieceCount?: number
  pieceSize?: number
  dateCreated?: number
  files?: TorrentFile[]
  fileStats?: TorrentFileStat[]
  isPrivate?: boolean
  downloadLimit?: number
  uploadLimit?: number
  downloadLimited?: boolean
  uploadLimited?: boolean
  bandwidthPriority?: number
  webseeds?: string[]
  // 可以根据需要继续添加更多字段
}

export interface TorrentTracker {
  id: number
  announce: string
  scrape: string
  tier: number
}

export interface TorrentTrackerStat {
  announce: string
  host: string
  seederCount: number
  leecherCount: number
  downloadCount: number
  isBackup: boolean
  lastAnnounceTime: number
  lastAnnounceSucceeded: boolean
  lastAnnouncePeerCount: number
  nextAnnounceTime: number
}

export interface TorrentFile {
  name: string
  length: number
  bytesCompleted: number
}

export interface TorrentFileStat {
  bytesCompleted: number
  priority: number
  wanted: boolean
}

export interface FreeSpaceResult {
  path: string
  'size-bytes': number
}

// 会话统计信息
export interface SessionTotals {
  uploadedBytes: number
  downloadedBytes: number
  filesAdded: number
  sessionCount: number
  secondsActive: number
}

export interface SessionStats {
  downloadSpeed: number
  uploadSpeed: number
  activeTorrentCount: number
  pausedTorrentCount: number
  torrentCount: number
  'cumulative-stats': SessionTotals
  'current-stats': SessionTotals
}

export interface PortTestResult {
  'port-is-open': boolean
}

// 会话配置信息
export interface SessionConfig {
  'alt-speed-down': number
  'alt-speed-enabled': boolean
  'alt-speed-up': number
  'alt-speed-time-begin': number
  'alt-speed-time-enabled': boolean
  'alt-speed-time-end': number
  'alt-speed-time-day': number
  'download-dir': string
  'incomplete-dir': string
  'incomplete-dir-enabled': boolean
  'rename-partial-files': boolean
  'start-added-torrents': boolean
  'trash-original-torrent-files': boolean
  'speed-limit-down': number
  'speed-limit-down-enabled': boolean
  'speed-limit-up': number
  'speed-limit-up-enabled': boolean
  'seedRatioLimit': number
  'seedRatioLimited': boolean
  'seedIdleLimit': number
  'seedIdleLimited': boolean
  'peer-limit-per-torrent': number
  'peer-limit-global': number
  'peer-port': number
  'peer-port-random-on-start': boolean
  'port-forwarding-enabled': boolean
  'dht-enabled': boolean
  'lpd-enabled': boolean
  'pex-enabled': boolean
  'utp-enabled': boolean
  encryption: 'required' | 'preferred' | 'tolerated'
  'download-queue-size': number
  'download-queue-enabled': boolean
  'seed-queue-size': number
  'seed-queue-enabled': boolean
  'queue-stalled-enabled': boolean
  'queue-stalled-minutes': number
  'rpc-version': number
  'rpc-version-minimum': number
  'rpc-version-semver'?: string
  'rpc-whitelist-enabled': boolean
  'rpc-whitelist': string
  'rpc-authentication-required': boolean
  'rpc-username': string
  version: string
  // 可以根据需要继续添加更多字段
}
