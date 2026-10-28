import trackerErrorPatternsJson from '@/config/trackerErrorPatterns.json'

export interface ErrorMappingLike {
  keywords: string[]
  type: string
  message: string
}

type Namespace = 'torrent' | 'reseed'
type TrackerErrorGroup =
  | 'torrent_error'
  | 'auth_error'
  | 'duplicate_error'
  | 'network_error'
  | 'client_error'
  | 'file_error'
  | 'ratio_error'

type TrackerErrorPatternItem = {
  en: string
  zh: string
}

type TrackerErrorPatterns = Record<TrackerErrorGroup, TrackerErrorPatternItem[]>

const trackerErrorPatterns = trackerErrorPatternsJson as TrackerErrorPatterns

const groupToCategoryKey: Record<TrackerErrorGroup, string> = {
  torrent_error: 'torrentError',
  auth_error: 'authError',
  duplicate_error: 'duplicateError',
  network_error: 'networkError',
  client_error: 'clientError',
  file_error: 'fileError',
  ratio_error: 'ratioError',
}

export const buildTrackerErrorMappings = (params: {
  t: (key: string) => string
  namespace: Namespace
  locale: string
}): ErrorMappingLike[] => {
  const { t, namespace, locale } = params
  const isZh = locale.toLowerCase().startsWith('zh')

  const mappings: ErrorMappingLike[] = []

  ;(Object.keys(groupToCategoryKey) as TrackerErrorGroup[]).forEach((group) => {
    const categoryI18nKey = `${namespace}.errorType.${groupToCategoryKey[group]}`
    const type = t(categoryI18nKey)

    trackerErrorPatterns[group].forEach((item) => {
      const keywords = [item.en, item.zh].filter(Boolean)
      if (!keywords.length) return

      mappings.push({
        keywords,
        type,
        message: isZh ? item.zh : item.en,
      })
    })
  })

  return mappings
}

/**
 * 基础错误规则表（与客户端/ tracker 无关的通用关键词）。
 * typeKey / messageKey 是 `${namespace}.errorType.*` 下的 key 后缀。
 */
const baseErrorRules: Array<{
  keywords: string[]
  typeKey: string
  messageKey: string
  /** 仅在 torrent 命名空间下启用（与历史行为保持一致） */
  torrentOnly?: boolean
}> = [
  { keywords: ['No data found', 'Ensure your drives are connected', 'Set Location'], typeKey: 'fileNotExist', messageKey: 'fileNotExist' },
  { keywords: ['more than', '上传同一个种子', 'other location'], typeKey: 'duplicateAnnounce', messageKey: 'duplicateAnnounce' },
  { keywords: ['Request too frequent'], typeKey: 'frequentAnnounce', messageKey: 'frequentAnnounce', torrentOnly: true },
  { keywords: ['You already are downloading'], typeKey: 'duplicateAnnounce', messageKey: 'duplicateDownload' },
  { keywords: ['missingFiles'], typeKey: 'fileNotExist', messageKey: 'fileNotExist' },
  { keywords: ['Permission denied', 'permission'], typeKey: 'permissionError', messageKey: 'permissionError' },
  { keywords: ['No space left', 'disk full', 'Disk full'], typeKey: 'diskSpaceError', messageKey: 'diskSpaceError' },
  { keywords: ['Tracker gave HTTP response code 404', 'Tracker not found'], typeKey: 'networkError', messageKey: 'trackerNotFound' },
  { keywords: ['Tracker gave HTTP response code 403', 'Forbidden'], typeKey: 'authError', messageKey: 'trackerDenied' },
  { keywords: ['Tracker gave a warning', 'Unregistered torrent'], typeKey: 'torrentError', messageKey: 'torrentNotRegistered' },
  { keywords: ['Tracker gave HTTP response code 5', '502'], typeKey: 'networkError', messageKey: 'trackerServerError' },
  { keywords: ['Connection refused', 'Could not connect', 'timeout'], typeKey: 'networkError', messageKey: 'networkFailed' },
  { keywords: ['Piece #', 'corrupt', 'checksum'], typeKey: 'verifyError', messageKey: 'verifyFailed' },
]

/**
 * 各命名空间的 message key 覆盖（保持与收敛前两个视图的文案完全一致）：
 * - reseed 的重复汇报提示使用独立文案 key
 * - torrent 的「已在下载」提示复用 duplicateAnnounce
 */
const messageKeyOverrides: Record<Namespace, Record<string, string>> = {
  torrent: { duplicateDownload: 'duplicateAnnounce' },
  reseed: { duplicateDownload: 'duplicateDownloadMsg', duplicateAnnounce: 'duplicateAnnounceMsg' },
}

/**
 * 构建完整的错误映射表：基础规则 + tracker 错误模式。
 * HomeView / ReseedView 共用，避免 keywords 表双份漂移。
 */
export const buildErrorMappings = (params: {
  t: (key: string) => string
  namespace: Namespace
  locale: string
}): ErrorMappingLike[] => {
  const { t, namespace, locale } = params
  const i18nKey = (suffix: string) => `${namespace}.errorType.${suffix}`
  const overrides = messageKeyOverrides[namespace]

  const mappings: ErrorMappingLike[] = baseErrorRules
    .filter((rule) => !rule.torrentOnly || namespace === 'torrent')
    .map((rule) => ({
      keywords: rule.keywords,
      type: t(i18nKey(rule.typeKey)),
      message: t(i18nKey(overrides[rule.messageKey] ?? rule.messageKey)),
    }))

  return [...mappings, ...buildTrackerErrorMappings({ t, namespace, locale })]
}

/** 按 errorString 匹配映射表（关键词大小写不敏感，命中任一即可） */
export const matchErrorMapping = (
  errorString: string,
  mappings: ErrorMappingLike[]
): ErrorMappingLike | undefined => {
  const lowerError = errorString.toLowerCase()
  return mappings.find((mapping) =>
    mapping.keywords.some((keyword) => lowerError.includes(keyword.toLowerCase()))
  )
}

