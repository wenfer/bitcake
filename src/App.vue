<template>
  <router-view />
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useConnectionStore } from '@/stores/connection'
import { configureConnection } from '@/api/torrents'
// 移除了主题相关的导入和初始化

const connectionStore = useConnectionStore()

onMounted(() => {
  // 加载已保存的配置和连接状态
  connectionStore.loadConfig()

  // 如果有保存的配置，恢复连接配置（但不重新登录）
  if (connectionStore.serverConfig.username) {
    configureConnection(connectionStore.serverConfig)
  }
})
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

#app {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial,
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* 默认主题（清新风格） */
:root[data-theme="default"] {
  /* 主色调 - 清新绿 */
  --fresh-primary: #10b981;
  --fresh-primary-light: #34d399;
  --fresh-primary-lighter: #6ee7b7;
  --fresh-primary-dark: #059669;

  /* 背景色 */
  --fresh-bg-base: #f8fafb;
  --fresh-bg-elevated: #ffffff;
  --fresh-bg-hover: #f0f9ff;

  /* 文字颜色 */
  --fresh-text-primary: #1f2937;
  --fresh-text-secondary: #6b7280;
  --fresh-text-tertiary: #9ca3af;

  /* 边框颜色 */
  --fresh-border-light: #e5e7eb;
  --fresh-border-medium: #d1d5db;

  /* 阴影 */
  --fresh-shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --fresh-shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  --fresh-shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);

  /* 状态颜色 */
  --fresh-success: #10b981;
  --fresh-warning: #f59e0b;
  --fresh-danger: #ef4444;
  --fresh-info: #3b82f6;
}

/* 默认主题（清新风格）样式 */
html[data-theme="default"] {
  background: var(--fresh-bg-base);
  color: var(--fresh-text-primary);
}

html[data-theme="default"] body {
  background: var(--fresh-bg-base);
}

/* 主布局 */
html[data-theme="default"] .main-layout {
  background: var(--fresh-bg-base);
}

/* 顶部导航栏 */
html[data-theme="default"] .header {
  background: linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%);
  border-bottom: 1px solid var(--fresh-border-light);
  box-shadow: var(--fresh-shadow-sm);
}

html[data-theme="default"] .title {
  color: var(--fresh-primary);
  font-weight: 600;
}

/* 侧边栏 */
html[data-theme="default"] .aside {
  background: var(--fresh-bg-elevated);
  border-right: 1px solid var(--fresh-border-light);
}

/* 主内容区 */
html[data-theme="default"] .main {
  background: var(--fresh-bg-base);
}

/* 按钮样式 */
html[data-theme="default"] .el-button {
  border-radius: 8px;
  font-weight: 500;
  transition: all 0.2s ease;
}

html[data-theme="default"] .el-button:hover {
  transform: translateY(-1px);
}

html[data-theme="default"] .el-button.is-plain {
  background: var(--fresh-bg-elevated);
  border-color: var(--fresh-border-medium);
  color: var(--fresh-text-primary);
}

html[data-theme="default"] .el-button.is-plain:hover {
  background: var(--fresh-bg-hover);
  border-color: var(--fresh-primary);
  color: var(--fresh-primary);
}

html[data-theme="default"] .el-button.is-circle {
  box-shadow: var(--fresh-shadow-sm);
}

html[data-theme="default"] .el-button--primary {
  background: var(--fresh-primary);
  border-color: var(--fresh-primary);
  box-shadow: var(--fresh-shadow-sm);
}

html[data-theme="default"] .el-button--primary:hover {
  background: var(--fresh-primary-dark);
  border-color: var(--fresh-primary-dark);
  box-shadow: var(--fresh-shadow-md);
}

html[data-theme="default"] .el-button--danger {
  background: var(--fresh-danger);
  border-color: var(--fresh-danger);
}

html[data-theme="default"] .el-button--danger:hover {
  background: #dc2626;
  border-color: #dc2626;
}

/* 菜单样式 */
html[data-theme="default"] .el-menu {
  background: transparent;
  border: none;
}

html[data-theme="default"] .el-menu-item,
html[data-theme="default"] .el-sub-menu__title {
  color: var(--fresh-text-secondary);
  border-radius: 8px;
  margin: 4px 8px;
  transition: all 0.2s ease;
}

html[data-theme="default"] .el-menu-item:hover,
html[data-theme="default"] .el-sub-menu__title:hover {
  background: var(--fresh-bg-hover);
  color: var(--fresh-primary);
}

html[data-theme="default"] .el-menu-item.is-active {
  background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
  color: var(--fresh-primary);
  font-weight: 600;
}

/* 表格样式 */
html[data-theme="default"] .el-table {
  background: var(--fresh-bg-elevated);
  color: var(--fresh-text-primary);
  border-radius: 12px;
  overflow: hidden;
}

html[data-theme="default"] .el-table th.el-table__cell {
  background: #f9fafb;
  color: var(--fresh-text-primary);
  border-bottom: 1px solid var(--fresh-border-light);
  font-weight: 600;
}

html[data-theme="default"] .el-table tr {
  background: var(--fresh-bg-elevated);
}

html[data-theme="default"] .el-table--striped .el-table__body tr.el-table__row--striped td.el-table__cell {
  background: #fafafa;
}

html[data-theme="default"] .el-table__body tr:hover > td {
  background: var(--fresh-bg-hover) !important;
}

html[data-theme="default"] .el-table td.el-table__cell,
html[data-theme="default"] .el-table th.el-table__cell.is-leaf {
  border-bottom: 1px solid var(--fresh-border-light);
}

/* 对话框 */
html[data-theme="default"] .el-dialog {
  background: var(--fresh-bg-elevated);
  border-radius: 16px;
  box-shadow: var(--fresh-shadow-lg);
  border: 1px solid var(--fresh-border-light);
}

html[data-theme="default"] .el-dialog__header {
  background: linear-gradient(135deg, #f9fafb 0%, #f0fdf4 100%);
  border-bottom: 1px solid var(--fresh-border-light);
  border-radius: 16px 16px 0 0;
}

html[data-theme="default"] .el-dialog__title {
  color: var(--fresh-primary);
  font-weight: 600;
}

/* 输入框 */
html[data-theme="default"] .el-input__wrapper {
  background: var(--fresh-bg-elevated);
  border: 1px solid var(--fresh-border-medium);
  border-radius: 8px;
  transition: all 0.2s ease;
}

html[data-theme="default"] .el-input__wrapper:hover {
  border-color: var(--fresh-primary-light);
}

html[data-theme="default"] .el-input__wrapper.is-focus {
  border-color: var(--fresh-primary);
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
}

html[data-theme="default"] .el-input__inner {
  color: var(--fresh-text-primary);
}

html[data-theme="default"] .el-textarea__inner {
  border-radius: 8px;
}

/* 选择器 */
html[data-theme="default"] .el-select-dropdown {
  background: var(--fresh-bg-elevated);
  border: 1px solid var(--fresh-border-light);
  border-radius: 12px;
  box-shadow: var(--fresh-shadow-lg);
}

html[data-theme="default"] .el-select-dropdown__item {
  color: var(--fresh-text-primary);
  border-radius: 6px;
  margin: 4px 8px;
}

html[data-theme="default"] .el-select-dropdown__item:hover {
  background: var(--fresh-bg-hover);
  color: var(--fresh-primary);
}

html[data-theme="default"] .el-select-dropdown__item.is-selected {
  color: var(--fresh-primary);
  background: #ecfdf5;
  font-weight: 600;
}

/* 进度条 */
html[data-theme="default"] .el-progress-bar__outer {
  background: #e5e7eb;
  border-radius: 100px;
}

html[data-theme="default"] .el-progress-bar__inner {
  background: linear-gradient(90deg, var(--fresh-primary) 0%, var(--fresh-primary-light) 100%);
  border-radius: 100px;
}

html[data-theme="default"] .el-progress__text {
  color: var(--fresh-text-secondary);
}

/* 标签 */
html[data-theme="default"] .el-tag {
  border-radius: 6px;
  font-weight: 500;
  border: none;
}

html[data-theme="default"] .el-tag--success {
  background: #d1fae5;
  color: #065f46;
}

html[data-theme="default"] .el-tag--info {
  background: #e0e7ff;
  color: #3730a3;
}

html[data-theme="default"] .el-tag--danger {
  background: #fee2e2;
  color: #991b1b;
}

html[data-theme="default"] .el-tag--warning {
  background: #fef3c7;
  color: #92400e;
}

/* 复选框 */
html[data-theme="default"] .el-checkbox__input.is-checked .el-checkbox__inner {
  background: var(--fresh-primary);
  border-color: var(--fresh-primary);
}

html[data-theme="default"] .el-checkbox__inner {
  border-color: var(--fresh-border-medium);
  border-radius: 4px;
}

html[data-theme="default"] .el-checkbox__inner:hover {
  border-color: var(--fresh-primary);
}

/* 下拉菜单 */
html[data-theme="default"] .el-dropdown-menu {
  background: var(--fresh-bg-elevated);
  border: 1px solid var(--fresh-border-light);
  border-radius: 12px;
  box-shadow: var(--fresh-shadow-lg);
  padding: 8px;
}

html[data-theme="default"] .el-dropdown-menu__item {
  color: var(--fresh-text-primary);
  border-radius: 6px;
  padding: 8px 12px;
}

html[data-theme="default"] .el-dropdown-menu__item:hover {
  background: var(--fresh-bg-hover);
  color: var(--fresh-primary);
}

html[data-theme="default"] .el-dropdown-menu__item.is-disabled {
  color: var(--fresh-text-tertiary);
  background: transparent;
}

/* 分页 */
html[data-theme="default"] .el-pagination {
  color: var(--fresh-text-primary);
}

html[data-theme="default"] .el-pagination button {
  background: var(--fresh-bg-elevated);
  color: var(--fresh-text-primary);
  border: 1px solid var(--fresh-border-light);
  border-radius: 8px;
}

html[data-theme="default"] .el-pagination button:hover {
  color: var(--fresh-primary);
  border-color: var(--fresh-primary);
}

html[data-theme="default"] .el-pagination .el-pager li {
  background: var(--fresh-bg-elevated);
  color: var(--fresh-text-primary);
  border: 1px solid var(--fresh-border-light);
  border-radius: 8px;
  margin: 0 2px;
}

html[data-theme="default"] .el-pagination .el-pager li:hover {
  color: var(--fresh-primary);
  border-color: var(--fresh-primary);
}

html[data-theme="default"] .el-pagination .el-pager li.is-active {
  background: var(--fresh-primary);
  color: white;
  border-color: var(--fresh-primary);
  font-weight: 600;
}

/* 滚动条样式 */
html[data-theme="default"] ::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

html[data-theme="default"] ::-webkit-scrollbar-track {
  background: var(--fresh-bg-base);
  border-radius: 4px;
}

html[data-theme="default"] ::-webkit-scrollbar-thumb {
  background: var(--fresh-border-medium);
  border-radius: 4px;
}

html[data-theme="default"] ::-webkit-scrollbar-thumb:hover {
  background: var(--fresh-primary);
}

/* 卡片效果 */
html[data-theme="default"] .el-card {
  background: var(--fresh-bg-elevated);
  border: 1px solid var(--fresh-border-light);
  border-radius: 12px;
  box-shadow: var(--fresh-shadow-sm);
}

/* 消息提示 */
html[data-theme="default"] .el-message {
  background: var(--fresh-bg-elevated);
  border: 1px solid var(--fresh-border-light);
  color: var(--fresh-text-primary);
  border-radius: 12px;
  box-shadow: var(--fresh-shadow-lg);
}

html[data-theme="default"] .el-message--success {
  background: #ecfdf5;
  border-color: var(--fresh-primary-lighter);
  color: var(--fresh-primary-dark);
}

html[data-theme="default"] .el-message--warning {
  background: #fef3c7;
  border-color: #fcd34d;
  color: #92400e;
}

html[data-theme="default"] .el-message--error {
  background: #fee2e2;
  border-color: #fca5a5;
  color: #991b1b;
}

/* 文本颜色覆盖 */
html[data-theme="default"] .el-text {
  color: var(--fresh-text-primary);
}

html[data-theme="default"] .el-descriptions__label {
  color: var(--fresh-text-secondary);
  font-weight: 500;
}

html[data-theme="default"] .el-descriptions__content {
  color: var(--fresh-text-primary);
}

/* 表单标签 */
html[data-theme="default"] .el-form-item__label {
  color: var(--fresh-text-secondary);
  font-weight: 500;
}

/* Drawer */
html[data-theme="default"] .el-drawer {
  background: var(--fresh-bg-elevated);
  border-left: 1px solid var(--fresh-border-light);
}

/* 筛选栏 */
html[data-theme="default"] .filter-submenu {
  background: var(--fresh-bg-elevated);
  border: 1px solid var(--fresh-border-light);
  border-radius: 12px;
  box-shadow: var(--fresh-shadow-sm);
}

/* 表格容器 */
html[data-theme="default"] .table-scroll {
  background: var(--fresh-bg-elevated);
  border-radius: 12px;
  box-shadow: var(--fresh-shadow-sm);
}

/* 上传组件 */
html[data-theme="default"] .el-upload {
  border-color: var(--fresh-border-medium);
  border-radius: 8px;
  transition: all 0.2s ease;
}

html[data-theme="default"] .el-upload:hover {
  border-color: var(--fresh-primary);
}

/* 工具栏 */
html[data-theme="default"] .toolbar {
  background: transparent;
}

/* Switch 开关 */
html[data-theme="default"] .el-switch.is-checked .el-switch__core {
  background-color: var(--fresh-primary);
}

/* 加载动画 */
html[data-theme="default"] .el-loading-mask {
  background-color: rgba(255, 255, 255, 0.8);
}

/* 空状态 */
html[data-theme="default"] .el-empty__description {
  color: var(--fresh-text-secondary);
}

/* Tabs 标签页 */
html[data-theme="default"] .el-tabs__item {
  color: var(--fresh-text-secondary);
}

html[data-theme="default"] .el-tabs__item:hover {
  color: var(--fresh-primary);
}

html[data-theme="default"] .el-tabs__item.is-active {
  color: var(--fresh-primary);
}

html[data-theme="default"] .el-tabs__active-bar {
  background-color: var(--fresh-primary);
}

/* 状态标签样式优化 */
html[data-theme="default"] .status-count {
  background: #f3f4f6;
  color: var(--fresh-text-secondary);
  border: none;
  font-weight: 500;
}

/* 描述列表 */
html[data-theme="default"] .el-descriptions {
  background: var(--fresh-bg-elevated);
}

html[data-theme="default"] .el-descriptions__cell {
  border-color: var(--fresh-border-light);
}

html[data-theme="default"] .el-descriptions__header {
  color: var(--fresh-text-primary);
  font-weight: 600;
}

/* 蓝白主题（原默认主题） */
:root[data-theme="blue"] {
  /* 蓝白主题使用 Element Plus 默认颜色 */
}
</style>