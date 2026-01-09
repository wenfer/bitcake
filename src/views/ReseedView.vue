<template>
  <div class="reseed-view">
    <div class="toolbar">
      <div class="actions-group">
        <el-button :icon="Refresh" @click="loadReseedData()">刷新</el-button>
        <el-radio-group v-model="filterMode" size="default">
          <el-radio-button value="all">全部种子</el-radio-button>
          <el-radio-button value="reseed">仅辅种</el-radio-button>
        </el-radio-group>
        <el-input
          v-model="searchKeyword"
          placeholder="搜索种子文件名..."
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
        label="种子文件名"
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
        label="文件大小"
        width="130"
        sortable="custom"
      >
        <template #default="{ row }">
          {{ formatSize(row.totalSize) }}
        </template>
      </el-table-column>

      <el-table-column
        prop="trackerCount"
        label="辅种数量"
        width="110"
        sortable="custom"
        align="center"
      />

      <el-table-column
        label="Tracker 列表"
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
        label="总分享率"
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
        label="总上传量"
        width="130"
        sortable="custom"
      >
        <template #default="{ row }">
          {{ formatSize(row.totalUploaded) }}
        </template>
      </el-table-column>

      <el-table-column
        label="操作"
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
            详情
          </el-button>
          <el-button
            type="danger"
            size="small"
            link
            @click="showDeleteConfirm(row)"
          >
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination-container">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="filteredReseedData.length"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>

    <!-- 详情对话框 -->
    <el-dialog
      v-model="detailDialogVisible"
      :title="`辅种详情: ${selectedReseed?.fileName}`"
      width="80%"
      :close-on-click-modal="false"
    >
      <div v-if="selectedReseed" class="reseed-details">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="文件名">
            {{ selectedReseed.fileName }}
          </el-descriptions-item>
          <el-descriptions-item label="Hash">
            {{ selectedReseed.hashString }}
          </el-descriptions-item>
          <el-descriptions-item label="文件大小">
            {{ formatSize(selectedReseed.totalSize) }}
          </el-descriptions-item>
          <el-descriptions-item label="做种数量">
            {{ selectedReseed.trackerCount }} 个 Tracker
          </el-descriptions-item>
          <el-descriptions-item label="总上传量">
            {{ formatSize(selectedReseed.totalUploaded) }}
          </el-descriptions-item>
          <el-descriptions-item label="总下载量">
            {{ formatSize(selectedReseed.totalDownloaded) }}
          </el-descriptions-item>
          <el-descriptions-item label="总分享率">
            <span :class="getRatioClass(selectedReseed.totalUploadRatio)">
              {{ selectedReseed.totalUploadRatio.toFixed(2) }}
            </span>
          </el-descriptions-item>
        </el-descriptions>

        <div class="torrents-list">
          <h3>各 Tracker 详情</h3>
          <el-table :data="selectedReseed.torrents" border stripe>
            <el-table-column
              prop="trackerName"
              label="Tracker"
              min-width="150"
            />
            <el-table-column
              prop="status"
              label="状态"
              width="100"
            >
              <template #default="{ row }">
                <el-tag :type="getStatusTagType(row.status)" size="small">
                  {{ getStatusText(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column
              label="错误信息"
              width="150"
            >
              <template #default="{ row }">
                <template v-if="row.errorType">
                  <el-tooltip :content="row.errorString || '未知错误'" placement="top">
                    <el-tag type="danger" size="small">
                      {{ row.errorType }}
                    </el-tag>
                  </el-tooltip>
                </template>
                <span v-else style="color: #909399">—</span>
              </template>
            </el-table-column>
            <el-table-column
              prop="percentDone"
              label="进度"
              width="100"
            >
              <template #default="{ row }">
                {{ (row.percentDone * 100).toFixed(1) }}%
              </template>
            </el-table-column>
            <el-table-column
              prop="uploadRatio"
              label="分享率"
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
              label="上传量"
              width="120"
            >
              <template #default="{ row }">
                {{ formatSize(row.uploadedEver || 0) }}
              </template>
            </el-table-column>
            <el-table-column
              prop="rateUpload"
              label="上传速度"
              width="120"
            >
              <template #default="{ row }">
                {{ formatSpeed(row.rateUpload) }}
              </template>
            </el-table-column>
            <el-table-column
              prop="category"
              label="分类"
              width="100"
              show-overflow-tooltip
            />
            <el-table-column
              prop="downloadDir"
              label="保存位置"
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
      title="确认删除"
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
            <div style="font-weight: 600;">此操作将删除以下资源在所有 Tracker 上的种子</div>
          </template>
        </el-alert>

        <div class="delete-info">
          <p><strong>文件名：</strong>{{ deleteTarget.fileName }}</p>
          <p><strong>文件大小：</strong>{{ formatSize(deleteTarget.totalSize) }}</p>
          <p><strong>涉及 Tracker 数量：</strong>{{ deleteTarget.trackerCount }} 个</p>
          <p><strong>涉及种子数量：</strong>{{ deleteTarget.torrents.length }} 个</p>
        </div>

        <div class="tracker-list">
          <p><strong>将删除以下 Tracker 的种子：</strong></p>
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
          同时删除本地文件
        </el-checkbox>
      </div>

      <template #footer>
        <el-button @click="deleteDialogVisible = false">取消</el-button>
        <el-button
          type="danger"
          :loading="deleteLoading"
          @click="confirmDelete"
        >
          确认删除
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { Refresh, Search } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useSystemStatusStore } from '@/stores/systemStatus'
import { getTrackerDisplayName } from '@/utils/torrent'
import { formatBytes, formatSpeed } from '@/utils/format'
import * as api from '@/api/torrents'
import type { Torrent, TorrentStatus } from '@/types/torrent'
import { TorrentStatusEnum } from '@/types/torrent'

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

// 错误消息映射配置
interface ErrorMapping {
  keywords: string[] // 关键字列表，只要匹配其中之一就命中
  type: string // 错误类型（用于筛选）
  message: string // 友好的错误提示
}

const errorMappings: ErrorMapping[] = [
  {
    keywords: [
      'No data found',
      'Ensure your drives are connected',
      'Set Location',
    ],
    type: '文件不存在',
    message: '文件不存在',
  },
  {
    keywords: ['more than', '上传同一个种子', 'other location'],
    type: '重复汇报',
    message: '重复汇报，通常可忽略',
  },
  {
    keywords: ['You already are downloading'],
    type: '重复汇报',
    message: '重复下载，通常可忽略',
  },
  {
    keywords: ['missingFiles'],
    type: '文件不存在',
    message: '文件不存在',
  },
  {
    keywords: ['Permission denied', 'permission'],
    type: '权限错误',
    message: '权限错误',
  },
  {
    keywords: ['No space left', 'disk full', 'Disk full'],
    type: '磁盘空间不足',
    message: '磁盘空间不足',
  },
  {
    keywords: ['Tracker gave HTTP response code 404', 'Tracker not found'],
    type: 'Tracker错误',
    message: 'Tracker未找到',
  },
  {
    keywords: ['Tracker gave HTTP response code 403', 'Forbidden'],
    type: 'Tracker错误',
    message: 'Tracker拒绝访问',
  },
  {
    keywords: ['Tracker gave a warning', 'Unregistered torrent'],
    type: 'Tracker错误',
    message: '种子未注册',
  },
  {
    keywords: ['Tracker gave HTTP response code 5'],
    type: 'Tracker错误',
    message: 'Tracker服务器错误',
  },
  {
    keywords: ['Connection refused', 'Could not connect', 'timeout'],
    type: '网络错误',
    message: '网络连接失败',
  },
  {
    keywords: ['Piece #', 'corrupt', 'checksum'],
    type: '数据校验错误',
    message: '数据校验失败',
  },
]

// 获取错误类型（用于筛选）
const getErrorType = (errorString?: string): string => {
  if (!errorString) return '其他错误'

  const lowerError = errorString.toLowerCase()

  // 遍历错误映射配置
  for (const mapping of errorMappings) {
    const matched = mapping.keywords.some((keyword) =>
      lowerError.includes(keyword.toLowerCase())
    )

    if (matched) {
      return mapping.type
    }
  }

  return '其他错误'
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

// 缓存上次的种子数据指纹，用于判断是否需要重新计算
const lastTorrentsFingerprint = ref('')

// 计算种子数据指纹（使用简单高效的方式）
const getTorrentsFingerprint = (torrents: Torrent[]): string => {
  // 只使用种子数量和前后几个种子的 hash 作为指纹，避免遍历所有种子
  const count = torrents.length
  if (count === 0) return '0'
  if (count <= 3) {
    return `${count}-${torrents.map(t => t.hashString).join(',')}`
  }
  // 对于大量种子，只取前 3 个和后 3 个的 hash
  const first3 = torrents.slice(0, 3).map(t => t.hashString).join(',')
  const last3 = torrents.slice(-3).map(t => t.hashString).join(',')
  return `${count}-${first3}-${last3}`
}

const tableHeight = computed(() => {
  return window.innerHeight - 260
})

// 加载辅种数据
const loadReseedData = () => {
  const torrents = systemStatusStore.torrents

  // 计算当前种子数据指纹
  const currentFingerprint = getTorrentsFingerprint(torrents)

  // 如果数据没有变化，跳过重新计算
  if (currentFingerprint === lastTorrentsFingerprint.value && reseedData.value.length > 0) {
    console.log('种子数据未变化，跳过重新计算')
    return
  }

  lastTorrentsFingerprint.value = currentFingerprint
  console.log('总种子数量:', torrents.length)

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

  console.log('文件名+大小分组数量:', groupedByNameAndSize.size)

  // 显示所有种子，按文件名+大小分组
  const reseedGroups = Array.from(groupedByNameAndSize.entries())

  console.log('显示种子组数量:', reseedGroups.length)

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
          // 基于种子的 errorString 判断是否异常，而不是 tracker.lastAnnounceSucceeded
          const hasError = !!torrent.errorString
          const errorDetail = hasError ? torrent.errorString : undefined

          trackerMap.set(announce, {
            announce,
            displayName: getTrackerDisplayName(announce),
            statusText: hasError ? '异常' : '正常',
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
      torrents: torrents.map(t => ({
        id: t.id,
        trackerName: t.trackerStats && t.trackerStats.length > 0 && t.trackerStats[0]
          ? getTrackerDisplayName(t.trackerStats[0].announce)
          : '未知',
        status: t.status,
        percentDone: t.percentDone,
        uploadRatio: t.uploadRatio,
        uploadedEver: t.uploadedEver || 0,
        rateUpload: t.rateUpload,
        category: t.category,
        downloadDir: t.downloadDir,
        errorString: t.errorString,
        errorType: t.errorString ? getErrorType(t.errorString) : undefined
      }))
    }
  })
}

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
  const statusMap = {
    [TorrentStatusEnum.STOPPED]: '已停止',
    [TorrentStatusEnum.CHECK_WAIT]: '等待校验',
    [TorrentStatusEnum.CHECK]: '校验中',
    [TorrentStatusEnum.DOWNLOAD_WAIT]: '等待下载',
    [TorrentStatusEnum.DOWNLOAD]: '下载中',
    [TorrentStatusEnum.SEED_WAIT]: '等待做种',
    [TorrentStatusEnum.SEED]: '做种中'
  }
  return statusMap[status] || '未知'
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

    ElMessage.success(`已删除 ${torrentIds.length} 个种子`)

    // 关闭对话框
    deleteDialogVisible.value = false
    deleteTarget.value = null

    // 重新加载种子数据
    try {
      const result = await api.getTorrents()
      systemStatusStore.setTorrents(result.torrents)
      loadReseedData()
    } catch (error) {
      console.error('重新加载种子数据失败:', error)
    }
  } catch (error: any) {
    ElMessage.error(`删除失败: ${error.message || error}`)
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

// 定时刷新
let refreshTimer: number | null = null

onMounted(async () => {
  // 如果 systemStatusStore 中没有种子数据，先加载
  if (systemStatusStore.torrents.length === 0) {
    try {
      const result = await api.getTorrents()
      systemStatusStore.setTorrents(result.torrents)
    } catch (error) {
      console.error('加载种子数据失败:', error)
    }
  }

  loadReseedData()
  // 每 10 秒刷新一次（配合缓存机制，数据未变化时不会重新计算）
  refreshTimer = window.setInterval(() => {
    loadReseedData()
  }, 10000)
})

onUnmounted(() => {
  if (refreshTimer) {
    clearInterval(refreshTimer)
  }
})
</script>

<style scoped>
.reseed-view {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 20px;
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
  padding: 16px 0;
  margin-top: auto;
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
  color: #67c23a;
  font-weight: bold;
}

.ratio-good {
  color: #409eff;
  font-weight: bold;
}

.ratio-normal {
  color: #e6a23c;
}

.ratio-low {
  color: #f56c6c;
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
  background-color: #f5f7fa;
  padding: 12px;
  border-radius: 4px;
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
