<template>
  <div class="settings-view">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>qBittorrent 全局设置</span>
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
              <el-col :xs="24" :md="12">
                <el-form-item label="添加时不自动开始下载">
                  <el-switch v-model="qbDontStartAuto" />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :md="12">
                <el-form-item label="为不完整的文件添加扩展名 .!qB">
                  <el-switch v-model="settings['rename-partial-files']" />
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
                <el-form-item label="开启备用速度限制">
                  <el-switch v-model="settings['alt-speed-enabled']" />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :md="12">
                <el-form-item label="开启备用速度限制定时启用">
                  <el-switch v-model="settings['alt-speed-time-enabled']" />
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
            <el-row v-if="settings['alt-speed-time-enabled']" :gutter="16">
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
                <el-form-item label="生效日期">
                  <el-select v-model="altSpeedScheduleDay" class="full-width">
                    <el-option
                      v-for="option in scheduleDayOptions"
                      :key="option.value"
                      :label="option.label"
                      :value="option.value"
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
                <el-form-item label="做种时间限制 (分钟)">
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
                <el-form-item label="全局连接数">
                  <el-input-number v-model="maxConnec" :min="1" class="full-width" />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :md="12">
                <el-form-item label="单种连接数">
                  <el-input-number v-model="maxConnecPerTorrent" :min="1" class="full-width" />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="16">
              <el-col :xs="24" :md="12">
                <el-form-item label="全局上传槽位">
                  <el-input-number v-model="maxUploads" :min="1" class="full-width" />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :md="12">
                <el-form-item label="单种上传槽位">
                  <el-input-number v-model="maxUploadsPerTorrent" :min="1" class="full-width" />
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
              <el-col :xs="24" :md="8">
                <el-form-item label="启用队列">
                  <el-switch v-model="queueingEnabled" />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :md="8">
                <el-form-item label="最大活动下载">
                  <el-input-number
                    v-model="maxActiveDownloads"
                    :disabled="!queueingEnabled"
                    :min="0"
                    class="full-width"
                  />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :md="8">
                <el-form-item label="最大活动上传">
                  <el-input-number
                    v-model="maxActiveUploads"
                    :disabled="!queueingEnabled"
                    :min="0"
                    class="full-width"
                  />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="16">
              <el-col :xs="24" :md="8">
                <el-form-item label="最大活动总数">
                  <el-input-number
                    v-model="maxActiveTorrents"
                    :disabled="!queueingEnabled"
                    :min="0"
                    class="full-width"
                  />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :md="8">
                <el-form-item label="排除慢速种子">
                  <el-switch v-model="dontCountSlowTorrents" :disabled="!queueingEnabled" />
                </el-form-item>
              </el-col>
            </el-row>
          </el-form>
        </el-tab-pane>

        <!-- WebUI 配置 -->
        <el-tab-pane label="WebUI 配置" name="webui">
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
                <el-form-item label="用户名">
                  <el-input v-model="webUiUsername" placeholder="admin" />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :md="12">
                <el-form-item label="密码">
                  <el-input
                    v-model="webUiPassword"
                    type="password"
                    placeholder="留空则不修改"
                    show-password
                  />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="16">
              <el-col :xs="24" :md="8">
                <el-form-item label="监听地址">
                  <el-input v-model="webUiAddress" placeholder="*" />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :md="8">
                <el-form-item label="监听端口">
                  <el-input-number v-model="webUiPort" :min="1" :max="65535" class="full-width" />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :md="8">
                <el-form-item label="会话超时(秒)">
                  <el-input-number v-model="webUiSessionTimeout" :min="0" class="full-width" />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="16">
              <el-col :xs="12" :md="6">
                <el-form-item label="本地跳过认证">
                  <el-switch v-model="bypassLocalAuth" />
                </el-form-item>
              </el-col>
              <el-col :xs="12" :md="6">
                <el-form-item label="CSRF 保护">
                  <el-switch v-model="webUiCsrfProtection" />
                </el-form-item>
              </el-col>
              <el-col :xs="12" :md="6">
                <el-form-item label="安全 Cookie">
                  <el-switch v-model="webUiSecureCookie" />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="16">
              <el-col :xs="24" :md="12">
                <el-form-item label="最大失败次数">
                  <el-input-number v-model="webUiMaxAuthFailCount" :min="0" class="full-width" />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :md="12">
                <el-form-item label="封禁时长(秒)">
                  <el-input-number v-model="webUiBanDuration" :min="0" class="full-width" />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="16">
              <el-col :xs="24">
                <el-form-item label="使用替代 WebUI">
                  <div class="inline-row">
                    <el-switch v-model="alternativeWebuiEnabled" />
                    <el-input
                      v-model="alternativeWebuiPath"
                      :disabled="!alternativeWebuiEnabled"
                      placeholder="/path/to/custom/webui"
                      class="inline-input"
                    />
                  </div>
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
              <el-col :xs="24" :md="12">
                <el-form-item label="qBittorrent 版本">
                  <span class="readonly-value">{{ settings.version || '未知' }}</span>
                </el-form-item>
              </el-col>
              <el-col :xs="24" :md="12">
                <el-form-item label="当前用户名">
                  <span class="readonly-value">{{ settings['rpc-username'] || '未知' }}</span>
                </el-form-item>
              </el-col>
            </el-row>
          </el-form>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import * as api from '@/api/torrents'
import type { SessionConfig } from '@/types/transmission'
import { useMediaQuery } from '@/utils/useMediaQuery'
import { exportConfig, importConfig, filterConfig } from '@/utils/configExportImport'

const loading = ref(false)
const settings = ref<Partial<SessionConfig>>({})
const activeTab = ref('download')
const encryptionOptions = [
  { label: '需要 (required)', value: 'required' },
  { label: '优先 (preferred)', value: 'preferred' },
  { label: '允许明文 (tolerated)', value: 'tolerated' },
]

const isMobile = useMediaQuery('(max-width: 768px)')
const formLabelPosition = computed(() => (isMobile.value ? 'top' : 'left'))
const formLabelWidth = computed(() => (isMobile.value ? 'auto' : '120px'))
const qbDontStartAuto = computed<boolean>({
  get: () => !(settings.value['start-added-torrents'] ?? true),
  set: (v) => {
    settings.value['start-added-torrents'] = !v
  }
})

// Connection & Port settings
const maxConnec = ref(0)
const maxConnecPerTorrent = ref(0)
const maxUploads = ref(0)
const maxUploadsPerTorrent = ref(0)

// Queue settings
const queueingEnabled = ref(false)
const maxActiveDownloads = ref(0)
const maxActiveUploads = ref(0)
const maxActiveTorrents = ref(0)
const dontCountSlowTorrents = ref(false)

// WebUI settings
const webUiUsername = ref('')
const webUiPassword = ref('')
const webUiAddress = ref('*')
const webUiPort = ref(8080)
const webUiSessionTimeout = ref(3600)
const bypassLocalAuth = ref(false)
const webUiCsrfProtection = ref(true)
const webUiSecureCookie = ref(false)
const webUiMaxAuthFailCount = ref(5)
const webUiBanDuration = ref(3600)
const alternativeWebuiEnabled = ref(false)
const alternativeWebuiPath = ref('')

const scheduleDayOptions = [
  { label: '每天', value: 0 },
  { label: '工作日', value: 1 },
  { label: '周末', value: 2 },
  { label: '周一', value: 3 },
  { label: '周二', value: 4 },
  { label: '周三', value: 5 },
  { label: '周四', value: 6 },
  { label: '周五', value: 7 },
  { label: '周六', value: 8 },
  { label: '周日', value: 9 },
]

const editableFields: (keyof SessionConfig)[] = [
  'download-dir',
  'incomplete-dir',
  'incomplete-dir-enabled',
  'rename-partial-files',
  'start-added-torrents',
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

const qbDaysToMask = (days?: number) => {
  switch (days) {
    case 0: return 127
    case 1: return 62
    case 2: return 65
    case 3: return 2
    case 4: return 4
    case 5: return 8
    case 6: return 16
    case 7: return 32
    case 8: return 64
    case 9: return 1
    default: return 0
  }
}

const maskToQbDays = (mask?: number) => {
  const v = mask || 0
  if (v === 127) return 0
  if (v === 62) return 1
  if (v === 65) return 2
  if (v === 2) return 3
  if (v === 4) return 4
  if (v === 8) return 5
  if (v === 16) return 6
  if (v === 32) return 7
  if (v === 64) return 8
  if (v === 1) return 9
  return 0
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

const altSpeedScheduleDay = computed({
  get: () => maskToQbDays(settings.value['alt-speed-time-day']),
  set: (value: number) => {
    settings.value['alt-speed-time-day'] = qbDaysToMask(value)
  },
})

const loadSettings = async () => {
  loading.value = true
  try {
    const sessionData = await api.getSession()
    settings.value = sessionData

    // Map additional qBittorrent-specific settings
    maxConnec.value = sessionData['peer-limit-global'] || 0
    maxConnecPerTorrent.value = sessionData['peer-limit-per-torrent'] || 0
    maxUploads.value = sessionData['upload-slots-global'] || 0
    maxUploadsPerTorrent.value = sessionData['upload-slots-per-torrent'] || 0

    queueingEnabled.value = sessionData['queue-stalled-enabled'] || false
    maxActiveDownloads.value = sessionData['download-queue-size'] || 0
    maxActiveUploads.value = sessionData['seed-queue-size'] || 0
    maxActiveTorrents.value = sessionData['max-active-torrents'] || 0
    dontCountSlowTorrents.value = sessionData['dont-count-slow-torrents'] || false

    webUiUsername.value = sessionData['web-ui-username'] || ''
    webUiPassword.value = ''
    webUiAddress.value = sessionData['web-ui-address'] || '*'
    webUiPort.value = sessionData['web-ui-port'] || 8080
    webUiSessionTimeout.value = sessionData['web-ui-session-timeout'] || 3600
    bypassLocalAuth.value = sessionData['bypass-local-auth'] || false
    webUiCsrfProtection.value = sessionData['web-ui-csrf-protection'] !== false
    webUiSecureCookie.value = sessionData['web-ui-secure-cookie'] || false
    webUiMaxAuthFailCount.value = sessionData['web-ui-max-auth-fail-count'] || 5
    webUiBanDuration.value = sessionData['web-ui-ban-duration'] || 3600
    alternativeWebuiEnabled.value = sessionData['alternative-webui-enabled'] || false
    alternativeWebuiPath.value = sessionData['alternative-webui-path'] || ''

    // Fallback enable logic for speed limits
    const s = settings.value
    s['speed-limit-up-enabled'] = (!!s['speed-limit-up-enabled']) || ((s['speed-limit-up'] || 0) > 0)
    s['speed-limit-down-enabled'] = (!!s['speed-limit-down-enabled']) || ((s['speed-limit-down'] || 0) > 0)
  } catch (error: any) {
    ElMessage.error(`加载设置失败: ${error.message}`)
  } finally {
    loading.value = false
  }
}

const saveSettings = async () => {
  loading.value = true
  try {
    const updates: Partial<SessionConfig> = {}
    const savedStartAdded = settings.value['start-added-torrents']
    const s = settings.value

    if (s['speed-limit-up-enabled'] === false && (s['speed-limit-up'] || 0) > 0) {
      s['speed-limit-up'] = 0
    }
    if (s['speed-limit-down-enabled'] === false && (s['speed-limit-down'] || 0) > 0) {
      s['speed-limit-down'] = 0
    }

    // Save basic editable fields
    editableFields.forEach((key) => {
      if (key in settings.value) {
        updates[key] = settings.value[key] as any
      }
    })

    // Add connection & upload slot settings
    updates['peer-limit-global'] = maxConnec.value
    updates['peer-limit-per-torrent'] = maxConnecPerTorrent.value
    updates['upload-slots-global'] = maxUploads.value
    updates['upload-slots-per-torrent'] = maxUploadsPerTorrent.value

    // Add queue settings
    updates['queue-stalled-enabled'] = queueingEnabled.value
    updates['download-queue-size'] = maxActiveDownloads.value
    updates['seed-queue-size'] = maxActiveUploads.value
    updates['max-active-torrents'] = maxActiveTorrents.value
    updates['dont-count-slow-torrents'] = dontCountSlowTorrents.value

    // Add WebUI settings
    updates['web-ui-username'] = webUiUsername.value
    if (webUiPassword.value) {
      updates['web-ui-password'] = webUiPassword.value
    }
    updates['web-ui-address'] = webUiAddress.value
    updates['web-ui-port'] = webUiPort.value
    updates['web-ui-session-timeout'] = webUiSessionTimeout.value
    updates['bypass-local-auth'] = bypassLocalAuth.value
    updates['web-ui-csrf-protection'] = webUiCsrfProtection.value
    updates['web-ui-secure-cookie'] = webUiSecureCookie.value
    updates['web-ui-max-auth-fail-count'] = webUiMaxAuthFailCount.value
    updates['web-ui-ban-duration'] = webUiBanDuration.value
    updates['alternative-webui-enabled'] = alternativeWebuiEnabled.value
    updates['alternative-webui-path'] = alternativeWebuiPath.value

    await api.setSession(updates)
    ElMessage.success('设置已保存')
    await loadSettings()
    if (typeof savedStartAdded === 'boolean') {
      settings.value['start-added-torrents'] = savedStartAdded
    }
  } catch (error: any) {
    ElMessage.error(`保存设置失败: ${error.message}`)
  } finally {
    loading.value = false
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
        client: 'qBittorrent',
        version: settings.value.version || 'unknown',
      },
      config,
    }

    // 生成文件名：qbittorrent-config-YYYYMMDD-HHMMSS.json
    const now = new Date()
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '')
    const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, '')
    const filename = `qbittorrent-config-${dateStr}-${timeStr}`

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
