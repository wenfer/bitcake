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

