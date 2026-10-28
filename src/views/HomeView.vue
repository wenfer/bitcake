<template>
  <div class="home-view">
  <div class="toolbar">
  <div class="actions-group">
  <el-button type="primary" :icon="Plus" @click="showAddDialog = true">
  {{ t('torrent.addTorrent') }}
  </el-button>
  <el-button :icon="Refresh" @click="handleManualRefresh">
  {{ isMobile ? '' : t('common.refresh') }}
  </el-button>
  <template v-if="!isMobile">
  <el-button :icon="VideoPlay" :disabled="!hasSelection" @click="startSelected">
  {{ t('torrent.startSelected') }}
  </el-button>
  <el-button :icon="VideoPause" :disabled="!hasSelection" @click="stopSelected">
  {{ t('torrent.stopSelected') }}
  </el-button>
  <el-button
  type="danger"
  :icon="Delete"
  :disabled="!hasSelection"
  @click="removeSelected"
  >
  {{ t('torrent.deleteSelected') }}
  </el-button>
  <el-button :icon="Odometer" @click="openBatchLimitDialog">
  {{ t('torrent.batchLimit') }}
  </el-button>
  <el-dropdown trigger="click" @command="handleActionCommand">
  <el-button :icon="MoreFilled">{{ t('common.more') }}</el-button>
  <template #dropdown>
  <el-dropdown-menu>
  <el-dropdown-item command="labels" :disabled="!hasSelection">
  {{ t('torrent.batchLabels') }}
  </el-dropdown-item>
  <el-dropdown-item command="replaceTracker">
  {{ t('torrent.batchReplaceTracker') }}
  </el-dropdown-item>
  <el-dropdown-item command="columnVisibility">
  {{ t('torrent.columnSettings') }}
  </el-dropdown-item>
  <el-dropdown-item
  v-if="notificationState.supported"
  command="toggleNotifications"
  >
  {{ notificationState.enabled ? t('notification.disableNotifications') : t('notification.enableNotifications') }}
  </el-dropdown-item>
  </el-dropdown-menu>
  </template>
  </el-dropdown>
  <el-button
  class="view-toggle"
  :icon="isCardView ? List : Grid"
  :title="isCardView ? t('home.tableView') : t('home.cardView')"
  @click="toggleViewMode"
  />
  </template>
  <template v-else>
  <el-dropdown trigger="click" @command="handleActionCommand">
  <el-button :icon="Operation">{{ t('common.operation') }}</el-button>
  <template #dropdown>
  <el-dropdown-menu>
  <el-dropdown-item command="start" :disabled="!hasSelection">
  {{ t('torrent.startSelected') }}
  </el-dropdown-item>
  <el-dropdown-item command="stop" :disabled="!hasSelection">
  {{ t('torrent.stopSelected') }}
  </el-dropdown-item>
  <el-dropdown-item command="remove" :disabled="!hasSelection">
  {{ t('torrent.deleteSelected') }}
  </el-dropdown-item>
  <el-dropdown-item command="limit">{{ t('torrent.batchLimit') }}</el-dropdown-item>
  <el-dropdown-item command="labels" :disabled="!hasSelection">
  {{ t('torrent.batchLabels') }}
  </el-dropdown-item>
  <el-dropdown-item command="replaceTracker">
  {{ t('torrent.batchReplaceTracker') }}
  </el-dropdown-item>
  <el-dropdown-item command="columnVisibility">
  {{ t('torrent.columnSettings') }}
  </el-dropdown-item>
  <el-dropdown-item
  v-if="notificationState.supported"
  command="toggleNotifications"
  >
  {{ notificationState.enabled ? t('notification.disableNotifications') : t('notification.enableNotifications') }}
  </el-dropdown-item>
  </el-dropdown-menu>
  </template>
  </el-dropdown>
        <el-button
          class="view-toggle"
          :icon="Filter"
          :title="showMobileFilters ? t('torrent.collapseFilter') : t('torrent.expandFilter')"
          @click="toggleMobileFilters"
        />
        <el-button
          class="view-toggle"
          :icon="isCardView ? List : Grid"
          :title="isCardView ? t('home.tableView') : t('home.cardView')"
          @click="toggleViewMode"
        />
  </template>
  </div>
  </div>
  
  <Transition name="fade">
  <div v-if="!isMobile || showMobileFilters" class="filter-submenu" :class="{ 'is-mobile': isMobile }">
  <div class="submenu-section filter-controls">
  <el-select
  v-model="trackerFilter"
  :placeholder="t('torrent.selectTracker')"
  clearable
  filterable
  :filter-method="filterTrackerOptions"
  class="filter-select"
  @clear="trackerFilter = ''"
  >
  <el-option :label="t('torrent.allTrackers')" value="" />
  <el-option
  v-for="tracker in filteredTrackerOptions"
  :key="tracker.value"
  :label="tracker.label"
  :value="tracker.value"
  />
  </el-select>
  <el-select
  v-if="!isTransmission && categoryOptions.length > 0"
  v-model="categoryFilter"
  :placeholder="t('torrent.selectCategory')"
  clearable
  filterable
  class="filter-select"
  @clear="categoryFilter = ''"
  >
  <el-option :label="t('torrent.allCategories')" value="" />
  <el-option
  v-for="category in categoryOptions"
  :key="category.value"
  :label="category.label"
  :value="category.value"
  />
  </el-select>
  <el-select
  v-if="downloadDirOptions.length > 0"
  v-model="downloadDirFilter"
  :placeholder="t('torrent.selectSaveDir')"
  clearable
  filterable
  class="filter-select"
  @clear="downloadDirFilter = ''"
  >
  <el-option :label="t('torrent.allDirs')" value="" />
  <el-option
  v-for="option in downloadDirOptions"
  :key="option.value"
  :label="option.label"
  :value="option.value"
  />
  </el-select>
  <el-select
  v-if="errorTypeOptions.length > 0"
  v-model="errorTypeFilter"
  :placeholder="t('torrent.selectErrorType')"
  clearable
  filterable
  class="filter-select"
  @clear="errorTypeFilter = ''"
  >
  <el-option :label="t('torrent.allErrors')" value="" />
  <el-option
  v-for="option in errorTypeOptions"
  :key="option.value"
  :label="option.label"
  :value="option.value"
  />
  </el-select>
  <el-select
  v-if="labelOptions.length > 0"
  v-model="labelFilter"
  :placeholder="t('torrent.selectLabel')"
  clearable
  filterable
  class="filter-select"
  @clear="labelFilter = ''"
  >
  <el-option :label="t('torrent.allLabels')" value="" />
  <el-option
  v-if="hasNoLabelTorrent"
  :label="t('torrent.noLabel')"
  value="__no_label__"
  />
  <el-option
  v-for="option in labelOptions"
  :key="option.value"
  :label="option.label"
  :value="option.value"
  />
  </el-select>
  <el-input
  v-model="searchKeyword"
  :placeholder="t('torrent.searchTorrent')"
  :prefix-icon="Search"
  clearable
  class="filter-input"
  />
  </div>
  <div class="submenu-section update-info" v-if="lastFetchedAt">
  <span>{{ t('torrent.dataUpdateTime') }}：{{ lastFetchedAt }}</span>
  </div>
  </div>
  </Transition>
  
  <div class="table-container">
    <TransitionGroup v-if="isCardView" name="card-list" tag="div" class="card-list">
      <TorrentCard
        v-for="torrent in paginatedTorrents"
        :key="torrent.id"
        :name="torrent.name"
        :selected="isTorrentSelected(torrent.id)"
        :is-paused="torrent.status === TorrentStatusEnum.STOPPED"
        :status-text="getStatusText(torrent)"
        :status-type="getStatusType(torrent)"
        :progress-percent="Math.round(getTorrentProgress(torrent) * 100)"
        :size-text="formatBytes(torrent.totalSize)"
        :speed-text="`↓ ${formatSpeed(torrent.rateDownload)} ↑ ${formatSpeed(torrent.rateUpload)}`"
        :eta-text="formatETA(torrent.eta, torrent.status)"
        :ratio-text="formatRatio(torrent.uploadRatio)"
        :error-text="getCardErrorText(torrent)"
        :labels="cardLabels"
        @toggle="(value: boolean) => toggleTorrentSelection(torrent, value)"
        @open="openDetailDialog(torrent)"
        @menu="({ x, y }) => handleCardContextMenu(torrent, x, y)"
      />
    </TransitionGroup>

    <div class="table-scroll" v-else v-loading="loading">
      <el-auto-resizer>
        <template #default="{ height, width }">
          <el-table-v2
            :columns="tableV2Columns"
            :data="paginatedTorrents"
            :width="width"
            :height="height"
            fixed
            :sort-by="v2SortState"
            @column-sort="handleV2Sort"
            @column-resize="handleColumnResizeV2"
            :row-event-handlers="v2RowEventHandlers"
            :row-class="v2RowClassName"
          />
        </template>
      </el-auto-resizer>
    </div>

    <el-empty
      v-if="displayedTorrents.length === 0 && !loading"
      class="list-empty"
      :description="t('home.emptyDescription')"
      :image-size="isMobile ? 72 : 96"
    />

    <div class="pagination" v-if="displayedTorrents.length > 0">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="pageSizeOptions"
        :pager-count="isMobile ? 5 : 7"
        :layout="isMobile ? 'prev, pager, next' : 'total, sizes, prev, pager, next'"
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
        {{ t('torrent.selectedCount', { count: contextMenuTargets.length }) }}
      </div>
      <button
        v-if="contextMenuHasStoppedTorrent"
        @click="handleContextAction('start')"
      >
        {{ contextMenuTargets.length > 1 ? t('torrent.startAll') : t('torrent.startItem') }}
      </button>
      <button
        v-if="contextMenuHasRunningTorrent"
        @click="handleContextAction('stop')"
      >
        {{ contextMenuTargets.length > 1 ? t('torrent.stopAll') : t('torrent.stopItem') }}
      </button>
      <button @click="handleContextAction('verify')">
        {{ contextMenuTargets.length > 1 ? t('torrent.verifyAll') : t('torrent.verify') }}
      </button>
      <button @click="handleContextAction('reannounce')">
        {{ contextMenuTargets.length > 1 ? t('torrent.reannounceAll') : t('torrent.reannounce') }}
      </button>
      <button @click="handleContextAction('location')">{{ t('torrent.changeLocation') }}</button>
      <button @click="handleContextAction('category')">{{ t('torrent.setCategory') }}</button>
      <button @click="handleContextAction('labels')">{{ t('torrent.modifyLabels') }}</button>
      <button
        v-if="contextMenuTargets.length === 1"
        @click="handleContextAction('rename')"
      >
        {{ t('torrent.renameTorrent') }}
      </button>
      <button
        v-if="contextMenuTargets.length === 1"
        @click="handleContextAction('detail')"
      >
        {{ t('torrent.viewDetail') }}
      </button>
      <button @click="handleContextAction('limit')">{{ t('torrent.limitSettings') }}</button>
      <div class="context-menu-divider"></div>
      <button @click="handleContextAction('copy')">{{ t('torrent.copyText') }}</button>
      <div class="context-menu-divider"></div>
      <button class="danger" @click="handleContextAction('delete')">
        {{ t('torrent.deleteItem') }}{{ contextMenuTargets.length > 1 ? t('common.start') : '' }}
      </button>
    </div>

    <!-- 列显示设置对话框 -->
    <el-dialog
      v-model="showColumnDialog"
      :title="t('torrent.columnVisibility')"
      :width="defaultDialogWidth"
      destroy-on-close
    >
      <div class="column-toggle-list">
        <p class="dialog-subtitle">{{ t('torrent.selectColumns') }}</p>
        <el-checkbox-group v-model="visibleColumnKeys" @change="saveColumnVisibility">
          <div
            v-for="col in tableColumns"
            :key="col.key"
            class="column-toggle-item"
          >
            <template v-if="col.key !== 'category' || !isTransmission">
              <el-checkbox :label="col.key" :disabled="col.key === 'name'">
                {{ col.label }}
              </el-checkbox>
            </template>
          </div>
        </el-checkbox-group>
      </div>
      <template #footer>
        <el-button @click="resetColumnWidths">{{ t('torrent.resetColumnWidth') }}</el-button>
        <el-button @click="showColumnDialog = false">{{ t('common.close') }}</el-button>
      </template>
    </el-dialog>

    <!-- 添加种子对话框 -->
    <el-dialog
      v-model="showAddDialog"
      :title="t('torrent.addTorrentBatch')"
      :width="defaultDialogWidth"
    >
      <el-form :model="addForm" label-width="100px">
        <el-form-item :label="t('torrent.source')">
          <el-radio-group v-model="addForm.type">
            <el-radio label="magnet">{{ t('torrent.magnetLink') }}</el-radio>
            <el-radio label="file">{{ t('torrent.torrentFile') }}</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="addForm.type === 'magnet'" :label="t('torrent.magnetLink')">
          <el-input
            v-model="addForm.magnet"
            type="textarea"
            :rows="6"
            :placeholder="t('torrent.magnetLinkPlaceholder') + '\nmagnet:?xt=urn:btih:...\nmagnet:?xt=urn:btih:...'"
          />
        </el-form-item>
        <el-form-item v-else :label="t('torrent.torrentFile')">
          <el-upload
            ref="uploadRef"
            class="torrent-file-upload"
            :auto-upload="false"
            accept=".torrent"
            :on-change="handleFileChange"
            :on-remove="handleFileRemove"
            :file-list="fileList"
            multiple
          >
            <el-button :icon="Upload">{{ t('torrent.selectFile') }}</el-button>
          </el-upload>
        </el-form-item>
        <el-form-item :label="t('torrent.downloadDir')">
          <el-autocomplete
            v-model="addForm.downloadDir"
            :fetch-suggestions="searchDownloadDirs"
            :placeholder="t('torrent.downloadDirPlaceholder')"
            style="width: 100%"
            clearable
            trigger-on-focus
          />
        </el-form-item>
        <el-form-item :label="t('torrent.autoStart')">
          <el-switch
            v-model="addForm.paused"
            :active-value="false"
            :inactive-value="true"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddDialog = false">{{ t('common.cancel') }}</el-button>
        <el-button type="primary" @click="handleAddTorrent">{{ t('common.confirm') }}</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="showLocationDialog"
      :title="t('torrent.changeLocation')"
      :width="defaultDialogWidth"
    >
      <el-form :model="locationForm" label-width="120px">
        <el-form-item :label="t('torrent.newSaveDir')">
          <el-autocomplete
            v-model="locationForm.path"
            :fetch-suggestions="searchDownloadDirs"
            placeholder="/data/downloads"
            style="width: 100%"
            clearable
            trigger-on-focus
          />
        </el-form-item>
        <el-form-item label="">
          <el-checkbox v-model="locationForm.move">{{ t('torrent.moveFiles') }}</el-checkbox>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showLocationDialog = false">{{ t('common.cancel') }}</el-button>
        <el-button type="primary" @click="submitLocationChange">{{ t('common.confirm') }}</el-button>
      </template>
    </el-dialog>

    <!-- 设置分类对话框 -->
    <el-dialog
      v-model="showCategoryDialog"
      :title="t('torrent.setCategory')"
      :width="defaultDialogWidth"
    >
      <el-form :model="categoryForm" label-width="80px">
        <el-form-item :label="t('torrent.categoryName')">
          <el-autocomplete
            v-model="categoryForm.category"
            :fetch-suggestions="searchCategory"
            :placeholder="t('torrent.categoryPlaceholder')"
            style="width: 100%"
            clearable
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCategoryDialog = false">{{ t('common.cancel') }}</el-button>
        <el-button type="primary" @click="submitCategoryChange">{{ t('common.confirm') }}</el-button>
      </template>
    </el-dialog>

    <!-- 批量修改标签对话框 -->
    <el-dialog
      v-model="showLabelsDialog"
      :title="t('torrent.modifyLabels')"
      :width="defaultDialogWidth"
    >
      <p class="dialog-subtitle">
        {{ labelsDialogTargetTorrents.length }} {{ t('torrent.torrentsCount') }}
      </p>

      <el-form :model="labelsForm" label-width="100px">
        <!-- 操作模式选择 -->
        <el-form-item :label="t('torrent.operationMode')">
          <el-radio-group v-model="labelsForm.mode">
            <el-radio label="add">{{ t('torrent.addLabels') }}</el-radio>
            <el-radio label="replace">{{ t('torrent.replaceLabels') }}</el-radio>
            <el-radio label="remove">{{ t('torrent.removeLabels') }}</el-radio>
          </el-radio-group>
          <div class="form-tip">
            {{ getLabelsModeDescription() }}
          </div>
        </el-form-item>

        <!-- 标签输入 -->
        <el-form-item
          :label="labelsForm.mode === 'remove' ? t('torrent.removeLabel') : t('torrent.labels')"
        >
          <el-select
            v-model="labelsForm.selectedLabels"
            multiple
            filterable
            allow-create
            default-first-option
            :placeholder="getLabelsPlaceholder()"
            style="width: 100%"
          >
            <el-option
              v-for="label in availableLabelsOptions"
              :key="label.value"
              :label="label.label"
              :value="label.value"
            />
          </el-select>
          <div class="form-tip">
            {{ getLabelsFormTip() }}
          </div>
        </el-form-item>

        <!-- 当前标签预览（非移除模式下显示） -->
        <el-form-item
          v-if="labelsForm.mode !== 'remove' && currentLabelsPreview.length > 0"
          :label="t('torrent.currentLabels')"
        >
          <div class="current-labels-preview">
            <el-tag
              v-for="label in currentLabelsPreview"
              :key="label"
              size="small"
              class="label-preview-tag"
            >
              {{ label }}
            </el-tag>
          </div>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showLabelsDialog = false">{{ t('common.cancel') }}</el-button>
        <el-button
          type="primary"
          :disabled="!isLabelsFormValid"
          @click="submitLabelsChange"
        >
          {{ t('common.confirm') }}
        </el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="showDetailDialog"
      :title="t('torrent.torrentDetail')"
      :width="detailDialogWidth"
      class="detail-dialog"
    >
      <el-skeleton :loading="detailLoading" animated>
        <template #default>
          <template v-if="detailTorrent">
            <el-tabs
              v-model="detailActiveTab"
              class="detail-tabs"
              type="border-card"
            >
              <el-tab-pane :label="t('torrent.basicInfo')" name="basic">
                <el-descriptions :column="2" size="small" border>
                  <el-descriptions-item
                    :label="t('torrent.name')"
                    :span="2"
                    class-name="torrent-name-item"
                  >
                    <div class="torrent-name-wrapper">
                      <span class="torrent-name-text">{{ detailTorrent.name }}</span>
                      <el-button
                        class="torrent-rename-btn"
                        link
                        size="small"
                        :icon="Edit"
                        :title="t('torrent.renameTorrent')"
                        @click="openRenameTorrentDialog(detailTorrent)"
                      />
                    </div>
                  </el-descriptions-item>
                  <el-descriptions-item :label="t('torrent.state')">
                    <el-tag size="small" :type="getStatusType(detailTorrent) as any">
                      {{ getStatusText(detailTorrent) }}
                    </el-tag>
                  </el-descriptions-item>
                  <el-descriptions-item :label="t('torrent.progressLabel')">
                    {{ Math.round(getTorrentProgress(detailTorrent) * 100) }}%
                  </el-descriptions-item>
                  <el-descriptions-item :label="t('torrent.sizeLabel')">
                    {{ formatBytes(detailTorrent.totalSize) }}
                  </el-descriptions-item>
                  <el-descriptions-item :label="t('torrent.ratioLabel')">
                    {{ formatRatio(detailTorrent.uploadRatio) }}
                  </el-descriptions-item>
                  <el-descriptions-item :label="t('torrent.downloadedLabel')">
                    {{ formatBytes(detailTorrent.downloadedEver || 0) }}
                  </el-descriptions-item>
                  <el-descriptions-item :label="t('torrent.uploadedLabel')">
                    {{ formatBytes(detailTorrent.uploadedEver || 0) }}
                  </el-descriptions-item>
                  <el-descriptions-item :label="t('torrent.addedTime')">
                    {{ formatTorrentDate(detailTorrent.addedDate) }}
                  </el-descriptions-item>
                  <el-descriptions-item :label="t('torrent.lastActivity')">
                    {{ formatLastActivity(detailTorrent.activityDate) }}
                  </el-descriptions-item>
                  <el-descriptions-item :label="t('torrent.savePath')" :span="2">
                    {{ detailTorrent.downloadDir }}
                  </el-descriptions-item>
                  <el-descriptions-item :label="t('torrent.hash')" :span="2">
                    <span class="hash-value">{{
                      detailTorrent.hashString
                    }}</span>
                  </el-descriptions-item>
                  <el-descriptions-item
                    v-if="detailTorrent.category"
                    :label="t('torrent.categoryLabel')"
                    :span="2"
                  >
                    <el-tag size="small">{{ detailTorrent.category }}</el-tag>
                  </el-descriptions-item>
                  <el-descriptions-item
                    v-if="detailTorrent.comment"
                    :label="t('torrent.description')"
                    :span="2"
                  >
                    <span
                      v-html="formatCommentWithLinks(detailTorrent.comment)"
                    ></span>
                  </el-descriptions-item>
                  <el-descriptions-item
                    v-if="detailTorrent.errorString"
                    :label="t('torrent.errorInfo')"
                    :span="2"
                  >
                    <div>
                      <el-text type="danger" style="font-weight: 600">{{
                        getFriendlyErrorMessage(detailTorrent.errorString)
                      }}</el-text>
                      <div
                        style="margin-top: 8px; opacity: 0.7; font-size: 12px"
                      >
                        <el-text type="info"
                          >{{ t('torrent.originalError') }}: {{ detailTorrent.errorString }}</el-text
                        >
                      </div>
                    </div>
                  </el-descriptions-item>
                </el-descriptions>
              </el-tab-pane>

              <el-tab-pane :label="t('torrent.fileContent')" name="content">
                <div v-if="detailFiles.length" class="files-container">
                  <div class="files-actions">
                    <span class="files-count"
                      >{{ t('torrent.selected') }} {{ detailSelectedFileCount }} /
                      {{ detailTotalFileCount }}</span
                    >
                    <div class="files-actions-buttons">
                      <el-button
                        size="small"
                        @click="toggleAllDetailFiles(true)"
                        >{{ t('torrent.selectAll') }}</el-button
                      >
                      <el-button
                        size="small"
                        @click="toggleAllDetailFiles(false)"
                        >{{ t('torrent.deselectAll') }}</el-button
                      >
                      <el-button
                        type="primary"
                        size="small"
                        :loading="detailFilesSaving"
                        @click="saveDetailFileSelections"
                      >
                        {{ t('common.save') }}
                      </el-button>
                    </div>
                  </div>
                  <el-tree
                    ref="detailFilesTreeRef"
                    class="files-tree"
                    :data="detailFileTree"
                    node-key="key"
                    show-checkbox
                    default-expand-all
                    :expand-on-click-node="false"
                    :props="{ children: 'children', label: 'label' }"
                    @check="handleDetailFileCheck"
                  >
                    <template #default="{ data }">
                      <div class="file-node">
                        <el-icon class="file-icon" v-if="data.isDir"><Folder /></el-icon>
                        <el-icon class="file-icon" v-else><Document /></el-icon>
                        <span class="file-name" :title="data.fullPath || data.label">{{ data.label }}</span>
                        <span class="file-meta" v-if="!data.isDir">
                          {{
                            formatBytes(
                              detailTorrent?.files?.[data.index!]?.bytesCompleted || 0
                            )
                          }}
                          /
                          {{
                            formatBytes(detailTorrent?.files?.[data.index!]?.length || 0)
                          }}
                        </span>
                        <el-button
                          class="file-rename-btn"
                          link
                          size="small"
                          :icon="Edit"
                          :title="data.isDir ? t('torrent.renameFolder') : t('torrent.renameFile')"
                          @click.stop="openRenamePathDialog(data)"
                        />
                      </div>
                    </template>
                  </el-tree>
                </div>
                <el-empty v-else :description="t('torrent.noFileInfo')" :image-size="80" />
              </el-tab-pane>

              <el-tab-pane :label="t('torrent.trackerLabel')" name="tracker">
                <div v-if="detailTrackerRows.length">
                  <el-table
                    :data="detailTrackerRows"
                    size="small"
                    border
                    max-height="400"
                  >
                    <el-table-column
                      prop="tier"
                      :label="t('torrent.tier')"
                      width="60"
                      align="center"
                    />
                    <el-table-column
                      prop="announce"
                      :label="t('torrent.announceUrl')"
                      min-width="200"
                      show-overflow-tooltip
                    />
                    <el-table-column :label="t('torrent.trackerStatus')" width="100" align="center">
                      <template #default="{ row }">
                        <el-tooltip
                          :content="row.announceResult"
                          :disabled="row.statusType !== 'danger' || !row.announceResult"
                          placement="top"
                        >
                          <el-tag size="small" :type="row.statusType">{{
                            row.statusText
                          }}</el-tag>
                        </el-tooltip>
                      </template>
                    </el-table-column>
                    <el-table-column
                      prop="lastAnnounce"
                      :label="t('torrent.lastAnnounce')"
                      width="140"
                      v-if="isTransmission"
                    />
                    <el-table-column
                      prop="nextAnnounce"
                      :label="t('torrent.nextAnnounce')"
                      width="140"
                      v-if="isTransmission"
                    />
                    <el-table-column
                      prop="announceResult"
                      :label="t('torrent.announceResult')"
                      min-width="160"
                      show-overflow-tooltip
                      v-if="isTransmission"
                    />
                  </el-table>
                </div>
                <el-empty
                  v-else
                  :description="t('torrent.noTracker')"
                  :image-size="80"
                />
              </el-tab-pane>

              <el-tab-pane :label="t('torrent.peersLabel')" name="peers">
                <div v-if="detailPeers.length">
                  <el-table
                    :data="detailPeers"
                    size="small"
                    border
                    max-height="400"
                  >
                    <el-table-column
                      :label="t('torrent.countryRegion')"
                      width="100"
                      align="center"
                    >
                      <template #default="{ row }">
                        <span v-if="row.countryFlag" :title="row.country">
                          {{ row.countryFlag }} {{ row.country }}
                        </span>
                        <span v-else style="color: var(--bc-text-subtle)">-</span>
                      </template>
                    </el-table-column>
                    <el-table-column
                      prop="address"
                      :label="t('torrent.ipAddress')"
                      width="130"
                    />
                    <el-table-column
                      prop="port"
                      :label="t('torrent.port')"
                      width="70"
                      align="center"
                    />
                    <el-table-column
                      prop="client"
                      :label="t('torrent.client')"
                      min-width="100"
                      show-overflow-tooltip
                    />
                    <el-table-column :label="t('torrent.progressLabel')" width="80" align="center">
                      <template #default="{ row }">
                        {{ Math.round(row.progress * 100) }}%
                      </template>
                    </el-table-column>
                    <el-table-column :label="t('torrent.downloadSpeedCol')" width="100" align="right">
                      <template #default="{ row }">
                        {{
                          row.rateToClient > 0
                            ? formatBytes(row.rateToClient) + "/s"
                            : "—"
                        }}
                      </template>
                    </el-table-column>
                    <el-table-column :label="t('torrent.uploadSpeedCol')" width="100" align="right">
                      <template #default="{ row }">
                        {{
                          row.rateToPeer > 0
                            ? formatBytes(row.rateToPeer) + "/s"
                            : "—"
                        }}
                      </template>
                    </el-table-column>
                    <el-table-column
                      prop="flagStr"
                      :label="t('torrent.flags')"
                      width="80"
                      align="center"
                    />
                  </el-table>
                </div>
                <el-empty
                  v-else
                  :description="t('torrent.noPeers')"
                  :image-size="80"
                />
              </el-tab-pane>
            </el-tabs>
          </template>
          <el-empty v-else :description="t('torrent.notFound')" :image-size="100" />
        </template>
      </el-skeleton>
      <template #footer>
        <el-button
          v-if="detailTorrent"
          :disabled="
            detailTorrent.status === TorrentStatusEnum.CHECK ||
            detailTorrent.status === TorrentStatusEnum.CHECK_WAIT
          "
          @click="verifyTorrentsById([detailTorrent.id])"
        >
          {{ t('torrent.verify') }}
        </el-button>
        <el-button @click="showDetailDialog = false">{{ t('common.close') }}</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="limitDialogVisible"
      :title="limitDialogTitle"
      :width="limitDialogWidth"
      class="limit-dialog"
    >
      <p class="dialog-subtitle" v-if="limitDialogMode === 'batch'">
        {{ (limitDialogTargetTorrents.length === torrents.length ? t('torrent.allTorrents') : t('torrent.selected')) }}：{{ limitDialogTargetTorrents.length }} {{ t('torrent.torrentsCount') }}
      </p>
      <p class="dialog-subtitle" v-else>
        {{ limitDialogTargetName }}
      </p>
      <el-form
        :model="limitDialogForm"
        label-width="100px"
        v-loading="limitDialogLoading"
        class="limit-form"
      >
        <!-- 批量模式：显示tracker筛选 -->
        <el-form-item v-if="limitDialogMode === 'batch'" :label="t('torrent.filterSite')">
          <el-select
            v-model="limitDialogForm.selectedTrackers"
            multiple
            filterable
            allow-create
            default-first-option
            :placeholder="t('torrent.filterSitePlaceholder')"
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
        <el-form-item :label="t('torrent.downloadLimitLabel')">
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
        <el-form-item :label="t('torrent.uploadLimitLabel')">
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
      </el-form>
      <template #footer>
        <el-button @click="limitDialogVisible = false">{{ t('common.cancel') }}</el-button>
        <el-button
          type="primary"
          :loading="limitDialogSaving"
          @click="submitLimitSettings"
        >
          {{ t('common.save') }}
        </el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="replaceTrackerDialogVisible"
      :title="t('torrent.batchReplaceTrackerTitle')"
      :width="isMobile ? '95%' : '500px'"
      class="replace-tracker-dialog"
    >
      <p class="dialog-subtitle">
        {{ t('torrent.replaceTrackerWarning', { count: torrents.length }) }}
      </p>
      <el-form
        :model="replaceTrackerForm"
        label-width="120px"
        v-loading="replaceTrackerLoading"
        class="replace-tracker-form"
      >
        <el-form-item :label="t('torrent.oldDomain')" required>
          <el-input
            v-model="replaceTrackerForm.oldUrl"
            :placeholder="t('torrent.oldDomainPlaceholder')"
            clearable
          />
          <div class="form-tip">{{ t('torrent.oldDomainTip') }}</div>
        </el-form-item>
        <el-form-item :label="t('torrent.newDomain')" required>
          <el-input
            v-model="replaceTrackerForm.newUrl"
            :placeholder="t('torrent.newDomainPlaceholder')"
            clearable
          />
          <div class="form-tip">{{ t('torrent.newDomainTip') }}</div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="replaceTrackerDialogVisible = false">{{ t('common.cancel') }}</el-button>
        <el-button
          type="primary"
          :loading="replaceTrackerLoading"
          :disabled="!replaceTrackerForm.oldUrl || !replaceTrackerForm.newUrl"
          @click="submitReplaceTracker"
        >
          {{ t('torrent.replaceButton') }}
        </el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="removeDialog.visible"
      :title="t('torrent.deleteItem')"
      :width="removeDialogWidth"
    >
      <p class="delete-message">
        {{
          removeDialog.message ||
          t('torrent.deleteConfirm', { count: removeDialog.ids.length })
        }}
      </p>
      <el-checkbox v-model="removeDialog.withData"
        >{{ t('torrent.deleteWithFiles') }}</el-checkbox
      >
      <template #footer>
        <el-button :disabled="removeDialog.loading" @click="removeDialog.visible = false">{{ t('common.cancel') }}</el-button>
        <el-button type="danger" :loading="removeDialog.loading" @click="confirmRemoveDialog">{{ t('common.delete') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import {
  ref,
  shallowRef,
  computed,
  onMounted,
  onBeforeUnmount,
  watch,
  nextTick,
} from "vue";
import {
  ElMessage,
  ElLoading,
  ElTableV2,
  ElAutoResizer,
  ElTree,
} from "element-plus";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/zh-cn";
import "dayjs/locale/en";

dayjs.extend(relativeTime);
import {
  Plus,
  Refresh,
  Search,
  VideoPlay,
  VideoPause,
  Delete,
  Odometer,
  Upload,
  Filter,
  Folder,
  Document,
  Operation,
  MoreFilled,
  Edit,
  Grid,
  List,
} from "@element-plus/icons-vue";
import TorrentCard from "@/components/TorrentCard.vue";
import * as api from "@/api/torrents";
import type { Torrent, TorrentStatus } from "@/types/transmission";
import { TorrentStatusEnum } from "@/types/transmission";
import type { StatusTagType } from "@/types/torrent";
import {
  getTrackerDisplayName,
} from "@/utils/torrent";
import {
  getTorrentErrorMessage,
  isTorrentError,
  getTorrentStatusText,
} from "@/utils/torrentStatus";
import { getIPGeolocation } from "@/utils/ipGeolocation";
import { useMediaQuery } from "@/utils/useMediaQuery";
import { formatBytes, formatSpeed } from "@/utils/format";
import {
  AdaptivePoller,
  SerialExecutor,
  SingleFlightExecutor,
} from "@/utils/polling";
import { useFilterStore, urlToStatus, statusToUrl } from "@/stores/filter";
import { useSystemStatusStore } from "@/stores/systemStatus";
import { storeToRefs } from "pinia";
import { isTransmission } from "@/config/torrentClient";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { buildErrorMappings, matchErrorMapping } from "@/utils/errorMapping";
import { useNotifications } from "@/composables/useNotifications";
import { useTorrentSelection } from "@/composables/useTorrentSelection";
import { useTorrentListQuery } from "@/composables/useTorrentListQuery";
import {
  useTorrentTable,
  type TorrentColumnConfig,
} from "@/composables/useTorrentTable";
import { useTorrentFacets } from "@/composables/useTorrentFacets";
import { ElMessageBox } from "element-plus";

const REFRESH_INTERVAL = 3000;
const COLUMN_WIDTH_STORAGE_KEY = "tv_table_column_widths";
const COLUMN_VISIBILITY_STORAGE_KEY = "tv_table_column_visibility";
const showColumnDialog = ref(false);
const visibleColumnKeys = ref<string[]>([]);

const saveColumnVisibility = () => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      COLUMN_VISIBILITY_STORAGE_KEY,
      JSON.stringify(visibleColumnKeys.value)
    );
  } catch (error) {
    console.warn("保存列显示状态失败", error);
  }
};

const loadColumnVisibility = () => {
  if (typeof window === "undefined") return;
  try {
    const stored = window.localStorage.getItem(COLUMN_VISIBILITY_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      visibleColumnKeys.value = parsed.filter((key: string) =>
        tableColumns.some((col) => col.key === key)
      );
    } else {
      visibleColumnKeys.value = [...defaultColumnKeys];
    }
  } catch (error) {
    console.warn("读取列显示状态失败", error);
    visibleColumnKeys.value = [...defaultColumnKeys];
  }
};
const DETAIL_FIELDS = [
  "id",
  "name",
  "status",
  "totalSize",
  "percentDone",
  "downloadDir",
  "hashString",
  "uploadedEver",
  "downloadedEver",
  "uploadRatio",
  "activityDate",
  "dateCreated",
  "addedDate",
  "trackers",
  "trackerStats",
  "files",
  "fileStats",
  "downloadLimit",
  "downloadLimited",
  "uploadLimit",
  "uploadLimited",
  "peers",
  "comment",
  "category",
];

const route = useRoute();
const router = useRouter();
const { t, locale } = useI18n();

watch(
  locale,
  (val) => {
    if (val === "zh-CN") {
      dayjs.locale("zh-cn");
    } else {
      dayjs.locale("en");
    }
  },
  { immediate: true }
);

const filterStore = useFilterStore();
const systemStatusStore = useSystemStatusStore();
const releaseTorrentSource = systemStatusStore.registerTorrentSource();
const {
  statusFilter,
  trackerFilter,
  categoryFilter,
  downloadDirFilter,
  errorTypeFilter,
  labelFilter,
} = storeToRefs(filterStore);
const { sessionConfig } = storeToRefs(systemStatusStore);

// 初始化通知功能
const {
  notifyTorrentCompleted,
  notifyTorrentError,
  notifyCheckCompleted,
  notificationState,
  enableNotifications,
  disableNotifications,
} = useNotifications();

// 切换通知开关
const toggleNotifications = async () => {
  if (notificationState.value.enabled) {
    disableNotifications();
    ElMessage.success(t('notification.notificationsDisabled'));
  } else {
    if ('Notification' in window && Notification.permission === 'denied') {
      ElMessage.warning(t('notification.permissionDenied'));
      return;
    }
    const granted = await enableNotifications();
    if (granted) {
      ElMessage.success(t('notification.notificationsEnabled'));
    } else {
      ElMessage.warning(
        'Notification' in window && Notification.permission === 'denied'
          ? t('notification.permissionDenied')
          : t('notification.notificationsDisabled')
      );
    }
  }
};

// 存储之前的种子状态用于比较
interface TorrentStatusSnapshot {
  status: TorrentStatus;
  percentDone: number;
  recheckProgress?: number;
  error?: number;
  generation: number;
}

const previousTorrentStates = new Map<number, TorrentStatusSnapshot>();
let torrentStateGeneration = 0;

// URL 参数同步功能
const syncFiltersFromUrl = () => {
  const statusParam = route.query.status as string | undefined;
  const trackerParam = route.query.tracker as string | undefined;
  const actionParam = route.query.action as string | undefined;

  if (statusParam) {
    const status = urlToStatus(statusParam);
    filterStore.setStatusFilter(status);
  } else {
    filterStore.setStatusFilter('all');
  }

  if (trackerParam) {
    filterStore.setTrackerFilter(trackerParam);
  }

  // 处理 PWA 快捷操作
  if (actionParam) {
    handlePwaAction(actionParam);
  }
};

const pauseAllRunningTorrents = () => {
  const runningTorrents = torrents.value.filter(
    (torrent) => torrent.status !== TorrentStatusEnum.STOPPED
  );
  if (runningTorrents.length > 0) {
    void stopTorrents(runningTorrents.map((torrent) => torrent.id));
  }
};

const startAllStoppedTorrents = () => {
  const stoppedTorrents = torrents.value.filter(
    (torrent) => torrent.status === TorrentStatusEnum.STOPPED
  );
  if (stoppedTorrents.length > 0) {
    void startTorrents(stoppedTorrents.map((torrent) => torrent.id));
  }
};

// 处理 PWA 快捷操作
const handlePwaAction = (action: string) => {
  switch (action) {
    case 'add-torrent':
      showAddDialog.value = true;
      break;
    case 'pause-all':
      pauseAllRunningTorrents();
      break;
    case 'start-all':
      startAllStoppedTorrents();
      break;
  }
  // 清除 URL 参数
  router.replace({ path: '/', query: {} });
};

onMounted(() => {
  // 检查是否是分享目标打开
  const urlParams = new URLSearchParams(window.location.search);
  const sharedText = urlParams.get('text');
  const sharedUrl = urlParams.get('url');
  if (sharedText || sharedUrl) {
    const magnetLink = sharedText || sharedUrl || '';
    if (magnetLink.startsWith('magnet:')) {
      addForm.value.type = 'magnet';
      addForm.value.magnet = magnetLink;
      showAddDialog.value = true;
      // 清除 URL 参数
      router.replace({ path: '/', query: {} });
    }
  }
});

// 监听路由变化，同步 URL 参数到 store
watch(
  () => route.query,
  () => {
    if (route.path === '/') {
      syncFiltersFromUrl();
    }
  }
);

// 监听 trackerFilter 变化，同步到 URL
watch(trackerFilter, (newTracker) => {
  if (route.path !== '/') return;

  const query: Record<string, string> = {};
  const currentStatus = statusToUrl(statusFilter.value);
  if (currentStatus !== 'all') {
    query.status = currentStatus;
  }
  if (newTracker) {
    query.tracker = newTracker;
  }

  // 只有当 query 确实发生变化时才更新 URL
  const currentQuery = route.query;
  const queryChanged =
    (query.status !== currentQuery.status) ||
    (query.tracker !== currentQuery.tracker);

  if (queryChanged) {
    router.replace({ path: '/', query });
  }
});

interface LimitFormState {
  downloadLimited: boolean;
  downloadLimit: number;
  downloadUnit: "KB" | "MB";
  uploadLimited: boolean;
  uploadLimit: number;
  uploadUnit: "KB" | "MB";
  selectedTrackers: string[];
}

const createEmptyLimitForm = (): LimitFormState => ({
  downloadLimited: false,
  downloadLimit: 0,
  downloadUnit: "KB",
  uploadLimited: false,
  uploadLimit: 0,
  uploadUnit: "KB",
  selectedTrackers: [],
});

// 错误消息映射：与 ReseedView 共用 buildErrorMappings，避免关键词表双份漂移
const errorMappings = buildErrorMappings({ t, namespace: "torrent", locale: locale.value });

// 获取友好的错误提示
const getFriendlyErrorMessage = (errorString?: string): string => {
  if (!errorString) return t('torrent.unknownError');
  return matchErrorMapping(errorString, errorMappings)?.message ?? errorString;
};

// 获取错误类型（用于筛选）
const getErrorType = (errorString?: string): string => {
  if (!errorString) return t('torrent.otherError');
  return matchErrorMapping(errorString, errorMappings)?.type ?? t('torrent.otherError');
};

const defaultColumnWidths: Record<string, number> = {
  name: 300,
  status: 100,
  percentDone: 100,
  totalSize: 90,
  uploadRatio: 90,
  defaultTracker: 160,
  peersDownloading: 100,
  peersUploading: 100,
  rateDownload: 100,
  rateUpload: 100,
  speedLimit: 110,
  eta: 140,
  uploadedEver: 100,
  downloadDir: 200,
  addedDate: 150,
  activityDate: 150,
  labels: 100,
  category: 100,
};

// 定义表格列配置
const tableColumns: TorrentColumnConfig[] = [
  {
    key: "name",
    label: t('torrent.col.name'),
    prop: "name",
    sortable: true,
    minWidth: 130,
    defaultWidth: 320,
    showInCompact: true,
  },
  {
    key: "status",
    label: t('torrent.col.status'),
    minWidth: 50,
    defaultWidth: 120,
    showInCompact: true,
  },
  {
    key: "percentDone",
    label: t('torrent.col.progress'),
    prop: "percentDone",
    sortable: true,
    minWidth: 60,
    defaultWidth: 140,
    showInCompact: true,
  },
  {
    key: "totalSize",
    label: t('torrent.col.size'),
    prop: "totalSize",
    sortable: true,
    minWidth: 60,
    defaultWidth: 140,
    showInCompact: true,
  },
  {
    key: "uploadRatio",
    label: t('torrent.col.ratio'),
    prop: "uploadRatio",
    sortable: true,
    minWidth: 35,
    defaultWidth: 70,
    showInCompact: false,
  },
  {
    key: "rateDownload",
    label: t('torrent.col.downloadSpeed'),
    prop: "rateDownload",
    sortable: true,
    minWidth: 60,
    defaultWidth: 140,
    showInCompact: true,
  },
  {
    key: "rateUpload",
    label: t('torrent.col.uploadSpeed'),
    prop: "rateUpload",
    sortable: true,
    minWidth: 60,
    defaultWidth: 140,
    showInCompact: true,
  },
  {
    key: "speedLimit",
    label: t('torrent.col.limit'),
    prop: "speedLimit",
    sortable: true,
    minWidth: 55,
    defaultWidth: 120,
    showInCompact: true,
  },
  {
    key: "defaultTracker",
    label: t('torrent.col.server'),
    prop: "defaultTracker",
    sortable: true,
    minWidth: 40,
    defaultWidth: 80,
    showInCompact: false,
  },
  {
    key: "peersDownloading",
    label: t('torrent.col.seedsCol'),
    prop: "peersDownloading",
    sortable: true,
    minWidth: 55,
    defaultWidth: 130,
    showInCompact: false,
  },
  {
    key: "peersUploading",
    label: t('torrent.col.peersCol'),
    prop: "peersUploading",
    sortable: true,
    minWidth: 55,
    defaultWidth: 130,
    showInCompact: false,
  },
  {
    key: "uploadedEver",
    label: t('torrent.col.uploaded'),
    prop: "uploadedEver",
    sortable: true,
    minWidth: 65,
    defaultWidth: 150,
    showInCompact: false,
  },
  {
    key: "downloadDir",
    label: t('torrent.col.downloadDir'),
    prop: "downloadDir",
    sortable: true,
    minWidth: 80,
    defaultWidth: 220,
    showInCompact: false,
  },
  {
    key: "addedDate",
    label: t('torrent.col.addedOn'),
    prop: "addedDate",
    sortable: true,
    minWidth: 75,
    defaultWidth: 180,
    showInCompact: false,
  },
  {
    key: "activityDate",
    label: t('torrent.col.lastActivityCol'),
    prop: "activityDate",
    sortable: true,
    minWidth: 75,
    defaultWidth: 180,
    showInCompact: false,
  },
  {
    key: "labels",
    label: t('torrent.col.labels'),
    minWidth: 75,
    defaultWidth: 200,
    showInCompact: false,
  },
  {
    key: "category",
    label: t('torrent.col.category'),
    prop: "category",
    sortable: true,
    minWidth: 60,
    defaultWidth: 120,
    showInCompact: false,
  },
];

const defaultColumnKeys = tableColumns.map((col) => col.key);

// Initialize visible columns if empty
if (visibleColumnKeys.value.length === 0) {
  visibleColumnKeys.value = [...defaultColumnKeys];
}

const loading = ref(false);
// API responses are immutable snapshots. Avoid recursively proxying large
// tracker/file trees; incremental updates replace changed objects instead.
const torrents = shallowRef<Torrent[]>([]);
const getActivePerTorrentLimitsKB = (torrent: Torrent) => {
  const downloadLimit = torrent.downloadLimited
    ? Math.max(0, Math.round((torrent.downloadLimit as number) || 0))
    : 0;
  const uploadLimit = torrent.uploadLimited
    ? Math.max(0, Math.round((torrent.uploadLimit as number) || 0))
    : 0;
  return { downloadLimit, uploadLimit };
};
const hasAnyPerTorrentLimit = computed(() => {
  return torrents.value.some((tor) => {
    const { downloadLimit, uploadLimit } = getActivePerTorrentLimitsKB(tor);
    return downloadLimit > 0 || uploadLimit > 0;
  });
});
const trackerSearchKeyword = ref("");
const showAddDialog = ref(false);
const addForm = ref({
  type: "magnet",
  magnet: "",
  files: [] as File[],
  downloadDir: "",
  paused: false,
});
const uploadRef = ref();
const fileList = ref<any[]>([]);
const showLocationDialog = ref(false);
const locationForm = ref({
  path: "",
  move: true,
});
const locationTarget = ref<Torrent | null>(null);
const locationTargetIds = ref<number[]>([]);
const showCategoryDialog = ref(false);
const categoryForm = ref({
  category: "",
});
const categoryTarget = ref<Torrent | null>(null);
const categoryTargetIds = ref<number[]>([]);
const availableCategories = ref<string[]>([]);
// 批量修改标签对话框相关
const showLabelsDialog = ref(false);
const labelsDialogTargetTorrents = ref<Torrent[]>([]);
const labelsForm = ref({
  mode: "add" as "add" | "replace" | "remove",
  selectedLabels: [] as string[],
});
const showDetailDialog = ref(false);
const detailLoading = ref(false);
const detailTorrent = ref<Torrent | null>(null);
const detailActiveTab = ref<"basic" | "content" | "tracker" | "peers">("basic");
const detailFileSelections = ref<Record<number, boolean>>({});
const detailFilesSaving = ref(false);
const detailPeers = ref<
  Array<{
    address: string;
    port: number;
    client: string;
    progress: number;
    rateToClient: number;
    rateToPeer: number;
    flagStr: string;
    country?: string;
    countryFlag?: string;
  }>
>([]);
const removeDialog = ref({
  visible: false,
  ids: [] as number[],
  withData: false,
  message: "",
  loading: false,
});
const lastFetchedAt = ref("");
const limitDialogVisible = ref(false);
const limitDialogIds = ref<number[]>([]);
const limitDialogTargetTorrents = ref<Torrent[]>([]);
const limitDialogForm = ref<LimitFormState>(createEmptyLimitForm());
const limitDialogSaving = ref(false);
const limitDialogMode = ref<"batch" | "single">("batch");
const limitDialogTargetName = ref("");
const limitDialogLoading = ref(false);
const limitDialogTitle = computed(() =>
  limitDialogMode.value === "single" ? t('torrent.limitSettings') : t('torrent.batchLimit')
);

// 批量替换tracker对话框相关
const replaceTrackerDialogVisible = ref(false);
const replaceTrackerLoading = ref(false);
const replaceTrackerForm = ref({
  oldUrl: "",
  newUrl: "",
});

// 从目标种子中提取所有唯一的tracker
const limitDialogTrackerOptions = computed(() => {
  const trackerMap = new Map<string, string>();
  limitDialogTargetTorrents.value.forEach((torrent) => {
    torrent.trackers?.forEach((tracker) => {
      const displayName = getTrackerDisplayName(tracker.announce);
      trackerMap.set(displayName, displayName);
    });
  });
  return Array.from(trackerMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([displayName]) => ({ label: displayName, value: displayName }));
});

// 计算筛选后将影响的种子数量
const limitDialogFilteredTorrents = computed(() => {
  const selectedTrackers = limitDialogForm.value.selectedTrackers;
  if (!selectedTrackers.length) {
    return limitDialogTargetTorrents.value;
  }
  return limitDialogTargetTorrents.value.filter((torrent) => {
    return torrent.trackers?.some((tracker) => {
      const displayName = getTrackerDisplayName(tracker.announce);
      return selectedTrackers.includes(displayName);
    });
  });
});

const limitDialogFilteredCount = computed(() => {
  const selectedTrackers = limitDialogForm.value.selectedTrackers;
  const filteredCount = limitDialogFilteredTorrents.value.length;
  const totalCount = limitDialogTargetTorrents.value.length;
  if (!selectedTrackers.length) {
    return t('torrent.applyToAll', { count: totalCount });
  }
  return t('torrent.applyToFiltered', { count: filteredCount, total: totalCount });
});

const isMobile = useMediaQuery("(max-width: 768px)");
const isCompactTable = useMediaQuery("(max-width: 1100px)");
const showMobileFilters = ref(!isMobile.value);

// 2.0：视图模式（表格 / 卡片），移动端默认卡片，可手动切换
const preferredViewMode = ref<"table" | "card">(isMobile.value ? "card" : "table");
const isCardView = computed(() => preferredViewMode.value === "card");
const toggleViewMode = () => {
  preferredViewMode.value = preferredViewMode.value === "card" ? "table" : "card";
};

const cardLabels = computed(() => ({
  size: t("home.cardLabels.size"),
  speed: t("home.cardLabels.speed"),
  eta: t("home.cardLabels.eta"),
  ratio: t("home.cardLabels.ratio"),
}));
const getCardErrorText = (torrent: Torrent): string | undefined => {
  if (!isTorrentError(torrent)) return undefined;
  return getErrorType(getTorrentErrorMessage(torrent));
};
const handleCardContextMenu = (torrent: Torrent, x: number, y: number) => {
  const isRowSelected = isTorrentSelected(torrent.id);
  contextMenuTargets.value =
    isRowSelected && selectedTorrents.value.length > 0
      ? [...selectedTorrents.value]
      : [torrent];
  contextMenu.value = { visible: true, x, y, torrent };
  nextTick(adjustContextMenuPosition);
};
const columnWidths = ref<Record<string, number>>({ ...defaultColumnWidths });
const createDialogWidth = (desktopWidth: string, mobileWidth = "94vw") =>
  computed(() => (isMobile.value ? mobileWidth : desktopWidth));
const defaultDialogWidth = createDialogWidth("600px");
const detailDialogWidth = createDialogWidth("900px", "96vw");
const limitDialogWidth = createDialogWidth("480px");
const removeDialogWidth = createDialogWidth("420px", "90vw");

const currentLabelsPreview = computed(() => {
  const labelsSet = new Set<string>();
  labelsDialogTargetTorrents.value.forEach((torrent) => {
    if (torrent.labels && torrent.labels.length > 0) {
      torrent.labels.forEach((label) => {
        // 排除分类标签
        if (!label.startsWith("category:")) {
          labelsSet.add(label);
        }
      });
    }
  });
  return Array.from(labelsSet).sort();
});

const isLabelsFormValid = computed(() => {
  return labelsForm.value.selectedLabels.length > 0;
});

const toggleMobileFilters = () => {
  if (!isMobile.value) return;
  showMobileFilters.value = !showMobileFilters.value;
};
const getColumnWidth = (key: string, fallback?: number) =>
  columnWidths.value[key] ?? fallback ?? defaultColumnWidths[key] ?? 70;

const contextMenu = ref<{
  visible: boolean;
  x: number;
  y: number;
  torrent: Torrent | null;
}>({
  visible: false,
  x: 0,
  y: 0,
  torrent: null,
});
const contextMenuRef = ref<HTMLElement | null>(null);
const contextMenuTargets = ref<Torrent[]>([]);
// 缓存右键打开菜单时的选中文本（点击菜单项可能导致 selection 被清空）
const contextMenuSelectedText = ref<string>("");

// 计算右键菜单目标中是否有已停止的种子
const contextMenuHasStoppedTorrent = computed(() =>
  contextMenuTargets.value.some((tor) => tor.status === TorrentStatusEnum.STOPPED)
);

// 计算右键菜单目标中是否有运行中的种子
const contextMenuHasRunningTorrent = computed(() =>
  contextMenuTargets.value.some((tor) => tor.status !== TorrentStatusEnum.STOPPED)
);

const getDefaultTracker = (torrent: Torrent): string => {
  // 优先选择第一个汇报成功的tracker
  if (torrent.trackerStats && torrent.trackerStats.length > 0) {
    const successTracker = torrent.trackerStats.find(
      (stat) => stat.lastAnnounceSucceeded
    );
    if (successTracker) {
      return getTrackerDisplayName(successTracker.announce);
    }
  }
  // 如果没有汇报成功的，则使用第一个tracker
  const tracker = torrent.trackers?.[0];
  return tracker ? getTrackerDisplayName(tracker.announce) : "—";
};

const {
  searchKeyword,
  sortState,
  currentPage,
  pageSize,
  pageSizeOptions,
  displayedTorrents,
  paginatedTorrents,
  updateIndexes: updateTorrentIndexes,
  rebuildIndexes: rebuildTorrentIndexes,
  removeIndexes: removeTorrentIndexes,
} = useTorrentListQuery({
  torrents,
  statusFilter,
  trackerFilter,
  categoryFilter,
  downloadDirFilter,
  errorTypeFilter,
  labelFilter,
  getNoCategoryLabel: () => t('torrent.noCategory'),
  getErrorType,
  getDefaultTracker,
});

const persistColumnWidths = () => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      COLUMN_WIDTH_STORAGE_KEY,
      JSON.stringify(columnWidths.value)
    );
  } catch (error) {
    console.warn("保存列宽失败", error);
  }
};

const loadColumnWidths = () => {
  if (typeof window === "undefined") return;
  try {
    const stored = window.localStorage.getItem(COLUMN_WIDTH_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      columnWidths.value = { ...defaultColumnWidths, ...parsed };
    }
  } catch (error) {
    console.warn("读取列宽失败", error);
    columnWidths.value = { ...defaultColumnWidths };
  }
};

const visibleColumns = computed(() => {
  return tableColumns.filter((column) => {
    if (column.key === "speedLimit" && !hasAnyPerTorrentLimit.value) return false;
    if (column.key === "category" && isTransmission) return false;
    return column.key === "name" || visibleColumnKeys.value.includes(column.key);
  });
});

watch(hasAnyPerTorrentLimit, (hasAny) => {
  if (hasAny) return;
  if (sortState.value.prop === "speedLimit") {
    sortState.value = { prop: "addedDate", order: "descending" };
  }
});

const getPeersDownloading = (torrent: Torrent): number => {
  return torrent.peersSendingToUs ?? 0;
};

const getPeersUploading = (torrent: Torrent): number => {
  return torrent.peersGettingFromUs ?? 0;
};

const getTrackerPeerCounts = (torrent: Torrent) => {
  let seeders = 0;
  let leechers = 0;
  torrent.trackerStats?.forEach((stat) => {
    if (typeof stat.seederCount === "number") {
      seeders = Math.max(seeders, stat.seederCount);
    }
    if (typeof stat.leecherCount === "number") {
      leechers = Math.max(leechers, stat.leecherCount);
    }
  });
  return { seeders, leechers };
};

const formatPeerStatText = (total: number, connected: number): string => {
  const connectedText = connected ?? 0;
  if (total > 0) {
    return `${total} (${connectedText})`;
  }
  return `${connectedText}`;
};

const getSeeders = (torrent: Torrent): string => {
  const { seeders } = getTrackerPeerCounts(torrent);
  return formatPeerStatText(seeders, getPeersDownloading(torrent));
};

const getLeechers = (torrent: Torrent): string => {
  const { leechers } = getTrackerPeerCounts(torrent);
  return formatPeerStatText(leechers, getPeersUploading(torrent));
};

const formatRatio = (ratio: number): string => {
  return (ratio ?? 0).toFixed(2);
};

const formatLastActivity = (timestamp?: number): string => {
  if (!timestamp || timestamp <= 0) return "—";
  return dayjs(timestamp * 1000).fromNow();
};

// 下次汇报：显示相对时间（如「5 分钟后」），已过期或未安排则显示 —
const formatNextAnnounce = (timestamp?: number): string => {
  if (!timestamp || timestamp <= 0) return "—";
  if (timestamp * 1000 <= Date.now()) return "—";
  return dayjs(timestamp * 1000).fromNow();
};

const formatTorrentDate = (timestamp?: number): string => {
  if (!timestamp) return "—";
  return dayjs(timestamp * 1000).format("YYYY-MM-DD HH:mm");
};

const formatSpeedLimitText = (torrent: Torrent): { text: string; tooltip: string; active: boolean } => {
  const { downloadLimit: downloadLimitKB, uploadLimit: uploadLimitKB } =
    getActivePerTorrentLimitsKB(torrent);
  const formatLimitValue = (kb: number) => {
    if (kb >= 1024 && kb % 1024 === 0) return `${kb / 1024} MB/s`;
    return `${kb} KB/s`;
  };

  const parts: string[] = [];
  if (downloadLimitKB > 0) parts.push(`↓${formatLimitValue(downloadLimitKB)}`);
  if (uploadLimitKB > 0) parts.push(`↑${formatLimitValue(uploadLimitKB)}`);
  if (!parts.length) {
    return { text: "—", tooltip: "", active: false };
  }
  const tooltip = `${t('torrent.perTorrentLimit')}：${parts.join("，")}`;
  return { text: parts.join(" "), tooltip, active: true };
};

const {
  availableLabelsOptions,
  labelOptions,
  hasNoLabelTorrent,
  trackerOptions,
  categoryOptions,
  downloadDirs,
  downloadDirOptions,
  errorTypeOptions,
} = useTorrentFacets({
  torrents,
  noCategoryLabel: () => t('torrent.noCategory'),
  isTorrentError,
  getErrorType,
});

const getTorrentProgress = (torrent: Torrent): number => {
  // 对于校验状态，使用校验进度
  if (
    torrent.status === TorrentStatusEnum.CHECK ||
    torrent.status === TorrentStatusEnum.CHECK_WAIT
  ) {
    return torrent.recheckProgress ?? torrent.percentDone;
  }
  // 其他状态使用下载进度
  return torrent.percentDone;
};

// 获取进度条悬浮提示内容
const getProgressTooltip = (torrent: Torrent): string => {
  const progress = getTorrentProgress(torrent);
  const progressPercent = Math.round(progress * 100);

  // 如果已完成，不显示提示
  if (progress === 1) {
    return "";
  }

  // 构建提示内容：进度 + 剩余时间
  const parts: string[] = [`${t('torrent.progressTip')}: ${progressPercent}%`];

  // 添加剩余时间（仅对未完成的任务）
  const eta = torrent.eta;
  if (eta !== undefined && eta !== null && eta >= 0) {
    // 排除已完成和已停止的状态
    if (
      torrent.status !== TorrentStatusEnum.SEED &&
      torrent.status !== TorrentStatusEnum.SEED_WAIT &&
      torrent.status !== TorrentStatusEnum.STOPPED
    ) {
      const etaText = formatETA(eta, torrent.status);
      if (etaText && etaText !== "—" && etaText !== t('torrent.unknownEta')) {
        parts.push(`${t('torrent.remainingTime')}: ${etaText}`);
      }
    }
  }

  // 如果有下载速度，也显示
  if (torrent.rateDownload > 0) {
    parts.push(`${t('torrent.downloadSpeedCol')}: ${formatSpeed(torrent.rateDownload)}`);
  }

  return parts.join("\n");
};

const getRatioClass = (ratio: number): string => {
  if (!ratio) return "ratio-zero";
  if (ratio > 0 && ratio < 1) return "ratio-low";
  if (ratio >= 1 && ratio < 3) return "ratio-mid";
  return "ratio-high";
};

const {
  selectedIdsState,
  selectedTorrents,
  hasSelection,
  isAllSelected,
  isIndeterminate,
  isSelected: isTorrentSelected,
  toggleRow: toggleTorrentSelection,
  togglePage: togglePageSelection,
  selectPage: selectCurrentPage,
  handleRowClick: updateSelectionFromRowClick,
  remove: removeFromSelection,
  reconcile: reconcileSelection,
  clear: clearSelection,
} = useTorrentSelection(torrents, paginatedTorrents);

const filteredTrackerOptions = computed(() => {
  if (!trackerSearchKeyword.value) {
    return trackerOptions.value;
  }
  const keyword = trackerSearchKeyword.value.toLowerCase();
  return trackerOptions.value.filter((option) => {
    // 同时搜索中文名、host 和 label
    return (
      option.displayName.toLowerCase().includes(keyword) ||
      option.host.toLowerCase().includes(keyword) ||
      option.label.toLowerCase().includes(keyword)
    );
  });
});

const filterTrackerOptions = (query: string) => {
  trackerSearchKeyword.value = query;
};

const allDownloadDirs = computed(() => {
  const set = new Set<string>();
  const def = sessionConfig.value?.["download-dir"];
  if (def) set.add(def);
  downloadDirs.value.forEach((dir) => set.add(dir));
  return Array.from(set).sort((a, b) => a.localeCompare(b));
});

const searchDownloadDirs = (queryString: string, cb: (results: any[]) => void) => {
  const q = (queryString || "").trim().toLowerCase();
  const list = allDownloadDirs.value.filter(
    (dir) => !q || dir.toLowerCase().includes(q)
  );
  cb(list.map((dir) => ({ value: dir })));
};

const selectedIds = selectedIdsState;
const detailTrackerRows = computed(() => {
  if (!detailTorrent.value?.trackers?.length) return [];
  return detailTorrent.value.trackers.map((tracker, index) => {
    const stat = detailTorrent.value?.trackerStats?.find(
      (s) => s.announce === tracker.announce
    );
    const success = stat?.lastAnnounceSucceeded;
    const announceResult = (stat?.lastAnnounceResult || "").trim();
    const hasAnnounced = stat?.hasAnnounced ?? Boolean(announceResult);
    // 汇报过且失败：说明没连上 tracker（如 "Connection failed"），需要重点关注
    const failed = Boolean(stat) && hasAnnounced && !success && Boolean(announceResult);

    let statusText: string;
    let statusType: string;
    if (success) {
      statusText = t('torrent.announceSuccess');
      statusType = "success";
    } else if (failed) {
      statusText = t('torrent.announceFailed');
      statusType = "danger";
    } else if (stat && hasAnnounced) {
      statusText = t('torrent.announceWaiting');
      statusType = "warning";
    } else {
      statusText = t('torrent.announceNotYet');
      statusType = "info";
    }

    const lastAnnounce = stat?.lastAnnounceTime
      ? formatLastActivity(stat.lastAnnounceTime)
      : "—";
    const nextAnnounce = formatNextAnnounce(stat?.nextAnnounceTime);
    // 成功时 Transmission 会返回 "Success"，展示成本地化的成功文案即可
    const resultText = /^success$/i.test(announceResult)
      ? t('torrent.announceSuccess')
      : announceResult;

    return {
      tier: tracker.tier ?? index,
      announce: tracker.announce,
      statusText,
      statusType,
      lastAnnounce,
      nextAnnounce,
      announceResult: resultText,
    };
  });
});

const detailFiles = computed(() => {
  if (!detailTorrent.value?.files?.length) return [];
  return detailTorrent.value.files.map((file, index) => ({
    ...file,
    index,
    wanted:
      detailFileSelections.value[index] ??
      detailTorrent.value?.fileStats?.[index]?.wanted ??
      true,
  }));
});

const detailTotalFileCount = computed(() => detailFiles.value.length);

const detailSelectedFileCount = computed(
  () =>
    detailFiles.value.filter(
      (file) => detailFileSelections.value[file.index] ?? true
    ).length
);

const detailFilesTreeRef = ref<any>(null);
const detailTreeInitialized = ref(false);

type FileTreeNode = {
  key: string | number;
  label: string;
  isDir: boolean;
  index?: number;
  fullPath?: string;
  children?: FileTreeNode[];
};

const buildDetailFileTree = (files: Array<{ name: string; index: number }>): FileTreeNode[] => {
  const root: FileTreeNode = { key: "__root__", label: "", isDir: true, children: [] };
  const ensureDir = (parent: FileTreeNode, name: string, fullPath: string): FileTreeNode => {
    parent.children = parent.children || [];
    let child = parent.children.find((n) => n.isDir && n.label === name);
    if (!child) {
      child = { key: fullPath, label: name, isDir: true, fullPath, children: [] };
      parent.children.push(child);
    }
    return child;
  };
  files.forEach((file) => {
    const normalizedName = (file.name || "").replace(/\\/g, "/");
    const parts = normalizedName.split("/").filter(Boolean);
    let parent = root;
    let acc = "";
    parts.forEach((part, i) => {
      acc = acc ? `${acc}/${part}` : part;
      const isLast = i === parts.length - 1;
      if (isLast) {
        parent.children = parent.children || [];
        parent.children.push({
          key: file.index,
          label: part,
          isDir: false,
          index: file.index,
          fullPath: acc,
        });
      } else {
        parent = ensureDir(parent, part, acc);
      }
    });
  });
  return root.children || [];
};

const detailFileTree = computed<FileTreeNode[]>(() => {
  const files = detailTorrent.value?.files ?? [];
  return buildDetailFileTree(files.map((f, index) => ({ name: f.name, index })));
});

const detailCheckedFileKeys = computed<number[]>(() =>
  detailFiles.value
    .filter((f) => detailFileSelections.value[f.index] ?? true)
    .map((f) => f.index)
);

const handleDetailFileCheck = () => {
  if (!detailFilesTreeRef.value) return;
  const keys = detailFilesTreeRef.value.getCheckedKeys(true) as Array<number | string>;
  const checkedFileIndexes = keys.filter((k) => typeof k === "number") as number[];
  const selections: Record<number, boolean> = {};
  detailFiles.value.forEach((f) => {
    selections[f.index] = checkedFileIndexes.includes(f.index);
  });
  detailFileSelections.value = selections;
};

watch(detailActiveTab, (tab) => {
  if (tab !== "content") return;
  nextTick(() => {
    if (detailFilesTreeRef.value && !detailTreeInitialized.value) {
      detailFilesTreeRef.value.setCheckedKeys(detailCheckedFileKeys.value);
      detailTreeInitialized.value = true;
    }
  });
});

watch(detailTorrent, () => {
  detailTreeInitialized.value = false;
});

const isScrolling = ref(false);
let scrollStopTimer: number | null = null;
const handleGlobalScroll = () => {
  isScrolling.value = true;
  if (scrollStopTimer) {
    clearTimeout(scrollStopTimer as any);
  }
  scrollStopTimer = window.setTimeout(() => {
    isScrolling.value = false;
  }, 300);
};

watch(isMobile, (mobile) => {
  showMobileFilters.value = !mobile;
});

watch(showLocationDialog, (visible) => {
  if (!visible) {
    locationTarget.value = null;
    locationForm.value.path = "";
  }
});

watch(showAddDialog, (visible) => {
  if (visible) {
    const def = sessionConfig.value?.["download-dir"] || "";
    if (def && !addForm.value.downloadDir) {
      addForm.value.downloadDir = def;
    }
  }
});

watch(showDetailDialog, (visible) => {
  if (!visible) {
    detailTorrent.value = null;
    resetDetailInteractions();
  }
});

watch(
  () => removeDialog.value.visible,
  (visible) => {
    if (!visible) {
      removeDialog.value.ids = [];
      removeDialog.value.withData = false;
      removeDialog.value.message = "";
    }
  }
);

watch(limitDialogVisible, (visible) => {
  if (!visible) {
    limitDialogIds.value = [];
    limitDialogTargetTorrents.value = [];
    limitDialogMode.value = "batch";
    limitDialogTargetName.value = "";
    limitDialogLoading.value = false;
    resetLimitDialogForm();
  }
});

const handleRowContextMenu = (
  row: Torrent,
  _column: any,
  event: MouseEvent
) => {
  event.preventDefault();

  // 先缓存当前选中的文本（点击自定义右键菜单时常会丢失 selection）
  contextMenuSelectedText.value = window.getSelection()?.toString() || "";

  // 判断右键的种子是否在已选择列表中
  const isRowSelected = isTorrentSelected(row.id);

  // 如果右键的种子在选中列表中，使用所有选中的种子；否则只使用当前右键的种子
  if (isRowSelected && selectedTorrents.value.length > 0) {
    contextMenuTargets.value = [...selectedTorrents.value];
  } else {
    contextMenuTargets.value = [row];
  }

  contextMenu.value = {
    visible: true,
    x: event.clientX,
    y: event.clientY,
    torrent: row,
  };
  nextTick(adjustContextMenuPosition);
};

const handleRowDoubleClick = (row: Torrent) => {
  openDetailDialog(row);
};

const handleKeydown = (event: KeyboardEvent) => {
  // Ctrl+A 或 Cmd+A 全选当前页
  if ((event.ctrlKey || event.metaKey) && event.key === "a") {
    // 检查焦点是否在输入框或文本区域中
    const activeElement = document.activeElement;
    const tagName = activeElement?.tagName.toLowerCase();

    // 如果焦点在输入框、文本区域或可编辑元素中，不拦截默认行为
    if (
      tagName === "input" ||
      tagName === "textarea" ||
      (activeElement as HTMLElement)?.isContentEditable
    ) {
      return;
    }

    // 阻止默认的全选文本行为
    event.preventDefault();

    // 全选当前页的所有行
    if (paginatedTorrents.value.length > 0) {
      selectCurrentPage();
    }
  }
};

const hideContextMenu = () => {
  contextMenu.value.visible = false;
  contextMenu.value.torrent = null;
  contextMenuTargets.value = [];
  contextMenuSelectedText.value = "";
};

const clearTorrentSelection = () => {
  clearSelection();
  hideContextMenu();
};

const reloadTorrentsAfterMutation = async () => {
  clearTorrentSelection();
  await loadTorrents();
};

const copyTextToClipboard = async (text: string) => {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.top = "-1000px";
  textarea.style.left = "-1000px";
  document.body.appendChild(textarea);
  textarea.select();
  const ok = document.execCommand("copy");
  document.body.removeChild(textarea);
  if (!ok) throw new Error("copy failed");
};

const adjustContextMenuPosition = () => {
  const menuEl = contextMenuRef.value;
  if (!menuEl) return;
  const rect = menuEl.getBoundingClientRect();
  const padding = 8;
  let x = contextMenu.value.x;
  let y = contextMenu.value.y;
  if (x + rect.width > window.innerWidth - padding) {
    x = window.innerWidth - rect.width - padding;
  }
  if (y + rect.height > window.innerHeight - padding) {
    y = window.innerHeight - rect.height - padding;
  }
  contextMenu.value.x = Math.max(padding, x);
  contextMenu.value.y = Math.max(padding, y);
};

const handleColumnResize = (
  newWidth: number,
  key: string | undefined,
  minWidth: number | undefined
) => {
  if (!key || key === "selection") return;
  const normalizedWidth = Math.max(Number(minWidth) || 80, Math.round(newWidth));
  if (columnWidths.value[key] === normalizedWidth) return;
  columnWidths.value = {
    ...columnWidths.value,
    [key]: normalizedWidth,
  };
  persistColumnWidths();
};

const resetColumnWidths = () => {
  ElMessageBox.confirm(
    t('torrent.resetColumnWidth'),
    {
      confirmButtonText: t('common.confirm'),
      cancelButtonText: t('common.cancel'),
      type: 'warning',
    }
  )
    .then(() => {
      columnWidths.value = { ...defaultColumnWidths };
      window.localStorage.removeItem(COLUMN_WIDTH_STORAGE_KEY);
      
      // 重置列显示
      visibleColumnKeys.value = [...defaultColumnKeys];
      window.localStorage.removeItem(COLUMN_VISIBILITY_STORAGE_KEY);
      
      ElMessage({
        type: 'success',
        message: t('common.success'),
      });
    })
    .catch(() => {});
};

type TorrentLoadMode = "full" | "incremental";
interface TorrentLoadOptions {
  silent?: boolean;
  forceFull?: boolean;
}

const performLoadTorrents = async (mode: TorrentLoadMode): Promise<void> => {
  if (mode === "incremental") {
    if (!torrents.value.length) {
      const full = await api.getTorrents();
      torrents.value = full.torrents;
      rebuildTorrentIndexes(full.torrents);
    } else {
      const inc = await api.getTorrents(undefined, { ids: "recently-active" });
      const removed = inc.removed || [];
      const removedSet = new Set(removed);
      if (removedSet.size) {
        removeFromSelection(removedSet);
        removeTorrentIndexes(removedSet);
      }

      if (removedSet.size || inc.torrents.length) {
        const updates = new Map(
          inc.torrents.map((torrent) => [torrent.id, torrent])
        );
        const nextTorrents: Torrent[] = [];
        for (const current of torrents.value) {
          if (removedSet.has(current.id)) continue;
          const update = updates.get(current.id);
          nextTorrents.push(update ? { ...current, ...update } : current);
          updates.delete(current.id);
        }
        nextTorrents.push(...updates.values());
        torrents.value = nextTorrents;
      }
      updateTorrentIndexes(inc.torrents);
    }
  } else {
    const result = await api.getTorrents();
    torrents.value = result.torrents;
    rebuildTorrentIndexes(result.torrents);
  }

  systemStatusStore.setTorrents(torrents.value);
  checkTorrentStatusChanges();
  reconcileSelection();
  syncContextMenuTorrent();
  lastFetchedAt.value = dayjs().format("YYYY-MM-DD HH:mm:ss");
};

const fullTorrentLoader = new SingleFlightExecutor<void>();
const incrementalTorrentLoader = new SingleFlightExecutor<void>();
const torrentUpdateQueue = new SerialExecutor();
const loadTorrents = async (
  options: TorrentLoadOptions = {}
): Promise<boolean> => {
  const mode: TorrentLoadMode =
    options.silent && isTransmission && !options.forceFull
      ? "incremental"
      : "full";
  const loader = mode === "incremental" ? incrementalTorrentLoader : fullTorrentLoader;

  if (!options.silent) loading.value = true;
  try {
    await loader.run(() =>
      torrentUpdateQueue.run(() => performLoadTorrents(mode))
    );
    return true;
  } catch (error: unknown) {
    if (!options.silent) {
      const message = error instanceof Error ? error.message : String(error);
      ElMessage.error(`${t('torrent.message.loadFailed')}: ${message}`);
    }
    return false;
  } finally {
    if (!options.silent) loading.value = false;
  }
};

const handleManualRefresh = async () => {
  clearTorrentSelection();
  try {
    await loadTorrents();
  } finally {
    clearTorrentSelection();
  }
};

const torrentPoller = new AdaptivePoller(
  () => loadTorrents({ silent: true }),
  {
    intervalMs: REFRESH_INTERVAL,
    maxIntervalMs: 30_000,
    shouldRun: () =>
      !isScrolling.value &&
      (typeof document === "undefined" || document.visibilityState !== "hidden"),
  }
);

const syncContextMenuTorrent = () => {
  if (!contextMenu.value.visible || !contextMenu.value.torrent) return;
  const currentId = contextMenu.value.torrent.id;
  const updated = torrents.value.find((torrent) => torrent.id === currentId);
  if (updated) {
    contextMenu.value.torrent = updated;
  } else {
    hideContextMenu();
  }
};

// 检查种子状态变化并发送通知
const checkTorrentStatusChanges = () => {
  const generation = ++torrentStateGeneration;
  
  torrents.value.forEach((torrent) => {
    const prev = previousTorrentStates.get(torrent.id);
    
    if (prev) {
      // 检查是否下载完成（从非完成状态变为完成状态）
      if (prev.percentDone < 1 && torrent.percentDone === 1) {
        notifyTorrentCompleted(torrent.name);
      }
      
      // 检查是否出错（tracker 的正常响应如 `ook` 不算错误）
      if ((!prev.error || prev.error === 0) && isTorrentError(torrent)) {
        notifyTorrentError(
          torrent.name,
          getTorrentErrorMessage(torrent) || 'Unknown error'
        );
      }
      
      // 检查校验是否完成（从校验状态变为非校验状态且进度100%）
      const wasChecking = prev.status === TorrentStatusEnum.CHECK || prev.status === TorrentStatusEnum.CHECK_WAIT;
      const isChecking = torrent.status === TorrentStatusEnum.CHECK || torrent.status === TorrentStatusEnum.CHECK_WAIT;
      if (wasChecking && !isChecking && torrent.recheckProgress === 1) {
        notifyCheckCompleted(torrent.name);
      }
    }

    if (prev) {
      prev.status = torrent.status;
      prev.percentDone = torrent.percentDone;
      prev.recheckProgress = torrent.recheckProgress;
      prev.error = torrent.error;
      prev.generation = generation;
    } else {
      previousTorrentStates.set(torrent.id, {
        status: torrent.status,
        percentDone: torrent.percentDone,
        recheckProgress: torrent.recheckProgress,
        error: torrent.error,
        generation,
      });
    }
  });

  for (const [id, snapshot] of previousTorrentStates) {
    if (snapshot.generation !== generation) previousTorrentStates.delete(id);
  }
};

const openRemoveDialog = (ids: number[], message: string) => {
  removeDialog.value.ids = ids;
  removeDialog.value.message = message;
  removeDialog.value.withData = false;
  removeDialog.value.visible = true;
};

const confirmRemoveDialog = async () => {
  if (!removeDialog.value.ids.length) {
    removeDialog.value.visible = false;
    return;
  }
  const ids = [...removeDialog.value.ids];
  const deleteData = removeDialog.value.withData;
  removeDialog.value.loading = true;
  try {
    await api.removeTorrents(ids, deleteData);
    ElMessage.success(t('torrent.message.deleted'));
    removeDialog.value.visible = false;
    removeDialog.value.ids = [];
    await reloadTorrentsAfterMutation();
  } catch (error: any) {
    ElMessage.error(`${t('torrent.message.deleteFailed')}: ${error.message}`);
  } finally {
    removeDialog.value.loading = false;
  }
};

let lastForegroundRefreshAt = 0;
const handleForegroundRefresh = () => {
  if (typeof document === "undefined") return;
  if (document.visibilityState === "hidden") return;
  const now = Date.now();
  if (now - lastForegroundRefreshAt < 800) return;
  lastForegroundRefreshAt = now;

  isScrolling.value = false;
  if (scrollStopTimer) {
    clearTimeout(scrollStopTimer as any);
    scrollStopTimer = null;
  }
  void loadTorrents({ silent: true, forceFull: true });
};

const startAutoRefresh = () => {
  torrentPoller.start(false);
};

const stopAutoRefresh = () => {
  torrentPoller.stop();
};

const startSelected = async () => {
  const ids = [...selectedIds.value];
  if (!ids.length) return;
  await startTorrents(ids);
};

const stopSelected = async () => {
  const ids = [...selectedIds.value];
  if (!ids.length) return;
  await stopTorrents(ids);
};

// 开始指定 ID 的种子
const startTorrents = async (ids: number[]) => {
  if (!ids.length) return;
  try {
    await api.startTorrents(ids);
    ElMessage.success(
      ids.length > 1 
        ? t('torrent.message.startedMultiple', { count: ids.length })
        : t('torrent.message.started')
    );
    await reloadTorrentsAfterMutation();
  } catch (error: any) {
    ElMessage.error(`${t('torrent.message.operationFailed')}: ${error.message}`);
  }
};

// 停止指定 ID 的种子
const stopTorrents = async (ids: number[]) => {
  if (!ids.length) return;
  try {
    await api.stopTorrents(ids);
    ElMessage.success(
      ids.length > 1
        ? t('torrent.message.stoppedMultiple', { count: ids.length })
        : t('torrent.message.stopped')
    );
    await reloadTorrentsAfterMutation();
  } catch (error: any) {
    ElMessage.error(`${t('torrent.message.operationFailed')}: ${error.message}`);
  }
};

const removeSelected = () => {
  if (!selectedIds.value.length) return;
  openRemoveDialog(
    [...selectedIds.value],
    t('torrent.deleteConfirm', { count: selectedIds.value.length })
  );
};

const handleActionCommand = (
  command:
    | "start"
    | "stop"
    | "remove"
    | "limit"
    | "labels"
    | "replaceTracker"
    | "resetWidth"
    | "columnVisibility"
    | "toggleNotifications"
) => {
  if (command === "start") {
    startSelected();
    return;
  }
  if (command === "stop") {
    stopSelected();
    return;
  }
  if (command === "remove") {
    removeSelected();
    return;
  }
  if (command === "limit") {
    openBatchLimitDialog();
    return;
  }
  if (command === "labels") {
    openLabelsDialog();
    return;
  }
  if (command === "replaceTracker") {
    openReplaceTrackerDialog();
    return;
  }
  if (command === "resetWidth") {
    resetColumnWidths();
    return;
  }
  if (command === "columnVisibility") {
    showColumnDialog.value = true;
    return;
  }
  if (command === "toggleNotifications") {
    toggleNotifications();
  }
};

const handleContextAction = (
  action:
    | "start"
    | "stop"
    | "delete"
    | "verify"
    | "reannounce"
    | "location"
    | "detail"
    | "limit"
    | "category"
    | "labels"
    | "copy"
    | "rename"
) => {
  const targets = [...contextMenuTargets.value];
  if (!targets.length) return;

  const targetIds = targets.map((tor) => tor.id);
  const isBatch = targets.length > 1;

  hideContextMenu();

  if (action === "start") {
    startTorrentsById(targetIds);
    return;
  }
  if (action === "stop") {
    stopTorrentsById(targetIds);
    return;
  }
  if (action === "delete") {
    if (isBatch) {
      openRemoveDialog(
        targetIds,
        t('torrent.deleteConfirm', { count: targetIds.length })
      );
    } else {
      openRemoveDialog(targetIds, t('torrent.deleteSingleConfirm'));
    }
    return;
  }
  if (action === "verify") {
    verifyTorrentsById(targetIds);
    return;
  }
  if (action === "reannounce") {
    reannounceTorrentsById(targetIds);
    return;
  }
  if (action === "location") {
    openLocationDialog(targets[0]!, isBatch ? targetIds : undefined);
    return;
  }
  if (action === "category") {
    openCategoryDialog(targets[0]!, isBatch ? targetIds : undefined);
    return;
  }
  if (action === "labels") {
    openLabelsDialogWithTargets(targets);
    return;
  }
  if (action === "detail") {
    // 查看详情只支持单个种子
    if (!isBatch) {
      openDetailDialog(targets[0]!);
    }
    return;
  }
  if (action === "rename") {
    if (!isBatch && targets[0]) {
      openRenameTorrentDialog(targets[0]);
    }
    return;
  }
  if (action === "limit") {
    if (isBatch) {
      openBatchLimitDialogWithTargets(targets);
    } else {
      openSingleLimitDialog(targets[0]!);
    }
    return;
  }
  if (action === "copy") {
    let selectedText =
      (window.getSelection()?.toString() || "").trim() ||
      (contextMenuSelectedText.value || "").trim();
      
    // 如果没有选中文本，则默认复制选中的种子名称
    if (!selectedText && targets.length > 0) {
      selectedText = targets.map((tor) => tor.name).join('\n');
    }

    if (!selectedText) {
      ElMessage.warning(t('torrent.message.noTextSelected'));
      return;
    }
    copyTextToClipboard(selectedText).then(() => {
      ElMessage.success(t('torrent.message.copiedToClipboard'));
    }).catch(() => {
      ElMessage.error(t('torrent.message.copyFailed'));
    });
  }
};

// 批量开始种子
const startTorrentsById = async (ids: number[]) => {
  try {
    await api.startTorrents(ids);
    ElMessage.success(
      ids.length > 1 ? t('torrent.message.startedMultiple', { count: ids.length }) : t('torrent.message.started')
    );
    await reloadTorrentsAfterMutation();
    if (detailTorrent.value && ids.includes(detailTorrent.value.id)) {
      await refreshDetailData();
    }
  } catch (error: any) {
    ElMessage.error(`${t('torrent.message.operationFailed')}: ${error.message}`);
  }
};

// 批量暂停种子
const stopTorrentsById = async (ids: number[]) => {
  try {
    await api.stopTorrents(ids);
    ElMessage.success(
      ids.length > 1 ? t('torrent.message.stoppedMultiple', { count: ids.length }) : t('torrent.message.stopped')
    );
    await reloadTorrentsAfterMutation();
    if (detailTorrent.value && ids.includes(detailTorrent.value.id)) {
      await refreshDetailData();
    }
  } catch (error: any) {
    ElMessage.error(`${t('torrent.message.operationFailed')}: ${error.message}`);
  }
};

// 批量校验种子
const verifyTorrentsById = async (ids: number[]) => {
  try {
    await api.verifyTorrents(ids);
    ElMessage.success(
      ids.length > 1 ? t('torrent.message.verifyStartedMultiple', { count: ids.length }) : t('torrent.message.verifyStarted')
    );
    await reloadTorrentsAfterMutation();
    if (detailTorrent.value && ids.includes(detailTorrent.value.id)) {
      await refreshDetailData();
    }
  } catch (error: any) {
    ElMessage.error(`${t('torrent.message.verifyFailed')}: ${error.message}`);
  }
};

// 批量汇报种子
const reannounceTorrentsById = async (ids: number[]) => {
  try {
    await api.reannounceTorrents(ids);
    ElMessage.success(
      ids.length > 1
        ? t('torrent.message.reannouncedMultiple', { count: ids.length })
        : t('torrent.message.reannounced')
    );
  } catch (error: any) {
    ElMessage.error(`${t('torrent.message.reannounceFailed')}: ${error.message}`);
  }
};

const openLocationDialog = (torrent: Torrent, batchIds?: number[]) => {
  locationTarget.value = torrent;
  locationTargetIds.value = batchIds || [torrent.id];
  locationForm.value.path = torrent.downloadDir;
  locationForm.value.move = true;
  showLocationDialog.value = true;
};

const submitLocationChange = async () => {
  if (!locationTargetIds.value.length) {
    showLocationDialog.value = false;
    return;
  }
  const path = locationForm.value.path.trim();
  if (!path) {
    ElMessage.warning(t('torrent.message.enterNewPath'));
    return;
  }
  try {
    await api.setTorrentLocation(
      locationTargetIds.value,
      path,
      locationForm.value.move
    );
    ElMessage.success(
      locationTargetIds.value.length > 1
        ? t('torrent.message.locationUpdatedMultiple', { count: locationTargetIds.value.length })
        : t('torrent.message.locationUpdated')
    );
    showLocationDialog.value = false;
    await reloadTorrentsAfterMutation();
  } catch (error: any) {
    ElMessage.error(`${t('torrent.message.locationChangeFailed')}: ${error.message}`);
  }
};

const openCategoryDialog = async (torrent: Torrent, batchIds?: number[]) => {
  categoryTarget.value = torrent;
  categoryTargetIds.value = batchIds || [torrent.id];
  categoryForm.value.category = torrent.category || "";
  showCategoryDialog.value = true;
  // 加载可用分类列表
  if (api.getCategories) {
    try {
      availableCategories.value = (await api.getCategories()) ?? [];
    } catch (error: any) {
      console.error("加载分类列表失败:", error);
    }
  }
};

const submitCategoryChange = async () => {
  if (!categoryTargetIds.value.length) {
    showCategoryDialog.value = false;
    return;
  }
  const category = categoryForm.value.category.trim();
  try {
    if (api.setTorrentCategory) {
      await api.setTorrentCategory(categoryTargetIds.value, category);
      ElMessage.success(
        categoryTargetIds.value.length > 1
          ? t('torrent.message.categoryUpdatedMultiple', { count: categoryTargetIds.value.length })
          : t('torrent.message.categoryUpdated')
      );
      showCategoryDialog.value = false;
      await reloadTorrentsAfterMutation();
    } else {
      ElMessage.warning(t('torrent.message.categoryNotSupported'));
    }
  } catch (error: any) {
    ElMessage.error(`${t('torrent.message.setCategoryFailed')}: ${error.message}`);
  }
};

const searchCategory = (queryString: string, cb: (results: any[]) => void) => {
  const results = availableCategories.value
    .filter(
      (cat) =>
        !queryString || cat.toLowerCase().includes(queryString.toLowerCase())
    )
    .map((cat) => ({ value: cat }));
  cb(results);
};

// 批量修改标签相关函数
const openLabelsDialog = () => {
  if (!selectedTorrents.value.length) {
    ElMessage.warning(t('torrent.message.selectTorrentsFirst'));
    return;
  }
  labelsDialogTargetTorrents.value = [...selectedTorrents.value];
  labelsForm.value = {
    mode: "add",
    selectedLabels: [],
  };
  showLabelsDialog.value = true;
};

const openLabelsDialogWithTargets = (targets: Torrent[]) => {
  if (!targets.length) return;
  labelsDialogTargetTorrents.value = [...targets];
  labelsForm.value = {
    mode: "add",
    selectedLabels: [],
  };
  showLabelsDialog.value = true;
};

const getLabelsModeDescription = () => {
  switch (labelsForm.value.mode) {
    case "add":
      return t('torrent.labelModeAdd');
    case "replace":
      return t('torrent.labelModeReplace');
    case "remove":
      return t('torrent.labelModeRemove');
    default:
      return "";
  }
};

const getLabelsPlaceholder = () => {
  switch (labelsForm.value.mode) {
    case "add":
      return t('torrent.labelPlaceholderAdd');
    case "replace":
      return t('torrent.labelPlaceholderReplace');
    case "remove":
      return t('torrent.labelPlaceholderRemove');
    default:
      return "";
  }
};

const getLabelsFormTip = () => {
  const count = labelsForm.value.selectedLabels.length;
  if (count === 0) return t('torrent.labelTipSelect');

  const torrentCount = labelsDialogTargetTorrents.value.length;
  switch (labelsForm.value.mode) {
    case "add":
      return t('torrent.labelTipAdd', { torrentCount, count });
    case "replace":
      return t('torrent.labelTipReplace', { torrentCount, count });
    case "remove":
      return t('torrent.labelTipRemove', { torrentCount, count });
    default:
      return "";
  }
};

const submitLabelsChange = async () => {
  if (!isLabelsFormValid.value) {
    ElMessage.warning(t('torrent.message.selectOrEnterLabels'));
    return;
  }

  const targetTorrents = labelsDialogTargetTorrents.value;
  const selectedLabels = labelsForm.value.selectedLabels
    .map((label) => label.trim())
    .filter(Boolean);
  const mode = labelsForm.value.mode;

  const loadingInstance = ElLoading.service({
    text: `${t('torrent.message.labelsUpdated', { count: 0 })} (0/${targetTorrents.length})`,
  });

  try {
    for (let i = 0; i < targetTorrents.length; i++) {
      const torrent = targetTorrents[i];
      if (!torrent) continue;
      const currentLabels = torrent.labels || [];

      // 提取分类标签（保留不动）
      const categoryLabel = currentLabels.find((l) =>
        l.startsWith("category:")
      );
      const specialLabels = categoryLabel ? [categoryLabel] : [];

      // 提取普通标签（排除分类标签）
      const normalLabels = currentLabels.filter(
        (l) => !l.startsWith("category:")
      );

      let newNormalLabels: string[];

      // 根据操作模式处理标签
      switch (mode) {
        case "add":
          // 添加：合并并去重
          newNormalLabels = Array.from(
            new Set([...normalLabels, ...selectedLabels])
          );
          break;

        case "replace":
          // 替换：直接使用新标签
          newNormalLabels = [...selectedLabels];
          break;

        case "remove":
          // 移除：过滤掉要移除的标签
          newNormalLabels = normalLabels.filter(
            (label) => !selectedLabels.includes(label)
          );
          break;

        default:
          newNormalLabels = normalLabels;
      }

      // 合并特殊标签和普通标签
      const finalLabels = [...specialLabels, ...newNormalLabels];

      // 调用API更新
      await api.setTorrents([torrent.id], { labels: finalLabels });

      loadingInstance.setText(
        `${t('torrent.message.labelsUpdated', { count: i + 1 })} (${i + 1}/${targetTorrents.length})`
      );
    }

    ElMessage.success(t('torrent.message.labelsUpdated', { count: targetTorrents.length }));
    showLabelsDialog.value = false;
    await reloadTorrentsAfterMutation();
  } catch (error: any) {
    ElMessage.error(`${t('torrent.message.modifyLabelsFailed')}: ${error.message}`);
  } finally {
    loadingInstance.close();
  }
};

const fetchTorrentDetail = async (id: number) => {
  const result = await api.getTorrents(DETAIL_FIELDS, { ids: [id] });
  return result.torrents[0] || null;
};

const applyDetailData = async (torrent: Torrent) => {
  detailTorrent.value = torrent;
  initializeDetailFileSelections();
  // 处理 peers 数据
  if (torrent.peers && torrent.peers.length > 0) {
    // 先立即显示基本信息
    detailPeers.value = torrent.peers.map((peer) => ({
      address: peer.address,
      port: peer.port,
      client: peer.clientName || t('torrent.unknownClient'),
      progress: peer.progress,
      rateToClient: peer.rateToClient,
      rateToPeer: peer.rateToPeer,
      flagStr: peer.flagStr || "",
    }));

    // 异步查询地理位置信息
    torrent.peers.forEach(async (peer, index) => {
      const geoInfo = await getIPGeolocation(peer.address);
      if (geoInfo && detailPeers.value[index]) {
        detailPeers.value[index].country = geoInfo.country;
        detailPeers.value[index].countryFlag = geoInfo.flag;
      }
    });
  } else {
    detailPeers.value = [];
  }
};

const refreshDetailData = async () => {
  if (!detailTorrent.value) return;
  try {
    const detail = await fetchTorrentDetail(detailTorrent.value.id);
    if (detail) {
      applyDetailData(detail);
    }
  } catch (error) {
    console.warn("刷新详情失败", error);
  }
};

const openDetailDialog = async (torrent: Torrent) => {
  detailActiveTab.value = "basic";
  showDetailDialog.value = true;
  detailLoading.value = true;
  try {
    const detail = await fetchTorrentDetail(torrent.id);
    applyDetailData(detail || torrent);
  } catch (error: any) {
    ElMessage.error(`${t('torrent.message.loadFailed')}: ${error.message}`);
    applyDetailData(torrent);
  } finally {
    detailLoading.value = false;
  }
};

const initializeDetailFileSelections = () => {
  if (!detailTorrent.value?.files) {
    detailFileSelections.value = {};
    return;
  }
  const selections: Record<number, boolean> = {};
  detailTorrent.value.files.forEach((_, index) => {
    const wanted = detailTorrent.value?.fileStats?.[index]?.wanted;
    selections[index] = wanted !== undefined ? wanted : true;
  });
  detailFileSelections.value = selections;
};

const toggleAllDetailFiles = (wanted: boolean) => {
  if (!detailFiles.value.length) return;
  const selections: Record<number, boolean> = {};
  detailFiles.value.forEach((file) => {
    selections[file.index] = wanted;
  });
  detailFileSelections.value = selections;
  nextTick(() => {
    if (detailFilesTreeRef.value) {
      const keys = wanted
        ? (detailTorrent.value?.files ?? []).map((_, idx) => idx)
        : [];
      detailFilesTreeRef.value.setCheckedKeys(keys);
    }
  });
};

const saveDetailFileSelections = async () => {
  if (!detailTorrent.value) return;
  if (!detailFiles.value.length) {
    ElMessage.warning(t('torrent.message.noFilesToUpdate'));
    return;
  }
  const wanted: number[] = [];
  const unwanted: number[] = [];
  detailFiles.value.forEach((file) => {
    const target = detailFileSelections.value[file.index];
    const current =
      detailTorrent.value?.fileStats?.[file.index]?.wanted ?? true;
    if (target === current) return;
    if (target) {
      wanted.push(file.index);
    } else {
      unwanted.push(file.index);
    }
  });
  if (!wanted.length && !unwanted.length) {
    ElMessage.info(t('torrent.message.fileSelectionUnchanged'));
    return;
  }
  const payload: Record<string, any> = {};
  if (wanted.length) payload["files-wanted"] = wanted;
  if (unwanted.length) payload["files-unwanted"] = unwanted;
  detailFilesSaving.value = true;
  try {
    await api.setTorrents([detailTorrent.value.id], payload);
    ElMessage.success(t('torrent.message.fileSelectionUpdated'));
    await refreshDetailData();
  } catch (error: any) {
    ElMessage.error(`${t('torrent.message.updateFailed')}: ${error.message}`);
  } finally {
    detailFilesSaving.value = false;
  }
};

// 重命名种子对话框
const openRenameTorrentDialog = async (torrent: Torrent) => {
  try {
    const { value } = await ElMessageBox.prompt(
      t('torrent.renameTorrentPrompt', { name: torrent.name }),
      t('torrent.renameTorrent'),
      {
        confirmButtonText: t('common.confirm'),
        cancelButtonText: t('common.cancel'),
        inputValue: torrent.name,
        inputPlaceholder: t('torrent.enterNewName'),
        inputValidator: (val) => {
          if (!val || !val.trim()) {
            return t('torrent.nameCannotBeEmpty');
          }
          if (val.trim() === torrent.name) {
            return t('torrent.nameNotChanged');
          }
          if (val.includes('/') || val.includes('\\')) {
            return t('torrent.noPathSeparators');
          }
          return true;
        },
      }
    );

    const newName = value.trim();
    const loadingTarget = document.querySelector(".detail-dialog") ? ".detail-dialog" : undefined;
    const loadingInstance = ElLoading.service({
      target: loadingTarget,
      text: t('torrent.renaming'),
    });

    try {
      await api.renameTorrent(torrent.id, newName);
      ElMessage.success(t('torrent.renameSuccess'));
      await reloadTorrentsAfterMutation();
      if (detailTorrent.value && detailTorrent.value.id === torrent.id) {
        await refreshDetailData();
      }
    } catch (err: any) {
      ElMessage.error(`${t('torrent.renameFailed')}: ${err.message || err}`);
    } finally {
      loadingInstance.close();
    }
  } catch {
    // 用户取消输入
  }
};

// 重命名文件或目录对话框
const openRenamePathDialog = async (node: FileTreeNode) => {
  if (!detailTorrent.value || !node.fullPath) return;

  const isFolder = node.isDir;
  const title = isFolder ? t('torrent.renameFolder') : t('torrent.renameFile');
  const message = isFolder
    ? t('torrent.renameFolderPrompt', { name: node.label })
    : t('torrent.renameFilePrompt', { name: node.label });

  try {
    const { value } = await ElMessageBox.prompt(message, title, {
      confirmButtonText: t('common.confirm'),
      cancelButtonText: t('common.cancel'),
      inputValue: node.label,
      inputPlaceholder: t('torrent.enterNewName'),
      inputValidator: (val) => {
        if (!val || !val.trim()) {
          return t('torrent.nameCannotBeEmpty');
        }
        if (val.trim() === node.label) {
          return t('torrent.nameNotChanged');
        }
        if (val.includes('/') || val.includes('\\')) {
          return t('torrent.noPathSeparators');
        }
        return true;
      },
    });

    const newName = value.trim();
    const targetEl = document.querySelector(".files-container");
    const loadingInstance = ElLoading.service({
      target: targetEl ? (targetEl as HTMLElement) : undefined,
      text: t('torrent.renaming'),
    });

    try {
      await api.renameTorrentPath(
        detailTorrent.value.id,
        node.fullPath,
        newName,
        node.isDir
      );
      ElMessage.success(t('torrent.renameSuccess'));
      await refreshDetailData();
      await reloadTorrentsAfterMutation();
    } catch (err: any) {
      ElMessage.error(`${t('torrent.renameFailed')}: ${err.message || err}`);
    } finally {
      loadingInstance.close();
    }
  } catch {
    // 用户取消输入
  }
};

const buildLimitPayload = (form: LimitFormState) => {
  const payload: Record<string, any> = {
    downloadLimited: form.downloadLimited,
    uploadLimited: form.uploadLimited,
  };
  if (form.downloadLimited) {
    // 转换为 KB/s (API 使用 KB/s)
    const downloadLimit =
      form.downloadUnit === "MB"
        ? form.downloadLimit * 1024
        : form.downloadLimit;
    payload.downloadLimit = Math.max(0, Math.round(downloadLimit));
  }
  if (form.uploadLimited) {
    // 转换为 KB/s (API 使用 KB/s)
    const uploadLimit =
      form.uploadUnit === "MB" ? form.uploadLimit * 1024 : form.uploadLimit;
    payload.uploadLimit = Math.max(0, Math.round(uploadLimit));
  }
  return payload;
};

const openBatchLimitDialog = () => {
  if (!torrents.value.length) {
    ElMessage.warning(t('torrent.message.noTorrents'));
    return;
  }
  limitDialogMode.value = "batch";
  limitDialogTargetName.value = "";
  limitDialogLoading.value = false;
  // 若有选中的种子则针对选中的种子，否则针对所有种子
  const targets = selectedTorrents.value.length > 0 ? selectedTorrents.value : torrents.value;
  limitDialogIds.value = targets.map((tor) => tor.id);
  limitDialogTargetTorrents.value = [...targets];
  resetLimitDialogForm();
  limitDialogVisible.value = true;
};

// 从右键菜单打开批量限速对话框
const openBatchLimitDialogWithTargets = (targets: Torrent[]) => {
  if (!targets.length) return;
  limitDialogMode.value = "batch";
  limitDialogTargetName.value = "";
  limitDialogLoading.value = false;
  limitDialogIds.value = targets.map((tor) => tor.id);
  limitDialogTargetTorrents.value = targets;
  resetLimitDialogForm();
  limitDialogVisible.value = true;
};

const resetLimitDialogForm = () => {
  limitDialogForm.value = createEmptyLimitForm();
};

const applyLimitFormFromTorrent = (torrent?: Torrent | null) => {
  if (!torrent) {
    resetLimitDialogForm();
    return;
  }
  limitDialogForm.value = {
    downloadLimited: torrent.downloadLimited ?? false,
    downloadLimit: torrent.downloadLimit ?? 0,
    downloadUnit: "KB",
    uploadLimited: torrent.uploadLimited ?? false,
    uploadLimit: torrent.uploadLimit ?? 0,
    uploadUnit: "KB",
    selectedTrackers: [],
  };
};

const openSingleLimitDialog = async (torrent: Torrent) => {
  limitDialogMode.value = "single";
  limitDialogTargetName.value = `${t('torrent.currentTorrent')}：${torrent.name}`;
  limitDialogIds.value = [torrent.id];
  limitDialogTargetTorrents.value = [torrent];
  resetLimitDialogForm();
  limitDialogVisible.value = true;
  limitDialogLoading.value = true;
  try {
    const detail = await fetchTorrentDetail(torrent.id);
    applyLimitFormFromTorrent(detail || torrent);
    // 更新目标种子列表以获取最新的标签信息
    if (detail) {
      limitDialogTargetTorrents.value = [detail];
    }
  } catch (error) {
    console.warn("加载限速信息失败", error);
    applyLimitFormFromTorrent(torrent);
  } finally {
    limitDialogLoading.value = false;
  }
};

const submitLimitSettings = async () => {
  // 批量模式：使用筛选后的种子
  const targetTorrents =
    limitDialogMode.value === "batch"
      ? limitDialogFilteredTorrents.value
      : limitDialogTargetTorrents.value;

  if (!targetTorrents.length) {
    ElMessage.warning(t('torrent.message.noMatchingTorrents'));
    return;
  }

  const targetIds = targetTorrents.map((tor) => tor.id);
  limitDialogSaving.value = true;

  try {
    // 1. 设置限速
    await api.setTorrents(targetIds, buildLimitPayload(limitDialogForm.value));

    ElMessage.success(
      targetIds.length > 1
        ? t('torrent.message.limitAppliedMultiple', { count: targetIds.length })
        : t('torrent.message.limitApplied')
    );
    limitDialogVisible.value = false;
    await reloadTorrentsAfterMutation();
  } catch (error: any) {
    ElMessage.error(`${t('torrent.message.saveFailed')}: ${error.message}`);
  } finally {
    limitDialogSaving.value = false;
  }
};

// 批量替换tracker相关方法
const openReplaceTrackerDialog = () => {
  if (!torrents.value.length) {
    ElMessage.warning(t('torrent.message.noTorrents'));
    return;
  }
  replaceTrackerForm.value = {
    oldUrl: "",
    newUrl: "",
  };
  replaceTrackerDialogVisible.value = true;
};

const submitReplaceTracker = async () => {
  const { oldUrl, newUrl } = replaceTrackerForm.value;

  if (!oldUrl || !newUrl) {
    ElMessage.warning(t('torrent.message.enterOldAndNew'));
    return;
  }

  if (oldUrl === newUrl) {
    ElMessage.warning(t('torrent.message.oldAndNewSame'));
    return;
  }

  replaceTrackerLoading.value = true;

  try {
    // 使用所有种子的ID
    const allIds = torrents.value.map((tor) => tor.id);
    await api.replaceTrackers(allIds, oldUrl, newUrl);
    ElMessage.success(t('torrent.message.trackerReplaced', { count: allIds.length }));
    replaceTrackerDialogVisible.value = false;
    // 刷新种子列表
    await reloadTorrentsAfterMutation();
  } catch (error: any) {
    ElMessage.error(`${t('torrent.message.replaceFailed')}: ${error.message || error}`);
  } finally {
    replaceTrackerLoading.value = false;
  }
};

const resetDetailInteractions = () => {
  detailFileSelections.value = {};
  detailActiveTab.value = "basic";
};

// 文件选择
const handleFileChange = (file: any) => {
  if (file.raw && !addForm.value.files.find((f) => f.name === file.raw.name)) {
    addForm.value.files.push(file.raw);
  }
};

// 文件移除
const handleFileRemove = (file: any) => {
  const index = addForm.value.files.findIndex((f) => f.name === file.name);
  if (index > -1) {
    addForm.value.files.splice(index, 1);
  }
};

// 添加种子
const handleAddTorrent = async () => {
  let loadingInstance: ReturnType<typeof ElLoading.service> | null = null;

  try {
    const basePayload = {
      paused: addForm.value.paused,
      downloadDir: addForm.value.downloadDir || undefined,
    };

    let successCount = 0;
    let failCount = 0;
    const errors: string[] = [];

    if (addForm.value.type === "magnet") {
      // 批量处理磁力链接
      if (!addForm.value.magnet.trim()) {
        ElMessage.warning(t('torrent.message.enterMagnetLink'));
        return;
      }

      // 按行分割，过滤空行
      const magnetLinks = addForm.value.magnet
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0);

      if (magnetLinks.length === 0) {
        ElMessage.warning(t('torrent.message.enterAtLeastOneMagnet'));
        return;
      }

      // 显示全屏遮罩
      loadingInstance = ElLoading.service({
        lock: true,
        text: t('torrent.message.addingTorrent', { current: 1, total: magnetLinks.length }),
        background: "rgba(0, 0, 0, 0.7)",
      });

      for (let i = 0; i < magnetLinks.length; i++) {
        const magnet = magnetLinks[i];
        if (!magnet) continue;

        // 更新进度
        if (loadingInstance) {
          loadingInstance.setText(
            t('torrent.message.addingTorrent', { current: i + 1, total: magnetLinks.length })
          );
        }

        try {
          await api.addTorrent({
            ...basePayload,
            magnet,
          });
          successCount++;
        } catch (error: any) {
          failCount++;
          errors.push(`${magnet.substring(0, 50)}...: ${error.message}`);
        }
      }
    } else {
      // 批量处理种子文件
      if (addForm.value.files.length === 0) {
        ElMessage.warning(t('torrent.message.selectAtLeastOneFile'));
        return;
      }

      const fileCount = addForm.value.files.length;

      // 显示全屏遮罩
      loadingInstance = ElLoading.service({
        lock: true,
        text: t('torrent.message.addingTorrentFile', { current: 1, total: fileCount }),
        background: "rgba(0, 0, 0, 0.7)",
      });

      for (let i = 0; i < fileCount; i++) {
        const file = addForm.value.files[i];
        if (!file) continue;

        // 更新进度
        if (loadingInstance) {
          loadingInstance.setText(
            t('torrent.message.addingTorrentFile', { current: i + 1, total: fileCount })
          );
        }

        try {
          await api.addTorrent({
            ...basePayload,
            file,
          });
          successCount++;
        } catch (error: any) {
          failCount++;
          errors.push(`${file.name}: ${error.message}`);
        }
      }
    }

    // 关闭遮罩
    if (loadingInstance) {
      loadingInstance.close();
      loadingInstance = null;
    }

    // 显示结果
    if (failCount === 0) {
      ElMessage.success(t('torrent.message.addedSuccess', { count: successCount }));
    } else if (successCount === 0) {
      ElMessage.error(`${t('torrent.message.addedFailed')}: ${errors.join("; ")}`);
    } else {
      ElMessage.warning(t('torrent.message.addedPartial', { success: successCount, fail: failCount }));
      if (errors.length > 0) {
        console.error("添加失败的种子:", errors);
      }
    }

    showAddDialog.value = false;

    // 重置表单数据
    addForm.value = {
      type: "magnet",
      magnet: "",
      files: [],
      downloadDir: "",
      paused: false,
    };

    // 清空文件列表
    fileList.value = [];

    // 清空上传组件
    uploadRef.value?.clearFiles();

    // 刷新列表
    await reloadTorrentsAfterMutation();
  } catch (error: any) {
    // 确保关闭遮罩
    if (loadingInstance) {
      loadingInstance.close();
    }
    ElMessage.error(`${t('torrent.message.addedFailed')}: ${error.message}`);
  }
};

// 获取状态文本
const getStatusText = (torrent: Torrent): string => {
  // 如果正在校验中，则显示校验中状态，忽略错误状态
  if (
    torrent.status === TorrentStatusEnum.CHECK ||
    torrent.status === TorrentStatusEnum.CHECK_WAIT
  ) {
    return getTorrentStatusText(t, torrent.status, t('torrent.unknownClient'));
  }

  // 其他状态下，如果存在错误则显示错误类型（type字段）
  if (isTorrentError(torrent)) {
    return getErrorType(getTorrentErrorMessage(torrent));
  }

  return getTorrentStatusText(t, torrent.status, t('torrent.unknownClient'));
};

// 获取状态类型
const getStatusType = (torrent: Torrent): StatusTagType => {
  // 如果正在校验中，则显示校验中状态，忽略错误状态
  if (
    torrent.status === TorrentStatusEnum.CHECK ||
    torrent.status === TorrentStatusEnum.CHECK_WAIT
  ) {
    return "warning";
  }

  // 其他状态下，如果存在错误则显示错误
  if (isTorrentError(torrent)) {
    return "danger";
  }

  const typeMap: Record<TorrentStatus, StatusTagType> = {
    [TorrentStatusEnum.STOPPED]: "info",
    [TorrentStatusEnum.CHECK_WAIT]: "warning",
    [TorrentStatusEnum.CHECK]: "warning",
    [TorrentStatusEnum.DOWNLOAD_WAIT]: "warning",
    [TorrentStatusEnum.DOWNLOAD]: "success",
    [TorrentStatusEnum.SEED_WAIT]: "warning",
    [TorrentStatusEnum.SEED]: "success",
  };
  return typeMap[torrent.status] || "info";
};

// 格式化剩余时间
const formatETA = (eta?: number, status?: TorrentStatus): string => {
  // 如果没有 eta 或者为负数，显示 —
  if (eta === undefined || eta === null || eta < 0) {
    return "—";
  }

  // 如果种子已经完成或正在做种，显示 —
  if (
    status === TorrentStatusEnum.SEED ||
    status === TorrentStatusEnum.SEED_WAIT
  ) {
    return "—";
  }

  // 如果种子已停止，显示 —
  if (status === TorrentStatusEnum.STOPPED) {
    return "—";
  }

  // 如果 eta 非常大（例如超过一年），显示"未知"
  const oneYear = 365 * 24 * 60 * 60;
  if (eta > oneYear) {
    return t('torrent.unknownEta');
  }

  const seconds = Math.floor(eta);

  // 小于1分钟
  if (seconds < 60) {
    return `${seconds}${t('torrent.timeUnit.seconds')}`;
  }

  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  // 超过1天
  if (days > 0) {
    const remainingHours = hours % 24;
    if (remainingHours > 0) {
      return `${days}${t('torrent.timeUnit.days')}${remainingHours}${t('torrent.timeUnit.hours')}`;
    }
    return `${days}${t('torrent.timeUnit.days')}`;
  }

  // 超过1小时
  if (hours > 0) {
    const remainingMinutes = minutes % 60;
    if (remainingMinutes > 0) {
      return `${hours}${t('torrent.timeUnit.hours')}${remainingMinutes}${t('torrent.timeUnit.minutes')}`;
    }
    return `${hours}${t('torrent.timeUnit.hours')}`;
  }

  // 只有分钟
  return `${minutes}${t('torrent.timeUnit.minutes')}`;
};

// 格式化描述字段,将URL转换为超链接
const formatCommentWithLinks = (comment: string): string => {
  if (!comment) return "";
  // URL 正则表达式，匹配 http:// 或 https:// 开头的链接
  const urlRegex = /(https?:\/\/[^\s<>"']+)/g;
  // 转义 HTML 特殊字符
  const escapeHtml = (text: string) => {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  };
  // 先转义整个文本
  let escapedComment = escapeHtml(comment);
  // 然后将 URL 替换为超链接
  return escapedComment.replace(urlRegex, (url) => {
    // deslop-ignore-next-line 09
    return `<a href="${url}" target="_blank" rel="noopener noreferrer" style="color: var(--bc-accent); text-decoration: underline;">${url}</a>`;
  });
};

const {
  columns: tableV2Columns,
  sortBy: v2SortState,
  handleSort: handleV2Sort,
  handleResize: handleColumnResizeV2,
  rowEventHandlers: v2RowEventHandlers,
  rowClassName: v2RowClassName,
} = useTorrentTable({
  visibleColumns,
  compact: isCompactTable,
  sortState,
  selectedIds: selectedIdsState,
  allSelected: isAllSelected,
  indeterminate: isIndeterminate,
  isSelected: isTorrentSelected,
  togglePage: togglePageSelection,
  toggleRow: toggleTorrentSelection,
  handleRowClick: updateSelectionFromRowClick,
  handleRowDoubleClick,
  handleRowContextMenu: (torrent, event) =>
    handleRowContextMenu(torrent, null, event),
  getColumnWidth,
  resizeColumn: handleColumnResize,
  getStatusType,
  getStatusText,
  isTorrentError,
  getErrorMessage: getTorrentErrorMessage,
  getProgress: getTorrentProgress,
  getProgressTooltip,
  getRatioClass,
  formatRatio,
  formatSpeedLimit: formatSpeedLimitText,
  openSpeedLimit: openSingleLimitDialog,
  getDefaultTracker,
  getSeeders,
  getLeechers,
  formatDate: formatTorrentDate,
  formatLastActivity,
  unknownErrorText: () => t('torrent.unknownError'),
});
onMounted(() => {
  // 首先从 URL 恢复过滤状态
  syncFiltersFromUrl();

  loadColumnWidths();
  loadColumnVisibility();
  loadTorrents();
  startAutoRefresh();
  window.addEventListener("click", hideContextMenu);
  window.addEventListener("scroll", hideContextMenu, {
    capture: true,
    passive: true,
  });
  window.addEventListener("scroll", handleGlobalScroll, {
    capture: true,
    passive: true,
  });
  window.addEventListener("focus", handleForegroundRefresh);
  document.addEventListener("visibilitychange", handleForegroundRefresh);
  window.addEventListener("keydown", handleKeydown);

});

onBeforeUnmount(() => {
  releaseTorrentSource();
  stopAutoRefresh();
  if (scrollStopTimer) {
    window.clearTimeout(scrollStopTimer);
    scrollStopTimer = null;
  }
  window.removeEventListener("click", hideContextMenu);
  window.removeEventListener("scroll", hideContextMenu, true);
  window.removeEventListener("scroll", handleGlobalScroll, true);
  window.removeEventListener("focus", handleForegroundRefresh);
  document.removeEventListener("visibilitychange", handleForegroundRefresh);
  window.removeEventListener("keydown", handleKeydown);
});
</script>

<style scoped src="./HomeView.css"></style>
