<template>
  <div class="stats-view">
    <div class="stats-header">
      <h2>数据统计</h2>
      <div class="header-actions">
        <span v-if="lastUpdated">最近更新：{{ lastUpdated }}</span>
        <el-button
          size="small"
          :loading="loading || systemStatusStore.loading"
          @click="loadData()"
        >
          刷新数据
        </el-button>
      </div>
    </div>

    <el-row :gutter="20" class="summary-row">
      <el-col :xs="24" :sm="12" :lg="6">
        <el-card class="summary-card">
          <div class="summary-title">历史总上传量</div>
          <div class="summary-value">{{ formatBytes(totalUploaded) }}</div>
          <div class="summary-subtitle">Transmission 返回的累计值</div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <el-card class="summary-card">
          <div class="summary-title">历史总下载量</div>
          <div class="summary-value">{{ formatBytes(totalDownloaded) }}</div>
          <div class="summary-subtitle">Transmission 返回的累计值</div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <el-card class="summary-card">
          <div class="summary-title">下载限速</div>
          <div class="summary-value">{{ downloadLimitText }}</div>
          <div class="summary-subtitle">Session 设置 (KB/s)</div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <el-card class="summary-card">
          <div class="summary-title">上传限速</div>
          <div class="summary-value">{{ uploadLimitText }}</div>
          <div class="summary-subtitle">Session 设置 (KB/s)</div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="summary-row secondary">
      <el-col :xs="24" :sm="24" :lg="24">
        <el-card class="summary-card summary-text-card">
          <div class="summary-title">会话概况</div>
          <div class="summary-value summary-text">
            {{ torrentSummaryText }}
          </div>
          <div class="summary-subtitle">来自 session-stats</div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="summary-row secondary">
      <el-col :xs="24" :sm="12" :lg="12">
        <el-card class="summary-card summary-text-card">
          <div class="summary-title">当前下载速度</div>
          <div class="summary-value">
            {{ formatSpeed(sessionStats?.downloadSpeed || 0) }}
          </div>
          <div class="summary-subtitle">实时速率</div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :lg="12">
        <el-card class="summary-card summary-text-card">
          <div class="summary-title">当前上传速度</div>
          <div class="summary-value">
            {{ formatSpeed(sessionStats?.uploadSpeed || 0) }}
          </div>
          <div class="summary-subtitle">实时速率</div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="summary-row secondary">
      <el-col :xs="24" :sm="12" :lg="12">
        <el-card class="summary-card summary-text-card">
          <div class="summary-title">磁盘剩余空间</div>
          <div class="summary-value">
            {{ freeSpaceText }}
          </div>
          <div class="summary-subtitle">根据下载目录计算</div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="charts-grid">
      <el-col :xs="24" :lg="24">
        <el-card class="stats-card chart-card">
          <template #header>
            <div class="card-header">
              <span>实时上传/下载趋势</span>
              <small>最近 {{ speedHistory.length }} 次刷新</small>
            </div>
          </template>
          <VChart class="chart" :option="speedChartOptions" autoresize />
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="charts-grid">
      <el-col :xs="24" :lg="14">
        <el-card class="stats-card chart-card">
          <template #header>
            <div class="card-header">
              <span>热门种子上传/下载对比</span>
              <small>按累计下载排序前 8 个</small>
            </div>
          </template>
          <VChart class="chart" :option="topTorrentChartOptions" autoresize />
        </el-card>
      </el-col>
      <el-col :xs="24" :lg="10">
        <el-card class="stats-card chart-card">
          <template #header>
            <div class="card-header">
              <span>Tracker 上传占比</span>
              <small>基于默认 Tracker 汇总</small>
            </div>
          </template>
          <VChart class="chart" :option="trackerShareChartOptions" autoresize />
        </el-card>
      </el-col>
    </el-row>

    <el-card class="stats-card">
      <template #header>
        <div class="card-header">
          <span>Tracker 全量统计</span>
          <small>按默认 Tracker 汇总上传/下载</small>
        </div>
      </template>
      <el-table
        v-loading="loading"
        :data="trackerStats"
        size="small"
        empty-text="暂无种子数据"
      >
        <el-table-column prop="tracker" label="Tracker" min-width="180" />
        <el-table-column label="下载">
          <template #default="{ row }">
            {{ formatBytes(row.downloaded) }}
          </template>
        </el-table-column>
        <el-table-column label="上传">
          <template #default="{ row }">
            {{ formatBytes(row.uploaded) }}
          </template>
        </el-table-column>
        <el-table-column label="分享率">
          <template #default="{ row }">
            {{ (row.ratio || 0).toFixed(2) }}
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart, BarChart, PieChart } from 'echarts/charts'
import { GridComponent, LegendComponent, TooltipComponent, TitleComponent } from 'echarts/components'
import * as api from '@/api/transmission'
import type { Torrent } from '@/types/transmission'
import { useSystemStatusStore } from '@/stores/systemStatus'
import { getTrackerHost } from '@/utils/torrent'

use([CanvasRenderer, LineChart, BarChart, PieChart, GridComponent, LegendComponent, TooltipComponent, TitleComponent])

interface SpeedPoint {
  time: string
  download: number
  upload: number
}

const SPEED_HISTORY_LIMIT = 40

const loading = ref(false)
const torrents = ref<Torrent[]>([])
const systemStatusStore = useSystemStatusStore()
const { sessionStats, sessionConfig, freeSpaceBytes, lastUpdated } =
  storeToRefs(systemStatusStore)
const speedHistory = ref<SpeedPoint[]>([])

const totalUploaded = computed(
  () => sessionStats.value?.['cumulative-stats'].uploadedBytes || 0
)
const totalDownloaded = computed(
  () => sessionStats.value?.['cumulative-stats'].downloadedBytes || 0
)

const downloadLimitText = computed(() => {
  const config = sessionConfig.value
  if (!config) return '未知'
  if (!config['speed-limit-down-enabled']) return '未启用'
  return `${config['speed-limit-down']} KB/s`
})

const uploadLimitText = computed(() => {
  const config = sessionConfig.value
  if (!config) return '未知'
  if (!config['speed-limit-up-enabled']) return '未启用'
  return `${config['speed-limit-up']} KB/s`
})

const torrentSummaryText = computed(() => {
  const stats = sessionStats.value
  if (!stats) return '暂无数据'
  const parts = [
    `总数 ${stats.torrentCount}`,
    `活跃 ${stats.activeTorrentCount}`,
    `暂停 ${stats.pausedTorrentCount}`,
  ]
  return parts.join(' / ')
})

const freeSpaceText = computed(() => {
  if (freeSpaceBytes.value == null) return '未知'
  return formatBytes(freeSpaceBytes.value)
})

const trackerStats = computed(() => {
  const trackerMap = new Map<
    string,
    { tracker: string; uploaded: number; downloaded: number }
  >()
  torrents.value.forEach((torrent) => {
    const tracker = torrent.trackers?.[0]
    const host = tracker ? getTrackerHost(tracker.announce) : '未设置'
    if (!trackerMap.has(host)) {
      trackerMap.set(host, { tracker: host, uploaded: 0, downloaded: 0 })
    }
    const entry = trackerMap.get(host)!
    entry.uploaded += torrent.uploadedEver || 0
    entry.downloaded += torrent.downloadedEver || 0
  })
  return Array.from(trackerMap.values())
    .map((entry) => ({
      ...entry,
      ratio: entry.downloaded > 0 ? entry.uploaded / entry.downloaded : 0,
    }))
    .sort((a, b) => b.uploaded - a.uploaded)
})

const trackerShareData = computed(() =>
  trackerStats.value
    .slice(0, 10)
    .map((item) => ({ name: item.tracker, value: item.uploaded || 0 }))
)

const topTorrents = computed(() =>
  [...torrents.value]
    .sort((a, b) => (b.downloadedEver || 0) - (a.downloadedEver || 0))
    .slice(0, 8)
    .map((torrent) => ({
      name: torrent.name,
      downloaded: torrent.downloadedEver || 0,
      uploaded: torrent.uploadedEver || 0,
    }))
)

const speedChartOptions = computed(() => ({
  tooltip: {
    trigger: 'axis',
    formatter: (params: any) => {
      if (!Array.isArray(params)) return ''
      const header = `${params[0]?.axisValueLabel || ''}<br/>`
      const lines = params
        .map(
          (item) => `${item.marker}${item.seriesName}：${formatSpeed(item.data ?? 0)}`
        )
        .join('<br/>')
      return header + lines
    },
  },
  legend: {
    data: ['下载速度', '上传速度'],
  },
  grid: {
    left: 30,
    right: 10,
    bottom: 10,
    containLabel: true,
  },
  xAxis: {
    type: 'category',
    boundaryGap: false,
    data: speedHistory.value.map((point) => point.time),
  },
  yAxis: {
    type: 'value',
    axisLabel: {
      formatter: (value: number) => formatSpeed(value),
    },
  },
  series: [
    {
      name: '下载速度',
      type: 'line',
      smooth: true,
      areaStyle: { opacity: 0.15 },
      data: speedHistory.value.map((point) => point.download),
    },
    {
      name: '上传速度',
      type: 'line',
      smooth: true,
      areaStyle: { opacity: 0.1 },
      data: speedHistory.value.map((point) => point.upload),
    },
  ],
}))

const topTorrentChartOptions = computed(() => ({
  tooltip: {
    trigger: 'axis',
    axisPointer: {
      type: 'shadow',
    },
    formatter: (params: any) => {
      if (!Array.isArray(params) || !params.length) return ''
      const name = params[0].name
      const lines = params
        .map((item) => `${item.marker}${item.seriesName}：${formatBytes(item.value || 0)}`)
        .join('<br/>')
      return `${name}<br/>${lines}`
    },
  },
  legend: { data: ['累计下载', '累计上传'] },
  grid: {
    left: 0,
    right: 20,
    bottom: 0,
    containLabel: true,
  },
  xAxis: {
    type: 'value',
    axisLabel: {
      formatter: (value: number) => formatBytes(value),
    },
  },
  yAxis: {
    type: 'category',
    data: topTorrents.value.map((item) => item.name),
    axisLabel: {
      formatter: (value: string) => (value.length > 16 ? `${value.slice(0, 16)}…` : value),
    },
  },
  series: [
    {
      name: '累计下载',
      type: 'bar',
      stack: 'total',
      emphasis: {
        focus: 'series',
      },
      data: topTorrents.value.map((item) => item.downloaded),
    },
    {
      name: '累计上传',
      type: 'bar',
      stack: 'total',
      emphasis: {
        focus: 'series',
      },
      data: topTorrents.value.map((item) => item.uploaded),
    },
  ],
}))

const trackerShareChartOptions = computed(() => ({
  tooltip: {
    trigger: 'item',
    formatter: ({ name, value, percent }: any) =>
      `${name}<br/>上传：${formatBytes(value || 0)}<br/>占比：${percent}%`,
  },
  legend: {
    show: false,
  },
  series: [
    {
      name: 'Tracker 上传占比',
      type: 'pie',
      radius: ['40%', '70%'],
      data: trackerShareData.value,
      label: {
        formatter: '{d}%'
      },
      labelLine: { show: true },
    },
  ],
}))

watch(
  () => sessionStats.value,
  (stats) => {
    if (!stats) return
    const nextPoint: SpeedPoint = {
      time: dayjs().format('HH:mm:ss'),
      download: stats.downloadSpeed || 0,
      upload: stats.uploadSpeed || 0,
    }
    const updated = speedHistory.value.slice()
    updated.push(nextPoint)
    if (updated.length > SPEED_HISTORY_LIMIT) {
      updated.shift()
    }
    speedHistory.value = updated
  },
  { immediate: true }
)

const loadTorrents = async () => {
  const torrentData = await api.getTorrents()
  torrents.value = torrentData.torrents
}

const loadData = async () => {
  loading.value = true
  try {
    await Promise.all([systemStatusStore.load(), loadTorrents()])
  } catch (error: any) {
    ElMessage.error(`加载失败: ${error.message || error}`)
  } finally {
    loading.value = false
  }
}

const formatBytes = (bytes: number): string => {
  if (!bytes) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`
}

const formatSpeed = (bytes: number): string => {
  return `${formatBytes(bytes)}/s`
}

onMounted(async () => {
  systemStatusStore.start()
  try {
    await loadData()
  } catch (error: any) {
    ElMessage.error(`加载数据失败: ${error.message || error}`)
  }
})
</script>

<style scoped>
.stats-view {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.stats-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
  color: #909399;
}

.summary-row {
  margin-top: 10px;
}

.summary-card {
  height: 100%;
  min-height: 150px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.summary-text-card {
  justify-content: flex-start;
}

.summary-title {
  font-size: 14px;
  color: #909399;
}

.summary-value {
  font-size: 24px;
  font-weight: 600;
  margin-top: 8px;
}

.summary-text {
  font-size: 16px;
  font-weight: 500;
  word-break: break-all;
}

.summary-subtitle {
  margin-top: 6px;
  font-size: 12px;
  color: #a0a3a6;
}

.stats-card {
  margin-top: 20px;
}

.card-header {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-weight: 600;
}

.card-header small {
  font-weight: normal;
  color: #909399;
}

.charts-grid {
  margin-top: 10px;
}

.chart-card {
  min-height: 360px;
}

.chart {
  width: 100%;
  height: 320px;
}

@media (max-width: 768px) {
  .chart-card {
    min-height: 300px;
  }

  .chart {
    height: 260px;
  }
}
</style>
