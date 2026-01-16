<template>
  <div class="settings-view">
    <el-card v-if="isTransmissionClient">
      <template #header>
        <div class="card-header">
          <span>{{ t('settings.transmission.globalSettings') }}</span>
          <div class="header-actions">
            <el-button type="primary" size="small" @click="saveSettings">{{ t('settings.transmission.saveSettings') }}</el-button>
            <el-button size="small" @click="loadSettings">{{ t('common.reset') }}</el-button>
            <el-button size="small" @click="exportSettings">{{ t('settings.transmission.exportConfig') }}</el-button>
            <el-button size="small" @click="importSettings">{{ t('settings.transmission.importConfig') }}</el-button>
          </div>
        </div>
      </template>

      <el-tabs v-model="activeTab" class="settings-tabs">
        <!-- 下载与文件 -->
        <el-tab-pane :label="t('settings.transmission.downloadAndFiles')" name="download">
          <el-form
            v-loading="loading"
            :model="settings"
            :label-position="formLabelPosition"
            :label-width="formLabelWidth"
            size="small"
            class="compact-form"
          >
            <el-divider content-position="left">{{ t('settings.transmission.savePath') }}</el-divider>
            <el-row :gutter="16">
              <el-col :xs="24" :md="12">
                <el-form-item :label="t('settings.transmission.defaultSaveDir')">
                  <el-input v-model="settings['download-dir']" />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :md="12">
                <el-form-item :label="t('settings.transmission.enableIncompleteDir')">
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
            <el-divider content-position="left">{{ t('settings.transmission.addBehaviorAndExtension') }}</el-divider>
            <el-row :gutter="16">
              <el-col :xs="24" :md="8">
                <el-form-item :label="t('settings.transmission.autoStartNewTorrents')">
                  <el-switch v-model="settings['start-added-torrents']" />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :md="8">
                <el-form-item :label="t('settings.transmission.renamePartialFiles')">
                  <el-switch v-model="settings['rename-partial-files']" />
                </el-form-item>
              </el-col>
            </el-row>
          </el-form>
        </el-tab-pane>

        <!-- 速度限制 -->
        <el-tab-pane :label="t('settings.transmission.speedLimit')" name="speed">
          <el-form
            v-loading="loading"
            :model="settings"
            :label-position="formLabelPosition"
            :label-width="formLabelWidth"
            size="small"
            class="compact-form"
          >
            <el-divider content-position="left">{{ t('settings.transmission.globalSpeedLimit') }}</el-divider>
            <el-row :gutter="16">
              <el-col :xs="24" :md="12">
                <el-form-item :label="t('settings.transmission.enableMaxDownloadSpeed')">
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
                <el-form-item :label="t('settings.transmission.enableMaxUploadSpeed')">
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
            <el-divider content-position="left">{{ t('settings.transmission.altSpeedLimit') }}</el-divider>
            <el-row :gutter="16">
              <el-col :xs="24" :md="12">
                <el-form-item :label="t('settings.transmission.altDownloadSpeed')">
                  <el-input-number v-model="settings['alt-speed-down']" :min="0" class="full-width" />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :md="12">
                <el-form-item :label="t('settings.transmission.altUploadSpeed')">
                  <el-input-number v-model="settings['alt-speed-up']" :min="0" class="full-width" />
                </el-form-item>
              </el-col>
            </el-row>
            <el-divider content-position="left">{{ t('settings.transmission.schedule') }}</el-divider>
            <el-row :gutter="16">
              <el-col :xs="24" :md="8">
                <el-form-item :label="t('settings.transmission.enableAltSpeed')">
                  <el-switch v-model="settings['alt-speed-enabled']" />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :md="8">
                <el-form-item :label="t('settings.transmission.altSpeedSchedule')">
                  <el-switch v-model="settings['alt-speed-time-enabled']" />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="16" v-if="settings['alt-speed-time-enabled']">
              <el-col :xs="24" :md="8">
                <el-form-item :label="t('settings.transmission.startTime')">
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
                <el-form-item :label="t('settings.transmission.endTime')">
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
                <el-form-item :label="t('settings.transmission.effectiveDays')">
                  <el-select
                    v-model="altSpeedDays"
                    multiple
                    collapse-tags
                    :placeholder="t('settings.transmission.selectDays')"
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
            <el-divider content-position="left">{{ t('settings.transmission.seedRatioAndLimit') }}</el-divider>
            <el-row :gutter="16">
              <el-col :xs="24" :md="12">
                <el-form-item :label="t('settings.transmission.stopSeedingAtRatio')">
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
                <el-form-item :label="t('settings.transmission.stopSeedingWhenIdle')">
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
        <el-tab-pane :label="t('settings.transmission.connectionAndPort')" name="connection">
          <el-form
            v-loading="loading"
            :model="settings"
            :label-position="formLabelPosition"
            :label-width="formLabelWidth"
            size="small"
            class="compact-form"
          >
            <el-divider content-position="left">{{ t('settings.transmission.portAndMapping') }}</el-divider>
            <el-row :gutter="16">
              <el-col :xs="24" :md="8">
                <el-form-item :label="t('settings.transmission.peerFixedPort')">
                  <el-input-number v-model="settings['peer-port']" :min="1" :max="65535" class="full-width" />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :md="8">
                <el-form-item :label="t('settings.transmission.portConnectivity')">
                  <div class="port-test">
                    <el-button size="small" :loading="testingPort" @click="handleTestPort">
                      {{ t('settings.transmission.testPort') }}
                    </el-button>
                    <el-tag
                      v-if="portTestResult !== null"
                      :type="portTestResult ? 'success' : 'danger'"
                      effect="plain"
                      size="small"
                    >
                      {{ portTestResult ? t('settings.transmission.portOpenStatus') : t('settings.transmission.portClosedStatus') }}
                    </el-tag>
                  </div>
                </el-form-item>
              </el-col>
              <el-col :xs="24" :md="8">
                <el-form-item :label="t('settings.transmission.portMapping')">
                  <el-switch v-model="settings['port-forwarding-enabled']" />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="16">
              <el-col :xs="24" :md="8">
                <el-form-item :label="t('settings.transmission.randomPortOnStart')">
                  <el-switch v-model="settings['peer-port-random-on-start']" />
                </el-form-item>
              </el-col>
            </el-row>
            <el-divider content-position="left">{{ t('settings.transmission.connectionLimitAndEncryption') }}</el-divider>
            <el-row :gutter="16">
              <el-col :xs="24" :md="12">
                <el-form-item :label="t('settings.transmission.globalPeerLimit')">
                  <el-input-number v-model="settings['peer-limit-global']" :min="1" class="full-width" />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :md="12">
                <el-form-item :label="t('settings.transmission.perTorrentPeerLimit')">
                  <el-input-number v-model="settings['peer-limit-per-torrent']" :min="1" class="full-width" />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="16">
              <el-col :xs="24" :md="12">
                <el-form-item :label="t('settings.transmission.encryptionPolicy')">
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
        <el-tab-pane :label="t('settings.transmission.protocolSupport')" name="protocol">
          <el-form
            v-loading="loading"
            :model="settings"
            :label-position="formLabelPosition"
            :label-width="formLabelWidth"
            size="small"
            class="compact-form"
          >
            <el-divider content-position="left">{{ t('settings.transmission.peerDiscoveryAndExchange') }}</el-divider>
            <el-row :gutter="16">
              <el-col :xs="12" :md="6">
                <el-form-item :label="t('settings.transmission.enableDHT')">
                  <el-switch v-model="settings['dht-enabled']" />
                </el-form-item>
              </el-col>
              <el-col :xs="12" :md="6">
                <el-form-item :label="t('settings.transmission.enablePEX')">
                  <el-switch v-model="settings['pex-enabled']" />
                </el-form-item>
              </el-col>
              <el-col :xs="12" :md="6">
                <el-form-item :label="t('settings.transmission.enableLPD')">
                  <el-switch v-model="settings['lpd-enabled']" />
                </el-form-item>
              </el-col>
              <el-col :xs="12" :md="6">
                <el-form-item :label="t('settings.transmission.enableUTP')">
                  <el-switch v-model="settings['utp-enabled']" />
                </el-form-item>
              </el-col>
            </el-row>
          </el-form>
        </el-tab-pane>

        <!-- 队列管理 -->
        <el-tab-pane :label="t('settings.transmission.queueManagement')" name="queue">
          <el-form
            v-loading="loading"
            :model="settings"
            :label-position="formLabelPosition"
            :label-width="formLabelWidth"
            size="small"
            class="compact-form"
          >
            <el-divider content-position="left">{{ t('settings.transmission.queueLimit') }}</el-divider>
            <el-row :gutter="16">
              <el-col :xs="24" :md="12">
                <el-form-item :label="t('settings.transmission.enableDownloadQueue')">
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
                <el-form-item :label="t('settings.transmission.enableSeedQueue')">
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
            <el-divider content-position="left">{{ t('settings.transmission.stalledTaskDetection') }}</el-divider>
            <el-row :gutter="16">
              <el-col :xs="24" :md="12">
                <el-form-item :label="t('settings.transmission.detectStalledTasks')">
                  <el-switch v-model="settings['queue-stalled-enabled']" />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :md="12">
                <el-form-item :label="t('settings.transmission.stalledMinutes')">
                  <el-input-number v-model="settings['queue-stalled-minutes']" :min="0" class="full-width" />
                </el-form-item>
              </el-col>
            </el-row>
          </el-form>
        </el-tab-pane>

        <!-- RPC 与访问控制 -->
        <el-tab-pane :label="t('settings.transmission.rpcConfig')" name="rpc">
          <el-form
            v-loading="loading"
            :model="settings"
            :label-position="formLabelPosition"
            :label-width="formLabelWidth"
            size="small"
            class="compact-form"
          >
            <el-divider content-position="left">{{ t('settings.transmission.authentication') }}</el-divider>
            <el-row :gutter="16">
              <el-col :xs="24" :md="12">
                <el-form-item :label="t('settings.transmission.requireAuth')">
                  <el-switch v-model="settings['rpc-authentication-required']" />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :md="12">
                <el-form-item :label="t('settings.transmission.username')">
                  <el-input v-model="settings['rpc-username']" />
                </el-form-item>
              </el-col>
            </el-row>
            <el-divider content-position="left">{{ t('settings.transmission.whitelist') }}</el-divider>
            <el-row :gutter="16">
              <el-col :xs="24" :md="12">
                <el-form-item :label="t('settings.transmission.enableWhitelist')">
                  <el-switch v-model="settings['rpc-whitelist-enabled']" />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="16">
              <el-col :xs="24">
                <el-form-item :label="t('settings.transmission.whitelistAddresses')">
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
        <el-tab-pane :label="t('settings.transmission.systemInfo')" name="system">
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
                <el-form-item :label="t('settings.transmission.backendVersion', { backend: backendLabel })">
                  <span class="readonly-value">{{ settings.version || t('common.unknown') }}</span>
                </el-form-item>
              </el-col>
              <el-col :xs="24" :md="8">
                <el-form-item :label="t('settings.transmission.rpcVersion')">
                  <span class="readonly-value">{{ settings['rpc-version'] ?? t('common.unknown') }}</span>
                </el-form-item>
              </el-col>
              <el-col :xs="24" :md="8">
                <el-form-item :label="t('settings.transmission.rpcMinVersion')">
                  <span class="readonly-value">{{ settings['rpc-version-minimum'] ?? t('common.unknown') }}</span>
                </el-form-item>
              </el-col>
            </el-row>
          </el-form>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <el-card v-else>
      <template #header>
        <span>{{ t('settings.transmission.backendGlobalSettings', { backend: backendLabel }) }}</span>
      </template>
      <p class="compat-hint">
        {{ t('settings.transmission.compatModeHint', { backend: backendLabel }) }}
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
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const loading = ref(false)
const settings = ref<Partial<SessionConfig>>({})
const activeTab = ref('download')
const isTransmissionClient = isTransmission
const backendLabel = torrentBackendName
const encryptionOptions = computed(() => [
  { label: t('settings.transmission.encryptionRequired'), value: 'required' },
  { label: t('settings.transmission.encryptionPreferred'), value: 'preferred' },
  { label: t('settings.transmission.encryptionTolerated'), value: 'tolerated' },
])
const dayOptions = computed(() => [
  { label: t('settings.transmission.monday'), value: 2 },
  { label: t('settings.transmission.tuesday'), value: 4 },
  { label: t('settings.transmission.wednesday'), value: 8 },
  { label: t('settings.transmission.thursday'), value: 16 },
  { label: t('settings.transmission.friday'), value: 32 },
  { label: t('settings.transmission.saturday'), value: 64 },
  { label: t('settings.transmission.sunday'), value: 1 },
])
const testingPort = ref(false)
const portTestResult = ref<boolean | null>(null)

const isMobile = useMediaQuery('(max-width: 768px)')
const formLabelPosition = computed(() => (isMobile.value ? 'top' : 'left'))
const formLabelWidth = computed(() => (isMobile.value ? 'auto' : '220px'))

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
    return dayOptions.value.filter((day) => (dayMask & day.value) !== 0).map((day) => day.value)
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
    ElMessage.error(`${t('settings.transmission.loadFailed')}: ${error.message}`)
  } finally {
    loading.value = false
  }
}

const saveSettings = async () => {
  if (!isTransmissionClient) {
    ElMessage.info(t('settings.transmission.modifyOnServer', { backend: backendLabel }))
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
    ElMessage.success(t('settings.transmission.saveSuccess'))
    loadSettings()
  } catch (error: any) {
    ElMessage.error(`${t('settings.transmission.saveFailed')}: ${error.message}`)
  } finally {
    loading.value = false
  }
}

const formatLimitText = (enabled?: boolean, value?: number) => {
  if (!enabled) return t('common.disabled')
  return `${value ?? 0} KB/s`
}

const readonlySettingItems = computed(() => [
  { label: t('settings.transmission.downloadDir'), value: settings.value['download-dir'] || '—' },
  { label: t('settings.transmission.incompleteDir'), value: settings.value['incomplete-dir'] || '—' },
  {
    label: t('settings.transmission.downloadLimit'),
    value: formatLimitText(
      settings.value['speed-limit-down-enabled'],
      settings.value['speed-limit-down']
    ),
  },
  {
    label: t('settings.transmission.uploadLimit'),
    value: formatLimitText(
      settings.value['speed-limit-up-enabled'],
      settings.value['speed-limit-up']
    ),
  },
  { label: t('settings.transmission.peerPort'), value: settings.value['peer-port'] || '—' },
  { label: t('settings.transmission.clientVersion'), value: settings.value.version || backendLabel },
])

const handleTestPort = async () => {
  testingPort.value = true
  try {
    const result = await api.testPort()
    portTestResult.value = result['port-is-open']
    if (result['port-is-open']) {
      ElMessage.success(t('settings.transmission.portOpen'))
    } else {
      ElMessage.warning(t('settings.transmission.portClosed'))
    }
  } catch (error: any) {
    portTestResult.value = null
    ElMessage.error(`${t('settings.transmission.testFailed')}: ${error.message || error}`)
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
    ElMessage.success(t('settings.transmission.configExported'))
  } catch (error: any) {
    ElMessage.error(`${t('settings.transmission.exportFailed')}: ${error.message || t('common.unknown')}`)
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
      ElMessage.error(t('settings.transmission.invalidConfigFormat'))
      return
    }

    // 过滤并验证配置
    const importedConfig = filterConfig<SessionConfig>(data.config, editableFields)

    // 确认导入
    await ElMessageBox.confirm(
      t('settings.transmission.importConfirm'),
      t('settings.transmission.confirmImportTitle'),
      {
        confirmButtonText: t('settings.transmission.import'),
        cancelButtonText: t('common.cancel'),
        type: 'warning',
      }
    )

    // 应用配置
    Object.assign(settings.value, importedConfig)

    ElMessage.success(t('settings.transmission.configImported'))
  } catch (error: any) {
    // 用户取消不显示错误
    if (error.message && !error.message.includes('取消')) {
      ElMessage.error(`${t('settings.transmission.importFailed')}: ${error.message || t('common.unknown')}`)
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

.compact-form :deep(.el-col) {
  flex: 0 0 100%;
  max-width: 100%;
  width: 100%;
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
