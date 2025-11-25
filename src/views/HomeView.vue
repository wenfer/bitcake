<template>
  <div class="home-view">
    <div class="toolbar">
      <div class="actions-group">
        <el-button type="primary" :icon="Plus" @click="showAddDialog = true">
          添加种子
        </el-button>
        <el-button :icon="Refresh" @click="loadTorrents()">刷新</el-button>
        <el-button
          :icon="VideoPlay"
          :disabled="!hasSelection"
          @click="startSelected"
        >
          开始选中
        </el-button>
        <el-button
          :icon="VideoPause"
          :disabled="!hasSelection"
          @click="stopSelected"
        >
          暂停选中
        </el-button>
        <el-button
          type="danger"
          :icon="Delete"
          :disabled="!hasSelection"
          @click="removeSelected"
        >
          删除选中
        </el-button>
        <el-button :disabled="!hasSelection" @click="openBatchLimitDialog">
          批量限速
        </el-button>
      </div>
    </div>

    <div class="filter-submenu">
      <div class="submenu-section">
        <span class="submenu-label">状态：</span>
        <el-button-group>
          <el-button
            v-for="status in statusOptions"
            :key="status.value"
            size="small"
            :type="statusFilter === status.value ? 'primary' : 'default'"
            @click="statusFilter = status.value"
          >
            {{ status.label }}
          </el-button>
        </el-button-group>
      </div>
      <div class="submenu-section">
        <span class="submenu-label">Tracker：</span>
        <el-dropdown @command="handleTrackerCommand">
          <el-button size="small">
            {{ currentTrackerLabel }}
            <el-icon class="dropdown-icon">
              <ArrowDown />
            </el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="">全部 Tracker</el-dropdown-item>
              <el-dropdown-item
                v-for="tracker in trackerOptions"
                :key="tracker.value"
                :command="tracker.value"
              >
                {{ tracker.label }}
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
      <div class="submenu-section search-section">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索种子..."
          :prefix-icon="Search"
          clearable
        />
      </div>
      <div class="submenu-section update-info" v-if="lastFetchedAt">
        <span>数据更新时间：{{ lastFetchedAt }}</span>
      </div>
    </div>

    <div class="table-container">
      <el-table
        ref="tableRef"
        v-loading="loading"
        :data="paginatedTorrents"
        stripe
        style="width: 100%"
        row-key="id"
        :reserve-selection="true"
        @selection-change="handleSelectionChange"
        @sort-change="handleSortChange"
        @row-contextmenu="handleRowContextMenu"
      >
        <el-table-column type="selection" width="48" />
        <el-table-column prop="name" label="名称" min-width="260" sortable="custom" show-overflow-tooltip />
        <el-table-column label="状态" width="110">
          <template #default="{ row }">
            <el-tooltip v-if="isTorrentError(row)" :content="row.errorString || '未知错误'" placement="top">
              <el-tag :type="getStatusType(row)">
                {{ getStatusText(row) }}
              </el-tag>
            </el-tooltip>
            <el-tag v-else :type="getStatusType(row)">
              {{ getStatusText(row) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="percentDone" label="进度" width="120" sortable="custom">
          <template #default="{ row }">
            <el-progress
              :percentage="Math.round(row.percentDone * 100)"
              :status="row.percentDone === 1 ? 'success' : undefined"
            />
          </template>
        </el-table-column>
        <el-table-column prop="totalSize" label="大小" width="140" sortable="custom">
          <template #default="{ row }">
            {{ formatBytes(row.totalSize) }}
          </template>
        </el-table-column>
        <el-table-column prop="uploadRatio" label="分享率" width="120" sortable="custom">
          <template #default="{ row }">
            <el-tag size="small" :class="['ratio-tag', getRatioClass(row.uploadRatio)]">
              {{ formatRatio(row.uploadRatio) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="defaultTracker" label="默认 Tracker" min-width="180" sortable="custom">
          <template #default="{ row }">
            {{ getDefaultTracker(row) }}
          </template>
        </el-table-column>
        <el-table-column prop="peersDownloading" label="种子" width="120" sortable="custom">
          <template #default="{ row }">
            {{ getSeeders(row) }}
          </template>
        </el-table-column>
        <el-table-column prop="peersUploading" label="用户" width="120" sortable="custom">
          <template #default="{ row }">
            {{ getLeechers(row) }}
          </template>
        </el-table-column>
        <el-table-column prop="rateDownload" label="下载速度" width="120" sortable="custom">
          <template #default="{ row }">
            {{ formatSpeed(row.rateDownload) }}
          </template>
        </el-table-column>
        <el-table-column prop="rateUpload" label="上传速度" width="120" sortable="custom">
          <template #default="{ row }">
            {{ formatSpeed(row.rateUpload) }}
          </template>
        </el-table-column>
        <el-table-column prop="uploadedEver" label="已上传" width="140" sortable="custom">
          <template #default="{ row }">
            {{ formatBytes(row.uploadedEver || 0) }}
          </template>
        </el-table-column>
        <el-table-column prop="activityDate" label="最后活动" width="170" sortable="custom">
          <template #default="{ row }">
            {{ formatLastActivity(row.activityDate) }}
          </template>
        </el-table-column>
        <el-table-column label="标签" min-width="160">
          <template #default="{ row }">
            <template v-if="row.labels?.length">
              <el-tag v-for="label in row.labels" :key="label" size="small" class="label-tag">
                {{ label }}
              </el-tag>
            </template>
            <span v-else>—</span>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination" v-if="displayedTorrents.length > 0">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="pageSizeOptions"
          layout="total, sizes, prev, pager, next"
          :total="displayedTorrents.length"
          background
        />
      </div>
    </div>

    <div
      v-if="contextMenu.visible"
      ref="contextMenuRef"
      class="context-menu"
      :style="{ top: `${contextMenu.y}px`, left: `${contextMenu.x}px` }"
      @click.stop
    >
      <button
        v-if="contextMenu.torrent?.status === TorrentStatusEnum.STOPPED"
        @click="handleContextAction('start')"
      >
        开始
      </button>
      <button
        v-else
        @click="handleContextAction('stop')"
      >
        暂停
      </button>
      <button @click="handleContextAction('verify')">重新校验</button>
      <button @click="handleContextAction('reannounce')">重新汇报</button>
      <button @click="handleContextAction('location')">变更保存目录</button>
      <button @click="handleContextAction('detail')">查看详情</button>
      <button class="danger" @click="handleContextAction('delete')">删除</button>
    </div>

    <!-- 添加种子对话框 -->
    <el-dialog v-model="showAddDialog" title="添加种子" width="500px">
      <el-form :model="addForm" label-width="100px">
        <el-form-item label="种子来源">
          <el-radio-group v-model="addForm.type">
            <el-radio label="magnet">磁力链接</el-radio>
            <el-radio label="file">种子文件</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="addForm.type === 'magnet'" label="磁力链接">
          <el-input
            v-model="addForm.magnet"
            type="textarea"
            :rows="3"
            placeholder="magnet:?xt=urn:btih:..."
          />
        </el-form-item>
        <el-form-item v-else label="种子文件">
          <el-upload
            :auto-upload="false"
            :limit="1"
            accept=".torrent"
            :on-change="handleFileChange"
          >
            <el-button :icon="Upload">选择文件</el-button>
          </el-upload>
        </el-form-item>
        <el-form-item label="下载目录">
          <el-input v-model="addForm.downloadDir" placeholder="留空使用默认目录" />
        </el-form-item>
        <el-form-item label="自动开始">
          <el-switch v-model="addForm.paused" :active-value="false" :inactive-value="true" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" @click="handleAddTorrent">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showLocationDialog" title="变更保存目录" width="500px">
      <el-form :model="locationForm" label-width="120px">
        <el-form-item label="新的保存目录">
          <el-input v-model="locationForm.path" placeholder="/data/downloads" />
        </el-form-item>
        <el-form-item label="移动已有数据">
          <el-switch v-model="locationForm.move" active-text="移动" inactive-text="仅更新路径" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showLocationDialog = false">取消</el-button>
        <el-button type="primary" @click="submitLocationChange">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showDetailDialog" title="种子详情" width="720px" class="detail-dialog">
      <el-skeleton :loading="detailLoading" animated>
        <template #default>
          <template v-if="detailTorrent">
            <div class="detail-body">
              <div class="detail-grid">
                <div class="detail-item">
                  <div class="detail-label">名称</div>
                  <div class="detail-value">{{ detailTorrent.name }}</div>
                </div>
              <div class="detail-item">
                <div class="detail-label">状态</div>
                <div class="detail-value">{{ getStatusText(detailTorrent) }}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">大小</div>
                <div class="detail-value">{{ formatBytes(detailTorrent.totalSize) }}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">进度</div>
                <div class="detail-value">{{ Math.round(detailTorrent.percentDone * 100) }}%</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">保存目录</div>
                <div class="detail-value">{{ detailTorrent.downloadDir }}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">哈希</div>
                <div class="detail-value hash-value">{{ detailTorrent.hashString }}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">下载量</div>
                <div class="detail-value">{{ formatBytes(detailTorrent.downloadedEver || 0) }}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">上传量</div>
                <div class="detail-value">{{ formatBytes(detailTorrent.uploadedEver || 0) }}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">分享率</div>
                <div class="detail-value">{{ formatRatio(detailTorrent.uploadRatio) }}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">最后活动</div>
                <div class="detail-value">{{ formatLastActivity(detailTorrent.activityDate) }}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">创建时间</div>
                <div class="detail-value">{{ formatTorrentDate(detailTorrent.dateCreated) }}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">添加时间</div>
                <div class="detail-value">{{ formatTorrentDate(detailTorrent.addedDate) }}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">错误信息</div>
                <div class="detail-value">{{ detailTorrent.errorString || '—' }}</div>
              </div>
            </div>
            <h4 class="section-title">Tracker</h4>
            <el-table
              v-if="detailTrackerRows.length"
              :data="detailTrackerRows"
              size="small"
              border
              style="margin-bottom: 16px"
            >
              <el-table-column prop="tier" label="Tier" width="70" />
              <el-table-column prop="announce" label="Announce URL" min-width="220" />
              <el-table-column prop="status" label="汇报状态" width="160">
                <template #default="{ row }">
                  <el-tag :type="row.statusType">{{ row.statusText }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="lastAnnounce" label="上次汇报" width="160" />
            </el-table>
            <p v-else class="table-placeholder">未配置 Tracker</p>

            <h4 class="section-title">文件列表 ({{ detailTotalFileCount }})</h4>
            <div class="files-table" v-if="detailFiles.length">
              <div class="files-actions">
                <span>已选择 {{ detailSelectedFileCount }} / {{ detailTotalFileCount }}</span>
                <div class="files-actions-buttons">
                  <el-button size="small" @click="toggleAllDetailFiles(true)">全选</el-button>
                  <el-button size="small" @click="toggleAllDetailFiles(false)">全不选</el-button>
                  <el-button
                    type="primary"
                    size="small"
                    :loading="detailFilesSaving"
                    @click="saveDetailFileSelections"
                  >
                    保存部分下载
                  </el-button>
                </div>
              </div>
              <el-table
                :data="detailFiles"
                size="small"
                border
                height="320"
                :row-key="detailFileRowKey"
              >
                <el-table-column label="下载" width="100">
                  <template #default="{ row }">
                    <el-checkbox v-model="detailFileSelections[row.index]" />
                  </template>
                </el-table-column>
                <el-table-column prop="name" label="文件" min-width="240" />
                <el-table-column label="大小" width="120">
                  <template #default="{ row }">
                    {{ formatBytes(row.length) }}
                  </template>
                </el-table-column>
                <el-table-column label="进度" width="180">
                  <template #default="{ row }">
                    {{ formatBytes(row.bytesCompleted) }} / {{ formatBytes(row.length) }}
                  </template>
                </el-table-column>
              </el-table>
            </div>
            <p v-else class="table-placeholder">无文件信息</p>

            <h4 class="section-title">限速设置</h4>
            <el-form label-width="110px" class="limit-form">
              <el-form-item label="下载限速">
                <div class="limit-row">
                  <el-switch
                    v-model="detailLimitForm.downloadLimited"
                    active-text="启用"
                    inactive-text="关闭"
                  />
                  <el-input-number
                    v-model="detailLimitForm.downloadLimit"
                    :min="0"
                    :max="1000000"
                    :disabled="!detailLimitForm.downloadLimited"
                    controls-position="right"
                  />
                  <span class="limit-unit">KB/s</span>
                </div>
              </el-form-item>
              <el-form-item label="上传限速">
                <div class="limit-row">
                  <el-switch
                    v-model="detailLimitForm.uploadLimited"
                    active-text="启用"
                    inactive-text="关闭"
                  />
                  <el-input-number
                    v-model="detailLimitForm.uploadLimit"
                    :min="0"
                    :max="1000000"
                    :disabled="!detailLimitForm.uploadLimited"
                    controls-position="right"
                  />
                  <span class="limit-unit">KB/s</span>
                </div>
              </el-form-item>
            </el-form>
            <div class="detail-actions">
              <el-button
                type="primary"
                :loading="detailLimitSaving"
                @click="saveDetailLimit"
              >
                保存限速
              </el-button>
            </div>
          </div>
          </template>
          <p v-else class="table-placeholder">未找到种子详情</p>
        </template>
      </el-skeleton>
      <template #footer>
        <el-button @click="showDetailDialog = false">关闭</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="limitDialogVisible" title="批量限速" width="480px">
      <p class="dialog-subtitle">已选种子：{{ limitDialogIds.length }} 个</p>
      <el-form :model="limitDialogForm" label-width="120px">
        <el-form-item label="下载限速">
          <div class="limit-row">
            <el-switch
              v-model="limitDialogForm.downloadLimited"
              active-text="启用"
              inactive-text="关闭"
            />
            <el-input-number
              v-model="limitDialogForm.downloadLimit"
              :min="0"
              :max="1000000"
              :disabled="!limitDialogForm.downloadLimited"
              controls-position="right"
            />
            <span class="limit-unit">KB/s</span>
          </div>
        </el-form-item>
        <el-form-item label="上传限速">
          <div class="limit-row">
            <el-switch
              v-model="limitDialogForm.uploadLimited"
              active-text="启用"
              inactive-text="关闭"
            />
            <el-input-number
              v-model="limitDialogForm.uploadLimit"
              :min="0"
              :max="1000000"
              :disabled="!limitDialogForm.uploadLimited"
              controls-position="right"
            />
            <span class="limit-unit">KB/s</span>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="limitDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="limitDialogSaving" @click="submitBatchLimit">
          保存
        </el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="removeDialog.visible" title="删除种子" width="420px">
      <p class="delete-message">
        {{ removeDialog.message || `确定删除选中的 ${removeDialog.ids.length} 个种子？` }}
      </p>
      <el-checkbox v-model="removeDialog.withData">同时删除本地文件</el-checkbox>
      <template #footer>
        <el-button @click="removeDialog.visible = false">取消</el-button>
        <el-button type="danger" @click="confirmRemoveDialog">删除</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import type { TableInstance } from 'element-plus'
import dayjs from 'dayjs'
import {
  Plus,
  Refresh,
  Search,
  VideoPlay,
  VideoPause,
  Delete,
  Upload,
  ArrowDown,
} from '@element-plus/icons-vue'
import * as api from '@/api/transmission'
import type { Torrent, TorrentStatus } from '@/types/transmission'
import { TorrentStatusEnum } from '@/types/transmission'
import { getTrackerHost } from '@/utils/torrent'

const REFRESH_INTERVAL = 2000
const DETAIL_FIELDS = [
  'id',
  'name',
  'status',
  'totalSize',
  'percentDone',
  'downloadDir',
  'hashString',
  'uploadedEver',
  'downloadedEver',
  'uploadRatio',
  'activityDate',
  'dateCreated',
  'addedDate',
  'trackers',
  'trackerStats',
  'files',
  'fileStats',
  'downloadLimit',
  'downloadLimited',
  'uploadLimit',
  'uploadLimited',
]
type StatusFilter = 'all' | 'error' | TorrentStatus

interface LimitFormState {
  downloadLimited: boolean
  downloadLimit: number
  uploadLimited: boolean
  uploadLimit: number
}

const createEmptyLimitForm = (): LimitFormState => ({
  downloadLimited: false,
  downloadLimit: 0,
  uploadLimited: false,
  uploadLimit: 0,
})

const statusTextMap: Record<TorrentStatus, string> = {
  [TorrentStatusEnum.STOPPED]: '已停止',
  [TorrentStatusEnum.CHECK_WAIT]: '等待校验',
  [TorrentStatusEnum.CHECK]: '校验中',
  [TorrentStatusEnum.DOWNLOAD_WAIT]: '等待下载',
  [TorrentStatusEnum.DOWNLOAD]: '下载中',
  [TorrentStatusEnum.SEED_WAIT]: '等待做种',
  [TorrentStatusEnum.SEED]: '做种中',
}

const statusOptions: { label: string; value: StatusFilter }[] = [
  { label: '全部', value: 'all' },
  { label: '错误', value: 'error' },
  { label: statusTextMap[TorrentStatusEnum.STOPPED], value: TorrentStatusEnum.STOPPED },
  { label: statusTextMap[TorrentStatusEnum.CHECK_WAIT], value: TorrentStatusEnum.CHECK_WAIT },
  { label: statusTextMap[TorrentStatusEnum.CHECK], value: TorrentStatusEnum.CHECK },
  { label: statusTextMap[TorrentStatusEnum.DOWNLOAD_WAIT], value: TorrentStatusEnum.DOWNLOAD_WAIT },
  { label: statusTextMap[TorrentStatusEnum.DOWNLOAD], value: TorrentStatusEnum.DOWNLOAD },
  { label: statusTextMap[TorrentStatusEnum.SEED_WAIT], value: TorrentStatusEnum.SEED_WAIT },
  { label: statusTextMap[TorrentStatusEnum.SEED], value: TorrentStatusEnum.SEED },
]

let refreshTimer: number | undefined

const loading = ref(false)
const torrents = ref<Torrent[]>([])
const searchKeyword = ref('')
const showAddDialog = ref(false)
const addForm = ref({
  type: 'magnet',
  magnet: '',
  file: null as File | null,
  downloadDir: '',
  paused: false,
})
const statusFilter = ref<StatusFilter>('all')
const trackerFilter = ref('')
const selectedTorrents = ref<Torrent[]>([])
const selectedIdsState = ref<number[]>([])
const showLocationDialog = ref(false)
const locationForm = ref({
  path: '',
  move: true,
})
const locationTarget = ref<Torrent | null>(null)
const showDetailDialog = ref(false)
const detailLoading = ref(false)
const detailTorrent = ref<Torrent | null>(null)
const detailFileSelections = ref<Record<number, boolean>>({})
const detailFilesSaving = ref(false)
const detailLimitForm = ref<LimitFormState>(createEmptyLimitForm())
const detailLimitSaving = ref(false)
const tableRef = ref<TableInstance | null>(null)
const suppressSelectionChange = ref(false)
const removeDialog = ref({
  visible: false,
  ids: [] as number[],
  withData: false,
  message: '',
})
const lastFetchedAt = ref('')
const limitDialogVisible = ref(false)
const limitDialogIds = ref<number[]>([])
const limitDialogForm = ref<LimitFormState>(createEmptyLimitForm())
const limitDialogSaving = ref(false)

type SortOrder = 'ascending' | 'descending' | null

const sortState = ref<{ prop: string; order: SortOrder }>({
  prop: '',
  order: null,
})

const currentPage = ref(1)
const pageSize = ref(50)
const pageSizeOptions = [25, 50, 100, 200, 500]

const hasSelection = computed(() => selectedTorrents.value.length > 0)

const contextMenu = ref<{
  visible: boolean
  x: number
  y: number
  torrent: Torrent | null
}>({
  visible: false,
  x: 0,
  y: 0,
  torrent: null,
})
const contextMenuRef = ref<HTMLElement | null>(null)

const getDefaultTracker = (torrent: Torrent): string => {
  const tracker = torrent.trackers?.[0]
  return tracker ? getTrackerHost(tracker.announce) : '—'
}

const getPeersDownloading = (torrent: Torrent): number => {
  return torrent.peersSendingToUs ?? 0
}

const getPeersUploading = (torrent: Torrent): number => {
  return torrent.peersGettingFromUs ?? 0
}

const getTrackerPeerCounts = (torrent: Torrent) => {
  let seeders = 0
  let leechers = 0
  torrent.trackerStats?.forEach((stat) => {
    if (typeof stat.seederCount === 'number') {
      seeders = Math.max(seeders, stat.seederCount)
    }
    if (typeof stat.leecherCount === 'number') {
      leechers = Math.max(leechers, stat.leecherCount)
    }
  })
  return { seeders, leechers }
}

const formatPeerStatText = (total: number, connected: number): string => {
  const connectedText = connected ?? 0
  if (total > 0) {
    return `${total} (${connectedText})`
  }
  return `${connectedText}`
}

const getSeeders = (torrent: Torrent): string => {
  const { seeders } = getTrackerPeerCounts(torrent)
  return formatPeerStatText(seeders, getPeersDownloading(torrent))
}

const getLeechers = (torrent: Torrent): string => {
  const { leechers } = getTrackerPeerCounts(torrent)
  return formatPeerStatText(leechers, getPeersUploading(torrent))
}

const formatRatio = (ratio: number): string => {
  return (ratio ?? 0).toFixed(2)
}

const formatLastActivity = (timestamp: number): string => {
  if (!timestamp) return '—'
  return dayjs(timestamp * 1000).format('YYYY-MM-DD HH:mm')
}

const formatTorrentDate = (timestamp?: number): string => {
  if (!timestamp) return '—'
  return dayjs(timestamp * 1000).format('YYYY-MM-DD HH:mm')
}

const isTorrentError = (torrent: Torrent) => {
  return (torrent.error ?? 0) > 0 || !!torrent.errorString
}

const getRatioClass = (ratio: number): string => {
  if (!ratio) return 'ratio-zero'
  if (ratio > 0 && ratio < 1) return 'ratio-low'
  if (ratio >= 1 && ratio < 3) return 'ratio-mid'
  return 'ratio-high'
}

// 筛选后的种子列表
const filteredTorrents = computed(() => {
  const keyword = searchKeyword.value.trim().toLowerCase()
  return torrents.value.filter((torrent) => {
    const matchesKeyword = keyword ? torrent.name.toLowerCase().includes(keyword) : true
    const matchesStatus =
      statusFilter.value === 'all'
        ? true
        : statusFilter.value === 'error'
          ? isTorrentError(torrent)
          : torrent.status === statusFilter.value
    const matchesTracker =
      !trackerFilter.value ||
      (torrent.trackers ?? []).some(
        (tracker) => getTrackerHost(tracker.announce) === trackerFilter.value
      )
    return matchesKeyword && matchesStatus && matchesTracker
  })
})

const getSortValue = (torrent: Torrent, prop?: string) => {
  switch (prop) {
    case 'name':
      return torrent.name.toLowerCase()
    case 'status':
      return torrent.status
    case 'percentDone':
      return torrent.percentDone
    case 'totalSize':
      return torrent.totalSize
    case 'uploadRatio':
      return torrent.uploadRatio
    case 'defaultTracker':
      return getDefaultTracker(torrent)
    case 'peersDownloading':
      return getPeersDownloading(torrent)
    case 'peersUploading':
      return getPeersUploading(torrent)
    case 'rateDownload':
      return torrent.rateDownload
    case 'rateUpload':
      return torrent.rateUpload
    case 'uploadedEver':
      return torrent.uploadedEver ?? 0
    case 'activityDate':
      return torrent.activityDate ?? 0
    default:
      return (torrent as Record<string, any>)[prop || ''] ?? 0
  }
}

const displayedTorrents = computed(() => {
  const base = filteredTorrents.value
  const { prop, order } = sortState.value
  if (!prop || !order) return base
  return [...base].sort((a, b) => {
    const aVal = getSortValue(a, prop)
    const bVal = getSortValue(b, prop)
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      const compare = aVal.localeCompare(bVal)
      return order === 'ascending' ? compare : -compare
    }
    const compare = Number(aVal) - Number(bVal)
    return order === 'ascending' ? compare : -compare
  })
})

const paginatedTorrents = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return displayedTorrents.value.slice(start, start + pageSize.value)
})

const trackerOptions = computed(() => {
  const hosts = new Set<string>()
  torrents.value.forEach((torrent) => {
    torrent.trackers?.forEach((tracker) => {
      const host = getTrackerHost(tracker.announce)
      if (host) {
        hosts.add(host)
      }
    })
  })
  return Array.from(hosts)
    .sort((a, b) => a.localeCompare(b))
    .map((host) => ({ label: host, value: host }))
})

const selectedIds = computed(() => selectedTorrents.value.map((torrent) => torrent.id))
const currentTrackerLabel = computed(() =>
  trackerFilter.value || '全部 Tracker'
)
const detailTrackerRows = computed(() => {
  if (!detailTorrent.value?.trackers?.length) return []
  return detailTorrent.value.trackers.map((tracker, index) => {
    const stat = detailTorrent.value?.trackerStats?.find(
      (s) => s.announce === tracker.announce
    )
    const success = stat?.lastAnnounceSucceeded
    const statusType = success ? 'success' : 'warning'
    const lastAnnounce = stat?.lastAnnounceTime
      ? formatLastActivity(stat.lastAnnounceTime)
      : '—'
    const statusText = success
      ? '汇报成功'
      : stat
        ? '等待汇报/失败'
        : '未知'
    return {
      tier: tracker.tier ?? index,
      announce: tracker.announce,
      statusText,
      statusType,
      lastAnnounce,
    }
  })
})

const detailFiles = computed(() => {
  if (!detailTorrent.value?.files?.length) return []
  return detailTorrent.value.files.map((file, index) => ({
    ...file,
    index,
    wanted:
      detailFileSelections.value[index] ??
      detailTorrent.value?.fileStats?.[index]?.wanted ??
      true,
  }))
})

const detailTotalFileCount = computed(() => detailFiles.value.length)

const detailSelectedFileCount = computed(() =>
  detailFiles.value.filter((file) => detailFileSelections.value[file.index] ?? true).length
)

const detailFileRowKey = (row: { index: number }) => row.index

watch([searchKeyword, statusFilter, trackerFilter], () => {
  currentPage.value = 1
})

watch(pageSize, () => {
  currentPage.value = 1
})

watch(
  () => displayedTorrents.value.length,
  (total) => {
    const maxPage = Math.max(1, Math.ceil(total / pageSize.value) || 1)
    if (currentPage.value > maxPage) {
      currentPage.value = maxPage
    }
  }
)

watch(showLocationDialog, (visible) => {
  if (!visible) {
    locationTarget.value = null
    locationForm.value.path = ''
  }
})

watch(showDetailDialog, (visible) => {
  if (!visible) {
    detailTorrent.value = null
    resetDetailInteractions()
  }
})

watch(
  () => removeDialog.value.visible,
  (visible) => {
    if (!visible) {
      removeDialog.value.ids = []
      removeDialog.value.withData = false
      removeDialog.value.message = ''
    }
  }
)

watch(limitDialogVisible, (visible) => {
  if (!visible) {
    limitDialogIds.value = []
    resetLimitDialogForm()
  }
})

const handleTrackerCommand = (command: string) => {
  trackerFilter.value = command
}

const handleSortChange = ({
  prop,
  order,
}: {
  column: any
  prop: string
  order: SortOrder
}) => {
  sortState.value = {
    prop: prop || '',
    order: order || null,
  }
}

const handleSelectionChange = (selection: Torrent[]) => {
  selectedTorrents.value = selection
  if (suppressSelectionChange.value) {
    return
  }
  selectedIdsState.value = selection.map((torrent) => torrent.id)
}

const handleRowContextMenu = (row: Torrent, _column: any, event: MouseEvent) => {
  event.preventDefault()
  contextMenu.value = {
    visible: true,
    x: event.clientX,
    y: event.clientY,
    torrent: row,
  }
  nextTick(adjustContextMenuPosition)
}

const hideContextMenu = () => {
  contextMenu.value.visible = false
  contextMenu.value.torrent = null
}

const adjustContextMenuPosition = () => {
  const menuEl = contextMenuRef.value
  if (!menuEl) return
  const rect = menuEl.getBoundingClientRect()
  const padding = 8
  let x = contextMenu.value.x
  let y = contextMenu.value.y
  if (x + rect.width > window.innerWidth - padding) {
    x = window.innerWidth - rect.width - padding
  }
  if (y + rect.height > window.innerHeight - padding) {
    y = window.innerHeight - rect.height - padding
  }
  contextMenu.value.x = Math.max(padding, x)
  contextMenu.value.y = Math.max(padding, y)
}

// 加载种子列表
const loadTorrents = async (options: { silent?: boolean } = {}) => {
  if (!options.silent) {
    loading.value = true
  }
  try {
    const result = await api.getTorrents()
    torrents.value = result.torrents
    restoreSelection()
    syncContextMenuTorrent()
    lastFetchedAt.value = dayjs().format('YYYY-MM-DD HH:mm:ss')
  } catch (error: any) {
    ElMessage.error(`加载失败: ${error.message}`)
  } finally {
    if (!options.silent) {
      loading.value = false
    }
  }
}

const restoreSelection = () => {
  if (!tableRef.value) return
  const idsToRestore = [...selectedIdsState.value]
  suppressSelectionChange.value = true
  nextTick(() => {
    const table = tableRef.value
    if (!table) {
      suppressSelectionChange.value = false
      return
    }
    table.clearSelection()
    if (!idsToRestore.length) {
      selectedTorrents.value = []
      suppressSelectionChange.value = false
      return
    }
    const idSet = new Set(idsToRestore)
    const rowsToSelect = paginatedTorrents.value.filter((torrent) => idSet.has(torrent.id))
    rowsToSelect.forEach((torrent) => {
      table.toggleRowSelection(torrent, true)
    })
    selectedTorrents.value = rowsToSelect
    selectedIdsState.value = rowsToSelect.map((torrent) => torrent.id)
    suppressSelectionChange.value = false
  })
}

const syncContextMenuTorrent = () => {
  if (!contextMenu.value.visible || !contextMenu.value.torrent) return
  const currentId = contextMenu.value.torrent.id
  const updated = torrents.value.find((torrent) => torrent.id === currentId)
  if (updated) {
    contextMenu.value.torrent = updated
  } else {
    hideContextMenu()
  }
}

const openRemoveDialog = (ids: number[], message: string) => {
  removeDialog.value.ids = ids
  removeDialog.value.message = message
  removeDialog.value.withData = false
  removeDialog.value.visible = true
}

const confirmRemoveDialog = async () => {
  if (!removeDialog.value.ids.length) {
    removeDialog.value.visible = false
    return
  }
  const ids = [...removeDialog.value.ids]
  const deleteData = removeDialog.value.withData
  try {
    await api.removeTorrents(ids, deleteData)
    ElMessage.success('已删除')
    removeDialog.value.visible = false
    removeDialog.value.ids = []
    selectedIdsState.value = selectedIdsState.value.filter((id) => !ids.includes(id))
    selectedTorrents.value = selectedTorrents.value.filter((torrent) => !ids.includes(torrent.id))
    loadTorrents()
  } catch (error: any) {
    ElMessage.error(`删除失败: ${error.message}`)
  }
}

const startAutoRefresh = () => {
  stopAutoRefresh()
  refreshTimer = window.setInterval(() => {
    loadTorrents({ silent: true })
  }, REFRESH_INTERVAL)
}

const stopAutoRefresh = () => {
  if (refreshTimer) {
    window.clearInterval(refreshTimer)
    refreshTimer = undefined
  }
}

const startSelected = async () => {
  if (!selectedIds.value.length) return
  try {
    await api.startTorrents(selectedIds.value)
    ElMessage.success('已开始选中种子')
    loadTorrents()
  } catch (error: any) {
    ElMessage.error(`操作失败: ${error.message}`)
  }
}

const stopSelected = async () => {
  if (!selectedIds.value.length) return
  try {
    await api.stopTorrents(selectedIds.value)
    ElMessage.success('已暂停选中种子')
    loadTorrents()
  } catch (error: any) {
    ElMessage.error(`操作失败: ${error.message}`)
  }
}

const removeSelected = () => {
  if (!selectedIds.value.length) return
  openRemoveDialog([...selectedIds.value], `确定删除选中的 ${selectedIds.value.length} 个种子？`)
}

const handleContextAction = (
  action: 'start' | 'stop' | 'delete' | 'verify' | 'reannounce' | 'location' | 'detail'
) => {
  const torrent = contextMenu.value.torrent
  if (!torrent) return
  hideContextMenu()
  if (action === 'start') {
    startTorrent(torrent.id)
    return
  }
  if (action === 'stop') {
    stopTorrent(torrent.id)
    return
  }
  if (action === 'delete') {
    removeTorrent(torrent.id)
    return
  }
  if (action === 'verify') {
    verifyTorrent(torrent.id)
    return
  }
  if (action === 'reannounce') {
    reannounceTorrent(torrent.id)
    return
  }
  if (action === 'location') {
    openLocationDialog(torrent)
    return
  }
  if (action === 'detail') {
    openDetailDialog(torrent)
  }
}

// 开始种子
const startTorrent = async (id: number) => {
  try {
    await api.startTorrents([id])
    ElMessage.success('已开始')
    loadTorrents()
  } catch (error: any) {
    ElMessage.error(`操作失败: ${error.message}`)
  }
}

// 暂停种子
const stopTorrent = async (id: number) => {
  try {
    await api.stopTorrents([id])
    ElMessage.success('已暂停')
    loadTorrents()
  } catch (error: any) {
    ElMessage.error(`操作失败: ${error.message}`)
  }
}

// 删除种子
const removeTorrent = async (id: number) => {
  openRemoveDialog([id], '确定删除该种子？')
}

const verifyTorrent = async (id: number) => {
  try {
    await api.verifyTorrents([id])
    ElMessage.success('已开始重新校验')
  } catch (error: any) {
    ElMessage.error(`重新校验失败: ${error.message}`)
  }
}

const reannounceTorrent = async (id: number) => {
  try {
    await api.reannounceTorrents([id])
    ElMessage.success('已通知 Tracker')
  } catch (error: any) {
    ElMessage.error(`重新汇报失败: ${error.message}`)
  }
}

const openLocationDialog = (torrent: Torrent) => {
  locationTarget.value = torrent
  locationForm.value.path = torrent.downloadDir
  locationForm.value.move = true
  showLocationDialog.value = true
}

const submitLocationChange = async () => {
  if (!locationTarget.value) {
    showLocationDialog.value = false
    return
  }
  const path = locationForm.value.path.trim()
  if (!path) {
    ElMessage.warning('请输入新的保存目录')
    return
  }
  try {
    await api.setTorrentLocation([locationTarget.value.id], path, locationForm.value.move)
    ElMessage.success('保存目录已更新')
    showLocationDialog.value = false
    loadTorrents()
  } catch (error: any) {
    ElMessage.error(`变更失败: ${error.message}`)
  }
}

const fetchTorrentDetail = async (id: number) => {
  const result = await api.getTorrents(DETAIL_FIELDS, { ids: [id] })
  return result.torrents[0] || null
}

const applyDetailData = (torrent: Torrent) => {
  detailTorrent.value = torrent
  initializeDetailFileSelections()
  initializeDetailLimitForm()
}

const refreshDetailData = async () => {
  if (!detailTorrent.value) return
  try {
    const detail = await fetchTorrentDetail(detailTorrent.value.id)
    if (detail) {
      applyDetailData(detail)
    }
  } catch (error) {
    console.warn('刷新详情失败', error)
  }
}

const openDetailDialog = async (torrent: Torrent) => {
  showDetailDialog.value = true
  detailLoading.value = true
  try {
    const detail = await fetchTorrentDetail(torrent.id)
    applyDetailData(detail || torrent)
  } catch (error: any) {
    ElMessage.error(`加载详情失败: ${error.message}`)
    applyDetailData(torrent)
  } finally {
    detailLoading.value = false
  }
}

const initializeDetailFileSelections = () => {
  if (!detailTorrent.value?.files) {
    detailFileSelections.value = {}
    return
  }
  const selections: Record<number, boolean> = {}
  detailTorrent.value.files.forEach((_, index) => {
    const wanted = detailTorrent.value?.fileStats?.[index]?.wanted
    selections[index] = wanted !== undefined ? wanted : true
  })
  detailFileSelections.value = selections
}

const toggleAllDetailFiles = (wanted: boolean) => {
  if (!detailFiles.value.length) return
  const selections: Record<number, boolean> = {}
  detailFiles.value.forEach((file) => {
    selections[file.index] = wanted
  })
  detailFileSelections.value = selections
}

const saveDetailFileSelections = async () => {
  if (!detailTorrent.value) return
  if (!detailFiles.value.length) {
    ElMessage.warning('暂无文件可更新')
    return
  }
  const wanted: number[] = []
  const unwanted: number[] = []
  detailFiles.value.forEach((file) => {
    const target = detailFileSelections.value[file.index]
    const current = detailTorrent.value?.fileStats?.[file.index]?.wanted ?? true
    if (target === current) return
    if (target) {
      wanted.push(file.index)
    } else {
      unwanted.push(file.index)
    }
  })
  if (!wanted.length && !unwanted.length) {
    ElMessage.info('未改变文件选择')
    return
  }
  const payload: Record<string, any> = {}
  if (wanted.length) payload['files-wanted'] = wanted
  if (unwanted.length) payload['files-unwanted'] = unwanted
  detailFilesSaving.value = true
  try {
    await api.setTorrents([detailTorrent.value.id], payload)
    ElMessage.success('文件选择已更新')
    await refreshDetailData()
  } catch (error: any) {
    ElMessage.error(`更新失败: ${error.message}`)
  } finally {
    detailFilesSaving.value = false
  }
}

const initializeDetailLimitForm = () => {
  detailLimitForm.value = {
    downloadLimited: detailTorrent.value?.downloadLimited ?? false,
    downloadLimit: detailTorrent.value?.downloadLimit ?? 0,
    uploadLimited: detailTorrent.value?.uploadLimited ?? false,
    uploadLimit: detailTorrent.value?.uploadLimit ?? 0,
  }
}

const buildLimitPayload = (form: LimitFormState) => {
  const payload: Record<string, any> = {
    downloadLimited: form.downloadLimited,
    uploadLimited: form.uploadLimited,
  }
  if (form.downloadLimited) {
    payload.downloadLimit = Math.max(0, Math.round(form.downloadLimit))
  }
  if (form.uploadLimited) {
    payload.uploadLimit = Math.max(0, Math.round(form.uploadLimit))
  }
  return payload
}

const saveDetailLimit = async () => {
  if (!detailTorrent.value) return
  detailLimitSaving.value = true
  try {
    await api.setTorrents([detailTorrent.value.id], buildLimitPayload(detailLimitForm.value))
    ElMessage.success('限速已更新')
    await refreshDetailData()
  } catch (error: any) {
    ElMessage.error(`更新失败: ${error.message}`)
  } finally {
    detailLimitSaving.value = false
  }
}

const openBatchLimitDialog = () => {
  if (!selectedIds.value.length) return
  limitDialogIds.value = [...selectedIds.value]
  resetLimitDialogForm()
  limitDialogVisible.value = true
}

const resetLimitDialogForm = () => {
  limitDialogForm.value = createEmptyLimitForm()
}

const submitBatchLimit = async () => {
  if (!limitDialogIds.value.length) {
    limitDialogVisible.value = false
    return
  }
  limitDialogSaving.value = true
  try {
    await api.setTorrents(limitDialogIds.value, buildLimitPayload(limitDialogForm.value))
    ElMessage.success('限速设置已应用')
    limitDialogVisible.value = false
    loadTorrents()
  } catch (error: any) {
    ElMessage.error(`保存失败: ${error.message}`)
  } finally {
    limitDialogSaving.value = false
  }
}

const resetDetailInteractions = () => {
  detailFileSelections.value = {}
  detailLimitForm.value = createEmptyLimitForm()
}

// 文件选择
const handleFileChange = (file: any) => {
  addForm.value.file = file.raw
}

// 添加种子
const handleAddTorrent = async () => {
  try {
    const params: any = {
      paused: addForm.value.paused,
    }

    if (addForm.value.downloadDir) {
      params.downloadDir = addForm.value.downloadDir
    }

    if (addForm.value.type === 'magnet') {
      if (!addForm.value.magnet) {
        ElMessage.warning('请输入磁力链接')
        return
      }
      params.filename = addForm.value.magnet
    } else {
      if (!addForm.value.file) {
        ElMessage.warning('请选择种子文件')
        return
      }
      // 读取文件并转换为 base64
      const reader = new FileReader()
      reader.onload = async (e) => {
        const base64 = btoa(
          new Uint8Array(e.target!.result as ArrayBuffer).reduce(
            (data, byte) => data + String.fromCharCode(byte),
            ''
          )
        )
        params.metainfo = base64
        await api.addTorrent(params)
        ElMessage.success('添加成功')
        showAddDialog.value = false
        loadTorrents()
      }
      reader.readAsArrayBuffer(addForm.value.file)
      return
    }

    await api.addTorrent(params)
    ElMessage.success('添加成功')
    showAddDialog.value = false
    loadTorrents()
  } catch (error: any) {
    ElMessage.error(`添加失败: ${error.message}`)
  }
}

// 获取状态文本
const getStatusText = (torrent: Torrent): string => {
  if (isTorrentError(torrent)) {
    return '错误'
  }
  return statusTextMap[torrent.status] || '未知'
}

// 获取状态类型
const getStatusType = (torrent: Torrent): string => {
  if (isTorrentError(torrent)) {
    return 'danger'
  }
  const typeMap: Record<TorrentStatus, string> = {
    [TorrentStatusEnum.STOPPED]: 'info',
    [TorrentStatusEnum.CHECK_WAIT]: 'warning',
    [TorrentStatusEnum.CHECK]: 'warning',
    [TorrentStatusEnum.DOWNLOAD_WAIT]: 'warning',
    [TorrentStatusEnum.DOWNLOAD]: 'success',
    [TorrentStatusEnum.SEED_WAIT]: 'warning',
    [TorrentStatusEnum.SEED]: 'success',
  }
  return typeMap[torrent.status] || 'info'
}

// 格式化字节
const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`
}

// 格式化速度
const formatSpeed = (bytes: number): string => {
  if (bytes === 0) return '0 B/s'
  return `${formatBytes(bytes)}/s`
}

onMounted(() => {
  loadTorrents()
  startAutoRefresh()
  window.addEventListener('click', hideContextMenu)
  window.addEventListener('scroll', hideContextMenu, true)
})

onBeforeUnmount(() => {
  stopAutoRefresh()
  window.removeEventListener('click', hideContextMenu)
  window.removeEventListener('scroll', hideContextMenu, true)
})
</script>

<style scoped>
.home-view {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.actions-group {
  display: flex;
  gap: 10px;
}

.filter-submenu {
  margin-top: 12px;
  padding: 12px;
  background-color: #f5f7fa;
  border: 1px solid #ebeef5;
  border-radius: 6px;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
}

.submenu-section {
  display: flex;
  align-items: center;
  gap: 8px;
}

.submenu-label {
  font-size: 13px;
  color: #909399;
  white-space: nowrap;
}

.search-section {
  flex: 1 1 240px;
  min-width: 220px;
}

.update-info {
  margin-left: auto;
  color: #909399;
  font-size: 13px;
}

.label-tag {
  margin-right: 4px;
  margin-bottom: 4px;
}

.context-menu {
  position: fixed;
  background-color: #fff;
  border: 1px solid #ebeef5;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  border-radius: 4px;
  padding: 8px 0;
  z-index: 2000;
  min-width: 120px;
}

.context-menu button {
  display: block;
  width: 100%;
  padding: 6px 16px;
  text-align: left;
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 14px;
}

.context-menu button:hover {
  background-color: #f5f7fa;
}

.context-menu button.danger {
  color: #f56c6c;
}

.table-container {
  flex: 1;
  overflow: auto;
  margin-top: 20px;
  display: flex;
  flex-direction: column;
}

.pagination {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}

.detail-dialog :deep(.el-dialog__body) {
  max-height: 70vh;
  overflow: hidden;
}

.detail-body {
  max-height: 60vh;
  overflow-y: auto;
  padding-right: 8px;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 12px 24px;
  margin-bottom: 20px;
}

.detail-item {
  border: 1px solid #ebeef5;
  border-radius: 6px;
  padding: 10px 12px;
  background-color: #fff;
  display: flex;
  flex-direction: column;
  min-height: 64px;
}

.detail-label {
  font-size: 12px;
  color: #909399;
  margin-bottom: 4px;
}

.detail-value {
  font-weight: 500;
  color: #303133;
  word-break: break-word;
}

.hash-value {
  font-family: monospace;
}

.files-table {
  border: 1px solid #ebeef5;
  border-radius: 6px;
  overflow: hidden;
  background-color: #fff;
  padding: 12px;
}

.files-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 13px;
  color: #606266;
}

.files-actions-buttons {
  display: flex;
  gap: 8px;
}

.limit-form {
  margin-top: 12px;
}

.limit-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.limit-unit {
  color: #909399;
}

.detail-actions {
  margin-top: 8px;
  text-align: right;
}

.dialog-subtitle {
  margin: 0 0 12px;
  font-size: 13px;
  color: #909399;
}

.section-title {
  margin: 20px 0 10px;
  font-size: 15px;
  font-weight: 600;
}

.table-placeholder {
  color: #909399;
  font-size: 13px;
  margin: 0 0 16px;
}

.dropdown-icon {
  margin-left: 4px;
}

.ratio-tag {
  border: none;
  color: #fff;
}

.ratio-zero {
  background-color: #909399;
}

.ratio-low {
  background-color: #e6a23c;
}

.ratio-mid {
  background-color: #67c23a;
}

.ratio-high {
  background-color: #f56c6c;
}

.delete-message {
  margin-bottom: 12px;
  color: #606266;
}
</style>
