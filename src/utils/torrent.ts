import { i18n } from '@/i18n'

interface TrackerSite {
  name: string
  trackers: string[]
}

interface TrackerSitesConfig {
  sites: TrackerSite[]
}

const trackerKeywords: Array<{ keyword: string; siteName: string }> = []
let configLoaded = false
let configLoading: Promise<void> | null = null

/**
 * 异步加载 tracker 站点配置
 */
async function loadTrackerSitesConfig(): Promise<void> {
  if (configLoaded) return
  if (configLoading) return configLoading

  configLoading = (async () => {
    try {
      // 使用 BASE_URL 确保路径在开发和生产环境都正确
      const baseUrl = import.meta.env.BASE_URL || '/'
      const url = `${baseUrl}trackerSites.json`.replace(/\/+/g, '/').replace(':/', '://')

      const response = await fetch(url)
      if (!response.ok) {
        console.warn('Failed to load trackerSites.json, using empty config')
        configLoaded = true
        return
      }
      const config: TrackerSitesConfig = await response.json()

      trackerKeywords.splice(0, trackerKeywords.length)
      config.sites.forEach(site => {
        site.trackers.forEach(tracker => {
          trackerKeywords.push({ keyword: tracker.toLowerCase(), siteName: site.name })
        })
      })

      configLoaded = true
    } catch (error) {
      console.error('Error loading trackerSites.json:', error)
      configLoaded = true // 即使失败也标记为已加载，避免重复尝试
    }
  })()

  return configLoading
}

// 应用启动时立即开始加载配置
loadTrackerSitesConfig()

export const getTrackerHost = (announce: string): string => {
  try {
    const url = new URL(announce)
    return url.host || announce
  } catch {
    return announce
  }
}

const findSiteNameByAnnounce = (announce: string): string | null => {
  const host = getTrackerHost(announce).toLowerCase()
  const full = announce.toLowerCase()
  for (const { keyword, siteName } of trackerKeywords) {
    if (host.includes(keyword) || full.includes(keyword)) {
      return siteName
    }
  }
  return null
}

/**
 * 获取 tracker 的显示名称
 * 如果配置中有站点映射则返回站点名称（支持国际化），否则返回 tracker host
 */
export const getTrackerDisplayName = (announce: string): string => {
  const host = getTrackerHost(announce)
  const siteName = findSiteNameByAnnounce(announce)

  if (siteName) {
    // 尝试从 i18n 获取翻译
    const translationKey = `trackerSites.${siteName}`
    const translated = i18n.global.t(translationKey)
    // 如果翻译键不存在，t() 会返回键本身，所以检查是否等于键
    return translated !== translationKey ? translated : siteName
  }

  return host
}

/**
 * 根据站点名称或 tracker host 进行匹配
 */
export const matchesTrackerFilter = (announce: string, filter: string): boolean => {
  if (!filter) return true
  const host = getTrackerHost(announce)
  const siteName = findSiteNameByAnnounce(announce)
  // 如果有站点名称，则按站点名称匹配，否则按 host 匹配
  return siteName ? siteName === filter : host === filter
}

/**
 * 确保配置已加载（用于需要等待配置的场景）
 */
export const ensureTrackerConfigLoaded = async (): Promise<void> => {
  await loadTrackerSitesConfig()
}

/**
 * 重新加载配置（用于动态更新配置的场景）
 */
export const reloadTrackerSitesConfig = async (): Promise<void> => {
  configLoaded = false
  configLoading = null
  trackerKeywords.splice(0, trackerKeywords.length)
  await loadTrackerSitesConfig()
}
