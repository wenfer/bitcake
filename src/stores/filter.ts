import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { TorrentStatus } from '@/types/torrent'

export type StatusFilter = 'all' | 'error' | 'queued' | 'active' | TorrentStatus

export const useFilterStore = defineStore('filter', () => {
  const statusFilter = ref<StatusFilter>('all')
  const trackerFilter = ref('')
  const categoryFilter = ref('')

  const setStatusFilter = (filter: StatusFilter) => {
    statusFilter.value = filter
  }

  const setTrackerFilter = (filter: string) => {
    trackerFilter.value = filter
  }

  const setCategoryFilter = (filter: string) => {
    categoryFilter.value = filter
  }

  const resetFilters = () => {
    statusFilter.value = 'all'
    trackerFilter.value = ''
    categoryFilter.value = ''
  }

  return {
    statusFilter,
    trackerFilter,
    categoryFilter,
    setStatusFilter,
    setTrackerFilter,
    setCategoryFilter,
    resetFilters,
  }
})
