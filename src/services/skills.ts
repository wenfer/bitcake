import type { Skill } from '@/types/agent'
import * as torrentApi from '@/api/torrents'
import { TorrentStatusEnum } from '@/types/torrent'
import type { TorrentStatus } from '@/types/torrent'

/**
 * 预置的 Skills 集合
 * 这些 skills 可以被 agent 调用来完成各种 torrent 管理任务
 */

/**
 * 获取种子列表
 */
export const getTorrentsSkill: Skill = {
  name: 'get_torrents',
  description: '获取种子列表信息。支持按状态、名称关键词、数量限制等过滤。返回精简的种子信息。',
  parameters: [
    {
      name: 'status',
      type: 'string',
      description: '过滤种子状态：all(全部), downloading(下载中), seeding(做种中), paused(已暂停), checking(校验中)',
      required: false,
      default: 'all'
    },
    {
      name: 'keyword',
      type: 'string',
      description: '按名称关键词过滤种子（不区分大小写）',
      required: false
    },
    {
      name: 'limit',
      type: 'number',
      description: '限制返回的种子数量，默认20，最大100。如果种子很多，建议使用较小的值',
      required: false,
      default: 20
    },
    {
      name: 'sortBy',
      type: 'string',
      description: '排序方式：name(名称), size(大小), progress(进度), uploadSpeed(上传速度), downloadSpeed(下载速度)',
      required: false,
      default: 'name'
    }
  ],
  execute: async (params) => {
    const { torrents } = await torrentApi.getTorrents()

    // 1. 根据状态过滤
    let filtered = torrents
    if (params.status && params.status !== 'all') {
      const statusMap: Record<string, TorrentStatus> = {
        'downloading': TorrentStatusEnum.DOWNLOAD,
        'seeding': TorrentStatusEnum.SEED,
        'paused': TorrentStatusEnum.STOPPED,
        'checking': TorrentStatusEnum.CHECK
      }
      const targetStatus = statusMap[params.status]
      if (targetStatus !== undefined) {
        filtered = torrents.filter(t => t.status === targetStatus)
      }
    }

    // 2. 根据关键词过滤
    if (params.keyword) {
      const keyword = params.keyword.toLowerCase()
      filtered = filtered.filter(t =>
        t.name.toLowerCase().includes(keyword)
      )
    }

    // 3. 排序
    const sortBy = params.sortBy || 'name'
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'size':
          return b.totalSize - a.totalSize
        case 'progress':
          return b.percentDone - a.percentDone
        case 'uploadSpeed':
          return b.rateUpload - a.rateUpload
        case 'downloadSpeed':
          return b.rateDownload - a.rateDownload
        case 'name':
        default:
          return a.name.localeCompare(b.name)
      }
    })

    // 4. 限制数量
    const limit = Math.min(params.limit || 20, 100)
    const limited = filtered.slice(0, limit)
    const hasMore = filtered.length > limit

    // 5. 返回精简的信息（只包含必要字段）
    return {
      total: filtered.length,
      returned: limited.length,
      hasMore,
      torrents: limited.map(t => {
        // 获取状态名称
        const statusName = Object.entries(TorrentStatusEnum).find(
          ([, value]) => value === t.status
        )?.[0] || 'UNKNOWN'

        // 格式化大小
        const formatSize = (bytes: number) => {
          if (bytes < 1024) return `${bytes}B`
          if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
          if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)}MB`
          return `${(bytes / 1024 / 1024 / 1024).toFixed(2)}GB`
        }

        // 格式化速度
        const formatSpeed = (bytesPerSec: number) => {
          if (bytesPerSec === 0) return '0'
          return `${formatSize(bytesPerSec)}/s`
        }

        return {
          id: t.id,
          name: t.name.length > 50 ? t.name.substring(0, 47) + '...' : t.name, // 截断过长的名称
          status: statusName,
          size: formatSize(t.totalSize),
          progress: `${Math.round(t.percentDone * 100)}%`,
          downloadSpeed: formatSpeed(t.rateDownload),
          uploadSpeed: formatSpeed(t.rateUpload)
        }
      })
    }
  }
}

/**
 * 添加种子
 */
export const addTorrentSkill: Skill = {
  name: 'add_torrent',
  description: '通过磁力链接添加新的种子任务',
  parameters: [
    {
      name: 'magnet',
      type: 'string',
      description: '磁力链接，以 magnet:?xt=urn:btih: 开头',
      required: true
    },
    {
      name: 'paused',
      type: 'boolean',
      description: '是否暂停状态添加（不立即开始下载）',
      required: false,
      default: false
    }
  ],
  execute: async (params) => {
    await torrentApi.addTorrent({
      magnet: params.magnet,
      paused: params.paused || false
    })
    return { success: true, message: '种子添加成功' }
  }
}

/**
 * 启动种子
 */
export const startTorrentsSkill: Skill = {
  name: 'start_torrents',
  description: '启动指定的种子任务，开始下载或做种',
  parameters: [
    {
      name: 'ids',
      type: 'array',
      description: '要启动的种子 ID 数组',
      required: true
    }
  ],
  execute: async (params) => {
    const ids = Array.isArray(params.ids) ? params.ids : [params.ids]
    await torrentApi.startTorrents(ids)
    return { success: true, message: `已启动 ${ids.length} 个种子` }
  }
}

/**
 * 暂停种子
 */
export const stopTorrentsSkill: Skill = {
  name: 'stop_torrents',
  description: '暂停指定的种子任务',
  parameters: [
    {
      name: 'ids',
      type: 'array',
      description: '要暂停的种子 ID 数组',
      required: true
    }
  ],
  execute: async (params) => {
    const ids = Array.isArray(params.ids) ? params.ids : [params.ids]
    await torrentApi.stopTorrents(ids)
    return { success: true, message: `已暂停 ${ids.length} 个种子` }
  }
}

/**
 * 删除种子
 */
export const removeTorrentsSkill: Skill = {
  name: 'remove_torrents',
  description: '删除指定的种子任务',
  parameters: [
    {
      name: 'ids',
      type: 'array',
      description: '要删除的种子 ID 数组',
      required: true
    },
    {
      name: 'deleteLocalData',
      type: 'boolean',
      description: '是否同时删除本地文件',
      required: false,
      default: false
    }
  ],
  execute: async (params) => {
    const ids = Array.isArray(params.ids) ? params.ids : [params.ids]
    await torrentApi.removeTorrents(ids, params.deleteLocalData || false)
    return {
      success: true,
      message: `已删除 ${ids.length} 个种子${params.deleteLocalData ? '（包括本地文件）' : ''}`
    }
  }
}

/**
 * 获取系统统计信息
 */
export const getStatsSkill: Skill = {
  name: 'get_stats',
  description: '获取系统统计信息，包括总下载/上传速度、活跃种子数等',
  parameters: [],
  execute: async () => {
    const stats = await torrentApi.getSessionStats()
    return {
      downloadSpeed: stats.downloadSpeed,
      uploadSpeed: stats.uploadSpeed,
      activeTorrentCount: stats.activeTorrentCount,
      pausedTorrentCount: stats.pausedTorrentCount,
      torrentCount: stats.torrentCount
    }
  }
}

/**
 * 设置种子限速
 */
export const setTorrentSpeedLimitSkill: Skill = {
  name: 'set_speed_limit',
  description: '设置指定种子的上传/下载速度限制',
  parameters: [
    {
      name: 'ids',
      type: 'array',
      description: '要设置的种子 ID 数组',
      required: true
    },
    {
      name: 'downloadLimit',
      type: 'number',
      description: '下载速度限制（KB/s），-1 表示不限制',
      required: false
    },
    {
      name: 'uploadLimit',
      type: 'number',
      description: '上传速度限制（KB/s），-1 表示不限制',
      required: false
    }
  ],
  execute: async (params) => {
    const ids = Array.isArray(params.ids) ? params.ids : [params.ids]
    const settings: Record<string, any> = {}

    if (params.downloadLimit !== undefined) {
      settings.downloadLimited = params.downloadLimit >= 0
      settings.downloadLimit = params.downloadLimit
    }

    if (params.uploadLimit !== undefined) {
      settings.uploadLimited = params.uploadLimit >= 0
      settings.uploadLimit = params.uploadLimit
    }

    await torrentApi.setTorrents(ids, settings)
    return { success: true, message: `已设置 ${ids.length} 个种子的速度限制` }
  }
}

/**
 * 校验种子
 */
export const verifyTorrentsSkill: Skill = {
  name: 'verify_torrents',
  description: '校验指定种子的文件完整性',
  parameters: [
    {
      name: 'ids',
      type: 'array',
      description: '要校验的种子 ID 数组',
      required: true
    }
  ],
  execute: async (params) => {
    const ids = Array.isArray(params.ids) ? params.ids : [params.ids]
    await torrentApi.verifyTorrents(ids)
    return { success: true, message: `已开始校验 ${ids.length} 个种子` }
  }
}

/**
 * 为种子添加标签
 */
export const addLabelsSkill: Skill = {
  name: 'add_labels',
  description: '为指定的种子添加标签。标签可以用于分类、标记辅种等。注意：重复的种子（相同文件的多个种子）通常是辅种。',
  parameters: [
    {
      name: 'ids',
      type: 'array',
      description: '要添加标签的种子 ID 数组',
      required: true
    },
    {
      name: 'labels',
      type: 'array',
      description: '要添加的标签数组，例如：["辅种", "高清", "电影"]',
      required: true
    }
  ],
  execute: async (params) => {
    const ids = Array.isArray(params.ids) ? params.ids : [params.ids]
    const labels = Array.isArray(params.labels) ? params.labels : [params.labels]

    // 获取当前种子信息
    const { torrents } = await torrentApi.getTorrents(undefined, { ids })

    // 为每个种子添加标签
    for (const torrent of torrents) {
      const currentLabels = torrent.labels || []
      const newLabels = [...new Set([...currentLabels, ...labels])] // 去重

      await torrentApi.setTorrents([torrent.id], { labels: newLabels })
    }

    return {
      success: true,
      message: `已为 ${ids.length} 个种子添加标签: ${labels.join(', ')}`
    }
  }
}

/**
 * 移除种子的标签
 */
export const removeLabelsSkill: Skill = {
  name: 'remove_labels',
  description: '从指定种子中移除标签',
  parameters: [
    {
      name: 'ids',
      type: 'array',
      description: '要移除标签的种子 ID 数组',
      required: true
    },
    {
      name: 'labels',
      type: 'array',
      description: '要移除的标签数组',
      required: true
    }
  ],
  execute: async (params) => {
    const ids = Array.isArray(params.ids) ? params.ids : [params.ids]
    const labelsToRemove = Array.isArray(params.labels) ? params.labels : [params.labels]

    // 获取当前种子信息
    const { torrents } = await torrentApi.getTorrents(undefined, { ids })

    // 为每个种子移除标签
    for (const torrent of torrents) {
      const currentLabels = torrent.labels || []
      const newLabels = currentLabels.filter(label => !labelsToRemove.includes(label))

      await torrentApi.setTorrents([torrent.id], { labels: newLabels })
    }

    return {
      success: true,
      message: `已从 ${ids.length} 个种子移除标签: ${labelsToRemove.join(', ')}`
    }
  }
}

/**
 * 替换种子的标签
 */
export const replaceLabelsSkill: Skill = {
  name: 'replace_labels',
  description: '替换指定种子的所有标签（清空现有标签，设置新标签）',
  parameters: [
    {
      name: 'ids',
      type: 'array',
      description: '要替换标签的种子 ID 数组',
      required: true
    },
    {
      name: 'labels',
      type: 'array',
      description: '新的标签数组',
      required: true
    }
  ],
  execute: async (params) => {
    const ids = Array.isArray(params.ids) ? params.ids : [params.ids]
    const newLabels = Array.isArray(params.labels) ? params.labels : [params.labels]

    // 为每个种子设置新标签
    for (const id of ids) {
      await torrentApi.setTorrents([id], { labels: newLabels })
    }

    return {
      success: true,
      message: `已替换 ${ids.length} 个种子的标签为: ${newLabels.join(', ')}`
    }
  }
}

/**
 * 查询带有特定标签的种子
 */
export const getTorrentsByLabelSkill: Skill = {
  name: 'get_torrents_by_label',
  description: '查询带有特定标签的种子',
  parameters: [
    {
      name: 'label',
      type: 'string',
      description: '要查询的标签',
      required: true
    },
    {
      name: 'limit',
      type: 'number',
      description: '限制返回的种子数量，默认20',
      required: false,
      default: 20
    }
  ],
  execute: async (params) => {
    const { torrents } = await torrentApi.getTorrents()

    // 过滤带有指定标签的种子
    const filtered = torrents.filter(t =>
      t.labels && t.labels.includes(params.label)
    )

    // 限制数量
    const limit = Math.min(params.limit || 20, 100)
    const limited = filtered.slice(0, limit)

    // 格式化大小
    const formatSize = (bytes: number) => {
      if (bytes < 1024) return `${bytes}B`
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
      if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)}MB`
      return `${(bytes / 1024 / 1024 / 1024).toFixed(2)}GB`
    }

    return {
      total: filtered.length,
      returned: limited.length,
      hasMore: filtered.length > limit,
      torrents: limited.map(t => ({
        id: t.id,
        name: t.name.length > 50 ? t.name.substring(0, 47) + '...' : t.name,
        size: formatSize(t.totalSize),
        labels: t.labels || []
      }))
    }
  }
}

/**
 * 获取辅种信息
 */
export const getReseedInfoSkill: Skill = {
  name: 'get_reseed_info',
  description: '获取种子的辅种情况。辅种是指相同文件（相同名称和大小）在不同 tracker 上的种子。可以查看哪些文件有辅种，以及每个文件在哪些站点上。',
  parameters: [
    {
      name: 'keyword',
      type: 'string',
      description: '按文件名关键词过滤（可选）',
      required: false
    },
    {
      name: 'minReseedCount',
      type: 'number',
      description: '最小辅种数量，只返回辅种数量>=此值的文件。默认为2（即至少有2个种子）',
      required: false,
      default: 2
    },
    {
      name: 'limit',
      type: 'number',
      description: '限制返回的文件数量，默认20',
      required: false,
      default: 20
    }
  ],
  execute: async (params) => {
    const { torrents } = await torrentApi.getTorrents()

    // 按照文件名+文件大小分组（辅种判定规则）
    const groupedByNameAndSize = new Map<string, any[]>()

    torrents.forEach(torrent => {
      const key = `${torrent.name}|${torrent.totalSize}`
      if (!groupedByNameAndSize.has(key)) {
        groupedByNameAndSize.set(key, [])
      }
      groupedByNameAndSize.get(key)!.push(torrent)
    })

    // 过滤：只保留辅种数量 >= minReseedCount 的
    const minCount = params.minReseedCount || 2
    let reseedGroups = Array.from(groupedByNameAndSize.entries())
      .filter(([_, torrents]) => torrents.length >= minCount)

    // 按关键词过滤
    if (params.keyword) {
      const keyword = params.keyword.toLowerCase()
      reseedGroups = reseedGroups.filter(([key]) =>
        key.toLowerCase().includes(keyword)
      )
    }

    // 按辅种数量排序（从多到少）
    reseedGroups.sort((a, b) => b[1].length - a[1].length)

    // 限制数量
    const limit = Math.min(params.limit || 20, 100)
    const limited = reseedGroups.slice(0, limit)

    // 格式化大小
    const formatSize = (bytes: number) => {
      if (bytes < 1024) return `${bytes}B`
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
      if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)}MB`
      return `${(bytes / 1024 / 1024 / 1024).toFixed(2)}GB`
    }

    // 获取 tracker 显示名称
    const getTrackerName = (announce: string): string => {
      try {
        const url = new URL(announce)
        return url.hostname
      } catch {
        return announce
      }
    }

    return {
      total: reseedGroups.length,
      returned: limited.length,
      hasMore: reseedGroups.length > limit,
      reseeds: limited.map(([, torrents]) => {
        const firstTorrent = torrents[0]
        const fileName = firstTorrent.name.length > 50
          ? firstTorrent.name.substring(0, 47) + '...'
          : firstTorrent.name

        // 收集所有 tracker
        const trackers = torrents.map(t => {
          const trackerStat = t.trackerStats?.[0]
          return {
            id: t.id,
            tracker: trackerStat ? getTrackerName(trackerStat.announce) : 'Unknown',
            status: t.errorString ? 'Error' : 'Normal',
            progress: `${Math.round(t.percentDone * 100)}%`,
            ratio: t.uploadRatio?.toFixed(2) || '0.00',
            uploaded: formatSize(t.uploadedEver || 0)
          }
        })

        // 计算总上传量和平均分享率
        const totalUploaded = torrents.reduce((sum, t) => sum + (t.uploadedEver || 0), 0)
        const avgRatio = torrents.reduce((sum, t) => sum + (t.uploadRatio || 0), 0) / torrents.length

        return {
          fileName,
          fileSize: formatSize(firstTorrent.totalSize),
          reseedCount: torrents.length,
          trackers,
          totalUploaded: formatSize(totalUploaded),
          avgRatio: avgRatio.toFixed(2)
        }
      })
    }
  }
}

/**
 * 所有预置 skills
 */
export const predefinedSkills: Skill[] = [
  getTorrentsSkill,
  addTorrentSkill,
  startTorrentsSkill,
  stopTorrentsSkill,
  removeTorrentsSkill,
  getStatsSkill,
  setTorrentSpeedLimitSkill,
  verifyTorrentsSkill,
  addLabelsSkill,
  removeLabelsSkill,
  replaceLabelsSkill,
  getTorrentsByLabelSkill,
  getReseedInfoSkill
]
