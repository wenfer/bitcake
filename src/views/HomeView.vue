<template>
  <div class="home-view">
    <div class="toolbar">
      <div class="actions-group">
        <el-button type="primary" :icon="Plus" @click="showAddDialog = true">
          添加种子
        </el-button>
        <el-button :icon="Refresh" @click="loadTorrents()">刷新</el-button>
        <template v-if="!isMobile">
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
          <el-button @click="openBatchLimitDialog"> 批量限速 </el-button>
          <el-button :disabled="!hasSelection" @click="openLabelsDialog">
            批量标签
          </el-button>
          <el-button @click="openReplaceTrackerDialog">
            批量替换Tracker
          </el-button>
          <el-button @click="resetColumnWidths" title="重置所有列的宽度为默认值">
            重置列宽
          </el-button>
        </template>
        <template v-else>
          <el-dropdown trigger="click" @command="handleActionCommand">
            <el-button :icon="Operation">操作</el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="start" :disabled="!hasSelection">
                  开始选中
                </el-dropdown-item>
                <el-dropdown-item command="stop" :disabled="!hasSelection">
                  暂停选中
                </el-dropdown-item>
                <el-dropdown-item command="remove" :disabled="!hasSelection">
                  删除选中
                </el-dropdown-item>
                <el-dropdown-item command="limit">
                  批量限速
                </el-dropdown-item>
                <el-dropdown-item command="labels" :disabled="!hasSelection">
                  批量标签
                </el-dropdown-item>
                <el-dropdown-item command="replaceTracker">
                  批量替换Tracker
                </el-dropdown-item>
                <el-dropdown-item command="resetWidth">
                  重置列宽
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </template>
      </div>
      <el-button
        v-if="isMobile"
        class="filter-toggle"
        :icon="Filter"
        plain
        @click="toggleMobileFilters"
      >
        {{ showMobileFilters ? "收起筛选" : "展开筛选" }}
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
            :filter-method="filterTrackerOptions"
            class="filter-select"
            @clear="trackerFilter = ''"
          >
            <el-option label="全部 Tracker" value="" />
            <el-option
              v-for="tracker in filteredTrackerOptions"
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
          <el-select
            v-if="downloadDirOptions.length > 0"
            v-model="downloadDirFilter"
            placeholder="选择保存目录"
            clearable
            filterable
            class="filter-select"
            @clear="downloadDirFilter = ''"
          >
            <el-option label="全部目录" value="" />
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
            placeholder="选择错误类型"
            clearable
            filterable
            class="filter-select"
            @clear="errorTypeFilter = ''"
          >
            <el-option label="全部错误" value="" />
            <el-option
              v-for="option in errorTypeOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
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
      <div class="table-scroll" v-loading="loading">
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
        开始{{ contextMenuTargets.length > 1 ? "选中" : "" }}
      </button>
      <button
        v-if="contextMenuHasRunningTorrent"
        @click="handleContextAction('stop')"
      >
        暂停{{ contextMenuTargets.length > 1 ? "选中" : "" }}
      </button>
      <button @click="handleContextAction('verify')">
        重新校验{{ contextMenuTargets.length > 1 ? "选中" : "" }}
      </button>
      <button @click="handleContextAction('reannounce')">
        重新汇报{{ contextMenuTargets.length > 1 ? "选中" : "" }}
      </button>
      <button @click="handleContextAction('location')">变更保存目录</button>
      <button @click="handleContextAction('category')">设置分类</button>
      <button @click="handleContextAction('labels')">修改标签</button>
      <button
        v-if="contextMenuTargets.length === 1"
        @click="handleContextAction('detail')"
      >
        查看详情
      </button>
      <button @click="handleContextAction('limit')">限速设置</button>
      <button class="danger" @click="handleContextAction('delete')">
        删除{{ contextMenuTargets.length > 1 ? "选中" : "" }}
      </button>
    </div>

    <!-- 添加种子对话框 -->
    <el-dialog
      v-model="showAddDialog"
      title="添加种子（支持批量）"
      :width="defaultDialogWidth"
    >
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
            :rows="6"
            placeholder="支持批量添加，每行一个磁力链接&#10;magnet:?xt=urn:btih:...&#10;magnet:?xt=urn:btih:..."
          />
        </el-form-item>
        <el-form-item v-else label="种子文件">
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
            <el-button :icon="Upload">选择文件（支持多选）</el-button>
          </el-upload>
        </el-form-item>
        <el-form-item label="下载目录">
          <el-autocomplete
            v-model="addForm.downloadDir"
            :fetch-suggestions="searchDownloadDirs"
            placeholder="留空使用默认目录"
            style="width: 100%"
            clearable
            trigger-on-focus
          />
        </el-form-item>
        <el-form-item label="自动开始">
          <el-switch
            v-model="addForm.paused"
            :active-value="false"
            :inactive-value="true"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" @click="handleAddTorrent">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="showLocationDialog"
      title="变更保存目录"
      :width="defaultDialogWidth"
    >
      <el-form :model="locationForm" label-width="120px">
        <el-form-item label="新的保存目录">
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
          <el-checkbox v-model="locationForm.move">同时移动文件</el-checkbox>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showLocationDialog = false">取消</el-button>
        <el-button type="primary" @click="submitLocationChange">确定</el-button>
      </template>
    </el-dialog>

    <!-- 设置分类对话框 -->
    <el-dialog
      v-model="showCategoryDialog"
      title="设置分类"
      :width="defaultDialogWidth"
    >
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

    <!-- 批量修改标签对话框 -->
    <el-dialog
      v-model="showLabelsDialog"
      title="批量修改标签"
      :width="defaultDialogWidth"
    >
      <p class="dialog-subtitle">
        {{ labelsDialogTargetTorrents.length }} 个种子
      </p>

      <el-form :model="labelsForm" label-width="100px">
        <!-- 操作模式选择 -->
        <el-form-item label="操作模式">
          <el-radio-group v-model="labelsForm.mode">
            <el-radio label="add">添加标签</el-radio>
            <el-radio label="replace">替换标签</el-radio>
            <el-radio label="remove">移除标签</el-radio>
          </el-radio-group>
          <div class="form-tip">
            {{ getLabelsModeDescription() }}
          </div>
        </el-form-item>

        <!-- 标签输入 -->
        <el-form-item
          :label="labelsForm.mode === 'remove' ? '移除标签' : '标签'"
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
          label="当前标签"
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
        <el-button @click="showLabelsDialog = false">取消</el-button>
        <el-button
          type="primary"
          :disabled="!isLabelsFormValid"
          @click="submitLabelsChange"
        >
          确定
        </el-button>
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
            <el-tabs
              v-model="detailActiveTab"
              class="detail-tabs"
              type="border-card"
            >
              <el-tab-pane label="基础信息" name="basic">
                <el-descriptions :column="2" size="small" border>
                  <el-descriptions-item
                    label="名称"
                    :span="2"
                    class-name="torrent-name-item"
                  >
                    {{ detailTorrent.name }}
                  </el-descriptions-item>
                  <el-descriptions-item label="状态">
                    <el-tag size="small" :type="getStatusType(detailTorrent) as any">
                      {{ getStatusText(detailTorrent) }}
                    </el-tag>
                  </el-descriptions-item>
                  <el-descriptions-item label="进度">
                    {{ Math.round(getTorrentProgress(detailTorrent) * 100) }}%
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
                    <span class="hash-value">{{
                      detailTorrent.hashString
                    }}</span>
                  </el-descriptions-item>
                  <el-descriptions-item
                    v-if="detailTorrent.category"
                    label="分类"
                    :span="2"
                  >
                    <el-tag size="small">{{ detailTorrent.category }}</el-tag>
                  </el-descriptions-item>
                  <el-descriptions-item
                    v-if="detailTorrent.comment"
                    label="描述"
                    :span="2"
                  >
                    <span
                      v-html="formatCommentWithLinks(detailTorrent.comment)"
                    ></span>
                  </el-descriptions-item>
                  <el-descriptions-item
                    v-if="detailTorrent.errorString"
                    label="错误信息"
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
                          >原始错误: {{ detailTorrent.errorString }}</el-text
                        >
                      </div>
                    </div>
                  </el-descriptions-item>
                </el-descriptions>
              </el-tab-pane>

              <el-tab-pane label="文件内容" name="content">
                <div v-if="detailFiles.length" class="files-container">
                  <div class="files-actions">
                    <span class="files-count"
                      >已选择 {{ detailSelectedFileCount }} /
                      {{ detailTotalFileCount }}</span
                    >
                    <div class="files-actions-buttons">
                      <el-button
                        size="small"
                        @click="toggleAllDetailFiles(true)"
                        >全选</el-button
                      >
                      <el-button
                        size="small"
                        @click="toggleAllDetailFiles(false)"
                        >全不选</el-button
                      >
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
                        <span class="file-name">{{ data.label }}</span>
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
                      </div>
                    </template>
                  </el-tree>
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
                    <el-table-column
                      prop="tier"
                      label="Tier"
                      width="60"
                      align="center"
                    />
                    <el-table-column
                      prop="announce"
                      label="Announce URL"
                      min-width="200"
                      show-overflow-tooltip
                    />
                    <el-table-column label="状态" width="100" align="center">
                      <template #default="{ row }">
                        <el-tag size="small" :type="row.statusType">{{
                          row.statusText
                        }}</el-tag>
                      </template>
                    </el-table-column>
                    <el-table-column
                      prop="lastAnnounce"
                      label="上次汇报"
                      width="140"
                    />
                  </el-table>
                </div>
                <el-empty
                  v-else
                  description="未配置 Tracker"
                  :image-size="80"
                />
              </el-tab-pane>

              <el-tab-pane label="Peers" name="peers">
                <div v-if="detailPeers.length">
                  <el-table
                    :data="detailPeers"
                    size="small"
                    border
                    max-height="400"
                  >
                    <el-table-column
                      label="国家/地区"
                      width="100"
                      align="center"
                    >
                      <template #default="{ row }">
                        <span v-if="row.countryFlag" :title="row.country">
                          {{ row.countryFlag }} {{ row.country }}
                        </span>
                        <span v-else style="color: #909399">-</span>
                      </template>
                    </el-table-column>
                    <el-table-column
                      prop="address"
                      label="IP 地址"
                      width="130"
                    />
                    <el-table-column
                      prop="port"
                      label="端口"
                      width="70"
                      align="center"
                    />
                    <el-table-column
                      prop="client"
                      label="客户端"
                      min-width="100"
                      show-overflow-tooltip
                    />
                    <el-table-column label="进度" width="80" align="center">
                      <template #default="{ row }">
                        {{ Math.round(row.progress * 100) }}%
                      </template>
                    </el-table-column>
                    <el-table-column label="下载速度" width="100" align="right">
                      <template #default="{ row }">
                        {{
                          row.rateToClient > 0
                            ? formatBytes(row.rateToClient) + "/s"
                            : "—"
                        }}
                      </template>
                    </el-table-column>
                    <el-table-column label="上传速度" width="100" align="right">
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
                      label="标志"
                      width="80"
                      align="center"
                    />
                  </el-table>
                </div>
                <el-empty
                  v-else
                  description="当前没有连接的 Peers"
                  :image-size="80"
                />
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
      <el-form
        :model="limitDialogForm"
        label-width="100px"
        v-loading="limitDialogLoading"
        class="limit-form"
      >
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
        <el-button
          type="primary"
          :loading="limitDialogSaving"
          @click="submitLimitSettings"
        >
          保存
        </el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="replaceTrackerDialogVisible"
      title="批量替换 Tracker"
      :width="isMobile ? '95%' : '500px'"
      class="replace-tracker-dialog"
    >
      <p class="dialog-subtitle">
        将对全部 {{ torrents.length }} 个种子进行操作
      </p>
      <el-form
        :model="replaceTrackerForm"
        label-width="120px"
        v-loading="replaceTrackerLoading"
        class="replace-tracker-form"
      >
        <el-form-item label="原域名/URL" required>
          <el-input
            v-model="replaceTrackerForm.oldUrl"
            placeholder="例如：old-tracker.com 或完整URL"
            clearable
          />
          <div class="form-tip">将匹配包含此字符串的 tracker 地址</div>
        </el-form-item>
        <el-form-item label="新域名/URL" required>
          <el-input
            v-model="replaceTrackerForm.newUrl"
            placeholder="例如：new-tracker.com 或完整URL"
            clearable
          />
          <div class="form-tip">使用字符串替换，保留参数等其他部分</div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="replaceTrackerDialogVisible = false">取消</el-button>
        <el-button
          type="primary"
          :loading="replaceTrackerLoading"
          :disabled="!replaceTrackerForm.oldUrl || !replaceTrackerForm.newUrl"
          @click="submitReplaceTracker"
        >
          替换
        </el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="removeDialog.visible"
      title="删除种子"
      :width="removeDialogWidth"
    >
      <p class="delete-message">
        {{
          removeDialog.message ||
          `确定删除选中的 ${removeDialog.ids.length} 个种子？`
        }}
      </p>
      <el-checkbox v-model="removeDialog.withData"
        >同时删除本地文件</el-checkbox
      >
      <template #footer>
        <el-button @click="removeDialog.visible = false">取消</el-button>
        <el-button type="danger" @click="confirmRemoveDialog">删除</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import {
  ref,
  computed,
  onMounted,
  onBeforeUnmount,
  watch,
  nextTick,
  h,
} from "vue";
import {
  ElMessage,
  ElLoading,
  ElTableV2,
  ElAutoResizer,
  ElTree,
  ElCheckbox,
  ElTag,
  ElProgress,
  ElTooltip,
} from "element-plus";
import type { TableInstance, TableColumnCtx, Column, CheckboxValueType } from "element-plus";
import dayjs from "dayjs";
// import Sortable from "sortablejs"; // Removed for TableV2 compatibility
import {
  Plus,
  Refresh,
  Search,
  VideoPlay,
  VideoPause,
  Delete,
  Upload,
  Filter,
  Folder,
  Document,
  Operation,
} from "@element-plus/icons-vue";
import * as api from "@/api/torrents";
import type { Torrent, TorrentStatus } from "@/types/transmission";
import { TorrentStatusEnum } from "@/types/transmission";
import {
  getTrackerDisplayName,
  getTrackerHost,
  matchesTrackerFilter,
} from "@/utils/torrent";
import { getIPGeolocation } from "@/utils/ipGeolocation";
import { useMediaQuery } from "@/utils/useMediaQuery";
import { formatBytes, formatSpeed } from "@/utils/format";
import { useFilterStore, urlToStatus, statusToUrl } from "@/stores/filter";
import { useSystemStatusStore } from "@/stores/systemStatus";
import { storeToRefs } from "pinia";
import { isTransmission } from "@/config/torrentClient";
import { useRoute, useRouter } from "vue-router";

const REFRESH_INTERVAL = 3000;
const COLUMN_WIDTH_STORAGE_KEY = "tv_table_column_widths";
const COLUMN_ORDER_STORAGE_KEY = "tv_table_column_order";
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
const filterStore = useFilterStore();
const systemStatusStore = useSystemStatusStore();
const {
  statusFilter,
  trackerFilter,
  categoryFilter,
  downloadDirFilter,
  errorTypeFilter,
} = storeToRefs(filterStore);
const { sessionConfig } = storeToRefs(systemStatusStore);

// URL 参数同步功能
const syncFiltersFromUrl = () => {
  const statusParam = route.query.status as string | undefined;
  const trackerParam = route.query.tracker as string | undefined;

  if (statusParam) {
    const status = urlToStatus(statusParam);
    filterStore.setStatusFilter(status);
  } else {
    filterStore.setStatusFilter('all');
  }

  if (trackerParam) {
    filterStore.setTrackerFilter(trackerParam);
  }
};

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
  addLabel: boolean;
}

const createEmptyLimitForm = (): LimitFormState => ({
  downloadLimited: false,
  downloadLimit: 0,
  downloadUnit: "KB",
  uploadLimited: false,
  uploadLimit: 0,
  uploadUnit: "KB",
  selectedTrackers: [],
  addLabel: true,
});

const statusTextMap: Record<TorrentStatus, string> = {
  [TorrentStatusEnum.STOPPED]: "已停止",
  [TorrentStatusEnum.CHECK_WAIT]: "等待校验",
  [TorrentStatusEnum.CHECK]: "校验中",
  [TorrentStatusEnum.DOWNLOAD_WAIT]: "等待下载",
  [TorrentStatusEnum.DOWNLOAD]: "下载中",
  [TorrentStatusEnum.SEED_WAIT]: "等待做种",
  [TorrentStatusEnum.SEED]: "做种中",
};

// 错误消息映射配置
interface ErrorMapping {
  keywords: string[]; // 关键字列表，只要匹配其中之一就命中
  type: string; // 错误类型（用于筛选）
  message: string; // 友好的错误提示
  originalPattern?: RegExp; // 可选的正则表达式，用于更精确的匹配
}

const errorMappings: ErrorMapping[] = [
  {
    keywords: [
      "No data found",
      "Ensure your drives are connected",
      "Set Location",
    ],
    type: "文件不存在",
    message: "文件不存在",
  },
  {
    keywords: ["more than", "上传同一个种子", "other location"],
    type: "重复汇报",
    message: "重复汇报，通常可忽略",
  },
  {
    keywords: ["Request too frequent"],
    type: "频繁汇报",
    message: "频繁汇报，通常可忽略",
  },
  {
    keywords: ["You already are downloading"],
    type: "重复汇报",
    message: "重复下载，通常可忽略",
  },
  {
    keywords: ["missingFiles"],
    type: "文件不存在",
    message: "文件不存在",
  },
  {
    keywords: ["Permission denied", "permission"],
    type: "权限错误",
    message: "权限错误",
  },
  {
    keywords: ["No space left", "disk full", "Disk full"],
    type: "磁盘空间不足",
    message: "磁盘空间不足",
  },
  {
    keywords: ["Tracker gave HTTP response code 404", "Tracker not found"],
    type: "Tracker错误",
    message: "Tracker未找到",
  },
  {
    keywords: ["Tracker gave HTTP response code 403", "Forbidden"],
    type: "Tracker错误",
    message: "Tracker拒绝访问",
  },
  {
    keywords: ["Tracker gave a warning", "Unregistered torrent"],
    type: "Tracker错误",
    message: "种子未注册",
  },
  {
    keywords: ["Tracker gave HTTP response code 5", "502"],
    type: "Tracker错误",
    message: "Tracker服务器错误",
  },
  {
    keywords: ["Connection refused", "Could not connect", "timeout"],
    type: "网络错误",
    message: "网络连接失败",
  },
  {
    keywords: ["Piece #", "corrupt", "checksum"],
    type: "数据校验错误",
    message: "数据校验失败",
  },
];

// 获取友好的错误提示
const getFriendlyErrorMessage = (errorString?: string): string => {
  if (!errorString) return "未知错误";

  const lowerError = errorString.toLowerCase();

  // 遍历错误映射配置
  for (const mapping of errorMappings) {
    // 检查是否匹配任一关键字
    const matched = mapping.keywords.some((keyword) =>
      lowerError.includes(keyword.toLowerCase())
    );

    if (matched) {
      return mapping.message;
    }
  }

  // 如果没有匹配到任何规则，返回原始错误信息
  return errorString;
};

// 获取错误类型（用于筛选）
const getErrorType = (errorString?: string): string => {
  if (!errorString) return "其他错误";

  const lowerError = errorString.toLowerCase();

  // 遍历错误映射配置
  for (const mapping of errorMappings) {
    const matched = mapping.keywords.some((keyword) =>
      lowerError.includes(keyword.toLowerCase())
    );

    if (matched) {
      return mapping.type;
    }
  }

  return "其他错误";
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
  eta: 140,
  uploadedEver: 100,
  downloadDir: 200,
  addedDate: 150,
  activityDate: 150,
  labels: 100,
};

// 定义表格列配置
interface ColumnConfig {
  key: string;
  label: string;
  prop?: string;
  sortable?: boolean;
  minWidth?: number;
  defaultWidth?: number;
  showInCompact?: boolean; // 是否在紧凑模式下显示
}

const tableColumns: ColumnConfig[] = [
  {
    key: "name",
    label: "名称",
    prop: "name",
    sortable: true,
    minWidth: 260,
    defaultWidth: 320,
    showInCompact: true,
  },
  {
    key: "status",
    label: "状态",
    minWidth: 100,
    defaultWidth: 120,
    showInCompact: true,
  },
  {
    key: "percentDone",
    label: "进度",
    prop: "percentDone",
    sortable: true,
    minWidth: 120,
    defaultWidth: 140,
    showInCompact: true,
  },
  {
    key: "totalSize",
    label: "大小",
    prop: "totalSize",
    sortable: true,
    minWidth: 120,
    defaultWidth: 140,
    showInCompact: true,
  },
  {
    key: "uploadRatio",
    label: "分享率",
    prop: "uploadRatio",
    sortable: true,
    minWidth: 70,
    defaultWidth: 70,
    showInCompact: false,
  },
  {
    key: "rateDownload",
    label: "下载速度",
    prop: "rateDownload",
    sortable: true,
    minWidth: 120,
    defaultWidth: 140,
    showInCompact: true,
  },
  {
    key: "rateUpload",
    label: "上传速度",
    prop: "rateUpload",
    sortable: true,
    minWidth: 120,
    defaultWidth: 140,
    showInCompact: true,
  },
  {
    key: "defaultTracker",
    label: "服务器",
    prop: "defaultTracker",
    sortable: true,
    minWidth: 160,
    defaultWidth: 150,
    showInCompact: false,
  },
  {
    key: "peersDownloading",
    label: "种子",
    prop: "peersDownloading",
    sortable: true,
    minWidth: 110,
    defaultWidth: 130,
    showInCompact: false,
  },
  {
    key: "peersUploading",
    label: "用户",
    prop: "peersUploading",
    sortable: true,
    minWidth: 110,
    defaultWidth: 130,
    showInCompact: false,
  },
  {
    key: "uploadedEver",
    label: "已上传",
    prop: "uploadedEver",
    sortable: true,
    minWidth: 130,
    defaultWidth: 150,
    showInCompact: false,
  },
  {
    key: "downloadDir",
    label: "保存目录",
    prop: "downloadDir",
    sortable: true,
    minWidth: 160,
    defaultWidth: 220,
    showInCompact: false,
  },
  {
    key: "addedDate",
    label: "添加时间",
    prop: "addedDate",
    sortable: true,
    minWidth: 150,
    defaultWidth: 180,
    showInCompact: false,
  },
  {
    key: "activityDate",
    label: "最后活动",
    prop: "activityDate",
    sortable: true,
    minWidth: 150,
    defaultWidth: 180,
    showInCompact: false,
  },
  {
    key: "labels",
    label: "标签",
    minWidth: 150,
    defaultWidth: 200,
    showInCompact: false,
  },
];

const defaultColumnOrder = tableColumns.map((col) => col.key);

let refreshTimer: number | undefined;

const loading = ref(false);
function debounce<T extends (...args: any[]) => any>(fn: T, delay: number) {
  let timeoutId: number | null = null;
  return function (this: any, ...args: Parameters<T>) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = window.setTimeout(() => {
      fn.apply(this, args);
    }, delay);
  } as T;
}

const torrents = ref<Torrent[]>([]);
const searchKeyword = ref("");
const debouncedSearchKeyword = ref("");
const nameLowerCache = new Map<number, string>();
const defaultTrackerCache = new Map<number, string>();
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
const selectedTorrents = ref<Torrent[]>([]);
const selectedIdsState = ref<number[]>([]);
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
const tableRef = ref<TableInstance | null>(null);
const suppressSelectionChange = ref(false);
const lastClickedIndex = ref<number>(-1);
const removeDialog = ref({
  visible: false,
  ids: [] as number[],
  withData: false,
  message: "",
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
  limitDialogMode.value === "single" ? "限速设置" : "批量限速"
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
    return `将应用于所有 ${totalCount} 个种子`;
  }
  return `将应用于 ${filteredCount} / ${totalCount} 个种子`;
});

const isMobile = useMediaQuery("(max-width: 768px)");
const isCompactTable = useMediaQuery("(max-width: 1100px)");
const showMobileFilters = ref(!isMobile.value);
const columnWidths = ref<Record<string, number>>({ ...defaultColumnWidths });
const columnOrder = ref<string[]>([...defaultColumnOrder]);
const createDialogWidth = (desktopWidth: string, mobileWidth = "94vw") =>
  computed(() => (isMobile.value ? mobileWidth : desktopWidth));
const defaultDialogWidth = createDialogWidth("600px");
const detailDialogWidth = createDialogWidth("900px", "96vw");
const limitDialogWidth = createDialogWidth("480px");
const removeDialogWidth = createDialogWidth("420px", "90vw");

type SortOrder = "ascending" | "descending" | null;

const sortState = ref<{ prop: string; order: SortOrder }>({
  prop: "addedDate",
  order: "descending",
});

const currentPage = ref(1);
const pageSize = ref(50);
const pageSizeOptions = [25, 50, 100, 200, 500];

const hasSelection = computed(() => selectedTorrents.value.length > 0);

// 批量标签相关计算属性
const availableLabelsOptions = computed(() => {
  const labelsSet = new Set<string>();
  torrents.value.forEach((torrent) => {
    if (torrent.labels && torrent.labels.length > 0) {
      torrent.labels.forEach((label) => {
        // 排除特殊标签：分类和限速标签
        if (!label.startsWith("category:") && !label.startsWith("limit:")) {
          labelsSet.add(label);
        }
      });
    }
  });
  return Array.from(labelsSet)
    .sort()
    .map((label) => ({ label, value: label }));
});

const currentLabelsPreview = computed(() => {
  const labelsSet = new Set<string>();
  labelsDialogTargetTorrents.value.forEach((torrent) => {
    if (torrent.labels && torrent.labels.length > 0) {
      torrent.labels.forEach((label) => {
        // 排除特殊标签
        if (!label.startsWith("category:") && !label.startsWith("limit:")) {
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

// 计算右键菜单目标中是否有已停止的种子
const contextMenuHasStoppedTorrent = computed(() =>
  contextMenuTargets.value.some((t) => t.status === TorrentStatusEnum.STOPPED)
);

// 计算右键菜单目标中是否有运行中的种子
const contextMenuHasRunningTorrent = computed(() =>
  contextMenuTargets.value.some((t) => t.status !== TorrentStatusEnum.STOPPED)
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

// 持久化列顺序
/*
const persistColumnOrder = () => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      COLUMN_ORDER_STORAGE_KEY,
      JSON.stringify(columnOrder.value)
    );
  } catch (error) {
    console.warn("保存列顺序失败", error);
  }
};
*/

// 加载列顺序
const loadColumnOrder = () => {
  if (typeof window === "undefined") return;
  try {
    const stored = window.localStorage.getItem(COLUMN_ORDER_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // 验证顺序数组的有效性，确保包含所有列
      const validOrder = parsed.filter((key: string) =>
        tableColumns.some((col) => col.key === key)
      );
      // 添加新增的列（如果配置中有新列但存储中没有）
      const newColumns = tableColumns
        .map((col) => col.key)
        .filter((key) => !validOrder.includes(key));
      columnOrder.value = [...validOrder, ...newColumns];
    } else {
      columnOrder.value = [...defaultColumnOrder];
    }
  } catch (error) {
    console.warn("读取列顺序失败", error);
    columnOrder.value = [...defaultColumnOrder];
  }
};

// 根据顺序获取有序的列配置
const orderedColumns = computed(() => {
  return columnOrder.value
    .map((key) => tableColumns.find((col) => col.key === key))
    .filter(Boolean) as ColumnConfig[];
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
  if (!timestamp) return "—";
  return dayjs(timestamp * 1000).format("YYYY-MM-DD HH:mm");
};

const formatTorrentDate = (timestamp?: number): string => {
  if (!timestamp) return "—";
  return dayjs(timestamp * 1000).format("YYYY-MM-DD HH:mm");
};

const isTorrentError = (torrent: Torrent) => {
  return (torrent.error ?? 0) > 0 || !!torrent.errorString;
};

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
  const parts: string[] = [`进度: ${progressPercent}%`];

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
      if (etaText && etaText !== "—" && etaText !== "未知") {
        parts.push(`剩余时间: ${etaText}`);
      }
    }
  }

  // 如果有下载速度，也显示
  if (torrent.rateDownload > 0) {
    parts.push(`下载速度: ${formatSpeed(torrent.rateDownload)}`);
  }

  return parts.join("\n");
};

const getRatioClass = (ratio: number): string => {
  if (!ratio) return "ratio-zero";
  if (ratio > 0 && ratio < 1) return "ratio-low";
  if (ratio >= 1 && ratio < 3) return "ratio-mid";
  return "ratio-high";
};

// 筛选后的种子列表
const filteredTorrents = computed(() => {
  const keyword = debouncedSearchKeyword.value.trim().toLowerCase();
  return torrents.value.filter((torrent) => {
    const nameLower =
      nameLowerCache.get(torrent.id) ?? torrent.name.toLowerCase();
    const matchesKeyword = keyword
      ? nameLower.includes(keyword)
      : true;
    const matchesStatus =
      statusFilter.value === "all"
        ? true
        : statusFilter.value === "error"
        ? isTorrentError(torrent)
        : statusFilter.value === "queued"
        ? (
            [
              TorrentStatusEnum.CHECK_WAIT,
              TorrentStatusEnum.DOWNLOAD_WAIT,
              TorrentStatusEnum.SEED_WAIT,
            ] as TorrentStatus[]
          ).includes(torrent.status)
        : statusFilter.value === "active"
        ? torrent.rateDownload > 0 || torrent.rateUpload > 0
        : Number(statusFilter.value) === torrent.status;
    const matchesTracker =
      !trackerFilter.value ||
      (torrent.trackers ?? []).some((tracker) =>
        matchesTrackerFilter(tracker.announce, trackerFilter.value)
      );
    const matchesCategory =
      !categoryFilter.value ||
      (categoryFilter.value === "无分类"
        ? !torrent.category
        : torrent.category === categoryFilter.value);
    const matchesDownloadDir =
      !downloadDirFilter.value ||
      torrent.downloadDir === downloadDirFilter.value;
    const matchesErrorType =
      !errorTypeFilter.value ||
      (isTorrentError(torrent) &&
        getErrorType(torrent.errorString) === errorTypeFilter.value);
    return (
      matchesKeyword &&
      matchesStatus &&
      matchesTracker &&
      matchesCategory &&
      matchesDownloadDir &&
      matchesErrorType
    );
  });
});

const getSortValue = (torrent: Torrent, prop?: string) => {
  switch (prop) {
    case "name":
      return nameLowerCache.get(torrent.id) ?? torrent.name.toLowerCase();
    case "status":
      return torrent.status;
    case "percentDone":
      return torrent.percentDone;
    case "totalSize":
      return torrent.totalSize;
    case "uploadRatio":
      return torrent.uploadRatio;
    case "defaultTracker":
      return defaultTrackerCache.get(torrent.id) ?? getDefaultTracker(torrent);
    case "peersDownloading":
      // 按照 tracker 报告的种子总数排序
      return getTrackerPeerCounts(torrent).seeders;
    case "peersUploading":
      // 按照 tracker 报告的用户总数排序
      return getTrackerPeerCounts(torrent).leechers;
    case "rateDownload":
      return torrent.rateDownload;
    case "rateUpload":
      return torrent.rateUpload;
    case "eta":
      // eta 为负数或未定义时，排序时放到最后
      return torrent.eta !== undefined && torrent.eta >= 0
        ? torrent.eta
        : Number.MAX_SAFE_INTEGER;
    case "uploadedEver":
      return torrent.uploadedEver ?? 0;
    case "downloadDir":
      return (torrent.downloadDir || "").toLowerCase();
    case "addedDate":
      return torrent.addedDate ?? 0;
    case "activityDate":
      return torrent.activityDate ?? 0;
    default:
      return (torrent as Record<string, any>)[prop || ""] ?? 0;
  }
};

const displayedTorrents = computed(() => {
  const base = filteredTorrents.value;
  const { prop, order } = sortState.value;
  if (!prop || !order) return base;
  return [...base].sort((a, b) => {
    const aVal = getSortValue(a, prop);
    const bVal = getSortValue(b, prop);
    if (typeof aVal === "string" && typeof bVal === "string") {
      const compare = aVal.localeCompare(bVal);
      return order === "ascending" ? compare : -compare;
    }
    const compare = Number(aVal) - Number(bVal);
    return order === "ascending" ? compare : -compare;
  });
});

const paginatedTorrents = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  return displayedTorrents.value.slice(start, start + pageSize.value);
});

const trackerOptions = computed(() => {
  interface TrackerOption {
    label: string;
    value: string;
    displayName: string;
    host: string;
  }
  const trackerMap = new Map<string, TrackerOption>();
  torrents.value.forEach((torrent) => {
    const list = torrent.trackers || [];
    const recognized = list.find((tr) => {
      const dn = getTrackerDisplayName(tr.announce);
      const h = getTrackerHost(tr.announce);
      return dn !== h;
    });
    const chosen = recognized || list[0];
    if (!chosen) return;
    const displayName = getTrackerDisplayName(chosen.announce);
    const host = getTrackerHost(chosen.announce);
    if (!trackerMap.has(displayName)) {
      const label = displayName !== host ? `${displayName} (${host})` : host;
      trackerMap.set(displayName, {
        label,
        value: displayName,
        displayName,
        host,
      });
    }
  });
  return Array.from(trackerMap.values()).sort((a, b) =>
    a.label.localeCompare(b.label)
  );
});

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

const categoryOptions = computed(() => {
  const categories = new Set<string>();
  torrents.value.forEach((torrent) => {
    if (torrent.category) {
      categories.add(torrent.category);
    }
  });
  const result = Array.from(categories).sort();
  // 检查是否有无分类的种子
  const hasUncategorized = torrents.value.some((t) => !t.category);
  if (hasUncategorized) {
    result.unshift("无分类");
  }
  return result.map((cat) => ({ label: cat, value: cat }));
});

const downloadDirOptions = computed(() => {
  const dirMap = new Map<string, { label: string; value: string }>();

  torrents.value.forEach((torrent) => {
    const dir = torrent.downloadDir;
    if (dir && !dirMap.has(dir)) {
      dirMap.set(dir, {
        label: dir,
        value: dir,
      });
    }
  });

  return Array.from(dirMap.values())
    .sort((a, b) => a.label.localeCompare(b.label))
    .map((item) => ({
      label: item.label,
      value: item.value,
    }));
});

const allDownloadDirs = computed(() => {
  const set = new Set<string>();
  const def = sessionConfig.value?.["download-dir"];
  if (def) set.add(def);
  torrents.value.forEach((t) => {
    if (t.downloadDir) set.add(t.downloadDir);
  });
  return Array.from(set).sort((a, b) => a.localeCompare(b));
});

const searchDownloadDirs = (queryString: string, cb: (results: any[]) => void) => {
  const q = (queryString || "").trim().toLowerCase();
  const list = allDownloadDirs.value.filter(
    (dir) => !q || dir.toLowerCase().includes(q)
  );
  cb(list.map((dir) => ({ value: dir })));
};

const errorTypeOptions = computed(() => {
  const errorTypes = new Set<string>();

  torrents.value.forEach((torrent) => {
    if (isTorrentError(torrent)) {
      const errorType = getErrorType(torrent.errorString);
      errorTypes.add(errorType);
    }
  });

  return Array.from(errorTypes)
    .sort()
    .map((type) => ({ label: type, value: type }));
});

const selectedIds = computed(() =>
  selectedTorrents.value.map((torrent) => torrent.id)
);
const detailTrackerRows = computed(() => {
  if (!detailTorrent.value?.trackers?.length) return [];
  return detailTorrent.value.trackers.map((tracker, index) => {
    const stat = detailTorrent.value?.trackerStats?.find(
      (s) => s.announce === tracker.announce
    );
    const success = stat?.lastAnnounceSucceeded;
    const statusType = success ? "success" : "warning";
    const lastAnnounce = stat?.lastAnnounceTime
      ? formatLastActivity(stat.lastAnnounceTime)
      : "—";
    const statusText = success ? "汇报成功" : stat ? "等待汇报/失败" : "未知";
    return {
      tier: tracker.tier ?? index,
      announce: tracker.announce,
      statusText,
      statusType,
      lastAnnounce,
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
  children?: FileTreeNode[];
};

const buildDetailFileTree = (files: Array<{ name: string; index: number }>): FileTreeNode[] => {
  const root: FileTreeNode = { key: "__root__", label: "", isDir: true, children: [] };
  const ensureDir = (parent: FileTreeNode, name: string, fullPath: string): FileTreeNode => {
    parent.children = parent.children || [];
    let child = parent.children.find((n) => n.isDir && n.label === name);
    if (!child) {
      child = { key: fullPath, label: name, isDir: true, children: [] };
      parent.children.push(child);
    }
    return child;
  };
  files.forEach((file) => {
    const parts = (file.name || "").split("/").filter(Boolean);
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

watch([searchKeyword, statusFilter, trackerFilter], () => {
  currentPage.value = 1;
});

watch(pageSize, () => {
  currentPage.value = 1;
});

const debouncedSearch = debounce((value: string) => {
  debouncedSearchKeyword.value = value;
  currentPage.value = 1;
}, 300);
watch(searchKeyword, (val) => {
  debouncedSearch(val);
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

watch(
  () => displayedTorrents.value.length,
  (total) => {
    const maxPage = Math.max(1, Math.ceil(total / pageSize.value) || 1);
    if (currentPage.value > maxPage) {
      currentPage.value = maxPage;
    }
  }
);

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

const handleSortChange = ({
  prop,
  order,
}: {
  column: any;
  prop: string;
  order: SortOrder;
}) => {
  sortState.value = {
    prop: prop || "",
    order: order || null,
  };
};

/*
const handleSelectionChange = (selection: Torrent[]) => {
  selectedTorrents.value = selection;
  if (suppressSelectionChange.value) {
    return;
  }
  selectedIdsState.value = selection.map((torrent) => torrent.id);
};
*/

const handleRowClick = (row: Torrent, _column: any, event: MouseEvent) => {
  if (!tableRef.value) return;

  // 获取当前行在分页数据中的索引
  const clickedIndex = paginatedTorrents.value.findIndex(
    (t) => t.id === row.id
  );
  if (clickedIndex === -1) return;

  // 判断是否在选中状态
  const isSelected = selectedTorrents.value.some((t) => t.id === row.id);

  if (event.ctrlKey || event.metaKey) {
    // Ctrl/Cmd + 点击：切换选中状态
    if (isSelected) {
      tableRef.value.toggleRowSelection(row, false);
    } else {
      tableRef.value.toggleRowSelection(row, true);
    }
    lastClickedIndex.value = clickedIndex;
  } else if (event.shiftKey) {
    // Shift + 点击：范围选择
    if (
      lastClickedIndex.value >= 0 &&
      lastClickedIndex.value < paginatedTorrents.value.length
    ) {
      // 清除当前所有选中
      tableRef.value.clearSelection();

      // 计算范围
      const start = Math.min(lastClickedIndex.value, clickedIndex);
      const end = Math.max(lastClickedIndex.value, clickedIndex);

      // 选中范围内的所有行
      for (let i = start; i <= end; i++) {
        tableRef.value.toggleRowSelection(paginatedTorrents.value[i], true);
      }
    } else {
      // 如果没有上次点击记录，只选中当前行
      tableRef.value.clearSelection();
      tableRef.value.toggleRowSelection(row, true);
      lastClickedIndex.value = clickedIndex;
    }
  } else {
    // 普通点击：切换当前行的选中状态
    if (isSelected) {
      tableRef.value.toggleRowSelection(row, false);
    } else {
      tableRef.value.toggleRowSelection(row, true);
    }
    lastClickedIndex.value = clickedIndex;
  }
};

const handleRowContextMenu = (
  row: Torrent,
  _column: any,
  event: MouseEvent
) => {
  event.preventDefault();

  // 判断右键的种子是否在已选择列表中
  const isRowSelected = selectedTorrents.value.some((t) => t.id === row.id);

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
    if (tableRef.value && paginatedTorrents.value.length > 0) {
      tableRef.value.clearSelection();
      paginatedTorrents.value.forEach((torrent) => {
        tableRef.value?.toggleRowSelection(torrent, true);
      });
      // 更新最后点击索引为最后一行
      lastClickedIndex.value = paginatedTorrents.value.length - 1;
    }
  }
};

const hideContextMenu = () => {
  contextMenu.value.visible = false;
  contextMenu.value.torrent = null;
  contextMenuTargets.value = [];
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
  _oldWidth: number,
  column: TableColumnCtx<Torrent>
) => {
  const key = column.columnKey as string | undefined;
  if (!key || key === "selection") return;
  const minWidth = Number(column.minWidth) || 80;
  const normalizedWidth = Math.max(minWidth, Math.round(newWidth));
  if (columnWidths.value[key] === normalizedWidth) return;
  columnWidths.value = {
    ...columnWidths.value,
    [key]: normalizedWidth,
  };
  persistColumnWidths();
  nextTick(() => {
    tableRef.value?.doLayout?.();
  });
};

const resetColumnWidths = () => {
  columnWidths.value = { ...defaultColumnWidths };
  columnOrder.value = [...defaultColumnOrder];
  if (typeof window !== "undefined") {
    try {
      window.localStorage.removeItem(COLUMN_WIDTH_STORAGE_KEY);
      window.localStorage.removeItem(COLUMN_ORDER_STORAGE_KEY);
    } catch (error) {
      console.error(
        "Failed to clear column settings from localStorage:",
        error
      );
    }
  }
  nextTick(() => {
    tableRef.value?.doLayout?.();
  });
  ElMessage.success("列宽和列顺序已重置为默认值");
};

// 加载种子列表
const loadTorrents = async (options: { silent?: boolean } = {}) => {
  if (!options.silent) {
    loading.value = true;
  }
  try {
    if (options.silent && isTransmission) {
      if (!torrents.value.length) {
        const full = await api.getTorrents();
        torrents.value = full.torrents;
        nameLowerCache.clear();
        defaultTrackerCache.clear();
        full.torrents.forEach((t) => {
          nameLowerCache.set(t.id, (t.name || "").toLowerCase());
          defaultTrackerCache.set(t.id, getDefaultTracker(t));
        });
      } else {
        const inc = await api.getTorrents(undefined, { ids: "recently-active" });
        const removed = inc.removed || [];
        if (removed.length) {
          const removeSet = new Set(removed);
          torrents.value = torrents.value.filter((t) => !removeSet.has(t.id));
          selectedIdsState.value = selectedIdsState.value.filter((id) => !removeSet.has(id));
          selectedTorrents.value = selectedTorrents.value.filter((t) => !removeSet.has(t.id));
        }
        const map = new Map<number, Torrent>();
        torrents.value.forEach((t) => map.set(t.id, t));
        inc.torrents.forEach((u) => {
          const cur = map.get(u.id);
          if (cur) {
            Object.assign(cur, u);
          } else {
            torrents.value.push(u);
          }
          nameLowerCache.set(u.id, (u.name || "").toLowerCase());
          defaultTrackerCache.set(u.id, getDefaultTracker(u));
        });
      }
    } else {
      const result = await api.getTorrents();
      torrents.value = result.torrents;
      nameLowerCache.clear();
      defaultTrackerCache.clear();
      result.torrents.forEach((t) => {
        nameLowerCache.set(t.id, (t.name || "").toLowerCase());
        defaultTrackerCache.set(t.id, getDefaultTracker(t));
      });
    }
    // Update the torrents in system status store
    systemStatusStore.setTorrents([...torrents.value]);
    restoreSelection();
    syncContextMenuTorrent();
    lastFetchedAt.value = dayjs().format("YYYY-MM-DD HH:mm:ss");
  } catch (error: any) {
    ElMessage.error(`加载失败: ${error.message}`);
  } finally {
    if (!options.silent) {
      loading.value = false;
    }
  }
};

const restoreSelection = () => {
  if (!tableRef.value) return;
  const idsToRestore = [...selectedIdsState.value];
  suppressSelectionChange.value = true;
  nextTick(() => {
    const table = tableRef.value;
    if (!table) {
      suppressSelectionChange.value = false;
      return;
    }
    table.clearSelection();
    if (!idsToRestore.length) {
      selectedTorrents.value = [];
      suppressSelectionChange.value = false;
      return;
    }
    const idSet = new Set(idsToRestore);
    const rowsToSelect = paginatedTorrents.value.filter((torrent) =>
      idSet.has(torrent.id)
    );
    rowsToSelect.forEach((torrent) => {
      table.toggleRowSelection(torrent, true);
    });
    selectedTorrents.value = rowsToSelect;
    selectedIdsState.value = rowsToSelect.map((torrent) => torrent.id);
    suppressSelectionChange.value = false;
  });
};

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
  try {
    await api.removeTorrents(ids, deleteData);
    ElMessage.success("已删除");
    removeDialog.value.visible = false;
    removeDialog.value.ids = [];
    selectedIdsState.value = selectedIdsState.value.filter(
      (id) => !ids.includes(id)
    );
    selectedTorrents.value = selectedTorrents.value.filter(
      (torrent) => !ids.includes(torrent.id)
    );
    loadTorrents();
  } catch (error: any) {
    ElMessage.error(`删除失败: ${error.message}`);
  }
};

const startAutoRefresh = () => {
  stopAutoRefresh();
  refreshTimer = window.setInterval(() => {
    if (isScrolling.value) return;
    if (typeof document !== "undefined" && document.visibilityState === "hidden")
      return;
    loadTorrents({ silent: true });
  }, REFRESH_INTERVAL);
};

const stopAutoRefresh = () => {
  if (refreshTimer) {
    window.clearInterval(refreshTimer);
    refreshTimer = undefined;
  }
};

const startSelected = async () => {
  if (!selectedIds.value.length) return;
  try {
    await api.startTorrents(selectedIds.value);
    ElMessage.success("已开始选中种子");
    loadTorrents();
  } catch (error: any) {
    ElMessage.error(`操作失败: ${error.message}`);
  }
};

const stopSelected = async () => {
  if (!selectedIds.value.length) return;
  try {
    await api.stopTorrents(selectedIds.value);
    ElMessage.success("已暂停选中种子");
    loadTorrents();
  } catch (error: any) {
    ElMessage.error(`操作失败: ${error.message}`);
  }
};

const removeSelected = () => {
  if (!selectedIds.value.length) return;
  openRemoveDialog(
    [...selectedIds.value],
    `确定删除选中的 ${selectedIds.value.length} 个种子？`
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
) => {
  const targets = [...contextMenuTargets.value];
  if (!targets.length) return;

  const targetIds = targets.map((t) => t.id);
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
        `确定删除选中的 ${targetIds.length} 个种子？`
      );
    } else {
      openRemoveDialog(targetIds, "确定删除该种子？");
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
  if (action === "limit") {
    if (isBatch) {
      openBatchLimitDialogWithTargets(targets);
    } else {
      openSingleLimitDialog(targets[0]!);
    }
  }
};

// 批量开始种子
const startTorrentsById = async (ids: number[]) => {
  try {
    await api.startTorrents(ids);
    ElMessage.success(
      ids.length > 1 ? `已开始 ${ids.length} 个种子` : "已开始"
    );
    loadTorrents();
  } catch (error: any) {
    ElMessage.error(`操作失败: ${error.message}`);
  }
};

// 批量暂停种子
const stopTorrentsById = async (ids: number[]) => {
  try {
    await api.stopTorrents(ids);
    ElMessage.success(
      ids.length > 1 ? `已暂停 ${ids.length} 个种子` : "已暂停"
    );
    loadTorrents();
  } catch (error: any) {
    ElMessage.error(`操作失败: ${error.message}`);
  }
};

// 批量校验种子
const verifyTorrentsById = async (ids: number[]) => {
  try {
    await api.verifyTorrents(ids);
    ElMessage.success(
      ids.length > 1 ? `已开始重新校验 ${ids.length} 个种子` : "已开始重新校验"
    );
  } catch (error: any) {
    ElMessage.error(`重新校验失败: ${error.message}`);
  }
};

// 批量汇报种子
const reannounceTorrentsById = async (ids: number[]) => {
  try {
    await api.reannounceTorrents(ids);
    ElMessage.success(
      ids.length > 1
        ? `已通知 Tracker（${ids.length} 个种子）`
        : "已通知 Tracker"
    );
  } catch (error: any) {
    ElMessage.error(`重新汇报失败: ${error.message}`);
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
    ElMessage.warning("请输入新的保存目录");
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
        ? `已更新 ${locationTargetIds.value.length} 个种子的保存目录`
        : "保存目录已更新"
    );
    showLocationDialog.value = false;
    loadTorrents();
  } catch (error: any) {
    ElMessage.error(`变更失败: ${error.message}`);
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
          ? `已更新 ${categoryTargetIds.value.length} 个种子的分类`
          : "分类已更新"
      );
      showCategoryDialog.value = false;
      loadTorrents();
    } else {
      ElMessage.warning("当前客户端不支持设置分类");
    }
  } catch (error: any) {
    ElMessage.error(`设置分类失败: ${error.message}`);
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
    ElMessage.warning("请先选择种子");
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
      return "在现有标签基础上添加新标签";
    case "replace":
      return "清空现有标签，重新设置（分类和限速标签不受影响）";
    case "remove":
      return "删除指定的标签";
    default:
      return "";
  }
};

const getLabelsPlaceholder = () => {
  switch (labelsForm.value.mode) {
    case "add":
      return "输入新标签或从现有标签中选择";
    case "replace":
      return "输入标签或从现有标签中选择";
    case "remove":
      return "选择要移除的标签";
    default:
      return "";
  }
};

const getLabelsFormTip = () => {
  const count = labelsForm.value.selectedLabels.length;
  if (count === 0) return "请选择或输入标签";

  const torrentCount = labelsDialogTargetTorrents.value.length;
  switch (labelsForm.value.mode) {
    case "add":
      return `将为 ${torrentCount} 个种子添加 ${count} 个标签`;
    case "replace":
      return `将为 ${torrentCount} 个种子替换为 ${count} 个标签`;
    case "remove":
      return `将从 ${torrentCount} 个种子中移除 ${count} 个标签`;
    default:
      return "";
  }
};

const submitLabelsChange = async () => {
  if (!isLabelsFormValid.value) {
    ElMessage.warning("请选择或输入标签");
    return;
  }

  const targetTorrents = labelsDialogTargetTorrents.value;
  const selectedLabels = labelsForm.value.selectedLabels
    .map((label) => label.trim())
    .filter(Boolean);
  const mode = labelsForm.value.mode;

  const loadingInstance = ElLoading.service({
    text: `正在更新标签 (0/${targetTorrents.length})`,
  });

  try {
    for (let i = 0; i < targetTorrents.length; i++) {
      const torrent = targetTorrents[i];
      if (!torrent) continue;
      const currentLabels = torrent.labels || [];

      // 提取特殊标签（分类和限速）
      const categoryLabel = currentLabels.find((l) =>
        l.startsWith("category:")
      );
      const limitLabel = currentLabels.find((l) => l.startsWith("limit:"));
      const specialLabels = [categoryLabel, limitLabel].filter(
        Boolean
      ) as string[];

      // 提取普通标签（排除特殊标签）
      const normalLabels = currentLabels.filter(
        (l) => !l.startsWith("category:") && !l.startsWith("limit:")
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
        `正在更新标签 (${i + 1}/${targetTorrents.length})`
      );
    }

    ElMessage.success(`已更新 ${targetTorrents.length} 个种子的标签`);
    showLabelsDialog.value = false;
    loadTorrents();
  } catch (error: any) {
    ElMessage.error(`修改标签失败: ${error.message}`);
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
      client: peer.clientName || "未知",
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
    ElMessage.error(`加载详情失败: ${error.message}`);
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
    ElMessage.warning("暂无文件可更新");
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
    ElMessage.info("未改变文件选择");
    return;
  }
  const payload: Record<string, any> = {};
  if (wanted.length) payload["files-wanted"] = wanted;
  if (unwanted.length) payload["files-unwanted"] = unwanted;
  detailFilesSaving.value = true;
  try {
    await api.setTorrents([detailTorrent.value.id], payload);
    ElMessage.success("文件选择已更新");
    await refreshDetailData();
  } catch (error: any) {
    ElMessage.error(`更新失败: ${error.message}`);
  } finally {
    detailFilesSaving.value = false;
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

// 生成限速标签字符串
const buildLimitLabel = (form: LimitFormState): string => {
  const parts: string[] = [];
  if (form.downloadLimited && form.downloadLimit > 0) {
    parts.push(`↓${form.downloadLimit}${form.downloadUnit}/s`);
  }
  if (form.uploadLimited && form.uploadLimit > 0) {
    parts.push(`↑${form.uploadLimit}${form.uploadUnit}/s`);
  }
  if (parts.length === 0) {
    return "";
  }
  return `limit:${parts.join("")}`;
};

const openBatchLimitDialog = () => {
  if (!torrents.value.length) {
    ElMessage.warning("暂无种子");
    return;
  }
  limitDialogMode.value = "batch";
  limitDialogTargetName.value = "";
  limitDialogLoading.value = false;
  // 使用所有种子，而不是选中的种子
  limitDialogIds.value = torrents.value.map((t) => t.id);
  limitDialogTargetTorrents.value = [...torrents.value];
  resetLimitDialogForm();
  limitDialogVisible.value = true;
};

// 从右键菜单打开批量限速对话框
const openBatchLimitDialogWithTargets = (targets: Torrent[]) => {
  if (!targets.length) return;
  limitDialogMode.value = "batch";
  limitDialogTargetName.value = "";
  limitDialogLoading.value = false;
  limitDialogIds.value = targets.map((t) => t.id);
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
    addLabel: false, // 单个种子模式默认不添加标签
  };
};

const openSingleLimitDialog = async (torrent: Torrent) => {
  limitDialogMode.value = "single";
  limitDialogTargetName.value = `当前种子：${torrent.name}`;
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
    ElMessage.warning("没有匹配的种子");
    return;
  }

  const targetIds = targetTorrents.map((t) => t.id);
  limitDialogSaving.value = true;

  try {
    // 1. 设置限速
    await api.setTorrents(targetIds, buildLimitPayload(limitDialogForm.value));

    // 2. 如果是批量模式且需要添加标签
    if (limitDialogMode.value === "batch" && limitDialogForm.value.addLabel) {
      const limitLabel = buildLimitLabel(limitDialogForm.value);
      if (limitLabel) {
        // 为每个种子更新标签
        for (const torrent of targetTorrents) {
          // 移除旧的限速标签
          const existingLabels = (torrent.labels || []).filter(
            (label) => !label.startsWith("limit:")
          );
          // 添加新的限速标签
          const newLabels = [...existingLabels, limitLabel];
          await api.setTorrents([torrent.id], { labels: newLabels });
        }
      }
    }

    ElMessage.success(
      targetIds.length > 1
        ? `已对 ${targetIds.length} 个种子应用限速设置`
        : "限速设置已应用"
    );
    limitDialogVisible.value = false;
    loadTorrents();
  } catch (error: any) {
    ElMessage.error(`保存失败: ${error.message}`);
  } finally {
    limitDialogSaving.value = false;
  }
};

// 批量替换tracker相关方法
const openReplaceTrackerDialog = () => {
  if (!torrents.value.length) {
    ElMessage.warning("暂无种子");
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
    ElMessage.warning("请填写原域名和新域名");
    return;
  }

  if (oldUrl === newUrl) {
    ElMessage.warning("原域名和新域名不能相同");
    return;
  }

  replaceTrackerLoading.value = true;

  try {
    // 使用所有种子的ID
    const allIds = torrents.value.map((t) => t.id);
    await api.replaceTrackers(allIds, oldUrl, newUrl);
    ElMessage.success(`已对 ${allIds.length} 个种子替换 tracker`);
    replaceTrackerDialogVisible.value = false;
    // 刷新种子列表
    await loadTorrents();
  } catch (error: any) {
    ElMessage.error(`替换失败: ${error.message || error}`);
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
        ElMessage.warning("请输入磁力链接");
        return;
      }

      // 按行分割，过滤空行
      const magnetLinks = addForm.value.magnet
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0);

      if (magnetLinks.length === 0) {
        ElMessage.warning("请输入至少一个磁力链接");
        return;
      }

      // 显示全屏遮罩
      loadingInstance = ElLoading.service({
        lock: true,
        text: `正在添加第 1/${magnetLinks.length} 个种子...`,
        background: "rgba(0, 0, 0, 0.7)",
      });

      for (let i = 0; i < magnetLinks.length; i++) {
        const magnet = magnetLinks[i];
        if (!magnet) continue;

        // 更新进度
        if (loadingInstance) {
          loadingInstance.setText(
            `正在添加第 ${i + 1}/${magnetLinks.length} 个种子...`
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
        ElMessage.warning("请选择至少一个种子文件");
        return;
      }

      const fileCount = addForm.value.files.length;

      // 显示全屏遮罩
      loadingInstance = ElLoading.service({
        lock: true,
        text: `正在添加第 1/${fileCount} 个种子文件...`,
        background: "rgba(0, 0, 0, 0.7)",
      });

      for (let i = 0; i < fileCount; i++) {
        const file = addForm.value.files[i];
        if (!file) continue;

        // 更新进度
        if (loadingInstance) {
          loadingInstance.setText(
            `正在添加第 ${i + 1}/${fileCount} 个种子文件...`
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
      ElMessage.success(`成功添加 ${successCount} 个种子`);
    } else if (successCount === 0) {
      ElMessage.error(`添加失败: ${errors.join("; ")}`);
    } else {
      ElMessage.warning(`成功 ${successCount} 个，失败 ${failCount} 个`);
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
    loadTorrents();
  } catch (error: any) {
    // 确保关闭遮罩
    if (loadingInstance) {
      loadingInstance.close();
    }
    ElMessage.error(`添加失败: ${error.message}`);
  }
};

// 获取状态文本
const getStatusText = (torrent: Torrent): string => {
  // 如果正在校验中，则显示校验中状态，忽略错误状态
  if (
    torrent.status === TorrentStatusEnum.CHECK ||
    torrent.status === TorrentStatusEnum.CHECK_WAIT
  ) {
    return statusTextMap[torrent.status];
  }

  // 其他状态下，如果存在错误则显示错误类型（type字段）
  if (isTorrentError(torrent)) {
    return getErrorType(torrent.errorString);
  }

  return statusTextMap[torrent.status] || "未知";
};

// 获取状态类型
const getStatusType = (torrent: Torrent): string => {
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

  const typeMap: Record<TorrentStatus, string> = {
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
    return "未知";
  }

  const seconds = Math.floor(eta);

  // 小于1分钟
  if (seconds < 60) {
    return `${seconds}秒`;
  }

  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  // 超过1天
  if (days > 0) {
    const remainingHours = hours % 24;
    if (remainingHours > 0) {
      return `${days}天${remainingHours}小时`;
    }
    return `${days}天`;
  }

  // 超过1小时
  if (hours > 0) {
    const remainingMinutes = minutes % 60;
    if (remainingMinutes > 0) {
      return `${hours}小时${remainingMinutes}分钟`;
    }
    return `${hours}小时`;
  }

  // 只有分钟
  return `${minutes}分钟`;
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
    return `<a href="${url}" target="_blank" rel="noopener noreferrer" style="color: #409eff; text-decoration: underline;">${url}</a>`;
  });
};

// 初始化表格列头拖拽排序
// let sortableInstance: Sortable | null = null;

const initColumnDragSort = () => {
  // TableV2暂不支持SortableJS拖拽排序
  return;
};

// Table V2 Logic

const isAllSelected = computed(() => {
  return (
    paginatedTorrents.value.length > 0 &&
    selectedIdsState.value.length === paginatedTorrents.value.length &&
    paginatedTorrents.value.every((t) => selectedIdsState.value.includes(t.id))
  );
});

const isIndeterminate = computed(() => {
  const selectedCount = paginatedTorrents.value.filter((t) =>
    selectedIdsState.value.includes(t.id)
  ).length;
  return selectedCount > 0 && selectedCount < paginatedTorrents.value.length;
});

const toggleAllSelection = (val: CheckboxValueType) => {
  if (!!val) {
    const ids = paginatedTorrents.value.map((t) => t.id);
    const newSelected = [...selectedIdsState.value];
    ids.forEach((id) => {
      if (!newSelected.includes(id)) {
        newSelected.push(id);
      }
    });
    selectedIdsState.value = newSelected;
    selectedTorrents.value = torrents.value.filter((t) =>
      newSelected.includes(t.id)
    );
  } else {
    const ids = paginatedTorrents.value.map((t) => t.id);
    const newSelected = selectedIdsState.value.filter(
      (id) => !ids.includes(id)
    );
    selectedIdsState.value = newSelected;
    selectedTorrents.value = torrents.value.filter((t) =>
      newSelected.includes(t.id)
    );
  }
};

const toggleRowSelection = (row: Torrent, val: CheckboxValueType) => {
  if (!!val) {
    if (!selectedIdsState.value.includes(row.id)) {
      selectedIdsState.value = [...selectedIdsState.value, row.id];
    }
  } else {
    selectedIdsState.value = selectedIdsState.value.filter(
      (id) => id !== row.id
    );
  }
  selectedTorrents.value = torrents.value.filter((t) =>
    selectedIdsState.value.includes(t.id)
  );
};

const v2SortState = computed(() => {
  if (!sortState.value.order) return undefined;
  return {
    key: sortState.value.prop,
    order: sortState.value.order === "ascending" ? "asc" : "desc",
  } as any;
});

const handleV2Sort = ({ key, order }: { key: any; order: any }) => {
  handleSortChange({
    column: null,
    prop: key,
    order: order === "asc" ? "ascending" : "descending",
  });
};

const handleColumnResizeV2 = ({
  column,
  width,
}: {
  column: any;
  width: number;
}) => {
  handleColumnResize(width, 0, {
    columnKey: column.key,
    minWidth: column.minWidth,
  } as any);
};

const v2RowEventHandlers = {
  onClick: ({ rowData, event }: { rowData: Torrent; event: Event }) => {
    handleRowClick(rowData, null, event as MouseEvent);
  },
  onDblclick: ({ rowData }: { rowData: Torrent }) => {
    handleRowDoubleClick(rowData);
  },
  onContextmenu: ({
    rowData,
    event,
  }: {
    rowData: Torrent;
    event: Event;
  }) => {
    handleRowContextMenu(rowData, null, event as MouseEvent);
  },
};

const v2RowClassName = ({ rowData, rowIndex }: { rowData: Torrent; rowIndex: number }) => {
  const classes = [];
  if (rowIndex % 2 === 1) {
    classes.push("el-table-v2__row--striped");
  }
  if (selectedIdsState.value.includes(rowData.id)) {
    classes.push("current-row");
  }
  return classes.join(" ");
};

const onColumnResizeMouseDown = (e: MouseEvent, column: any) => {
  e.preventDefault();
  e.stopPropagation();

  const startX = e.clientX;
  const startWidth = column.width || 80;

  const onMouseMove = (e: MouseEvent) => {
    requestAnimationFrame(() => {
      const diff = e.clientX - startX;
      const newWidth = Math.max(column.minWidth || 50, startWidth + diff);
      
      handleColumnResizeV2({
        column,
        width: newWidth
      });
    });
  };

  const onMouseUp = () => {
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
    document.body.style.cursor = '';
  };

  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('mouseup', onMouseUp);
  document.body.style.cursor = 'col-resize';
};

const tableV2Columns = computed<Column<Torrent>[]>(() => {
  const selectionCol: Column<Torrent> = {
    key: "selection",
    width: 48,
    fixed: true,
    align: "center",
    headerCellRenderer: () => {
      return h(ElCheckbox, {
        modelValue: isAllSelected.value,
        indeterminate: isIndeterminate.value,
        "onUpdate:modelValue": toggleAllSelection,
      });
    },
    cellRenderer: ({ rowData }) => {
      return h(ElCheckbox, {
        modelValue: selectedIdsState.value.includes(rowData.id),
        "onUpdate:modelValue": (val: CheckboxValueType) =>
          toggleRowSelection(rowData, val),
        onClick: (e: Event) => e.stopPropagation(),
      });
    },
  };

  const dynamicCols = orderedColumns.value.map((col) => {
    const common: Column<Torrent> = {
      key: col.key,
      dataKey: col.key,
      title: col.label,
      width: getColumnWidth(col.key, col.defaultWidth),
      sortable: col.sortable,
      resizable: true,
      minWidth: col.minWidth,
      headerCellRenderer: (props: any) => {
        return h('div', { 
          class: 'el-table-v2__header-cell-text',
          style: { height: '100%', display: 'flex', alignItems: 'center', width: '100%' } 
        }, [
          h('span', { style: { flex: '0 1 auto', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: '4px' }, title: props.column.title }, props.column.title),
          
          props.column.sortable && h('span', { 
            class: 'el-table-v2__sort-icon',
            style: { 
              cursor: 'pointer', 
              flexShrink: 0,
              display: 'inline-flex',
              flexDirection: 'column',
              alignItems: 'center',
              height: '14px',
              width: '24px',
              verticalAlign: 'middle',
              overflow: 'initial',
              position: 'relative'
            }
          }, [
            h('i', {
              class: {
                'sort-caret': true,
                'ascending': true,
                'active': props.sortBy?.key === props.column.key && props.sortBy?.order === 'asc'
              },
              style: {
                width: 0,
                height: 0,
                border: '5px solid transparent',
                position: 'absolute',
                left: '7px',
                borderBottomColor: props.sortBy?.key === props.column.key && props.sortBy?.order === 'asc' ? '#409eff' : '#c0c4cc',
                top: '-5px'
              }
            }),
            h('i', {
              class: {
                'sort-caret': true,
                'descending': true,
                'active': props.sortBy?.key === props.column.key && props.sortBy?.order === 'desc'
              },
              style: {
                width: 0,
                height: 0,
                border: '5px solid transparent',
                position: 'absolute',
                left: '7px',
                borderTopColor: props.sortBy?.key === props.column.key && props.sortBy?.order === 'desc' ? '#409eff' : '#c0c4cc',
                bottom: '-5px'
              }
            })
          ]),

          h('div', {
            class: 'el-table-v2__column-resizer',
            onMousedown: (e: MouseEvent) => onColumnResizeMouseDown(e, props.column),
            onClick: (e: MouseEvent) => e.stopPropagation(),
          })
        ]);
      }
      // hidden: !col.showInCompact && isCompactTable.value // Logic handled in orderedColumns? No, orderedColumns only filters by columnOrder which contains all keys usually.
      // Wait, orderedColumns logic in original code:
      // <template v-for="column in orderedColumns">
      //   <el-table-column v-if="..." ... />
      // </template>
      // The v-if conditions check showInCompact.
    };
    
    // Filter out hidden columns based on compact mode
    if (!col.showInCompact && isCompactTable.value) {
      return null;
    }

    if (col.key === "name") {
      common.cellRenderer = ({ rowData }) =>
        h(
          "span",
          {
            style: {
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              display: "block",
              width: "100%",
            },
            title: rowData.name,
          },
          rowData.name
        );
    } else if (col.key === "status") {
      common.cellRenderer = ({ rowData }) => {
        const type = getStatusType(rowData) as any;
        const text = getStatusText(rowData);
        const isError = isTorrentError(rowData);
        const tag = h(ElTag, { type }, () => text);
        if (isError) {
          return h(
            ElTooltip,
            { content: rowData.errorString || "未知错误", placement: "top" },
            () => tag
          );
        }
        return tag;
      };
    } else if (col.key === "percentDone") {
      common.cellRenderer = ({ rowData }) => {
        const progress = getTorrentProgress(rowData);
        const percentage = Math.round(progress * 100);
        const status = progress === 1 ? "success" : undefined;
        const bar = h(ElProgress, { percentage, status });
        const tooltipContent = getProgressTooltip(rowData);
        return h(
          ElTooltip,
          {
            content: tooltipContent,
            disabled: progress === 1,
            placement: "top",
          },
          () => bar
        );
      };
    } else if (col.key === "totalSize") {
      common.cellRenderer = ({ rowData }) => h("span", formatBytes(rowData.totalSize));
    } else if (col.key === "uploadRatio") {
      common.cellRenderer = ({ rowData }) => {
        return h(
          ElTag,
          {
            size: "small",
            class: ["ratio-tag", getRatioClass(rowData.uploadRatio)],
          },
          () => formatRatio(rowData.uploadRatio)
        );
      };
    } else if (col.key === "rateDownload") {
      common.cellRenderer = ({ rowData }) => h("span", formatSpeed(rowData.rateDownload));
    } else if (col.key === "rateUpload") {
      common.cellRenderer = ({ rowData }) => h("span", formatSpeed(rowData.rateUpload));
    } else if (col.key === "defaultTracker") {
      common.cellRenderer = ({ rowData }) => h("span", getDefaultTracker(rowData));
    } else if (col.key === "peersDownloading") {
      common.cellRenderer = ({ rowData }) => h("span", getSeeders(rowData));
    } else if (col.key === "peersUploading") {
      common.cellRenderer = ({ rowData }) => h("span", getLeechers(rowData));
    } else if (col.key === "uploadedEver") {
      common.cellRenderer = ({ rowData }) =>
        h("span", formatBytes(rowData.uploadedEver || 0));
    } else if (col.key === "downloadDir") {
      common.cellRenderer = ({ rowData }) =>
        h(
          "span",
          {
            style: {
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              display: "block",
              width: "100%",
            },
            title: rowData.downloadDir || "—",
          },
          rowData.downloadDir || "—"
        );
    } else if (col.key === "addedDate") {
      common.cellRenderer = ({ rowData }) =>
        h("span", formatTorrentDate(rowData.addedDate));
    } else if (col.key === "activityDate") {
      common.cellRenderer = ({ rowData }) =>
        h("span", formatLastActivity(rowData.activityDate));
    } else if (col.key === "labels") {
      common.cellRenderer = ({ rowData }) => {
        if (!rowData.labels?.length) return h("span", "—");
        return h(
          "div",
          { style: { display: "flex", flexWrap: "wrap", gap: "4px" } },
          rowData.labels.map((label: string) =>
            h(ElTag, { size: "small", class: "label-tag" }, () => label)
          )
        );
      };
    }

    return common;
  });

  return [selectionCol, ...dynamicCols.filter(Boolean)] as Column<Torrent>[];
});

onMounted(() => {
  // 首先从 URL 恢复过滤状态
  syncFiltersFromUrl();

  loadColumnWidths();
  loadColumnOrder();
  loadTorrents();
  startAutoRefresh();
  window.addEventListener("click", hideContextMenu);
  window.addEventListener("scroll", hideContextMenu, true);
  window.addEventListener("scroll", handleGlobalScroll, true);
  window.addEventListener("keydown", handleKeydown);

  // 延迟初始化列头拖拽排序，确保表格完全渲染
  setTimeout(() => {
    initColumnDragSort();
  }, 500);
});

onBeforeUnmount(() => {
  stopAutoRefresh();
  window.removeEventListener("click", hideContextMenu);
  window.removeEventListener("scroll", hideContextMenu, true);
  window.removeEventListener("scroll", handleGlobalScroll, true);
  window.removeEventListener("keydown", handleKeydown);

  // 清理拖拽实例
  // if (sortableInstance) {
  //   sortableInstance.destroy();
  //   sortableInstance = null;
  // }
});
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
  overflow: hidden;
}

.table-scroll {
  flex: 1;
  overflow: hidden;
  border-radius: 6px;
  background: #fff;
  display: flex;
  flex-direction: column;
}

.table-scroll :deep(.el-table) {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.table-scroll :deep(.el-table__inner-wrapper) {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.table-scroll :deep(.el-table__body-wrapper) {
  flex: 1;
  overflow-y: auto;
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

.detail-tabs :deep(.torrent-name-item .el-descriptions__cell-content) {
  word-break: break-all;
  white-space: normal;
  line-height: 1.6;
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

.files-tree {
  border: 1px solid #ebeef5;
  border-radius: 4px;
  background: #fff;
  padding: 6px 8px;
  max-height: 400px;
  overflow: auto;
}
.files-tree :deep(.el-tree-node__content) {
  height: 32px;
}
.file-node {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}
.file-icon {
  color: #909399;
}
.file-name {
  flex: 1;
}
.file-meta {
  color: #909399;
  font-size: 12px;
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

.torrent-file-upload {
  width: 100%;
}

.torrent-file-upload :deep(.el-upload-list) {
  max-width: 100%;
}

.torrent-file-upload :deep(.el-upload-list__item) {
  max-width: 100%;
}

.torrent-file-upload :deep(.el-upload-list__item-name) {
  max-width: calc(100% - 80px);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: inline-block;
  vertical-align: middle;
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

/* 批量修改标签对话框样式 */
.current-labels-preview {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 8px;
  background: var(--el-fill-color-light);
  border-radius: 4px;
  min-height: 40px;
}

.label-preview-tag {
  margin: 0;
}

.no-labels-text {
  color: var(--el-text-color-secondary);
  font-size: 14px;
}

.form-tip {
  margin-top: 4px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

/* 拖拽排序相关样式 */
.table-scroll :deep(th) {
  cursor: move;
  cursor: grab;
  user-select: none;
}

.table-scroll :deep(th:active) {
  cursor: grabbing;
}

.table-scroll :deep(th.el-table-column--selection) {
  cursor: default;
}

.table-scroll :deep(.sortable-ghost) {
  opacity: 0.4;
  background: #f0f9ff;
}

.table-scroll :deep(.sortable-chosen) {
  background: #ecfdf5;
}

.table-scroll :deep(.sortable-drag) {
  opacity: 0.8;
  background: #dbeafe;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

/* Table V2 Custom Styles */
.table-scroll :deep(.el-table-v2__row--striped) .el-table-v2__row-cell {
  background-color: #fafafa;
}
.table-scroll :deep(.current-row) .el-table-v2__row-cell {
  background-color: #ecf5ff !important;
}
.table-scroll :deep(.el-table-v2__header-cell) {
  background-color: #f5f7fa;
  color: #909399;
  font-weight: 600;
  border-right: 1px solid #ebeef5;
  border-bottom: 1px solid #ebeef5;
  overflow: visible;
  position: relative;
}
/* Ensure the handle is positioned correctly */
.table-scroll :deep(.el-table-v2__column-resizer) {
  position: absolute;
  right: -3px;
  top: 0;
  height: 100%;
  width: 10px; /* wider touch area */
  cursor: col-resize;
  z-index: 10;
  background-color: transparent; /* Invisible but clickable */
}

/* Hide default Element Plus TableV2 sort icon */
.table-scroll :deep(.el-table-v2__header-cell .el-icon.el-table-v2__sort-icon) {
  display: none !important;
}

.table-scroll :deep(.el-table-v2__row-cell) {
  border-right: 1px solid #ebeef5;
  border-bottom: 1px solid #ebeef5;
  padding: 0 8px;
  display: flex;
  align-items: center;
}
.table-scroll :deep(.el-table-v2__left) {
  border-right: 1px solid #ebeef5;
  box-shadow: 2px 0 5px rgba(0,0,0,0.05);
}
</style>
