<template>
  <el-container class="main-layout">
    <el-header class="header">
      <div class="header-left">
        <h1 class="title">Transmission Vue</h1>
      </div>
      <div class="header-right">
        <div class="status-group">
          <div class="status-item">
            <span class="status-label">上传速度</span>
            <span class="status-value">{{ uploadSpeedText }}</span>
          </div>
          <div class="status-item">
            <span class="status-label">下载速度</span>
            <span class="status-value">{{ downloadSpeedText }}</span>
          </div>
          <div class="status-item">
            <span class="status-label">可用空间</span>
            <span class="status-value">{{ freeSpaceText }}</span>
          </div>
          <div class="status-item">
            <span class="status-label">版本</span>
            <span class="status-value">{{ versionText }}</span>
          </div>
          <div class="status-item">
            <span class="status-label">数据更新时间</span>
            <span class="status-value">{{ lastUpdatedText }}</span>
          </div>
          <div class="status-item">
            <span class="status-label">前端版本</span>
            <span class="status-value">{{ frontendVersion }}</span>
          </div>
        </div>
        <el-button :icon="Setting" circle @click="$router.push('/settings')" />
      </div>
    </el-header>

    <el-container class="content-container">
      <el-aside width="200px" class="aside">
        <el-menu :default-active="$route.path" router>
          <el-menu-item index="/">
            <el-icon><List /></el-icon>
            <span>种子列表</span>
          </el-menu-item>
          <el-menu-item index="/settings">
            <el-icon><Setting /></el-icon>
            <span>设置</span>
          </el-menu-item>
          <el-menu-item index="/stats">
            <el-icon><TrendCharts /></el-icon>
            <span>数据统计</span>
          </el-menu-item>
        </el-menu>
      </el-aside>

      <el-main class="main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount } from 'vue'
import { storeToRefs } from 'pinia'
import { Setting, List, TrendCharts } from '@element-plus/icons-vue'
import { useSystemStatusStore } from '@/stores/systemStatus'

const systemStatusStore = useSystemStatusStore()
const { sessionStats, freeSpaceBytes, sessionConfig, lastUpdated } = storeToRefs(systemStatusStore)

const uploadSpeedText = computed(() => formatSpeed(sessionStats.value?.uploadSpeed || 0))
const downloadSpeedText = computed(() => formatSpeed(sessionStats.value?.downloadSpeed || 0))
const freeSpaceText = computed(() =>
  freeSpaceBytes.value !== null ? formatBytes(freeSpaceBytes.value) : '未知'
)
const versionText = computed(() => sessionConfig.value?.version || '未知')
const lastUpdatedText = computed(() => lastUpdated.value || '—')
const frontendVersion = __APP_VERSION__ || 'dev'

onMounted(() => {
  systemStatusStore.start()
})

onBeforeUnmount(() => {
  systemStatusStore.stop()
})

const formatBytes = (bytes: number): string => {
  if (!bytes) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`
}

const formatSpeed = (bytes: number): string => {
  if (!bytes) return '0 B/s'
  return `${formatBytes(bytes)}/s`
}
</script>

<style scoped>
.main-layout {
  height: 100vh;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: #409eff;
  color: white;
  padding: 0 20px;
}

.header-left {
  display: flex;
  align-items: center;
}

.title {
  margin: 0;
  font-size: 20px;
  font-weight: 500;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.status-group {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-right: 12px;
  flex-wrap: wrap;
}

.status-item {
  display: flex;
  flex-direction: column;
  color: #fff;
}

.status-label {
  font-size: 12px;
  opacity: 0.85;
}

.status-value {
  font-size: 14px;
  font-weight: 600;
}

.content-container {
  height: calc(100vh - 60px);
}

.aside {
  background-color: #f5f7fa;
  border-right: 1px solid #e4e7ed;
}

.main {
  background-color: #fff;
  padding: 20px;
}
</style>
