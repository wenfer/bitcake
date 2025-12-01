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
        <el-button @click="openBatchLimitDialog">
          批量限速
        </el-button>
        <el-button @click="resetColumnWidths" title="重置所有列的宽度为默认值">
          重置列宽
        </el-button>
      </div>
      <el-button
        v-if="isMobile"
        class="filter-toggle"
        :icon="Filter"
        plain
        @click="toggleMobileFilters"
      >
        {{ showMobileFilters ? '收起筛选' : '展开筛选' }}
      </el-button>
    </div>

    <Transition name="fade">
      <div
        v-if="!isMobile || showMobileFilters"
        class="filter-submenu"
        :class="{ 'is-mobile': isMobile }"
      >
        <div class="submenu-section filter-controls">
          <el-select
            v-model="trackerFilter"
            placeholder="选择 Tracker"
            clearable
            filterable
            class="filter-select"
            @clear="trackerFilter = ''"
          >
            <el-option label="全部 Tracker" value="" />
            <el-option
              v-for="tracker in trackerOptions"
              :key="tracker.value"
              :label="tracker.label"
              :value="tracker.value"
            />
          </el-select>
          <el-select
            v-if="categoryOptions.length > 0"
            v-model="categoryFilter"
            placeholder="选择分类"
            clearable
            filterable
            class="filter-select"
            @clear="categoryFilter = ''"
          >
            <el-option label="全部分类" value="" />
            <el-option
              v-for="category in categoryOptions"
              :key="category.value"
              :label="category.label"
              :value="category.value"
            />
          </el-select>
          <el-input
            v-model="searchKeyword"
            placeholder="搜索种子..."
            :prefix-icon="Search"
            clearable
            class="filter-input"
          />
        </div>
        <div class="submenu-section update-info" v-if="lastFetchedAt">
          <span>数据更新时间：{{ lastFetchedAt }}</span>
        </div>
      </div>
    </Transition>

    <div class="table-container">
      <div class="table-scroll">
        <el-table
          ref="tableRef"
          v-loading="loading"
          :data="paginatedTorrents"
          stripe
          border
          style="width: 100%"
          row-key="id"
          :reserve-selection="true"
          @selection-change="handleSelectionChange"
          @sort-change="handleSortChange"
          @row-contextmenu="handleRowContextMenu"
          @header-dragend="handleColumnResize"
        >
          <el-table-column
            type="selection"
            column-key="selection"
            width="48"
            :resizable="false"
          />
          <el-table-column
            prop="name"
            column-key="name"
            label="名称"
            :width="getColumnWidth('name', isCompactTable ? 260 : 320)"
            :min-width="240"
            sortable="custom"
            show-overflow-tooltip
          />
          <el-table-column
            column-key="status"
            label="状态"
            :width="getColumnWidth('status', 120)"
            :min-width="100"
          >
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
          <el-table-column
            prop="percentDone"
            column-key="percentDone"
            label="进度"
            :width="getColumnWidth('percentDone', 140)"
            :min-width="120"
            sortable="custom"
          >
            <template #default="{ row }">
              <el-progress
                :percentage="Math.round(row.percentDone * 100)"
                :status="row.percentDone === 1 ? 'success' : undefined"
              />
            </template>
          </el-table-column>
          <el-table-column
            prop="totalSize"
            column-key="totalSize"
            label="大小"
            :width="getColumnWidth('totalSize', 140)"
            :min-width="120"
            sortable="custom"
          >
            <template #default="{ row }">
              {{ formatBytes(row.totalSize) }}
            </template>
          </el-table-column>
          <el-table-column
            v-if="!isCompactTable"
            column-key="uploadRatio"
            prop="uploadRatio"
            label="分享率"
            :width="getColumnWidth('uploadRatio', 70)"
            :min-width="70"
            sortable="custom"
          >
            <template #default="{ row }">
              <el-tag size="small" :class="['ratio-tag', getRatioClass(row.uploadRatio)]">
                {{ formatRatio(row.uploadRatio) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column
            v-if="!isCompactTable"
            column-key="popularity"
            prop="popularity"
            label="人气值"
            :width="getColumnWidth('popularity', 120)"
            :min-width="100"
            sortable="custom"
          >
            <template #default="{ row }">
              {{ formatPopularity(row.popularity) }}
            </template>
          </el-table-column>
          <el-table-column
            v-if="!isCompactTable"
            column-key="defaultTracker"
            prop="defaultTracker"
            label="默认 Tracker"
            :width="getColumnWidth('defaultTracker', 200)"
            :min-width="160"
            sortable="custom"
          >
            <template #default="{ row }">
              {{ getDefaultTracker(row) }}
            </template>
          </el-table-column>
          <el-table-column
            v-if="!isCompactTable"
            column-key="peersDownloading"
            prop="peersDownloading"
            label="种子"
            :width="getColumnWidth('peersDownloading', 130)"
            :min-width="110"
            sortable="custom"
          >
            <template #default="{ row }">
              {{ getSeeders(row) }}
            </template>
          </el-table-column>
          <el-table-column
            v-if="!isCompactTable"
            column-key="peersUploading"
            prop="peersUploading"
            label="用户"
            :width="getColumnWidth('peersUploading', 130)"
            :min-width="110"
            sortable="custom"
          >
            <template #default="{ row }">
              {{ getLeechers(row) }}
            </template>
          </el-table-column>
          <el-table-column
            prop="rateDownload"
            column-key="rateDownload"
            label="下载速度"
            :width="getColumnWidth('rateDownload', 140)"
            :min-width="120"
            sortable="custom"
          >
            <template #default="{ row }">
              {{ formatSpeed(row.rateDownload) }}
            </template>
          </el-table-column>
          <el-table-column
            prop="rateUpload"
            column-key="rateUpload"
            label="上传速度"
            :width="getColumnWidth('rateUpload', 140)"
            :min-width="120"
            sortable="custom"
          >
            <template #default="{ row }">
              {{ formatSpeed(row.rateUpload) }}
            </template>
          </el-table-column>
          <el-table-column
            v-if="!isCompactTable"
            column-key="uploadedEver"
            prop="uploadedEver"
            label="已上传"
            :width="getColumnWidth('uploadedEver', 150)"
            :min-width="130"
            sortable="custom"
          >
            <template #default="{ row }">
              {{ formatBytes(row.uploadedEver || 0) }}
            </template>
          </el-table-column>
          <el-table-column
            v-if="!isCompactTable"
            column-key="addedDate"
            prop="addedDate"
            label="添加时间"
            :width="getColumnWidth('addedDate', 180)"
            :min-width="150"
            sortable="custom"
          >
            <template #default="{ row }">
              {{ formatTorrentDate(row.addedDate) }}
            </template>
          </el-table-column>
          <el-table-column
            v-if="!isCompactTable"
            column-key="activityDate"
            prop="activityDate"
            label="最后活动"
            :width="getColumnWidth('activityDate', 180)"
            :min-width="150"
            sortable="custom"
          >
            <template #default="{ row }">
              {{ formatLastActivity(row.activityDate) }}
            </template>
          </el-table-column>
          <el-table-column
            v-if="!isCompactTable"
            column-key="labels"
            label="标签"
            :width="getColumnWidth('labels', 200)"
            :min-width="150"
          >
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
      </div>

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
      <div v-if="contextMenuTargets.length > 1" class="context-menu-header">
        已选 {{ contextMenuTargets.length }} 个种子
      </div>
      <button
        v-if="contextMenuHasStoppedTorrent"
        @click="handleContextAction('start')"
      >
        开始{{ contextMenuTargets.length > 1 ? '选中' : '' }}
      </button>
      <button
        v-if="contextMenuHasRunningTorrent"
        @click="handleContextAction('stop')"
      >
        暂停{{ contextMenuTargets.length > 1 ? '选中' : '' }}
      </button>
      <button @click="handleContextAction('verify')">重新校验{{ contextMenuTargets.length > 1 ? '选中' : '' }}</button>
      <button @click="handleContextAction('reannounce')">重新汇报{{ contextMenuTargets.length > 1 ? '选中' : '' }}</button>
      <button @click="handleContextAction('location')">变更保存目录</button>
      <button @click="handleContextAction('category')">设置分类</button>
      <button v-if="contextMenuTargets.length === 1" @click="handleContextAction('detail')">查看详情</button>
      <button @click="handleContextAction('limit')">限速设置</button>
      <button class="danger" @click="handleContextAction('delete')">删除{{ contextMenuTargets.length > 1 ? '选中' : '' }}</button>
    </div>

    <!-- 添加种子对话框 -->
    <el-dialog v-model="showAddDialog" title="添加种子" :width="defaultDialogWidth">
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

    <el-dialog v-model="showLocationDialog" title="变更保存目录" :width="defaultDialogWidth">
      <el-form :model="locationForm" label-width="120px">
        <el-form-item label="新的保存目录">
          <el-input v-model="locationForm.path" placeholder="/data/downloads" />
        </el-form-item>
        <el-form-item label="数据文件处理">
          <el-switch v-model="locationForm.move" active-text="同时移动文件" inactive-text="仅改路径记录" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showLocationDialog = false">取消</el-button>
        <el-button type="primary" @click="submitLocationChange">确定</el-button>
      </template>
    </el-dialog>

    <!-- 设置分类对话框 -->
    <el-dialog v-model="showCategoryDialog" title="设置分类" :width="defaultDialogWidth">
      <el-form :model="categoryForm" label-width="80px">
        <el-form-item label="分类">
          <el-autocomplete
            v-model="categoryForm.category"
            :fetch-suggestions="searchCategory"
            placeholder="输入分类名称或从现有分类中选择"
            style="width: 100%"
            clearable
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCategoryDialog = false">取消</el-button>
        <el-button type="primary" @click="submitCategoryChange">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="showDetailDialog"
      title="种子详情"
      :width="detailDialogWidth"
      class="detail-dialog"
    >
      <el-skeleton :loading="detailLoading" animated>
        <template #default>
          <template v-if="detailTorrent">
            <el-tabs v-model="detailActiveTab" class="detail-tabs" type="border-card">
              <el-tab-pane label="基础信息" name="basic">
                <el-descriptions :column="2" size="small" border>
                  <el-descriptions-item label="名称" :span="2">
                    {{ detailTorrent.name }}
                  </el-descriptions-item>
                  <el-descriptions-item label="状态">
                    <el-tag size="small" :type="getStatusType(detailTorrent)">
                      {{ getStatusText(detailTorrent) }}
                    </el-tag>
                  </el-descriptions-item>
                  <el-descriptions-item label="进度">
                    {{ Math.round(detailTorrent.percentDone * 100) }}%
                  </el-descriptions-item>
                  <el-descriptions-item label="大小">
                    {{ formatBytes(detailTorrent.totalSize) }}
                  </el-descriptions-item>
                  <el-descriptions-item label="分享率">
                    {{ formatRatio(detailTorrent.uploadRatio) }}
                  </el-descriptions-item>
                  <el-descriptions-item label="下载量">
                    {{ formatBytes(detailTorrent.downloadedEver || 0) }}
                  </el-descriptions-item>
                  <el-descriptions-item label="上传量">
                    {{ formatBytes(detailTorrent.uploadedEver || 0) }}
                  </el-descriptions-item>
                  <el-descriptions-item label="添加时间">
                    {{ formatTorrentDate(detailTorrent.addedDate) }}
                  </el-descriptions-item>
                  <el-descriptions-item label="最后活动">
                    {{ formatLastActivity(detailTorrent.activityDate) }}
                  </el-descriptions-item>
                  <el-descriptions-item label="保存目录" :span="2">
                    {{ detailTorrent.downloadDir }}
                  </el-descriptions-item>
                  <el-descriptions-item label="哈希" :span="2">
                    <span class="hash-value">{{ detailTorrent.hashString }}</span>
                  </el-descriptions-item>
                  <el-descriptions-item v-if="detailTorrent.category" label="分类" :span="2">
                    <el-tag size="small">{{ detailTorrent.category }}</el-tag>
                  </el-descriptions-item>
                  <el-descriptions-item v-if="detailTorrent.comment" label="描述" :span="2">
                    {{ detailTorrent.comment }}
                  </el-descriptions-item>
                  <el-descriptions-item v-if="detailTorrent.errorString" label="错误信息" :span="2">
                    <el-text type="danger">{{ detailTorrent.errorString }}</el-text>
                  </el-descriptions-item>
                </el-descriptions>
              </el-tab-pane>

              <el-tab-pane label="文件内容" name="content">
                <div v-if="detailFiles.length" class="files-container">
                  <div class="files-actions">
                    <span class="files-count">已选择 {{ detailSelectedFileCount }} / {{ detailTotalFileCount }}</span>
                    <div class="files-actions-buttons">
                      <el-button size="small" @click="toggleAllDetailFiles(true)">全选</el-button>
                      <el-button size="small" @click="toggleAllDetailFiles(false)">全不选</el-button>
                      <el-button
                        type="primary"
                        size="small"
                        :loading="detailFilesSaving"
                        @click="saveDetailFileSelections"
                      >
                        保存
                      </el-button>
                    </div>
                  </div>
                  <el-table
                    :data="detailFiles"
                    size="small"
                    border
                    max-height="400"
                    :row-key="detailFileRowKey"
                  >
                    <el-table-column label="下载" width="60" align="center">
                      <template #default="{ row }">
                        <el-checkbox v-model="detailFileSelections[row.index]" />
                      </template>
                    </el-table-column>
                    <el-table-column prop="name" label="文件名" min-width="200" show-overflow-tooltip />
                    <el-table-column label="大小" width="100" align="right">
                      <template #default="{ row }">
                        {{ formatBytes(row.length) }}
                      </template>
                    </el-table-column>
                    <el-table-column label="进度" width="150" align="right">
                      <template #default="{ row }">
                        {{ formatBytes(row.bytesCompleted) }} / {{ formatBytes(row.length) }}
                      </template>
                    </el-table-column>
                  </el-table>
                </div>
                <el-empty v-else description="无文件信息" :image-size="80" />
              </el-tab-pane>

              <el-tab-pane label="Tracker" name="tracker">
                <div v-if="detailTrackerRows.length">
                  <el-table
                    :data="detailTrackerRows"
                    size="small"
                    border
                    max-height="400"
                  >
                    <el-table-column prop="tier" label="Tier" width="60" align="center" />
                    <el-table-column prop="announce" label="Announce URL" min-width="200" show-overflow-tooltip />
                    <el-table-column label="状态" width="100" align="center">
                      <template #default="{ row }">
                        <el-tag size="small" :type="row.statusType">{{ row.statusText }}</el-tag>
                      </template>
                    </el-table-column>
                    <el-table-column prop="lastAnnounce" label="上次汇报" width="140" />
                  </el-table>
                </div>
                <el-empty v-else description="未配置 Tracker" :image-size="80" />
              </el-tab-pane>

              <el-tab-pane label="Peers" name="peers">
                <div v-if="detailPeers.length">
                  <el-table
                    :data="detailPeers"
                    size="small"
                    border
                    max-height="400"
                  >
                    <el-table-column prop="address" label="IP 地址" width="130" />
                    <el-table-column prop="port" label="端口" width="70" align="center" />
                    <el-table-column prop="client" label="客户端" min-width="100" show-overflow-tooltip />
                    <el-table-column label="进度" width="80" align="center">
                      <template #default="{ row }">
                        {{ Math.round(row.progress * 100) }}%
                      </template>
                    </el-table-column>
                    <el-table-column label="下载速度" width="100" align="right">
                      <template #default="{ row }">
                        {{ row.rateToClient > 0 ? formatBytes(row.rateToClient) + '/s' : '—' }}
                      </template>
                    </el-table-column>
                    <el-table-column label="上传速度" width="100" align="right">
                      <template #default="{ row }">
                        {{ row.rateToPeer > 0 ? formatBytes(row.rateToPeer) + '/s' : '—' }}
                      </template>
                    </el-table-column>
                    <el-table-column prop="flagStr" label="标志" width="80" align="center" />
                  </el-table>
                </div>
                <el-empty v-else description="当前没有连接的 Peers" :image-size="80" />
              </el-tab-pane>
            </el-tabs>
          </template>
          <el-empty v-else description="未找到种子详情" :image-size="100" />
        </template>
      </el-skeleton>
      <template #footer>
        <el-button @click="showDetailDialog = false">关闭</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="limitDialogVisible"
      :title="limitDialogTitle"
      :width="limitDialogWidth"
      class="limit-dialog"
    >
      <p class="dialog-subtitle" v-if="limitDialogMode === 'batch'">
        全部种子：{{ limitDialogTargetTorrents.length }} 个
      </p>
      <p class="dialog-subtitle" v-else>
        {{ limitDialogTargetName }}
      </p>
      <el-form :model="limitDialogForm" label-width="100px" v-loading="limitDialogLoading" class="limit-form">
        <!-- 批量模式：显示tracker筛选 -->
        <el-form-item v-if="limitDialogMode === 'batch'" label="筛选站点">
          <el-select
            v-model="limitDialogForm.selectedTrackers"
            multiple
            filterable
            allow-create
            default-first-option
            placeholder="留空则应用于全部种子"
            style="width: 100%"
          >
            <el-option
              v-for="tracker in limitDialogTrackerOptions"
              :key="tracker.value"
              :label="tracker.label"
              :value="tracker.value"
            />
          </el-select>
          <div class="form-tip">
            {{ limitDialogFilteredCount }}
          </div>
        </el-form-item>
        <el-form-item label="下载限速">
          <div class="limit-row">
            <el-switch
              v-model="limitDialogForm.downloadLimited"
              class="limit-switch"
            />
            <el-input-number
              v-model="limitDialogForm.downloadLimit"
              :min="0"
              :max="1000000"
              :disabled="!limitDialogForm.downloadLimited"
              controls-position="right"
              class="limit-input"
            />
            <el-select
              v-model="limitDialogForm.downloadUnit"
              :disabled="!limitDialogForm.downloadLimited"
              class="limit-unit-select"
            >
              <el-option label="KB/s" value="KB" />
              <el-option label="MB/s" value="MB" />
            </el-select>
          </div>
        </el-form-item>
        <el-form-item label="上传限速">
          <div class="limit-row">
            <el-switch
              v-model="limitDialogForm.uploadLimited"
              class="limit-switch"
            />
            <el-input-number
              v-model="limitDialogForm.uploadLimit"
              :min="0"
              :max="1000000"
              :disabled="!limitDialogForm.uploadLimited"
              controls-position="right"
              class="limit-input"
            />
            <el-select
              v-model="limitDialogForm.uploadUnit"
              :disabled="!limitDialogForm.uploadLimited"
              class="limit-unit-select"
            >
              <el-option label="KB/s" value="KB" />
              <el-option label="MB/s" value="MB" />
            </el-select>
          </div>
        </el-form-item>
        <el-form-item v-if="limitDialogMode === 'batch'" label="添加标签">
          <div class="limit-row">
            <el-switch
              v-model="limitDialogForm.addLabel"
              class="limit-switch"
            />
            <span class="form-tip-inline" v-if="limitDialogForm.addLabel">
              如：limit:↓100KB/s↑50KB/s
            </span>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="limitDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="limitDialogSaving" @click="submitLimitSettings">
          保存
        </el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="removeDialog.visible" title="删除种子" :width="removeDialogWidth">
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
import type { TableInstance, TableColumnCtx } from 'element-plus'
import dayjs from 'dayjs'
import {
  Plus,
  Refresh,
  Search,
  VideoPlay,
  VideoPause,
  Delete,
  Upload,
  Filter,
} from '@element-plus/icons-vue'
import * as api from '@/api/torrents'
import type { AddTorrentPayload } from '@/api/torrents'
import type { Torrent, TorrentStatus } from '@/types/transmission'
import { TorrentStatusEnum } from '@/types/transmission'
import { getTrackerDisplayName, matchesTrackerFilter } from '@/utils/torrent'
import { useMediaQuery } from '@/utils/useMediaQuery'
import { useFilterStore } from '@/stores/filter'
import { storeToRefs } from 'pinia'

const REFRESH_INTERVAL = 3000
const COLUMN_WIDTH_STORAGE_KEY = 'tv_table_column_widths'
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
  'peers',
  'comment',
  'category',
]

const filterStore = useFilterStore()
const { statusFilter, trackerFilter, categoryFilter } = storeToRefs(filterStore)

interface LimitFormState {
  downloadLimited: boolean
  downloadLimit: number
  downloadUnit: 'KB' | 'MB'
  uploadLimited: boolean
  uploadLimit: number
  uploadUnit: 'KB' | 'MB'
  selectedTrackers: string[]
  addLabel: boolean
}

const createEmptyLimitForm = (): LimitFormState => ({
  downloadLimited: false,
  downloadLimit: 0,
  downloadUnit: 'KB',
  uploadLimited: false,
  uploadLimit: 0,
  uploadUnit: 'KB',
  selectedTrackers: [],
  addLabel: true,
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

const defaultColumnWidths: Record<string, number> = {
  name: 300,
  status: 100,
  percentDone: 100,
  totalSize: 90,
  uploadRatio: 90,
  popularity: 90,
  defaultTracker: 160,
  peersDownloading: 100,
  peersUploading: 100,
  rateDownload: 100,
  rateUpload: 100,
  uploadedEver: 100,
  addedDate: 150,
  activityDate: 150,
  labels: 100,
}

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
const selectedTorrents = ref<Torrent[]>([])
const selectedIdsState = ref<number[]>([])
const showLocationDialog = ref(false)
const locationForm = ref({
  path: '',
  move: true,
})
const locationTarget = ref<Torrent | null>(null)
const locationTargetIds = ref<number[]>([])
const showCategoryDialog = ref(false)
const categoryForm = ref({
  category: '',
})
const categoryTarget = ref<Torrent | null>(null)
const categoryTargetIds = ref<number[]>([])
const availableCategories = ref<string[]>([])
const showDetailDialog = ref(false)
const detailLoading = ref(false)
const detailTorrent = ref<Torrent | null>(null)
const detailActiveTab = ref<'basic' | 'content' | 'tracker' | 'peers'>('basic')
const detailFileSelections = ref<Record<number, boolean>>({})
const detailFilesSaving = ref(false)
const detailPeers = ref<Array<{
  address: string
  port: number
  client: string
  progress: number
  rateToClient: number
  rateToPeer: number
  flagStr: string
}>>([])
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
const limitDialogTargetTorrents = ref<Torrent[]>([])
const limitDialogForm = ref<LimitFormState>(createEmptyLimitForm())
const limitDialogSaving = ref(false)
const limitDialogMode = ref<'batch' | 'single'>('batch')
const limitDialogTargetName = ref('')
const limitDialogLoading = ref(false)
const limitDialogTitle = computed(() =>
  limitDialogMode.value === 'single' ? '限速设置' : '批量限速'
)

// 从目标种子中提取所有唯一的tracker
const limitDialogTrackerOptions = computed(() => {
  const trackerMap = new Map<string, string>()
  limitDialogTargetTorrents.value.forEach(torrent => {
    torrent.trackers?.forEach(tracker => {
      const displayName = getTrackerDisplayName(tracker.announce)
      trackerMap.set(displayName, displayName)
    })
  })
  return Array.from(trackerMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([displayName]) => ({ label: displayName, value: displayName }))
})

// 计算筛选后将影响的种子数量
const limitDialogFilteredTorrents = computed(() => {
  const selectedTrackers = limitDialogForm.value.selectedTrackers
  if (!selectedTrackers.length) {
    return limitDialogTargetTorrents.value
  }
  return limitDialogTargetTorrents.value.filter(torrent => {
    return torrent.trackers?.some(tracker => {
      const displayName = getTrackerDisplayName(tracker.announce)
      return selectedTrackers.includes(displayName)
    })
  })
})

const limitDialogFilteredCount = computed(() => {
  const selectedTrackers = limitDialogForm.value.selectedTrackers
  const filteredCount = limitDialogFilteredTorrents.value.length
  const totalCount = limitDialogTargetTorrents.value.length
  if (!selectedTrackers.length) {
    return `将应用于所有 ${totalCount} 个种子`
  }
  return `将应用于 ${filteredCount} / ${totalCount} 个种子`
})

const isMobile = useMediaQuery('(max-width: 768px)')
const isCompactTable = useMediaQuery('(max-width: 1100px)')
const showMobileFilters = ref(!isMobile.value)
const columnWidths = ref<Record<string, number>>({ ...defaultColumnWidths })
const createDialogWidth = (desktopWidth: string, mobileWidth = '94vw') =>
  computed(() => (isMobile.value ? mobileWidth : desktopWidth))
const defaultDialogWidth = createDialogWidth('500px')
const detailDialogWidth = createDialogWidth('720px', '96vw')
const limitDialogWidth = createDialogWidth('480px')
const removeDialogWidth = createDialogWidth('420px', '90vw')

type SortOrder = 'ascending' | 'descending' | null

const sortState = ref<{ prop: string; order: SortOrder }>({
  prop: '',
  order: null,
})

const currentPage = ref(1)
const pageSize = ref(50)
const pageSizeOptions = [25, 50, 100, 200, 500]

const hasSelection = computed(() => selectedTorrents.value.length > 0)
const toggleMobileFilters = () => {
  if (!isMobile.value) return
  showMobileFilters.value = !showMobileFilters.value
}
const getColumnWidth = (key: string, fallback?: number) =>
  columnWidths.value[key] ?? fallback ?? defaultColumnWidths[key] ?? 70

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
const contextMenuTargets = ref<Torrent[]>([])

// 计算右键菜单目标中是否有已停止的种子
const contextMenuHasStoppedTorrent = computed(() =>
  contextMenuTargets.value.some(t => t.status === TorrentStatusEnum.STOPPED)
)

// 计算右键菜单目标中是否有运行中的种子
const contextMenuHasRunningTorrent = computed(() =>
  contextMenuTargets.value.some(t => t.status !== TorrentStatusEnum.STOPPED)
)

const getDefaultTracker = (torrent: Torrent): string => {
  // 优先选择第一个汇报成功的tracker
  if (torrent.trackerStats && torrent.trackerStats.length > 0) {
    const successTracker = torrent.trackerStats.find(stat => stat.lastAnnounceSucceeded)
    if (successTracker) {
      return getTrackerDisplayName(successTracker.announce)
    }
  }
  // 如果没有汇报成功的，则使用第一个tracker
  const tracker = torrent.trackers?.[0]
  return tracker ? getTrackerDisplayName(tracker.announce) : '—'
}

const persistColumnWidths = () => {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(
      COLUMN_WIDTH_STORAGE_KEY,
      JSON.stringify(columnWidths.value)
    )
  } catch (error) {
    console.warn('保存列宽失败', error)
  }
}

const loadColumnWidths = () => {
  if (typeof window === 'undefined') return
  try {
    const stored = window.localStorage.getItem(COLUMN_WIDTH_STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      columnWidths.value = { ...defaultColumnWidths, ...parsed }
    }
  } catch (error) {
    console.warn('读取列宽失败', error)
    columnWidths.value = { ...defaultColumnWidths }
  }
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

const formatPopularity = (popularity?: number): string => {
  if (popularity === undefined || popularity === null) return '—'
  // 乘以100并取整
  const value = Math.round(popularity * 100)
  return value.toString()
}

const formatLastActivity = (timestamp?: number): string => {
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
          : statusFilter.value === 'queued'
            ? ([TorrentStatusEnum.CHECK_WAIT, TorrentStatusEnum.DOWNLOAD_WAIT, TorrentStatusEnum.SEED_WAIT] as TorrentStatus[]).includes(torrent.status)
            : torrent.status === statusFilter.value
    const matchesTracker =
      !trackerFilter.value ||
      (torrent.trackers ?? []).some((tracker) => matchesTrackerFilter(tracker.announce, trackerFilter.value))
    const matchesCategory =
      !categoryFilter.value ||
      (categoryFilter.value === '无分类' ? !torrent.category : torrent.category === categoryFilter.value)
    return matchesKeyword && matchesStatus && matchesTracker && matchesCategory
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
    case 'popularity':
      return torrent.popularity ?? 0
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
    case 'addedDate':
      return torrent.addedDate ?? 0
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
  const trackerMap = new Map<string, string>() // displayName -> filterValue
  torrents.value.forEach((torrent) => {
    torrent.trackers?.forEach((tracker) => {
      const displayName = getTrackerDisplayName(tracker.announce)
      trackerMap.set(displayName, displayName)
    })
  })
  return Array.from(trackerMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([displayName]) => ({ label: displayName, value: displayName }))
})

const categoryOptions = computed(() => {
  const categories = new Set<string>()
  torrents.value.forEach((torrent) => {
    if (torrent.category) {
      categories.add(torrent.category)
    }
  })
  const result = Array.from(categories).sort()
  // 检查是否有无分类的种子
  const hasUncategorized = torrents.value.some(t => !t.category)
  if (hasUncategorized) {
    result.unshift('无分类')
  }
  return result.map((cat) => ({ label: cat, value: cat }))
})

const selectedIds = computed(() => selectedTorrents.value.map((torrent) => torrent.id))
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

watch(isMobile, (mobile) => {
  showMobileFilters.value = !mobile
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
    limitDialogTargetTorrents.value = []
    limitDialogMode.value = 'batch'
    limitDialogTargetName.value = ''
    limitDialogLoading.value = false
    resetLimitDialogForm()
  }
})

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

  // 判断右键的种子是否在已选择列表中
  const isRowSelected = selectedTorrents.value.some(t => t.id === row.id)

  // 如果右键的种子在选中列表中，使用所有选中的种子；否则只使用当前右键的种子
  if (isRowSelected && selectedTorrents.value.length > 0) {
    contextMenuTargets.value = [...selectedTorrents.value]
  } else {
    contextMenuTargets.value = [row]
  }

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
  contextMenuTargets.value = []
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

const handleColumnResize = (
  newWidth: number,
  _oldWidth: number,
  column: TableColumnCtx<Torrent>
) => {
  const key = column.columnKey as string | undefined
  if (!key || key === 'selection') return
  const minWidth = Number(column.minWidth) || 80
  const normalizedWidth = Math.max(minWidth, Math.round(newWidth))
  if (columnWidths.value[key] === normalizedWidth) return
  columnWidths.value = {
    ...columnWidths.value,
    [key]: normalizedWidth,
  }
  persistColumnWidths()
  nextTick(() => {
    tableRef.value?.doLayout?.()
  })
}

const resetColumnWidths = () => {
  columnWidths.value = { ...defaultColumnWidths }
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.removeItem(COLUMN_WIDTH_STORAGE_KEY)
    } catch (error) {
      console.error('Failed to clear column widths from localStorage:', error)
    }
  }
  nextTick(() => {
    tableRef.value?.doLayout?.()
  })
  ElMessage.success('列宽已重置为默认值')
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
  action:
    | 'start'
    | 'stop'
    | 'delete'
    | 'verify'
    | 'reannounce'
    | 'location'
    | 'detail'
    | 'limit'
    | 'category'
) => {
  const targets = [...contextMenuTargets.value]
  if (!targets.length) return

  const targetIds = targets.map(t => t.id)
  const isBatch = targets.length > 1

  hideContextMenu()

  if (action === 'start') {
    startTorrentsById(targetIds)
    return
  }
  if (action === 'stop') {
    stopTorrentsById(targetIds)
    return
  }
  if (action === 'delete') {
    if (isBatch) {
      openRemoveDialog(targetIds, `确定删除选中的 ${targetIds.length} 个种子？`)
    } else {
      openRemoveDialog(targetIds, '确定删除该种子？')
    }
    return
  }
  if (action === 'verify') {
    verifyTorrentsById(targetIds)
    return
  }
  if (action === 'reannounce') {
    reannounceTorrentsById(targetIds)
    return
  }
  if (action === 'location') {
    openLocationDialog(targets[0]!, isBatch ? targetIds : undefined)
    return
  }
  if (action === 'category') {
    openCategoryDialog(targets[0]!, isBatch ? targetIds : undefined)
    return
  }
  if (action === 'detail') {
    // 查看详情只支持单个种子
    if (!isBatch) {
      openDetailDialog(targets[0]!)
    }
    return
  }
  if (action === 'limit') {
    if (isBatch) {
      openBatchLimitDialogWithTargets(targets)
    } else {
      openSingleLimitDialog(targets[0]!)
    }
  }
}

// 批量开始种子
const startTorrentsById = async (ids: number[]) => {
  try {
    await api.startTorrents(ids)
    ElMessage.success(ids.length > 1 ? `已开始 ${ids.length} 个种子` : '已开始')
    loadTorrents()
  } catch (error: any) {
    ElMessage.error(`操作失败: ${error.message}`)
  }
}

// 批量暂停种子
const stopTorrentsById = async (ids: number[]) => {
  try {
    await api.stopTorrents(ids)
    ElMessage.success(ids.length > 1 ? `已暂停 ${ids.length} 个种子` : '已暂停')
    loadTorrents()
  } catch (error: any) {
    ElMessage.error(`操作失败: ${error.message}`)
  }
}

// 批量校验种子
const verifyTorrentsById = async (ids: number[]) => {
  try {
    await api.verifyTorrents(ids)
    ElMessage.success(ids.length > 1 ? `已开始重新校验 ${ids.length} 个种子` : '已开始重新校验')
  } catch (error: any) {
    ElMessage.error(`重新校验失败: ${error.message}`)
  }
}

// 批量汇报种子
const reannounceTorrentsById = async (ids: number[]) => {
  try {
    await api.reannounceTorrents(ids)
    ElMessage.success(ids.length > 1 ? `已通知 Tracker（${ids.length} 个种子）` : '已通知 Tracker')
  } catch (error: any) {
    ElMessage.error(`重新汇报失败: ${error.message}`)
  }
}

const openLocationDialog = (torrent: Torrent, batchIds?: number[]) => {
  locationTarget.value = torrent
  locationTargetIds.value = batchIds || [torrent.id]
  locationForm.value.path = torrent.downloadDir
  locationForm.value.move = true
  showLocationDialog.value = true
}

const submitLocationChange = async () => {
  if (!locationTargetIds.value.length) {
    showLocationDialog.value = false
    return
  }
  const path = locationForm.value.path.trim()
  if (!path) {
    ElMessage.warning('请输入新的保存目录')
    return
  }
  try {
    await api.setTorrentLocation(locationTargetIds.value, path, locationForm.value.move)
    ElMessage.success(locationTargetIds.value.length > 1 ? `已更新 ${locationTargetIds.value.length} 个种子的保存目录` : '保存目录已更新')
    showLocationDialog.value = false
    loadTorrents()
  } catch (error: any) {
    ElMessage.error(`变更失败: ${error.message}`)
  }
}

const openCategoryDialog = async (torrent: Torrent, batchIds?: number[]) => {
  categoryTarget.value = torrent
  categoryTargetIds.value = batchIds || [torrent.id]
  categoryForm.value.category = torrent.category || ''
  showCategoryDialog.value = true
  // 加载可用分类列表
  if (api.getCategories) {
    try {
      availableCategories.value = (await api.getCategories()) ?? []
    } catch (error: any) {
      console.error('加载分类列表失败:', error)
    }
  }
}

const submitCategoryChange = async () => {
  if (!categoryTargetIds.value.length) {
    showCategoryDialog.value = false
    return
  }
  const category = categoryForm.value.category.trim()
  try {
    if (api.setTorrentCategory) {
      await api.setTorrentCategory(categoryTargetIds.value, category)
      ElMessage.success(categoryTargetIds.value.length > 1 ? `已更新 ${categoryTargetIds.value.length} 个种子的分类` : '分类已更新')
      showCategoryDialog.value = false
      loadTorrents()
    } else {
      ElMessage.warning('当前客户端不支持设置分类')
    }
  } catch (error: any) {
    ElMessage.error(`设置分类失败: ${error.message}`)
  }
}

const searchCategory = (queryString: string, cb: (results: any[]) => void) => {
  const results = availableCategories.value
    .filter(cat => !queryString || cat.toLowerCase().includes(queryString.toLowerCase()))
    .map(cat => ({ value: cat }))
  cb(results)
}

const fetchTorrentDetail = async (id: number) => {
  const result = await api.getTorrents(DETAIL_FIELDS, { ids: [id] })
  return result.torrents[0] || null
}

const applyDetailData = (torrent: Torrent) => {
  detailTorrent.value = torrent
  initializeDetailFileSelections()
  // 处理 peers 数据
  if (torrent.peers && torrent.peers.length > 0) {
    detailPeers.value = torrent.peers.map((peer) => ({
      address: peer.address,
      port: peer.port,
      client: peer.clientName || '未知',
      progress: peer.progress,
      rateToClient: peer.rateToClient,
      rateToPeer: peer.rateToPeer,
      flagStr: peer.flagStr || '',
    }))
  } else {
    detailPeers.value = []
  }
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
  detailActiveTab.value = 'basic'
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

const buildLimitPayload = (form: LimitFormState) => {
  const payload: Record<string, any> = {
    downloadLimited: form.downloadLimited,
    uploadLimited: form.uploadLimited,
  }
  if (form.downloadLimited) {
    // 转换为 KB/s (API 使用 KB/s)
    const downloadLimit = form.downloadUnit === 'MB'
      ? form.downloadLimit * 1024
      : form.downloadLimit
    payload.downloadLimit = Math.max(0, Math.round(downloadLimit))
  }
  if (form.uploadLimited) {
    // 转换为 KB/s (API 使用 KB/s)
    const uploadLimit = form.uploadUnit === 'MB'
      ? form.uploadLimit * 1024
      : form.uploadLimit
    payload.uploadLimit = Math.max(0, Math.round(uploadLimit))
  }
  return payload
}

// 生成限速标签字符串
const buildLimitLabel = (form: LimitFormState): string => {
  const parts: string[] = []
  if (form.downloadLimited && form.downloadLimit > 0) {
    parts.push(`↓${form.downloadLimit}${form.downloadUnit}/s`)
  }
  if (form.uploadLimited && form.uploadLimit > 0) {
    parts.push(`↑${form.uploadLimit}${form.uploadUnit}/s`)
  }
  if (parts.length === 0) {
    return ''
  }
  return `limit:${parts.join('')}`
}

const openBatchLimitDialog = () => {
  if (!torrents.value.length) {
    ElMessage.warning('暂无种子')
    return
  }
  limitDialogMode.value = 'batch'
  limitDialogTargetName.value = ''
  limitDialogLoading.value = false
  // 使用所有种子，而不是选中的种子
  limitDialogIds.value = torrents.value.map(t => t.id)
  limitDialogTargetTorrents.value = [...torrents.value]
  resetLimitDialogForm()
  limitDialogVisible.value = true
}

// 从右键菜单打开批量限速对话框
const openBatchLimitDialogWithTargets = (targets: Torrent[]) => {
  if (!targets.length) return
  limitDialogMode.value = 'batch'
  limitDialogTargetName.value = ''
  limitDialogLoading.value = false
  limitDialogIds.value = targets.map(t => t.id)
  limitDialogTargetTorrents.value = targets
  resetLimitDialogForm()
  limitDialogVisible.value = true
}

const resetLimitDialogForm = () => {
  limitDialogForm.value = createEmptyLimitForm()
}

const applyLimitFormFromTorrent = (torrent?: Torrent | null) => {
  if (!torrent) {
    resetLimitDialogForm()
    return
  }
  limitDialogForm.value = {
    downloadLimited: torrent.downloadLimited ?? false,
    downloadLimit: torrent.downloadLimit ?? 0,
    downloadUnit: 'KB',
    uploadLimited: torrent.uploadLimited ?? false,
    uploadLimit: torrent.uploadLimit ?? 0,
    uploadUnit: 'KB',
    selectedTrackers: [],
    addLabel: false, // 单个种子模式默认不添加标签
  }
}

const openSingleLimitDialog = async (torrent: Torrent) => {
  limitDialogMode.value = 'single'
  limitDialogTargetName.value = `当前种子：${torrent.name}`
  limitDialogIds.value = [torrent.id]
  limitDialogTargetTorrents.value = [torrent]
  resetLimitDialogForm()
  limitDialogVisible.value = true
  limitDialogLoading.value = true
  try {
    const detail = await fetchTorrentDetail(torrent.id)
    applyLimitFormFromTorrent(detail || torrent)
    // 更新目标种子列表以获取最新的标签信息
    if (detail) {
      limitDialogTargetTorrents.value = [detail]
    }
  } catch (error) {
    console.warn('加载限速信息失败', error)
    applyLimitFormFromTorrent(torrent)
  } finally {
    limitDialogLoading.value = false
  }
}

const submitLimitSettings = async () => {
  // 批量模式：使用筛选后的种子
  const targetTorrents = limitDialogMode.value === 'batch'
    ? limitDialogFilteredTorrents.value
    : limitDialogTargetTorrents.value

  if (!targetTorrents.length) {
    ElMessage.warning('没有匹配的种子')
    return
  }

  const targetIds = targetTorrents.map(t => t.id)
  limitDialogSaving.value = true

  try {
    // 1. 设置限速
    await api.setTorrents(targetIds, buildLimitPayload(limitDialogForm.value))

    // 2. 如果是批量模式且需要添加标签
    if (limitDialogMode.value === 'batch' && limitDialogForm.value.addLabel) {
      const limitLabel = buildLimitLabel(limitDialogForm.value)
      if (limitLabel) {
        // 为每个种子更新标签
        for (const torrent of targetTorrents) {
          // 移除旧的限速标签
          const existingLabels = (torrent.labels || []).filter(
            label => !label.startsWith('limit:')
          )
          // 添加新的限速标签
          const newLabels = [...existingLabels, limitLabel]
          await api.setTorrents([torrent.id], { labels: newLabels })
        }
      }
    }

    ElMessage.success(targetIds.length > 1
      ? `已对 ${targetIds.length} 个种子应用限速设置`
      : '限速设置已应用'
    )
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
  detailActiveTab.value = 'basic'
}

// 文件选择
const handleFileChange = (file: any) => {
  addForm.value.file = file.raw
}

// 添加种子
const handleAddTorrent = async () => {
  try {
    const payload: AddTorrentPayload = {
      paused: addForm.value.paused,
    }
    if (addForm.value.downloadDir) {
      payload.downloadDir = addForm.value.downloadDir
    }

    if (addForm.value.type === 'magnet') {
      if (!addForm.value.magnet) {
        ElMessage.warning('请输入磁力链接')
        return
      }
      payload.magnet = addForm.value.magnet
    } else {
      if (!addForm.value.file) {
        ElMessage.warning('请选择种子文件')
        return
      }
      payload.file = addForm.value.file
    }

    await api.addTorrent(payload)
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
  loadColumnWidths()
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
  align-items: flex-start;
  gap: 12px;
  flex-wrap: wrap;
}

.actions-group {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  flex: 1 1 auto;
}

.filter-toggle {
  align-self: flex-start;
  flex: 0 0 auto;
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
  gap: 12px;
}

.filter-controls {
  display: flex;
  align-items: center;
  gap: 12px;
}

.filter-select {
  width: 200px;
}

.filter-select :deep(.el-select-dropdown) {
  max-height: 300px;
}

.filter-select :deep(.el-select-dropdown__list) {
  max-height: 280px;
}

.filter-input {
  width: 240px;
}

.filter-submenu.is-mobile {
  width: 100%;
}

.filter-submenu.is-mobile .filter-controls {
  flex-direction: column;
  align-items: stretch;
  gap: 8px;
}

.filter-submenu.is-mobile .filter-select,
.filter-submenu.is-mobile .filter-input {
  width: 100%;
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

.context-menu-header {
  padding: 6px 16px;
  font-size: 12px;
  color: #909399;
  border-bottom: 1px solid #ebeef5;
  margin-bottom: 4px;
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
  margin-top: 20px;
  display: flex;
  flex-direction: column;
}

.table-scroll {
  flex: 1;
  overflow: auto;
  border-radius: 6px;
  background: #fff;
  -webkit-overflow-scrolling: touch;
}

.table-scroll :deep(.el-table) {
  min-width: 1100px;
}

.table-scroll :deep(.el-table__row) {
  height: 48px;
}

.table-scroll :deep(.el-table__cell) {
  padding: 8px 0;
}

.table-scroll :deep(.el-table .cell) {
  padding-left: 8px;
  padding-right: 8px;
  line-height: 1.4;
}

.table-scroll :deep(.el-progress) {
  width: 100%;
}

.table-scroll :deep(.el-progress__text) {
  min-width: 36px;
  font-size: 12px !important;
}

.pagination {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}

.detail-dialog :deep(.el-dialog__body) {
  padding: 0;
  overflow: hidden;
}

.detail-tabs {
  border: none;
}

.detail-tabs :deep(.el-tabs__header) {
  margin: 0;
  background-color: #f5f7fa;
}

.detail-tabs :deep(.el-tabs__content) {
  padding: 16px;
  max-height: 500px;
  overflow-y: auto;
}

.detail-tabs :deep(.el-descriptions) {
  margin: 0;
}

.hash-value {
  font-family: monospace;
  font-size: 12px;
  word-break: break-all;
}

.files-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.files-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background-color: #f5f7fa;
  border-radius: 4px;
  font-size: 13px;
}

.files-count {
  color: #606266;
  font-weight: 500;
}

.files-actions-buttons {
  display: flex;
  gap: 8px;
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

.limit-form .el-form-item {
  margin-bottom: 16px;
}

.form-tip {
  margin-top: 4px;
  font-size: 12px;
  color: #909399;
}

.form-tip-inline {
  font-size: 12px;
  color: #909399;
  margin-left: 8px;
}

.dialog-subtitle {
  margin: 0 0 12px;
  font-size: 13px;
  color: #909399;
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

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

@media (max-width: 1200px) {
  .table-scroll :deep(.el-table) {
    min-width: 960px;
  }
}

@media (max-width: 1024px) {
  .toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .actions-group {
    width: 100%;
  }

  .filter-submenu {
    flex-direction: column;
    align-items: stretch;
  }

  .filter-controls {
    width: 100%;
  }

  .update-info {
    margin-left: 0;
    width: 100%;
  }

  .table-scroll {
    border: 1px solid #ebeef5;
  }
}

@media (max-width: 900px) {
  .table-scroll :deep(.el-table) {
    min-width: 780px;
  }
}

@media (max-width: 768px) {
  .home-view {
    gap: 10px;
  }

  .actions-group {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  }

  .actions-group :deep(.el-button) {
    width: 100%;
    justify-content: center;
  }

  .filter-toggle {
    width: 100%;
  }

  .table-container {
    margin-top: 12px;
  }

  .table-scroll :deep(.el-table) {
    min-width: 720px;
  }

  .detail-grid {
    grid-template-columns: 1fr;
  }

  .files-actions {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .files-actions-buttons {
    width: 100%;
    flex-wrap: wrap;
  }

  .files-actions-buttons :deep(.el-button) {
    flex: 1;
  }
}
</style>
