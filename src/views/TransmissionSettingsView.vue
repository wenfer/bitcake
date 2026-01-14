<template>
  <div class="settings-view">
    <el-card v-if="isTransmissionClient">
      <template #header>
        <div class="card-header">
          <span>Transmission 全局设置</span>
          <div class="header-actions">
            <el-button type="primary" size="small" @click="saveSettings">保存设置</el-button>
            <el-button size="small" @click="loadSettings">重置</el-button>
            <el-button size="small" @click="exportSettings">导出配置</el-button>
            <el-button size="small" @click="importSettings">导入配置</el-button>
          </div>
        </div>
      </template>

      <el-tabs v-model="activeTab" class="settings-tabs">
        <!-- 下载与文件 -->
        <el-tab-pane label="下载与文件" name="download">
          <el-form
            v-loading="loading"
            :model="settings"
            :label-position="formLabelPosition"
            :label-width="formLabelWidth"
            size="small"
            class="compact-form"
          >
            <el-row :gutter="16">
              <el-col :xs="24" :md="12">
                <el-form-item label="下载目录">
                  <el-input v-model="settings['download-dir']" />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :md="12">
                <el-form-item label="未完成目录">
                  <div class="inline-row">
                    <el-switch v-model="settings['incomplete-dir-enabled']" />
                    <el-input
                      v-model="settings['incomplete-dir']"
                      :disabled="!settings['incomplete-dir-enabled']"
                      placeholder=".../Incomplete"
                      class="inline-input"
                    />
                  </div>
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="16">
              <el-col :xs="24" :md="8">
                <el-form-item label="新增种子自动开始">
                  <el-switch v-model="settings['start-added-torrents']" />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :md="8">
                <el-form-item label="在未完成的文件名后加上“.part”后缀">
                  <el-switch v-model="settings['rename-partial-files']" />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :md="8">
                <el-form-item label="删除原始种子文件">
                  <el-switch v-model="settings['trash-original-torrent-files']" />
                </el-form-item>
              </el-col>
            </el-row>
          </el-form>
        </el-tab-pane>

        <!-- 速度限制 -->
        <el-tab-pane label="速度限制" name="speed">
          <el-form
            v-loading="loading"
            :model="settings"
            :label-position="formLabelPosition"
            :label-width="formLabelWidth"
            size="small"
            class="compact-form"
          >
            <el-row :gutter="16">
              <el-col :xs="24" :md="12">
                <el-form-item label="下载限速 (KB/s)">
                  <div class="inline-row">
                    <el-switch v-model="settings['speed-limit-down-enabled']" />
                    <el-input-number
                      v-model="settings['speed-limit-down']"
                      :disabled="!settings['speed-limit-down-enabled']"
                      :min="0"
                      class="inline-input"
                    />
                  </div>
                </el-form-item>
              </el-col>
              <el-col :xs="24" :md="12">
                <el-form-item label="上传限速 (KB/s)">
                  <div class="inline-row">
                    <el-switch v-model="settings['speed-limit-up-enabled']" />
                    <el-input-number
                      v-model="settings['speed-limit-up']"
                      :disabled="!settings['speed-limit-up-enabled']"
                      :min="0"
                      class="inline-input"
                    />
                  </div>
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="16">
              <el-col :xs="24" :md="12">
                <el-form-item label="备用下载限速 (KB/s)">
                  <el-input-number v-model="settings['alt-speed-down']" :min="0" class="full-width" />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :md="12">
                <el-form-item label="备用上传限速 (KB/s)">
                  <el-input-number v-model="settings['alt-speed-up']" :min="0" class="full-width" />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="16">
              <el-col :xs="24" :md="8">
                <el-form-item label="启用备用限速">
                  <el-switch v-model="settings['alt-speed-enabled']" />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :md="8">
                <el-form-item label="备用限速计划">
                  <el-switch v-model="settings['alt-speed-time-enabled']" />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="16" v-if="settings['alt-speed-time-enabled']">
              <el-col :xs="24" :md="8">
                <el-form-item label="开始时间">
                  <el-time-select
                    v-model="altSpeedBeginTime"
                    start="00:00"
                    end="23:30"
                    step="00:30"
                    class="full-width"
                  />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :md="8">
                <el-form-item label="结束时间">
                  <el-time-select
                    v-model="altSpeedEndTime"
                    start="00:00"
                    end="23:30"
                    step="00:30"
                    class="full-width"
                  />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :md="8">
                <el-form-item label="生效星期">
                  <el-select
                    v-model="altSpeedDays"
                    multiple
                    collapse-tags
                    placeholder="选择生效的天"
                    class="full-width"
                  >
                    <el-option
                      v-for="day in dayOptions"
                      :key="day.value"
                      :label="day.label"
                      :value="day.value"
                    />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="16">
              <el-col :xs="24" :md="12">
                <el-form-item label="分享率限制">
                  <div class="inline-row">
                    <el-switch v-model="settings['seedRatioLimited']" />
                    <el-input-number
                      v-model="settings['seedRatioLimit']"
                      :disabled="!settings['seedRatioLimited']"
                      :min="0"
                      :step="0.1"
                      class="inline-input"
                    />
                  </div>
                </el-form-item>
              </el-col>
              <el-col :xs="24" :md="12">
                <el-form-item label="做种空闲限制 (分钟)">
                  <div class="inline-row">
                    <el-switch v-model="settings['seedIdleLimited']" />
                    <el-input-number
                      v-model="settings['seedIdleLimit']"
                      :disabled="!settings['seedIdleLimited']"
                      :min="0"
                      class="inline-input"
                    />
                  </div>
                </el-form-item>
              </el-col>
            </el-row>
          </el-form>
        </el-tab-pane>

        <!-- 连接与端口 -->
        <el-tab-pane label="连接与端口" name="connection">
          <el-form
            v-loading="loading"
            :model="settings"
            :label-position="formLabelPosition"
            :label-width="formLabelWidth"
            size="small"
            class="compact-form"
          >
            <el-row :gutter="16">
              <el-col :xs="24" :md="8">
                <el-form-item label="Peer 端口">
                  <el-input-number v-model="settings['peer-port']" :min="1" :max="65535" class="full-width" />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :md="8">
                <el-form-item label="端口映射 (UPnP)">
                  <el-switch v-model="settings['port-forwarding-enabled']" />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :md="8">
                <el-form-item label="启动时随机端口">
                  <el-switch v-model="settings['peer-port-random-on-start']" />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="16">
              <el-col :xs="24" :md="12">
                <el-form-item label="全局 Peer 上限">
                  <el-input-number v-model="settings['peer-limit-global']" :min="1" class="full-width" />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :md="12">
                <el-form-item label="单种 Peer 上限">
                  <el-input-number v-model="settings['peer-limit-per-torrent']" :min="1" class="full-width" />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="16">
              <el-col :xs="24" :md="12">
                <el-form-item label="加密策略">
                  <el-select v-model="settings.encryption" class="full-width">
                    <el-option
                      v-for="option in encryptionOptions"
                      :key="option.value"
                      :label="option.label"
                      :value="option.value"
                    />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :xs="24" :md="12">
                <el-form-item label="端口连通性">
                  <div class="port-test">
                    <el-button size="small" :loading="testingPort" @click="handleTestPort">
                      测试端口
                    </el-button>
                    <el-tag
                      v-if="portTestResult !== null"
                      :type="portTestResult ? 'success' : 'danger'"
                      effect="plain"
                      size="small"
                    >
                      {{ portTestResult ? '端口开放' : '端口关闭' }}
                    </el-tag>
                  </div>
                </el-form-item>
              </el-col>
            </el-row>
          </el-form>
        </el-tab-pane>

        <!-- 协议支持 -->
        <el-tab-pane label="协议支持" name="protocol">
          <el-form
            v-loading="loading"
            :model="settings"
            :label-position="formLabelPosition"
            :label-width="formLabelWidth"
            size="small"
            class="compact-form"
          >
            <el-row :gutter="16">
              <el-col :xs="12" :md="6">
                <el-form-item label="DHT">
                  <el-switch v-model="settings['dht-enabled']" />
                </el-form-item>
              </el-col>
              <el-col :xs="12" :md="6">
                <el-form-item label="PEX">
                  <el-switch v-model="settings['pex-enabled']" />
                </el-form-item>
              </el-col>
              <el-col :xs="12" :md="6">
                <el-form-item label="LPD">
                  <el-switch v-model="settings['lpd-enabled']" />
                </el-form-item>
              </el-col>
              <el-col :xs="12" :md="6">
                <el-form-item label="uTP">
                  <el-switch v-model="settings['utp-enabled']" />
                </el-form-item>
              </el-col>
            </el-row>
          </el-form>
        </el-tab-pane>

        <!-- 队列管理 -->
        <el-tab-pane label="队列管理" name="queue">
          <el-form
            v-loading="loading"
            :model="settings"
            :label-position="formLabelPosition"
            :label-width="formLabelWidth"
            size="small"
            class="compact-form"
          >
            <el-row :gutter="16">
              <el-col :xs="24" :md="12">
                <el-form-item label="下载队列大小">
                  <div class="inline-row">
                    <el-switch v-model="settings['download-queue-enabled']" />
                    <el-input-number
                      v-model="settings['download-queue-size']"
                      :disabled="!settings['download-queue-enabled']"
                      :min="0"
                      class="inline-input"
                    />
                  </div>
                </el-form-item>
              </el-col>
              <el-col :xs="24" :md="12">
                <el-form-item label="做种队列大小">
                  <div class="inline-row">
                    <el-switch v-model="settings['seed-queue-enabled']" />
                    <el-input-number
                      v-model="settings['seed-queue-size']"
                      :disabled="!settings['seed-queue-enabled']"
                      :min="0"
                      class="inline-input"
                    />
                  </div>
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="16">
              <el-col :xs="24" :md="12">
                <el-form-item label="检测卡住任务">
                  <el-switch v-model="settings['queue-stalled-enabled']" />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :md="12">
                <el-form-item label="卡住最小分钟">
                  <el-input-number v-model="settings['queue-stalled-minutes']" :min="0" class="full-width" />
                </el-form-item>
              </el-col>
            </el-row>
          </el-form>
        </el-tab-pane>

        <!-- RPC 与访问控制 -->
        <el-tab-pane label="RPC 配置" name="rpc">
          <el-form
            v-loading="loading"
            :model="settings"
            :label-position="formLabelPosition"
            :label-width="formLabelWidth"
            size="small"
            class="compact-form"
          >
            <el-row :gutter="16">
              <el-col :xs="24" :md="12">
                <el-form-item label="需要认证">
                  <el-switch v-model="settings['rpc-authentication-required']" />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :md="12">
                <el-form-item label="用户名">
                  <el-input v-model="settings['rpc-username']" />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="16">
              <el-col :xs="24" :md="12">
                <el-form-item label="启用白名单">
                  <el-switch v-model="settings['rpc-whitelist-enabled']" />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="16">
              <el-col :xs="24">
                <el-form-item label="访问白名单（逗号分隔）">
                  <el-input
                    v-model="settings['rpc-whitelist']"
                    type="textarea"
                    :rows="3"
                    placeholder="127.0.0.1,192.168.*.*"
                  />
                </el-form-item>
              </el-col>
            </el-row>
          </el-form>
        </el-tab-pane>

        <!-- 系统信息 -->
        <el-tab-pane label="系统信息" name="system">
          <el-form
            v-loading="loading"
            :model="settings"
            :label-position="formLabelPosition"
            :label-width="formLabelWidth"
            size="small"
            class="compact-form"
          >
            <el-row :gutter="16">
              <el-col :xs="24" :md="8">
                <el-form-item :label="`${backendLabel} 版本`">
                  <span class="readonly-value">{{ settings.version || '未知' }}</span>
                </el-form-item>
              </el-col>
              <el-col :xs="24" :md="8">
                <el-form-item label="RPC 版本">
                  <span class="readonly-value">{{ settings['rpc-version'] ?? '未知' }}</span>
                </el-form-item>
              </el-col>
              <el-col :xs="24" :md="8">
                <el-form-item label="RPC 最低版本">
                  <span class="readonly-value">{{ settings['rpc-version-minimum'] ?? '未知' }}</span>
                </el-form-item>
              </el-col>
            </el-row>
          </el-form>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <el-card v-else>
      <template #header>
        <span>{{ backendLabel }} 全局设置</span>
      </template>
      <p class="compat-hint">
        {{ backendLabel }} 正在使用兼容模式，仅展示核心只读信息。如需调整参数，请直接在 {{
          backendLabel
        }} 原生设置界面中处理。
      </p>
      <el-descriptions :column="1" border size="small">
        <el-descriptions-item
          v-for="item in readonlySettingItems"
          :key="item.label"
          :label="item.label"
        >
          {{ item.value }}
        </el-descriptions-item>
      </el-descriptions>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import * as api from '@/api/torrents'
import { isTransmission, torrentBackendName } from '@/config/torrentClient'
import type { SessionConfig } from '@/types/transmission'
import { useMediaQuery } from '@/utils/useMediaQuery'
import { exportConfig, importConfig, filterConfig } from '@/utils/configExportImport'

const loading = ref(false)
const settings = ref<Partial<SessionConfig>>({})
const activeTab = ref('download')
const isTransmissionClient = isTransmission
const backendLabel = torrentBackendName
const encryptionOptions = [
  { label: '需要 (required)', value: 'required' },
  { label: '优先 (preferred)', value: 'preferred' },
  { label: '允许明文 (tolerated)', value: 'tolerated' },
]
const dayOptions = [
  { label: '周一', value: 2 },
  { label: '周二', value: 4 },
  { label: '周三', value: 8 },
  { label: '周四', value: 16 },
  { label: '周五', value: 32 },
  { label: '周六', value: 64 },
  { label: '周日', value: 1 },
]
const testingPort = ref(false)
const portTestResult = ref<boolean | null>(null)

const isMobile = useMediaQuery('(max-width: 768px)')
const formLabelPosition = computed(() => (isMobile.value ? 'top' : 'left'))
const formLabelWidth = computed(() => (isMobile.value ? 'auto' : '120px'))

const editableFields: (keyof SessionConfig)[] = [
  'download-dir',
  'incomplete-dir',
  'incomplete-dir-enabled',
  'rename-partial-files',
  'start-added-torrents',
  'trash-original-torrent-files',
  'speed-limit-down',
  'speed-limit-down-enabled',
  'speed-limit-up',
  'speed-limit-up-enabled',
  'alt-speed-enabled',
  'alt-speed-down',
  'alt-speed-up',
  'alt-speed-time-begin',
  'alt-speed-time-enabled',
  'alt-speed-time-end',
  'alt-speed-time-day',
  'seedRatioLimited',
  'seedRatioLimit',
  'seedIdleLimited',
  'seedIdleLimit',
  'peer-limit-per-torrent',
  'peer-limit-global',
  'peer-port',
  'peer-port-random-on-start',
  'port-forwarding-enabled',
  'dht-enabled',
  'lpd-enabled',
  'pex-enabled',
  'utp-enabled',
  'encryption',
  'download-queue-size',
  'download-queue-enabled',
  'seed-queue-size',
  'seed-queue-enabled',
  'queue-stalled-enabled',
  'queue-stalled-minutes',
  'rpc-whitelist',
  'rpc-whitelist-enabled',
  'rpc-authentication-required',
  'rpc-username',
]

const minutesToTime = (minutes?: number) => {
  if (minutes === undefined) return '00:00'
  const mins = Math.max(0, Math.min(1439, minutes))
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

const timeToMinutes = (time: string) => {
  const [hStr = '0', mStr = '0'] = (time || '').split(':')
  const h = parseInt(hStr, 10)
  const m = parseInt(mStr, 10)
  if (Number.isNaN(h) || Number.isNaN(m)) return 0
  return h * 60 + m
}

const altSpeedBeginTime = computed({
  get: () => minutesToTime(settings.value['alt-speed-time-begin']),
  set: (value: string) => {
    settings.value['alt-speed-time-begin'] = timeToMinutes(value)
  },
})

const altSpeedEndTime = computed({
  get: () => minutesToTime(settings.value['alt-speed-time-end']),
  set: (value: string) => {
    settings.value['alt-speed-time-end'] = timeToMinutes(value)
  },
})

const altSpeedDays = computed({
  get: () => {
    const dayMask = settings.value['alt-speed-time-day'] ?? 0
    return dayOptions.filter((day) => (dayMask & day.value) !== 0).map((day) => day.value)
  },
  set: (values: number[]) => {
    settings.value['alt-speed-time-day'] = values.reduce((sum, val) => sum + val, 0)
  },
})

const loadSettings = async () => {
  loading.value = true
  try {
    const result = await api.getSession()
    settings.value = result
  } catch (error: any) {
    ElMessage.error(`加载失败: ${error.message}`)
  } finally {
    loading.value = false
  }
}

const saveSettings = async () => {
  if (!isTransmissionClient) {
    ElMessage.info(`${backendLabel} 设置请在服务器端或原生 Web UI 中修改`)
    return
  }
  loading.value = true
  try {
    const payload: Partial<SessionConfig> = {}
    editableFields.forEach((key) => {
      const value = settings.value[key]
      if (value !== undefined) {
        ;(payload as Record<string, any>)[key as string] = value
      }
    })
    await api.setSession(payload)
    ElMessage.success('保存成功')
    loadSettings()
  } catch (error: any) {
    ElMessage.error(`保存失败: ${error.message}`)
  } finally {
    loading.value = false
  }
}

const formatLimitText = (enabled?: boolean, value?: number) => {
  if (!enabled) return '未启用'
  return `${value ?? 0} KB/s`
}

const readonlySettingItems = computed(() => [
  { label: '下载目录', value: settings.value['download-dir'] || '—' },
  { label: '未完成目录', value: settings.value['incomplete-dir'] || '—' },
  {
    label: '下载限速',
    value: formatLimitText(
      settings.value['speed-limit-down-enabled'],
      settings.value['speed-limit-down']
    ),
  },
  {
    label: '上传限速',
    value: formatLimitText(
      settings.value['speed-limit-up-enabled'],
      settings.value['speed-limit-up']
    ),
  },
  { label: 'Peer 端口', value: settings.value['peer-port'] || '—' },
  { label: '客户端版本', value: settings.value.version || backendLabel },
])

const handleTestPort = async () => {
  testingPort.value = true
  try {
    const result = await api.testPort()
    portTestResult.value = result['port-is-open']
    if (result['port-is-open']) {
      ElMessage.success('端口开放，可以接受外部连接')
    } else {
      ElMessage.warning('端口未开放，请检查路由或防火墙')
    }
  } catch (error: any) {
    portTestResult.value = null
    ElMessage.error(`测试失败: ${error.message || error}`)
  } finally {
    testingPort.value = false
  }
}

/**
 * 导出当前配置
 */
const exportSettings = () => {
  try {
    // 提取可编辑字段的配置
    const config: Record<string, any> = {}
    editableFields.forEach((key) => {
      const value = settings.value[key]
      if (value !== undefined) {
        config[key as string] = value
      }
    })

    // 添加元数据
    const exportData = {
      _metadata: {
        exportTime: new Date().toISOString(),
        client: 'Transmission',
        version: settings.value.version || 'unknown',
      },
      config,
    }

    // 生成文件名：transmission-config-YYYYMMDD-HHMMSS.json
    const now = new Date()
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '')
    const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, '')
    const filename = `transmission-config-${dateStr}-${timeStr}`

    exportConfig(exportData, filename)
    ElMessage.success('配置已导出')
  } catch (error: any) {
    ElMessage.error(`导出失败: ${error.message || '未知错误'}`)
  }
}

/**
 * 导入配置
 */
const importSettings = async () => {
  try {
    const data = await importConfig()

    // 验证数据格式
    if (!data.config || typeof data.config !== 'object') {
      ElMessage.error('配置文件格式无效')
      return
    }

    // 过滤并验证配置
    const importedConfig = filterConfig<SessionConfig>(data.config, editableFields)

    // 确认导入
    await ElMessageBox.confirm(
      `即将导入配置，这将覆盖当前设置。是否继续？`,
      '确认导入',
      {
        confirmButtonText: '导入',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )

    // 应用配置
    Object.assign(settings.value, importedConfig)

    ElMessage.success('配置已导入，请点击"保存设置"以应用')
  } catch (error: any) {
    // 用户取消不显示错误
    if (error.message && !error.message.includes('取消')) {
      ElMessage.error(`导入失败: ${error.message || '未知错误'}`)
    }
  }
}

onMounted(() => {
  loadSettings()
})
</script>

<style scoped>
.settings-view {
  padding: 20px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.settings-tabs {
  margin-top: -12px;
}

.settings-tabs :deep(.el-tabs__content) {
  padding-top: 16px;
}

.compact-form {
  max-width: 1200px;
}

.inline-row {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
}

.inline-input {
  flex: 1;
}

.full-width {
  width: 100%;
}

.readonly-value {
  color: var(--el-text-color-regular);
  font-size: 14px;
}

.compat-hint {
  margin-bottom: 16px;
  color: #606266;
  line-height: 1.6;
}

.port-test {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

@media (max-width: 768px) {
  .settings-view {
    padding: 12px;
  }

  .card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .header-actions {
    width: 100%;
  }

  .header-actions :deep(.el-button) {
    flex: 1;
  }

  .compact-form :deep(.el-form-item__label) {
    margin-bottom: 4px;
  }
}
</style>
