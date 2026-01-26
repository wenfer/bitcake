<template>
  <div class="strategy-view">
    <div class="toolbar">
      <div class="actions-group">
        <el-button type="primary" :icon="Plus" @click="showCreateDialog">
          {{ t('speedStrategy.createStrategy') }}
        </el-button>
        <el-button :icon="Refresh" @click="loadStrategies">{{ t('speedStrategy.refresh') }}</el-button>
        <el-button :icon="Download" @click="handleExport">{{ t('speedStrategy.exportStrategy') }}</el-button>
        <el-button :icon="Upload" @click="showImportDialog = true">{{ t('speedStrategy.importStrategy') }}</el-button>
      </div>
    </div>

    <div class="table-container">
      <el-table
        v-loading="loading"
        :data="strategies"
        stripe
        border
        style="width: 100%"
      >
        <el-table-column prop="name" :label="t('speedStrategy.strategyName')" min-width="150" />
        <el-table-column prop="description" :label="t('speedStrategy.description')" min-width="200" show-overflow-tooltip />
        <el-table-column :label="t('speedStrategy.downloadLimit')" min-width="120">
          <template #default="{ row }">
            <span v-if="row.downloadLimited">
              {{ row.downloadLimit }} {{ row.downloadUnit }}/s
            </span>
            <span v-else class="text-muted">{{ t('speedStrategy.noLimit') }}</span>
          </template>
        </el-table-column>
        <el-table-column :label="t('speedStrategy.uploadLimit')" min-width="120">
          <template #default="{ row }">
            <span v-if="row.uploadLimited">
              {{ row.uploadLimit }} {{ row.uploadUnit }}/s
            </span>
            <span v-else class="text-muted">{{ t('speedStrategy.noLimit') }}</span>
          </template>
        </el-table-column>
        <el-table-column :label="t('speedStrategy.applyScope')" min-width="150">
          <template #default="{ row }">
            <span v-if="row.trackers.length === 0">{{ t('speedStrategy.allTorrents') }}</span>
            <el-tooltip v-else :content="row.trackers.join(', ')" placement="top" :show-after="300">
              <span class="scope-text">{{ row.trackers.join(', ') }}</span>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column :label="t('speedStrategy.createdAt')" width="180">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column :label="t('speedStrategy.operation')" width="220" fixed="right">
          <template #default="{ row }">
            <el-button
              type="primary"
              size="small"
              :loading="applyingStrategy === row.id"
              @click="handleApply(row)"
            >
              {{ t('speedStrategy.apply') }}
            </el-button>
            <el-button size="small" @click="handleEdit(row)">{{ t('speedStrategy.edit') }}</el-button>
            <el-button
              type="danger"
              size="small"
              @click="handleDelete(row)"
            >
              {{ t('speedStrategy.delete') }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-empty v-if="strategies.length === 0 && !loading" :description="t('speedStrategy.noStrategy')" />
    </div>

    <!-- 创建/编辑策略对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogMode === 'create' ? t('speedStrategy.createStrategy') : t('speedStrategy.editStrategy')"
      :width="dialogWidth"
      @close="handleDialogClose"
    >
      <el-form :model="form" :rules="formRules" ref="formRef" label-width="100px">
        <el-form-item :label="t('speedStrategy.strategyName')" prop="name" required>
          <el-input v-model="form.name" :placeholder="t('speedStrategy.strategyNamePlaceholder')" />
        </el-form-item>
        <el-form-item :label="t('speedStrategy.description')">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="2"
            :placeholder="t('speedStrategy.descriptionPlaceholder')"
          />
        </el-form-item>
        <el-form-item :label="t('speedStrategy.downloadLimit')">
          <div class="limit-row">
            <el-switch v-model="form.downloadLimited" class="limit-switch" />
            <el-input-number
              v-model="form.downloadLimit"
              :min="0"
              :max="1000000"
              :disabled="!form.downloadLimited"
              controls-position="right"
              class="limit-input"
            />
            <el-select
              v-model="form.downloadUnit"
              :disabled="!form.downloadLimited"
              class="limit-unit-select"
            >
              <el-option label="KB/s" value="KB" />
              <el-option label="MB/s" value="MB" />
            </el-select>
          </div>
        </el-form-item>
        <el-form-item :label="t('speedStrategy.uploadLimit')">
          <div class="limit-row">
            <el-switch v-model="form.uploadLimited" class="limit-switch" />
            <el-input-number
              v-model="form.uploadLimit"
              :min="0"
              :max="1000000"
              :disabled="!form.uploadLimited"
              controls-position="right"
              class="limit-input"
            />
            <el-select
              v-model="form.uploadUnit"
              :disabled="!form.uploadLimited"
              class="limit-unit-select"
            >
              <el-option label="KB/s" value="KB" />
              <el-option label="MB/s" value="MB" />
            </el-select>
          </div>
        </el-form-item>
        <el-form-item :label="t('speedStrategy.applyScope')">
          <el-select
            v-model="form.trackers"
            multiple
            filterable
            allow-create
            default-first-option
            :placeholder="t('speedStrategy.applyScopePlaceholder')"
            style="width: 100%"
          >
            <el-option
              v-for="tracker in trackerOptions"
              :key="tracker.value"
              :label="tracker.label"
              :value="tracker.value"
            />
          </el-select>
          <div class="form-tip">
            {{ t('speedStrategy.applyScopeTip') }}
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">{{ t('common.cancel') }}</el-button>
        <el-button type="primary" :loading="saving" @click="handleSubmit">
          {{ dialogMode === 'create' ? t('speedStrategy.create') : t('common.save') }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 导入策略对话框 -->
    <el-dialog
      v-model="showImportDialog"
      :title="t('speedStrategy.importStrategyTitle')"
      :width="dialogWidth"
    >
      <el-input
        v-model="importData"
        type="textarea"
        :rows="10"
        :placeholder="t('speedStrategy.importDataPlaceholder')"
      />
      <template #footer>
        <el-button @click="showImportDialog = false">{{ t('common.cancel') }}</el-button>
        <el-button type="primary" @click="handleImport">{{ t('speedStrategy.import') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { Plus, Refresh, Download, Upload } from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import { useI18n } from 'vue-i18n'
import * as strategyService from '@/services/speedLimitStrategyService'
import type { SpeedLimitStrategy } from '@/types/speedLimitStrategy'
import * as api from '@/api/torrents'
import { getTrackerDisplayName } from '@/utils/torrent'
import { useMediaQuery } from '@/utils/useMediaQuery'

const { t } = useI18n()

const isMobile = useMediaQuery('(max-width: 768px)')
const dialogWidth = computed(() => (isMobile.value ? '95%' : '600px'))

const loading = ref(false)
const strategies = ref<SpeedLimitStrategy[]>([])
const dialogVisible = ref(false)
const dialogMode = ref<'create' | 'edit'>('create')
const saving = ref(false)
const applyingStrategy = ref<string | null>(null)
const formRef = ref<FormInstance>()
const currentEditId = ref<string>('')
const showImportDialog = ref(false)
const importData = ref('')

interface StrategyForm {
  name: string
  description: string
  downloadLimited: boolean
  downloadLimit: number
  downloadUnit: 'KB' | 'MB'
  uploadLimited: boolean
  uploadLimit: number
  uploadUnit: 'KB' | 'MB'
  trackers: string[]
}

const form = ref<StrategyForm>({
  name: '',
  description: '',
  downloadLimited: false,
  downloadLimit: 0,
  downloadUnit: 'KB',
  uploadLimited: false,
  uploadLimit: 0,
  uploadUnit: 'KB',
  trackers: [],
})

const formRules: FormRules = {
  name: [
    { required: true, message: t('speedStrategy.strategyNameRequired'), trigger: 'blur' },
    { min: 2, max: 50, message: t('speedStrategy.strategyNameLength'), trigger: 'blur' },
  ],
}

const trackerOptions = ref<Array<{ label: string; value: string }>>([])

// 加载所有种子，提取tracker选项
const loadTrackerOptions = async () => {
  try {
    const result = await api.getTorrents()
    const trackerMap = new Map<string, string>()
    result.torrents.forEach((torrent) => {
      torrent.trackers?.forEach((tracker) => {
        const displayName = getTrackerDisplayName(tracker.announce)
        trackerMap.set(displayName, displayName)
      })
    })
    trackerOptions.value = Array.from(trackerMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([displayName]) => ({ label: displayName, value: displayName }))
  } catch (error: any) {
    console.error(t('speedStrategy.loadTrackerFailed'), error)
  }
}

const loadStrategies = () => {
  loading.value = true
  try {
    strategies.value = strategyService.getAllStrategies()
  } finally {
    loading.value = false
  }
}

const resetForm = () => {
  form.value = {
    name: '',
    description: '',
    downloadLimited: false,
    downloadLimit: 0,
    downloadUnit: 'KB',
    uploadLimited: false,
    uploadLimit: 0,
    uploadUnit: 'KB',
    trackers: [],
  }
  formRef.value?.clearValidate()
}

const showCreateDialog = () => {
  dialogMode.value = 'create'
  resetForm()
  dialogVisible.value = true
}

const handleEdit = (strategy: SpeedLimitStrategy) => {
  dialogMode.value = 'edit'
  currentEditId.value = strategy.id
  form.value = {
    name: strategy.name,
    description: strategy.description || '',
    downloadLimited: strategy.downloadLimited,
    downloadLimit: strategy.downloadLimit,
    downloadUnit: strategy.downloadUnit,
    uploadLimited: strategy.uploadLimited,
    uploadLimit: strategy.uploadLimit,
    uploadUnit: strategy.uploadUnit,
    trackers: [...strategy.trackers],
  }
  dialogVisible.value = true
}

const handleSubmit = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (!valid) return

    saving.value = true
    try {
      if (dialogMode.value === 'create') {
        strategyService.createStrategy(form.value)
        ElMessage.success(t('speedStrategy.strategyCreated'))
      } else {
        strategyService.updateStrategy(currentEditId.value, form.value)
        ElMessage.success(t('speedStrategy.strategyUpdated'))
      }
      dialogVisible.value = false
      loadStrategies()
    } catch (error: any) {
      ElMessage.error(t('speedStrategy.operationFailed', { message: error.message }))
    } finally {
      saving.value = false
    }
  })
}

const handleDelete = async (strategy: SpeedLimitStrategy) => {
  try {
    await ElMessageBox.confirm(
      t('speedStrategy.deleteConfirm', { name: strategy.name }),
      t('common.tip'),
      {
        confirmButtonText: t('common.confirm'),
        cancelButtonText: t('common.cancel'),
        type: 'warning',
      }
    )

    const success = strategyService.deleteStrategy(strategy.id)
    if (success) {
      ElMessage.success(t('speedStrategy.deleteSuccess'))
      loadStrategies()
    } else {
      ElMessage.error(t('speedStrategy.deleteFailed'))
    }
  } catch (error) {
    // 用户取消
  }
}

const handleApply = async (strategy: SpeedLimitStrategy) => {
  applyingStrategy.value = strategy.id
  try {
    // 获取所有种子
    const result = await api.getTorrents()
    let targetTorrents = result.torrents

    // 如果指定了tracker，则筛选
    if (strategy.trackers.length > 0) {
      targetTorrents = targetTorrents.filter((torrent) =>
        torrent.trackers?.some((tracker) => {
          const displayName = getTrackerDisplayName(tracker.announce)
          return strategy.trackers.includes(displayName)
        })
      )
    }

    if (targetTorrents.length === 0) {
      ElMessage.warning(t('speedStrategy.noMatchingTorrents'))
      return
    }

    // 构建限速参数
    const payload: Record<string, any> = {
      downloadLimited: strategy.downloadLimited,
      uploadLimited: strategy.uploadLimited,
    }

    if (strategy.downloadLimited) {
      const downloadLimit =
        strategy.downloadUnit === 'MB'
          ? strategy.downloadLimit * 1024
          : strategy.downloadLimit
      payload.downloadLimit = Math.max(0, Math.round(downloadLimit))
    }

    if (strategy.uploadLimited) {
      const uploadLimit =
        strategy.uploadUnit === 'MB'
          ? strategy.uploadLimit * 1024
          : strategy.uploadLimit
      payload.uploadLimit = Math.max(0, Math.round(uploadLimit))
    }

    // 应用限速
    const targetIds = targetTorrents.map((t) => t.id)
    await api.setTorrents(targetIds, payload)

    ElMessage.success(
      t('speedStrategy.strategyApplied', { name: strategy.name, count: targetIds.length })
    )
  } catch (error: any) {
    ElMessage.error(t('speedStrategy.applyFailed', { message: error.message }))
  } finally {
    applyingStrategy.value = null
  }
}

const handleExport = () => {
  try {
    const data = strategyService.exportStrategies()
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `speed_limit_strategies_${dayjs().format('YYYYMMDD_HHmmss')}.json`
    link.click()
    URL.revokeObjectURL(url)
    ElMessage.success(t('speedStrategy.exportSuccess'))
  } catch (error: any) {
    ElMessage.error(t('speedStrategy.exportFailed', { message: error.message }))
  }
}

const handleImport = () => {
  if (!importData.value.trim()) {
    ElMessage.warning(t('speedStrategy.importDataRequired'))
    return
  }

  try {
    const success = strategyService.importStrategies(importData.value)
    if (success) {
      ElMessage.success(t('speedStrategy.importSuccess'))
      showImportDialog.value = false
      importData.value = ''
      loadStrategies()
    } else {
      ElMessage.error(t('speedStrategy.importInvalidData'))
    }
  } catch (error: any) {
    ElMessage.error(t('speedStrategy.importFailed', { message: error.message }))
  }
}

const handleDialogClose = () => {
  resetForm()
  currentEditId.value = ''
}

const formatDate = (timestamp: number): string => {
  return dayjs(timestamp).format('YYYY-MM-DD HH:mm:ss')
}

onMounted(() => {
  loadStrategies()
  loadTrackerOptions()
})
</script>

<style scoped>
.strategy-view {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.actions-group {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.table-container {
  flex: 1;
  overflow: auto;
  background: #fff;
  border-radius: 6px;
}

.scope-text {
  display: inline-block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #606266;
}

.limit-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.limit-switch {
  flex-shrink: 0;
  width: 50px;
}

.limit-input {
  width: 120px;
}

.limit-unit-select {
  width: 80px;
}

.form-tip {
  margin-top: 4px;
  font-size: 12px;
  color: #909399;
}

.text-muted {
  color: #909399;
}

@media (max-width: 768px) {
  .toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .actions-group {
    width: 100%;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  }
}
</style>
