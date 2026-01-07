import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { TorrentStatus } from '@/types/torrent'
import { TorrentStatusEnum } from '@/types/transmission'

export type StatusFilter = 'all' | 'error' | 'queued' | 'active' | TorrentStatus

// 状态值与 URL 参数的双向映射
const statusToUrlParam: Record<string, string> = {
  'all': 'all',
  [TorrentStatusEnum.STOPPED]: 'stopped',
  [TorrentStatusEnum.CHECK_WAIT]: 'check-wait',
  [TorrentStatusEnum.CHECK]: 'checking',
  [TorrentStatusEnum.DOWNLOAD_WAIT]: 'download-wait',
  [TorrentStatusEnum.DOWNLOAD]: 'downloading',
  [TorrentStatusEnum.SEED_WAIT]: 'seed-wait',
  [TorrentStatusEnum.SEED]: 'seeding',
  'queued': 'queued',
  'active': 'active',
  'error': 'error',
}

const urlParamToStatus: Record<string, StatusFilter> = {
  'all': 'all',
  'stopped': TorrentStatusEnum.STOPPED as StatusFilter,
  'check-wait': TorrentStatusEnum.CHECK_WAIT as StatusFilter,
  'checking': TorrentStatusEnum.CHECK as StatusFilter,
  'download-wait': TorrentStatusEnum.DOWNLOAD_WAIT as StatusFilter,
  'downloading': TorrentStatusEnum.DOWNLOAD as StatusFilter,
  'seed-wait': TorrentStatusEnum.SEED_WAIT as StatusFilter,
  'seeding': TorrentStatusEnum.SEED as StatusFilter,
  'queued': 'queued',
  'active': 'active',
  'error': 'error',
}

// 导出映射函数供其他组件使用
export const statusToUrl = (status: StatusFilter): string => {
  return statusToUrlParam[String(status)] || 'all'
}

export const urlToStatus = (urlParam: string | null): StatusFilter => {
  if (!urlParam) return 'all'
  return urlParamToStatus[urlParam] || 'all'
}

export const useFilterStore = defineStore('filter', () => {
  const statusFilter = ref<StatusFilter>('all')
  const trackerFilter = ref('')
  const categoryFilter = ref('')
  const downloadDirFilter = ref('')
  const errorTypeFilter = ref('')

  const setStatusFilter = (filter: StatusFilter) => {
    statusFilter.value = filter
  }

  const setTrackerFilter = (filter: string) => {
    trackerFilter.value = filter
  }

  const setCategoryFilter = (filter: string) => {
    categoryFilter.value = filter
  }

  const setDownloadDirFilter = (filter: string) => {
    downloadDirFilter.value = filter
  }

  const setErrorTypeFilter = (filter: string) => {
    errorTypeFilter.value = filter
  }

  const resetFilters = () => {
    statusFilter.value = 'all'
    trackerFilter.value = ''
    categoryFilter.value = ''
    downloadDirFilter.value = ''
    errorTypeFilter.value = ''
  }

  return {
    statusFilter,
    trackerFilter,
    categoryFilter,
    downloadDirFilter,
    errorTypeFilter,
    setStatusFilter,
    setTrackerFilter,
    setCategoryFilter,
    setDownloadDirFilter,
    setErrorTypeFilter,
    resetFilters,
  }
})
