import type { Torrent } from '@/types/transmission'
import { TorrentStatusEnum, type TorrentStatus } from '@/types/torrent'

/**
 * 种子错误等级（沿用 Transmission RPC 的 error 字段语义）
 * - 0：无错误
 * - 1：tracker 警告（qBittorrent 侧复用为 error / missingFiles 状态）
 * - 2：tracker 错误
 * - 3：本地错误（文件缺失、磁盘不可写等）
 */
export const TorrentErrorLevel = {
  NONE: 0,
  TRACKER_WARNING: 1,
  TRACKER_ERROR: 2,
  LOCAL_ERROR: 3,
} as const

/**
 * 部分 tracker 对「正常种子」会返回非 bencoded 的成功文本（典型值 `ook`）。
 * Transmission / qBittorrent 解析不了这类响应，会把它当成 tracker 报错
 * 写进 errorString，导致种子列表把健康的种子显示成「错误」。
 *
 * 这里集中维护这些「看起来像报错、实际是正常响应」的文本，
 * 新增 tracker 特例时只需要往数组里加即可。
 */
export const TRACKER_HEALTHY_RESPONSES: readonly string[] = [
  'ok',
  'ook',
  'oook',
  'ooook',
  'okok',
  '200ok',
  'success',
  'succeeded',
  'noop',
]

/** 形如 "Tracker: ook" / "Announce: ook" 的前缀标签 */
const LABEL_PREFIX_PATTERN = /^(tracker|announce|announce response|scrape|warning|error)\s*[::：\-–—]?\s*/i

/** 归一化：去前缀标签、去大小写与所有非字母数字字符，便于做宽松匹配 */
const normalizeTrackerResponse = (message: string): string =>
  message
    .toLowerCase()
    .trim()
    .replace(LABEL_PREFIX_PATTERN, '')
    .replace(/[^a-z0-9]/g, '')

/**
 * 判断 tracker 返回文本是否属于「正常响应」
 * 空字符串同样视为正常（没有任何错误描述）
 */
export const isHealthyTrackerResponse = (message?: string | null): boolean => {
  if (message === null || message === undefined) return true

  const normalized = normalizeTrackerResponse(message)
  if (!normalized) return true

  // ok / ook / oook ...
  if (/^o+k+$/.test(normalized)) return true
  // 200 OK
  if (/^\d{3}ok$/.test(normalized)) return true

  return TRACKER_HEALTHY_RESPONSES.some((item) => normalizeTrackerResponse(item) === normalized)
}

/**
 * 取出种子真正的错误描述
 * tracker 的正常响应（如 `ook`）会被过滤掉，返回 undefined
 */
export const getTorrentErrorMessage = (torrent: Pick<Torrent, 'errorString'>): string | undefined => {
  const raw = torrent?.errorString
  if (typeof raw !== 'string') return undefined

  const trimmed = raw.trim()
  if (!trimmed) return undefined

  return isHealthyTrackerResponse(trimmed) ? undefined : trimmed
}

/**
 * 统一的种子异常判定
 * - 本地错误（等级 >= 3）始终视为异常
 * - tracker 级错误只在存在「真实错误描述」时才视为异常，
 *   避免 `ook` 这类正常响应把健康种子标记成错误
 */
export const isTorrentError = (torrent: Pick<Torrent, 'error' | 'errorString'>): boolean => {
  if (!torrent) return false

  const code = Number(torrent.error ?? 0)
  if (code >= TorrentErrorLevel.LOCAL_ERROR) return true

  return Boolean(getTorrentErrorMessage(torrent))
}

/**
 * 种子状态文案的单一来源（`status.*` i18n 命名空间）。
 * HomeView / MainLayout / ReseedView 共用；传入响应式作用域里的 t，
 * 在 computed / 渲染中调用即可随语言切换更新。
 */
export const buildTorrentStatusTextMap = (
  t: (key: string) => string
): Record<TorrentStatus, string> => ({
  [TorrentStatusEnum.STOPPED]: t('status.stopped'),
  [TorrentStatusEnum.CHECK_WAIT]: t('status.waitCheck'),
  [TorrentStatusEnum.CHECK]: t('status.checking'),
  [TorrentStatusEnum.DOWNLOAD_WAIT]: t('status.waitDownload'),
  [TorrentStatusEnum.DOWNLOAD]: t('status.downloading'),
  [TorrentStatusEnum.SEED_WAIT]: t('status.waitSeed'),
  [TorrentStatusEnum.SEED]: t('status.seeding'),
})

/** 取单个状态的文案，未命中时返回调用方提供的兜底文案 */
export const getTorrentStatusText = (
  t: (key: string) => string,
  status: TorrentStatus,
  fallback: string
): string => buildTorrentStatusTextMap(t)[status] ?? fallback
