<template>
  <div class="reseed-view" ref="reseedViewRef">
    <div class="toolbar" ref="toolbarRef">
      <div class="actions-group">
        <el-button :icon="Refresh" @click="loadReseedData()">{{ t('common.refresh') }}</el-button>
        <el-radio-group v-model="filterMode" size="default">
          <el-radio-button value="all">{{ t('reseed.filterMode.all') }}</el-radio-button>
          <el-radio-button value="reseed">{{ t('reseed.filterMode.reseedOnly') }}</el-radio-button>
        </el-radio-group>
        <el-input
          v-model="searchKeyword"
          :placeholder="t('reseed.searchPlaceholder')"
          :prefix-icon="Search"
          clearable
          class="search-input"
          style="width: 300px"
        />
      </div>
    </div>

    <el-table
      :data="paginatedData"
      style="width: 100%"
      :height="tableHeight"
      border
      stripe
      row-key="hashString"
      @sort-change="handleSortChange"
    >
      <el-table-column
        prop="fileName"
        :label="t('reseed.col.fileName')"
        min-width="350"
        sortable="custom"
        show-overflow-tooltip
      >
        <template #default="{ row }">
          <span class="file-name">{{ row.fileName }}</span>
        </template>
      </el-table-column>

      <el-table-column
        prop="totalSize"
        :label="t('reseed.col.fileSize')"
        width="130"
        sortable="custom"
      >
        <template #default="{ row }">
          {{ formatSize(row.totalSize) }}
        </template>
      </el-table-column>

      <el-table-column
        prop="trackerCount"
        :label="t('reseed.col.reseedCount')"
        width="110"
        sortable="custom"
        align="center"
      />

      <el-table-column
        :label="t('reseed.col.trackerList')"
        min-width="350"
      >
        <template #default="{ row }">
          <div class="tracker-tags">
            <template v-for="tracker in row.trackers.slice(0, 5)" :key="tracker.announce">
              <el-tooltip
                v-if="!tracker.lastAnnounceSucceeded && tracker.errorDetail"
                :content="tracker.errorDetail"
                placement="top"
              >
                <el-tag
                  :type="getTrackerTagType(tracker)"
                  class="tracker-tag"
                  size="small"
                >
                  {{ tracker.displayName }}
                  <span v-if="tracker.statusText" class="tracker-status">
                    ({{ tracker.statusText }})
                  </span>
                </el-tag>
              </el-tooltip>
              <el-tag
                v-else
                :type="getTrackerTagType(tracker)"
                class="tracker-tag"
                size="small"
              >
                {{ tracker.displayName }}
                <span v-if="tracker.statusText" class="tracker-status">
                  ({{ tracker.statusText }})
                </span>
              </el-tag>
            </template>
            <el-tag
              v-if="row.trackers.length > 5"
              type="info"
              size="small"
              class="tracker-tag"
            >
              +{{ row.trackers.length - 5 }}
            </el-tag>
          </div>
        </template>
      </el-table-column>

      <el-table-column
        prop="totalUploadRatio"
        :label="t('reseed.col.totalRatio')"
        width="110"
        sortable="custom"
        align="center"
      >
        <template #default="{ row }">
          <span :class="getRatioClass(row.totalUploadRatio)">
            {{ row.totalUploadRatio.toFixed(2) }}
          </span>
        </template>
      </el-table-column>

      <el-table-column
        prop="totalUploaded"
        :label="t('reseed.col.totalUploaded')"
        width="130"
        sortable="custom"
      >
        <template #default="{ row }">
          {{ formatSize(row.totalUploaded) }}
        </template>
      </el-table-column>

      <el-table-column
        :label="t('reseed.col.actions')"
        width="150"
        fixed="right"
      >
        <template #default="{ row }">
          <el-button
            type="success"
            size="small"
            link
            @click="showReseedDetails(row)"
          >
            {{ t('reseed.actions.details') }}
          </el-button>
          <el-button
            type="danger"
            size="small"
            link
            @click="showDeleteConfirm(row)"
          >
            {{ t('common.delete') }}
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination-container" ref="paginationRef">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :pager-count="5"
        :total="filteredReseedData.length"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>

    <!-- 详情对话框 -->
    <el-dialog
      v-model="detailDialogVisible"
      :title="t('reseed.dialog.detailTitle', { fileName: selectedReseed?.fileName })"
      width="80%"
      :close-on-click-modal="false"
    >
      <div v-if="selectedReseed" class="reseed-details">
        <el-descriptions :column="2" border>
          <el-descriptions-item :label="t('reseed.detail.fileName')">
            {{ selectedReseed.fileName }}
          </el-descriptions-item>
          <el-descriptions-item :label="t('reseed.detail.hash')">
            {{ selectedReseed.hashString }}
          </el-descriptions-item>
          <el-descriptions-item :label="t('reseed.detail.fileSize')">
            {{ formatSize(selectedReseed.totalSize) }}
          </el-descriptions-item>
          <el-descriptions-item :label="t('reseed.detail.seedCount')">
            {{ t('reseed.detail.trackerCount', { count: selectedReseed.trackerCount }) }}
          </el-descriptions-item>
          <el-descriptions-item :label="t('reseed.detail.totalUploaded')">
            {{ formatSize(selectedReseed.totalUploaded) }}
          </el-descriptions-item>
          <el-descriptions-item :label="t('reseed.detail.totalDownloaded')">
            {{ formatSize(selectedReseed.totalDownloaded) }}
          </el-descriptions-item>
          <el-descriptions-item :label="t('reseed.detail.totalRatio')">
            <span :class="getRatioClass(selectedReseed.totalUploadRatio)">
              {{ selectedReseed.totalUploadRatio.toFixed(2) }}
            </span>
          </el-descriptions-item>
        </el-descriptions>

        <div class="torrents-list">
          <h3>{{ t('reseed.detail.trackerDetails') }}</h3>
          <el-table :data="selectedReseed.torrents" border stripe>
            <el-table-column
              prop="trackerName"
              :label="t('reseed.detail.tracker')"
              min-width="150"
            />
            <el-table-column
              prop="status"
              :label="t('reseed.detail.status')"
              width="100"
            >
              <template #default="{ row }">
                <el-tag :type="getStatusTagType(row.status)" size="small">
                  {{ getStatusText(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column
              :label="t('reseed.detail.errorInfo')"
              width="150"
            >
              <template #default="{ row }">
                <template v-if="row.errorType">
                  <el-tooltip :content="row.errorString || t('reseed.detail.unknownError')" placement="top">
                    <el-tag type="danger" size="small">
                      {{ row.errorType }}
                    </el-tag>
                  </el-tooltip>
                </template>
                <span v-else style="color: var(--bc-text-subtle)">—</span>
              </template>
            </el-table-column>
            <el-table-column
              prop="percentDone"
              :label="t('reseed.detail.progress')"
              width="100"
            >
              <template #default="{ row }">
                {{ (row.percentDone * 100).toFixed(1) }}%
              </template>
            </el-table-column>
            <el-table-column
              prop="uploadRatio"
              :label="t('reseed.detail.ratio')"
              width="100"
            >
              <template #default="{ row }">
                <span :class="getRatioClass(row.uploadRatio)">
                  {{ row.uploadRatio.toFixed(2) }}
                </span>
              </template>
            </el-table-column>
            <el-table-column
              prop="uploadedEver"
              :label="t('reseed.detail.uploaded')"
              width="120"
            >
              <template #default="{ row }">
                {{ formatSize(row.uploadedEver || 0) }}
              </template>
            </el-table-column>
            <el-table-column
              prop="rateUpload"
              :label="t('reseed.detail.uploadSpeed')"
              width="120"
            >
              <template #default="{ row }">
                {{ formatSpeed(row.rateUpload) }}
              </template>
            </el-table-column>
            <el-table-column
              prop="category"
              :label="t('reseed.detail.category')"
              width="100"
              show-overflow-tooltip
            />
            <el-table-column
              prop="downloadDir"
              :label="t('reseed.detail.savePath')"
              min-width="200"
              show-overflow-tooltip
            />
          </el-table>
        </div>
      </div>
    </el-dialog>

    <!-- 删除确认对话框 -->
    <el-dialog
      v-model="deleteDialogVisible"
      :title="t('reseed.dialog.deleteConfirm')"
      width="500px"
      :close-on-click-modal="false"
    >
      <div v-if="deleteTarget" class="delete-confirm">
        <el-alert
          type="warning"
          :closable="false"
          show-icon
        >
          <template #title>
            <div style="font-weight: 600;">{{ t('reseed.delete.warning') }}</div>
          </template>
        </el-alert>

        <div class="delete-info">
          <p><strong>{{ t('reseed.delete.fileName') }}</strong>{{ deleteTarget.fileName }}</p>
          <p><strong>{{ t('reseed.delete.fileSize') }}</strong>{{ formatSize(deleteTarget.totalSize) }}</p>
          <p><strong>{{ t('reseed.delete.trackerCount') }}</strong>{{ t('reseed.delete.trackerCountValue', { count: deleteTarget.trackerCount }) }}</p>
          <p><strong>{{ t('reseed.delete.torrentCount') }}</strong>{{ t('reseed.delete.torrentCountValue', { count: deleteTarget.torrents.length }) }}</p>
        </div>

        <div class="tracker-list">
          <p><strong>{{ t('reseed.delete.trackerList') }}</strong></p>
          <div class="tracker-tags">
            <el-tag
              v-for="tracker in deleteTarget.trackers"
              :key="tracker.announce"
              size="small"
              style="margin: 4px"
            >
              {{ tracker.displayName }}
            </el-tag>
          </div>
        </div>

        <el-checkbox v-model="deleteWithFiles" style="margin-top: 16px;">
          {{ t('reseed.delete.deleteWithFiles') }}
        </el-checkbox>
      </div>

      <template #footer>
        <el-button @click="deleteDialogVisible = false">{{ t('common.cancel') }}</el-button>
        <el-button
          type="danger"
          :loading="deleteLoading"
          @click="confirmDelete"
        >
          {{ t('reseed.delete.confirmDelete') }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { Refresh, Search } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { useSystemStatusStore } from '@/stores/systemStatus'
import { getTrackerDisplayName } from '@/utils/torrent'
import { getTorrentErrorMessage, isTorrentError, getTorrentStatusText } from '@/utils/torrentStatus'
import { formatBytes, formatSpeed } from '@/utils/format'
import { buildErrorMappings, matchErrorMapping } from '@/utils/errorMapping'
import * as api from '@/api/torrents'
import type { Torrent, TorrentStatus } from '@/types/torrent'
import { TorrentStatusEnum } from '@/types/torrent'

const { t, locale } = useI18n()

// 防抖函数
function debounce<T extends (...args: any[]) => any>(fn: T, delay: number) {
  let timeoutId: number | null = null
  return function (this: any, ...args: Parameters<T>) {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
    timeoutId = window.setTimeout(() => {
      fn.apply(this, args)
    }, delay)
  } as T
}

interface ReseedTracker {
  announce: string
  displayName: string
  statusText: string
  lastAnnounceSucceeded: boolean
  errorDetail?: string // 错误详情
}

interface ReseedData {
  fileName: string
  hashString: string
  totalSize: number
  trackerCount: number
  trackers: ReseedTracker[]
  totalUploadRatio: number
  totalUploaded: number
  totalDownloaded: number
  torrents: {
    id: number
    trackerName: string
    status: TorrentStatus
    percentDone: number
    uploadRatio: number
    uploadedEver: number
    rateUpload: number
    category?: string
    downloadDir: string
    errorString?: string
    errorType?: string
  }[]
}

// 错误消息映射：与 HomeView 共用 buildErrorMappings，避免关键词表双份漂移
const errorMappings = buildErrorMappings({ t, namespace: 'reseed', locale: locale.value })

// 获取错误类型（用于筛选）
const getErrorType = (errorString?: string): string => {
  if (!errorString) return t('reseed.errorType.otherError')
  return matchErrorMapping(errorString, errorMappings)?.type ?? t('reseed.errorType.otherError')
}

const systemStatusStore = useSystemStatusStore()
const searchKeyword = ref('')
const debouncedSearchKeyword = ref('')
const filterMode = ref<'all' | 'reseed'>('all')
const reseedData = ref<ReseedData[]>([])
const detailDialogVisible = ref(false)
const selectedReseed = ref<ReseedData | null>(null)
const deleteDialogVisible = ref(false)
const deleteTarget = ref<ReseedData | null>(null)
const deleteWithFiles = ref(false)
const deleteLoading = ref(false)
const sortProp = ref('trackerCount')
const sortOrder = ref<'ascending' | 'descending'>('descending')
const currentPage = ref(1)
const pageSize = ref(50) // 增加默认每页大小，减少页面切换
const reseedViewRef = ref<HTMLElement | null>(null)
const toolbarRef = ref<HTMLElement | null>(null)
const paginationRef = ref<HTMLElement | null>(null)

const tableHeight = ref(420)

const updateTableHeight = () => {
  const containerHeight = reseedViewRef.value?.clientHeight ?? 0
  const toolbarHeight = toolbarRef.value?.offsetHeight ?? 0
  const paginationHeight = paginationRef.value?.offsetHeight ?? 0
  const verticalGap = 16
  const nextHeight = containerHeight - toolbarHeight - paginationHeight - verticalGap
  tableHeight.value = Math.max(260, nextHeight)
}

// 加载辅种数据
const loadReseedData = () => {
  const torrents = systemStatusStore.torrents

  // 按照文件名+文件大小分组（辅种判定规则）
  const groupedByNameAndSize = new Map<string, Torrent[]>()

  torrents.forEach(torrent => {
    // 使用文件名和大小作为唯一标识
    const key = `${torrent.name}|${torrent.totalSize}`
    if (!groupedByNameAndSize.has(key)) {
      groupedByNameAndSize.set(key, [])
    }
    groupedByNameAndSize.get(key)!.push(torrent)
  })

  // 显示所有种子，按文件名+大小分组
  const reseedGroups = Array.from(groupedByNameAndSize.entries())

  reseedData.value = reseedGroups.map(([_key, torrents]) => {
    // 使用第一个种子的信息作为基准
    const firstTorrent = torrents[0]
    if (!firstTorrent) {
      throw new Error('No torrent found in group')
    }

    // 收集所有 tracker 信息
    const trackerMap = new Map<string, ReseedTracker>()
    torrents.forEach(torrent => {
      if (torrent.trackerStats && torrent.trackerStats.length > 0) {
        const tracker = torrent.trackerStats[0]
        if (!tracker) return
        const announce = tracker.announce
        if (!trackerMap.has(announce)) {
          // 基于种子的错误信息判断是否异常，而不是 tracker.lastAnnounceSucceeded
          // 注意：部分 tracker 对正常种子会返回 `ook` 之类的响应，不能算作异常
          const hasError = isTorrentError(torrent)
          const errorDetail = getTorrentErrorMessage(torrent)

          trackerMap.set(announce, {
            announce,
            displayName: getTrackerDisplayName(announce),
            statusText: hasError ? t('reseed.trackerStatus.abnormal') : t('reseed.trackerStatus.normal'),
            lastAnnounceSucceeded: !hasError,
            errorDetail
          })
        }
      }
    })

    // 计算总上传量、下载量和分享率
    const totalUploaded = torrents.reduce((sum, t) => sum + (t.uploadedEver || 0), 0)
    const totalDownloaded = torrents.reduce((sum, t) => sum + (t.downloadedEver || 0), 0)
    const totalUploadRatio = totalDownloaded > 0 ? totalUploaded / totalDownloaded : 0

    return {
      fileName: firstTorrent.name,
      hashString: firstTorrent.hashString,
      totalSize: firstTorrent.totalSize,
      trackerCount: torrents.length,
      trackers: Array.from(trackerMap.values()),
      totalUploadRatio,
      totalUploaded,
      totalDownloaded,
      torrents: torrents.map(torrent => {
        const errorMessage = getTorrentErrorMessage(torrent)
        return {
          id: torrent.id,
          trackerName: torrent.trackerStats && torrent.trackerStats.length > 0 && torrent.trackerStats[0]
            ? getTrackerDisplayName(torrent.trackerStats[0].announce)
            : t('reseed.unknownTracker'),
          status: torrent.status,
          percentDone: torrent.percentDone,
          uploadRatio: torrent.uploadRatio,
          uploadedEver: torrent.uploadedEver || 0,
          rateUpload: torrent.rateUpload,
          category: torrent.category,
          downloadDir: torrent.downloadDir,
          errorString: errorMessage,
          errorType: errorMessage ? getErrorType(errorMessage) : undefined
        }
      })
    }
  })
}

watch(
  () => systemStatusStore.torrents.map((torrent) => [
    torrent.id,
    torrent.name,
    torrent.hashString,
    torrent.totalSize,
    torrent.status,
    torrent.percentDone,
    torrent.uploadRatio,
    torrent.uploadedEver,
    torrent.downloadedEver,
    torrent.rateUpload,
    torrent.category,
    torrent.downloadDir,
    torrent.errorString,
    torrent.trackerStats?.[0]?.announce,
    torrent.trackerStats?.[0]?.lastAnnounceSucceeded,
  ]),
  loadReseedData,
  { immediate: true }
)

// 过滤后的辅种数据
const filteredReseedData = computed(() => {
  let data = reseedData.value

  // 根据模式过滤
  if (filterMode.value === 'reseed') {
    data = data.filter(item => item.trackerCount > 1)
  }

  // 搜索过滤（使用防抖后的搜索关键词）
  if (debouncedSearchKeyword.value) {
    const keyword = debouncedSearchKeyword.value.toLowerCase()
    data = data.filter(item =>
      item.fileName.toLowerCase().includes(keyword)
    )
  }

  // 排序
  if (sortProp.value) {
    data = [...data].sort((a, b) => {
      const aVal = a[sortProp.value as keyof ReseedData]
      const bVal = b[sortProp.value as keyof ReseedData]

      let result = 0
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        result = aVal - bVal
      } else if (typeof aVal === 'string' && typeof bVal === 'string') {
        result = aVal.localeCompare(bVal)
      }

      return sortOrder.value === 'ascending' ? result : -result
    })
  }

  return data
})

// 分页数据
const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredReseedData.value.slice(start, end)
})

// 格式化文件大小（别名，兼容现有代码）
const formatSize = formatBytes

// 获取分享率样式类
const getRatioClass = (ratio: number): string => {
  if (ratio >= 2) return 'ratio-excellent'
  if (ratio >= 1) return 'ratio-good'
  if (ratio >= 0.5) return 'ratio-normal'
  return 'ratio-low'
}

// 获取 Tracker 标签类型
const getTrackerTagType = (tracker: ReseedTracker): string => {
  return tracker.lastAnnounceSucceeded ? 'success' : 'warning'
}

// 获取状态文本
const getStatusText = (status: TorrentStatus): string => {
  // 状态文案与主列表共用 status.* 命名空间（原 reseed.status.* 文案与之完全一致，已合并）
  return getTorrentStatusText(t, status, t('common.unknown'))
}

// 获取状态标签类型
const getStatusTagType = (status: TorrentStatus): string => {
  if (status === TorrentStatusEnum.SEED) return 'success'
  if (status === TorrentStatusEnum.DOWNLOAD) return 'primary'
  if (status === TorrentStatusEnum.STOPPED) return 'info'
  if (status === TorrentStatusEnum.CHECK) return 'warning'
  return ''
}

// 处理排序变化
const handleSortChange = ({ prop, order }: { prop: string; order: string | null }) => {
  sortProp.value = prop
  sortOrder.value = order === 'ascending' ? 'ascending' : 'descending'
  currentPage.value = 1 // 排序后回到第一页
}

// 处理每页条数变化
const handleSizeChange = (val: number) => {
  pageSize.value = val
  currentPage.value = 1 // 修改每页条数后回到第一页
}

// 处理页码变化
const handleCurrentChange = (val: number) => {
  currentPage.value = val
}

// 显示详情
const showReseedDetails = (reseed: ReseedData) => {
  selectedReseed.value = reseed
  detailDialogVisible.value = true
}

// 显示删除确认对话框
const showDeleteConfirm = (reseed: ReseedData) => {
  deleteTarget.value = reseed
  deleteWithFiles.value = false
  deleteDialogVisible.value = true
}

// 确认删除
const confirmDelete = async () => {
  if (!deleteTarget.value) return

  deleteLoading.value = true

  try {
    // 获取该资源所有种子的 ID
    const torrentIds = deleteTarget.value.torrents.map(t => t.id)

    // 调用删除 API
    await api.removeTorrents(torrentIds, deleteWithFiles.value)

    ElMessage.success(t('reseed.message.deletedTorrents', { count: torrentIds.length }))

    // 关闭对话框
    deleteDialogVisible.value = false
    deleteTarget.value = null

    // 重新加载种子数据
    try {
      const result = await api.getTorrents()
      systemStatusStore.setTorrents(result.torrents)
      loadReseedData()
    } catch (error) {
      console.error(t('reseed.message.reloadFailed'), error)
    }
  } catch (error: any) {
    ElMessage.error(t('reseed.message.deleteFailed', { message: error.message || error }))
  } finally {
    deleteLoading.value = false
  }
}

// 监听搜索关键词变化，使用防抖
const debouncedSearch = debounce((value: string) => {
  debouncedSearchKeyword.value = value
  currentPage.value = 1 // 搜索后回到第一页
}, 300)

watch(searchKeyword, (newValue) => {
  debouncedSearch(newValue)
})

watch(locale, async () => {
  loadReseedData()
  await nextTick()
  updateTableHeight()
})

onMounted(async () => {
  // 辅种分析依赖完整字段，不能复用系统状态轮询的精简种子对象。
  try {
    const result = await api.getTorrents()
    systemStatusStore.setTorrents(result.torrents)
  } catch (error) {
    console.error(t('reseed.message.loadFailed'), error)
  }

  await nextTick()
  updateTableHeight()
  window.addEventListener('resize', updateTableHeight)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateTableHeight)
})
</script>

<style scoped>
.reseed-view {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.toolbar {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  align-items: center;
  flex-wrap: wrap;
}

.toolbar .actions-group {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}

.pagination-container {
  display: flex;
  justify-content: center;
  width: 100%;
  max-width: 100%;
  padding: 16px 0 0 0;
  margin-top: auto;
  overflow: hidden;
  box-sizing: border-box;
}

.pagination-container :deep(.el-pagination) {
  width: 100%;
  max-width: 100%;
  justify-content: center;
  flex-wrap: nowrap;
  white-space: nowrap;
}

.pagination-container :deep(.el-pagination__sizes) {
  margin-right: 8px;
}

.pagination-container :deep(.el-pagination__sizes .el-select) {
  width: 110px;
}

.pagination-container :deep(.el-pagination__sizes .el-input__wrapper) {
  padding-left: 8px;
  padding-right: 8px;
}

@media (max-width: 768px) {
  .pagination-container {
    justify-content: flex-end;
  }

  .pagination-container :deep(.el-pagination) {
    justify-content: flex-end;
    column-gap: 4px;
  }

  .pagination-container :deep(.el-pagination__sizes .el-select) {
    width: 110px;
  }

  .pagination-container :deep(.el-pagination__sizes .el-input__wrapper) {
    padding-left: 6px;
    padding-right: 6px;
  }

  .pagination-container :deep(.btn-prev),
  .pagination-container :deep(.btn-next),
  .pagination-container :deep(.el-pager li) {
    min-width: 24px;
  }

  .pagination-container :deep(.el-pagination__total),
  .pagination-container :deep(.el-pagination__jump) {
    display: none;
  }
}

.file-name-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.file-name-cell .file-name {
  flex: 1;
}

.file-name-cell .count-tag {
  flex-shrink: 0;
}

.tracker-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.tracker-tags .tracker-tag .tracker-status {
  margin-left: 4px;
  opacity: 0.8;
}

.ratio-excellent {
  color: var(--bc-success);
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.ratio-good {
  color: var(--bc-accent);
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.ratio-normal {
  color: var(--bc-warning);
  font-variant-numeric: tabular-nums;
}

.ratio-low {
  color: var(--bc-danger);
  font-variant-numeric: tabular-nums;
}

.reseed-details .torrents-list {
  margin-top: 24px;
}

.reseed-details .torrents-list h3 {
  margin-bottom: 12px;
  font-size: 16px;
  font-weight: 600;
}

.delete-confirm {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.delete-info p {
  margin: 8px 0;
  line-height: 1.6;
}

.tracker-list {
  background-color: var(--bc-surface-muted);
  border: 1px solid var(--bc-border);
  padding: 12px;
  border-radius: var(--bc-radius-sm);
}

.tracker-list p {
  margin: 0 0 8px 0;
}

.tracker-list .tracker-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
</style>
