<template>
  <router-view />
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import { useConnectionStore } from "@/stores/connection";
import { useTipsStore } from "@/stores/tips";
import { configureConnection } from "@/api/torrents";
import { checkForUpdate } from "@/utils/version";
// 移除了主题相关的导入和初始化

const connectionStore = useConnectionStore();
const tipsStore = useTipsStore();

onMounted(async () => {
  // 加载已保存的配置和连接状态
  connectionStore.loadConfig();

  // 如果有保存的配置，恢复连接配置（但不重新登录）
  if (connectionStore.serverConfig.username) {
    configureConnection(connectionStore.serverConfig);
  }

  // 检查版本更新
  try {
    const updateInfo = await checkForUpdate();
    if (updateInfo.hasUpdate && updateInfo.latestVersion) {
      tipsStore.addVersionUpdateTip(updateInfo.latestVersion, updateInfo.currentVersion);
    }
  } catch (error) {
    console.warn('检查版本更新失败:', error);
  }
});
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

#app {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
    "Helvetica Neue", Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* 清新绿主题 */
:root[data-theme="green"] {
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
  --fresh-shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 2px 4px -1px rgba(0, 0, 0, 0.06);
  --fresh-shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1),
    0 4px 6px -2px rgba(0, 0, 0, 0.05);

  /* 状态颜色 */
  --fresh-success: #10b981;
  --fresh-warning: #f59e0b;
  --fresh-danger: #ef4444;
  --fresh-info: #3b82f6;
}

/* 清新绿主题样式 */
html[data-theme="green"] {
  background: var(--fresh-bg-base);
  color: var(--fresh-text-primary);
}

html[data-theme="green"] body {
  background: var(--fresh-bg-base);
}

/* 主布局 */
html[data-theme="green"] .main-layout {
  background: var(--fresh-bg-base);
}

/* 顶部导航栏 */
html[data-theme="green"] .header {
  background: linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%);
  border-bottom: 1px solid var(--fresh-border-light);
}

html[data-theme="green"] .title {
  color: var(--fresh-primary);
  font-weight: 600;
}

html[data-theme="green"] .header-tips {
  background: rgba(16, 185, 129, 0.15);
}

html[data-theme="green"] .tip-content {
  color: rgba(31, 41, 55, 0.9);
}

/* 侧边栏 */

/* 主内容区 */
html[data-theme="green"] .main {
  background: var(--fresh-bg-base);
}

/* 按钮样式 */
 

html[data-theme="green"] .el-button.is-plain {
  background: var(--fresh-bg-elevated);
  border-color: var(--fresh-border-medium);
  color: var(--fresh-text-primary);
}

html[data-theme="green"] .el-button.is-plain:hover {
  background: var(--fresh-bg-hover);
  border-color: var(--fresh-primary);
  color: var(--fresh-primary);
}

 

html[data-theme="green"] .el-button--primary {
  background: var(--fresh-primary);
  border-color: var(--fresh-primary);
}

html[data-theme="green"] .el-button--primary:hover {
  background: var(--fresh-primary-dark);
  border-color: var(--fresh-primary-dark);
}

html[data-theme="green"] .el-button--danger:not(.is-link) {
}

html[data-theme="green"] .el-button--danger:not(.is-link):hover {
}

html[data-theme="green"] .el-button.is-link.el-button--danger {
  background: transparent;
  border-color: transparent;
  color: var(--fresh-danger);
}

/* 菜单样式 */
html[data-theme="green"] .el-menu-item.is-active {
  color: var(--fresh-primary);
}

/* 表格样式 */
html[data-theme="green"] .el-table {
  background: var(--fresh-bg-elevated);
  color: var(--fresh-text-primary);
}

html[data-theme="green"] .el-table th.el-table__cell {
  background: #f9fafb;
  color: var(--fresh-text-primary);
  border-bottom: 1px solid var(--fresh-border-light);
}

html[data-theme="green"] .el-table tr {
  background: var(--fresh-bg-elevated);
}

html[data-theme="green"]
  .el-table--striped
  .el-table__body
  tr.el-table__row--striped
  td.el-table__cell {
  background: #fafafa;
}

html[data-theme="green"] .el-table__body tr:hover > td {
  background: var(--fresh-bg-hover) !important;
}

html[data-theme="green"] .el-table td.el-table__cell,
html[data-theme="green"] .el-table th.el-table__cell.is-leaf {
  border-bottom: 1px solid var(--fresh-border-light);
}

/* 对话框 */
html[data-theme="green"] .el-dialog {
  background: var(--fresh-bg-elevated);
}

html[data-theme="green"] .el-dialog__header {
  background: linear-gradient(135deg, #f9fafb 0%, #f0fdf4 100%);
  border-bottom: 1px solid var(--fresh-border-light);
}

html[data-theme="green"] .el-dialog__title {
  color: var(--fresh-primary);
}

/* 输入框 */
html[data-theme="green"] .el-input__wrapper {
  background: var(--fresh-bg-elevated);
}

html[data-theme="green"] .el-input__wrapper:hover {
  border-color: var(--fresh-primary-light);
}

html[data-theme="green"] .el-input__wrapper.is-focus {
  border-color: var(--fresh-primary);
}

html[data-theme="green"] .el-input__inner {
  color: var(--fresh-text-primary);
}

html[data-theme="green"] .el-textarea__inner {
}

/* 选择器 */
html[data-theme="green"] .el-select-dropdown {
  background: var(--fresh-bg-elevated);
}

html[data-theme="green"] .el-select-dropdown__item {
  color: var(--fresh-text-primary);
}

html[data-theme="green"] .el-select-dropdown__item:hover {
  background: var(--fresh-bg-hover);
  color: var(--fresh-primary);
}

html[data-theme="green"] .el-select-dropdown__item.is-selected {
  color: var(--fresh-primary);
  background: #ecfdf5;
}

/* 进度条 */
html[data-theme="green"] .el-progress-bar__outer {
  background: #e5e7eb;
}

html[data-theme="green"] .el-progress-bar__inner {
  background: linear-gradient(
    90deg,
    var(--fresh-primary) 0%,
    var(--fresh-primary-light) 100%
  );
}

html[data-theme="green"] .el-progress__text {
  color: var(--fresh-text-secondary);
}

/* 标签 */
html[data-theme="green"] .el-tag {
}

html[data-theme="green"] .el-tag--success {
  background: #d1fae5;
  color: #065f46;
}

html[data-theme="green"] .el-tag--info {
  background: #e0e7ff;
  color: #3730a3;
}

html[data-theme="green"] .el-tag--danger {
  background: #fee2e2;
  color: #991b1b;
}

html[data-theme="green"] .el-tag--warning {
  background: #fef3c7;
  color: #92400e;
}

/* 复选框 */
html[data-theme="green"] .el-checkbox__input.is-checked .el-checkbox__inner {
  background: var(--fresh-primary);
  border-color: var(--fresh-primary);
}

html[data-theme="green"] .el-checkbox__inner {
  border-color: var(--fresh-border-medium);
}

html[data-theme="green"] .el-checkbox__inner:hover {
  border-color: var(--fresh-primary);
}

/* 下拉菜单 */
html[data-theme="green"] .el-dropdown-menu {
  background: var(--fresh-bg-elevated);
}

html[data-theme="green"] .el-dropdown-menu__item {
  color: var(--fresh-text-primary);
}

html[data-theme="green"] .el-dropdown-menu__item:hover {
  background: var(--fresh-bg-hover);
  color: var(--fresh-primary);
}

html[data-theme="green"] .el-dropdown-menu__item.is-disabled {
  color: var(--fresh-text-tertiary);
  background: transparent;
}

/* 分页 */
html[data-theme="green"] .el-pagination {
  color: var(--fresh-text-primary);
}

html[data-theme="green"] .el-pagination button {
  background: var(--fresh-bg-elevated);
  color: var(--fresh-text-primary);
}

html[data-theme="green"] .el-pagination button:hover {
  color: var(--fresh-primary);
  border-color: var(--fresh-primary);
}

html[data-theme="green"] .el-pagination .el-pager li {
  background: var(--fresh-bg-elevated);
  color: var(--fresh-text-primary);
}

html[data-theme="green"] .el-pagination .el-pager li:hover {
  color: var(--fresh-primary);
  border-color: var(--fresh-primary);
}

html[data-theme="green"] .el-pagination .el-pager li.is-active {
  background: var(--fresh-primary);
  color: white;
  border-color: var(--fresh-primary);
  font-weight: 600;
}

/* 滚动条样式 */
html[data-theme="green"] ::-webkit-scrollbar {
}

html[data-theme="green"] ::-webkit-scrollbar-track {
  background: var(--fresh-bg-base);
}

html[data-theme="green"] ::-webkit-scrollbar-thumb {
  background: var(--fresh-border-medium);
}

html[data-theme="green"] ::-webkit-scrollbar-thumb:hover {
  background: var(--fresh-primary);
}

/* 卡片效果 */
html[data-theme="green"] .el-card {
  background: var(--fresh-bg-elevated);
}

/* 消息提示 */
html[data-theme="green"] .el-message {
  background: var(--fresh-bg-elevated);
  color: var(--fresh-text-primary);
}

html[data-theme="green"] .el-message--success {
  background: #ecfdf5;
  border-color: var(--fresh-primary-lighter);
  color: var(--fresh-primary-dark);
}

html[data-theme="green"] .el-message--warning {
  background: #fef3c7;
  border-color: #fcd34d;
  color: #92400e;
}

html[data-theme="green"] .el-message--error {
  background: #fee2e2;
  border-color: #fca5a5;
  color: #991b1b;
}

/* 文本颜色覆盖 */
html[data-theme="green"] .el-text {
  color: var(--fresh-text-primary);
}

html[data-theme="green"] .el-descriptions__label {
  color: var(--fresh-text-secondary);
}

html[data-theme="green"] .el-descriptions__content {
  color: var(--fresh-text-primary);
}

/* 表单标签 */
html[data-theme="green"] .el-form-item__label {
  color: var(--fresh-text-secondary);
}

/* Drawer */
html[data-theme="green"] .el-drawer {
  background: var(--fresh-bg-elevated);
  border-left: 1px solid var(--fresh-border-light);
}

/* 筛选栏 */
html[data-theme="green"] .filter-submenu {
  background: var(--fresh-bg-elevated);
}

/* 表格容器 */
html[data-theme="green"] .table-scroll {
  background: var(--fresh-bg-elevated);
}

/* 上传组件 */
html[data-theme="green"] .el-upload {
  border-color: var(--fresh-border-medium);
}

html[data-theme="green"] .el-upload:hover {
  border-color: var(--fresh-primary);
}

/* 工具栏 */
html[data-theme="green"] .toolbar {
  background: transparent;
}

/* Switch 开关 */
html[data-theme="green"] .el-switch.is-checked .el-switch__core {
  background-color: var(--fresh-primary);
}

/* 加载动画 */
html[data-theme="green"] .el-loading-mask {
  background-color: rgba(255, 255, 255, 0.8);
}

/* 空状态 */
html[data-theme="green"] .el-empty__description {
  color: var(--fresh-text-secondary);
}

/* Tabs 标签页 */
html[data-theme="green"] .el-tabs__item {
  color: var(--fresh-text-secondary);
}

html[data-theme="green"] .el-tabs__item:hover {
  color: var(--fresh-primary);
}

html[data-theme="green"] .el-tabs__item.is-active {
  color: var(--fresh-primary);
}

html[data-theme="green"] .el-tabs__active-bar {
  background-color: var(--fresh-primary);
}

/* 状态标签样式优化 */
html[data-theme="green"] .status-count {
  background: #f3f4f6;
  color: var(--fresh-text-secondary);
}

/* 描述列表 */
html[data-theme="green"] .el-descriptions {
  background: var(--fresh-bg-elevated);
}

html[data-theme="green"] .el-descriptions__cell {
  border-color: var(--fresh-border-light);
}

html[data-theme="green"] .el-descriptions__header {
  color: var(--fresh-text-primary);
}

/* 简约蓝主题 */
:root[data-theme="blue"] {
  /* 简约蓝主题使用 Element Plus 默认颜色 */
}

html[data-theme="blue"] .header-tips {
  background: rgba(255, 255, 255, 0.15);
}

html[data-theme="blue"] .tip-content {
  color: rgba(255, 255, 255, 0.95);
}

/* 可爱粉 */
:root[data-theme="pink"] {
  /* 主色调 - 粉嫩可爱 */
  --pink-primary: #ff6b9d;
  --pink-primary-light: #ff8fb5;
  --pink-primary-lighter: #ffb3cc;
  --pink-primary-dark: #e55a8a;

  /* 背景色 */
  --pink-bg-base: #fff5f9;
  --pink-bg-elevated: #ffffff;
  --pink-bg-hover: #fff0f6;

  /* 文字颜色 */
  --pink-text-primary: #2d1b2e;
  --pink-text-secondary: #7d5a7f;
  --pink-text-tertiary: #b39ab5;

  /* 边框颜色 */
  --pink-border-light: #ffd4e5;
  --pink-border-medium: #ffc0d9;

  /* 阴影 */
  --pink-shadow-sm: 0 1px 2px 0 rgba(255, 107, 157, 0.1);
  --pink-shadow-md: 0 4px 6px -1px rgba(255, 107, 157, 0.15),
    0 2px 4px -1px rgba(255, 107, 157, 0.1);
  --pink-shadow-lg: 0 10px 15px -3px rgba(255, 107, 157, 0.2),
    0 4px 6px -2px rgba(255, 107, 157, 0.1);

  /* 状态颜色 */
  --pink-success: #ff6b9d;
  --pink-warning: #ffb347;
  --pink-danger: #ff6b9d;
  --pink-info: #ff9ec7;
}

/* 粉嫩主题样式 */
html[data-theme="pink"] {
  background: var(--pink-bg-base);
  color: var(--pink-text-primary);
}

html[data-theme="pink"] body {
  background: var(--pink-bg-base);
}

/* 主布局 */
html[data-theme="pink"] .main-layout {
  background: var(--pink-bg-base);
}

/* 顶部导航栏 */
html[data-theme="pink"] .header {
  background: linear-gradient(135deg, #fff0f6 0%, #ffe4f0 100%);
  border-bottom: 2px solid var(--pink-border-light);
  box-shadow: var(--pink-shadow-sm);
}

html[data-theme="pink"] .title {
  color: var(--pink-primary);
  font-weight: 700;
}

html[data-theme="pink"] .header-tips {
  background: rgba(236, 72, 153, 0.15);
}

html[data-theme="pink"] .tip-content {
  color: rgba(255, 255, 255, 0.95);
}

/* 侧边栏 */

/* 主内容区 */
html[data-theme="pink"] .main {
  background: var(--pink-bg-base);
}
/* 按钮样式 */
html[data-theme="pink"] .el-button {
  border-radius: 20px;
  font-weight: 600;
  transition: all 0.3s ease;
}

html[data-theme="pink"] .el-button:hover {
  transform: translateY(-2px) scale(1.02);
}

html[data-theme="pink"] .el-button.is-plain {
  background: var(--pink-bg-elevated);
  border-color: var(--pink-border-medium);
  color: var(--pink-text-primary);
}

html[data-theme="pink"] .el-button.is-plain:hover {
  background: var(--pink-bg-hover);
  border-color: var(--pink-primary);
  color: var(--pink-primary);
}

html[data-theme="pink"] .el-button.is-circle {
  box-shadow: var(--pink-shadow-md);
}

html[data-theme="pink"] .el-button--primary {
  background: linear-gradient(
    135deg,
    var(--pink-primary) 0%,
    var(--pink-primary-light) 100%
  );
  border-color: var(--pink-primary);
  box-shadow: var(--pink-shadow-md);
}

html[data-theme="pink"] .el-button--primary:hover {
  background: linear-gradient(
    135deg,
    var(--pink-primary-dark) 0%,
    var(--pink-primary) 100%
  );
  border-color: var(--pink-primary-dark);
  box-shadow: var(--pink-shadow-lg);
}

html[data-theme="pink"] .el-button--danger:not(.is-link) {
}

html[data-theme="pink"] .el-button--danger:not(.is-link):hover {
}

html[data-theme="pink"] .el-button.is-link.el-button--danger {
  background: transparent;
  border-color: transparent;
  color: var(--pink-danger);
}

/* 菜单样式 */
html[data-theme="pink"] .el-menu-item.is-active {
  color: var(--pink-primary);
}
/* 菜单样式 */

/* 表格样式 */
html[data-theme="pink"] .el-table {
  background: var(--pink-bg-elevated);
  color: var(--pink-text-primary);
  border-radius: 16px;
  overflow: hidden;
  border: 2px solid var(--pink-border-light);
}

html[data-theme="pink"] .el-table th.el-table__cell {
  background: linear-gradient(135deg, #fff5f9 0%, #ffe4f0 100%);
  color: var(--pink-primary);
  border-bottom: 2px solid var(--pink-border-light);
  font-weight: 700;
}

html[data-theme="pink"] .el-table tr {
  background: var(--pink-bg-elevated);
}

html[data-theme="pink"]
  .el-table--striped
  .el-table__body
  tr.el-table__row--striped
  td.el-table__cell {
  background: #fffafc;
}

html[data-theme="pink"] .el-table__body tr:hover > td {
  background: var(--pink-bg-hover) !important;
}

html[data-theme="pink"] .el-table td.el-table__cell,
html[data-theme="pink"] .el-table th.el-table__cell.is-leaf {
  border-bottom: 1px solid var(--pink-border-light);
}

/* 对话框 */
html[data-theme="pink"] .el-dialog {
  background: var(--pink-bg-elevated);
  border-radius: 24px;
  box-shadow: var(--pink-shadow-lg);
  border: 2px solid var(--pink-border-light);
}

html[data-theme="pink"] .el-dialog__header {
  background: linear-gradient(135deg, #fff5f9 0%, #ffe4f0 100%);
  border-bottom: 2px solid var(--pink-border-light);
  border-radius: 24px 24px 0 0;
}

html[data-theme="pink"] .el-dialog__title {
  color: var(--pink-primary);
  font-weight: 700;
}

/* 输入框 */
html[data-theme="pink"] .el-input__wrapper {
  background: var(--pink-bg-elevated);
  border: 2px solid var(--pink-border-medium);
  border-radius: 12px;
  transition: all 0.3s ease;
}

html[data-theme="pink"] .el-input__wrapper:hover {
  border-color: var(--pink-primary-light);
}

html[data-theme="pink"] .el-input__wrapper.is-focus {
  border-color: var(--pink-primary);
  box-shadow: 0 0 0 4px rgba(255, 107, 157, 0.15);
}

html[data-theme="pink"] .el-input__inner {
  color: var(--pink-text-primary);
}

html[data-theme="pink"] .el-textarea__inner {
  border-radius: 12px;
}

/* 选择器 */
html[data-theme="pink"] .el-select-dropdown {
  background: var(--pink-bg-elevated);
  border: 2px solid var(--pink-border-light);
  border-radius: 16px;
  box-shadow: var(--pink-shadow-lg);
}

html[data-theme="pink"] .el-select-dropdown__item {
  color: var(--pink-text-primary);
  border-radius: 10px;
  margin: 4px 8px;
}

html[data-theme="pink"] .el-select-dropdown__item:hover {
  background: var(--pink-bg-hover);
  color: var(--pink-primary);
}

html[data-theme="pink"] .el-select-dropdown__item.is-selected {
  color: var(--pink-primary);
  background: #fff0f6;
  font-weight: 700;
}

/* 进度条 */
html[data-theme="pink"] .el-progress-bar__outer {
  background: #ffd4e5;
  border-radius: 100px;
}

html[data-theme="pink"] .el-progress-bar__inner {
  background: linear-gradient(
    90deg,
    var(--pink-primary) 0%,
    var(--pink-primary-light) 100%
  );
  border-radius: 100px;
}

html[data-theme="pink"] .el-progress__text {
  color: var(--pink-primary);
  font-weight: 600;
}

/* 标签 */
html[data-theme="pink"] .el-tag {
  border-radius: 12px;
  font-weight: 600;
  border: none;
}

html[data-theme="pink"] .el-tag--success {
  background: #ffe4f0;
  color: var(--pink-primary-dark);
}

html[data-theme="pink"] .el-tag--info {
  background: #fff0f6;
  color: #b36b9d;
}

html[data-theme="pink"] .el-tag--danger {
  background: #ffd4e5;
  color: var(--pink-primary-dark);
}

html[data-theme="pink"] .el-tag--warning {
  background: #fff3e0;
  color: #d97706;
}

/* 复选框 */
html[data-theme="pink"] .el-checkbox__input.is-checked .el-checkbox__inner {
  background: var(--pink-primary);
  border-color: var(--pink-primary);
}

html[data-theme="pink"] .el-checkbox__inner {
  border-color: var(--pink-border-medium);
  border-radius: 6px;
}

html[data-theme="pink"] .el-checkbox__inner:hover {
  border-color: var(--pink-primary);
}

/* 下拉菜单 */
html[data-theme="pink"] .el-dropdown-menu {
  background: var(--pink-bg-elevated);
  border: 2px solid var(--pink-border-light);
  border-radius: 16px;
  box-shadow: var(--pink-shadow-lg);
  padding: 8px;
}

html[data-theme="pink"] .el-dropdown-menu__item {
  color: var(--pink-text-primary);
  border-radius: 10px;
  padding: 10px 14px;
}

html[data-theme="pink"] .el-dropdown-menu__item:hover {
  background: var(--pink-bg-hover);
  color: var(--pink-primary);
}

html[data-theme="pink"] .el-dropdown-menu__item.is-disabled {
  color: var(--pink-text-tertiary);
  background: transparent;
}

/* 分页 */
html[data-theme="pink"] .el-pagination {
  color: var(--pink-text-primary);
}

html[data-theme="pink"] .el-pagination button {
  background: var(--pink-bg-elevated);
  color: var(--pink-text-primary);
  border: 2px solid var(--pink-border-light);
  border-radius: 12px;
}

html[data-theme="pink"] .el-pagination button:hover {
  color: var(--pink-primary);
  border-color: var(--pink-primary);
}

html[data-theme="pink"] .el-pagination .el-pager li {
  background: var(--pink-bg-elevated);
  color: var(--pink-text-primary);
  border: 2px solid var(--pink-border-light);
  border-radius: 12px;
  margin: 0 2px;
}

html[data-theme="pink"] .el-pagination .el-pager li:hover {
  color: var(--pink-primary);
  border-color: var(--pink-primary);
}

html[data-theme="pink"] .el-pagination .el-pager li.is-active {
  background: linear-gradient(
    135deg,
    var(--pink-primary) 0%,
    var(--pink-primary-light) 100%
  );
  color: white;
  border-color: var(--pink-primary);
  font-weight: 700;
}

/* 滚动条样式 */
html[data-theme="pink"] ::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}

html[data-theme="pink"] ::-webkit-scrollbar-track {
  background: var(--pink-bg-base);
  border-radius: 10px;
}

html[data-theme="pink"] ::-webkit-scrollbar-thumb {
  background: var(--pink-primary-lighter);
  border-radius: 10px;
}

html[data-theme="pink"] ::-webkit-scrollbar-thumb:hover {
  background: var(--pink-primary);
}

/* 卡片效果 */
html[data-theme="pink"] .el-card {
  background: var(--pink-bg-elevated);
  border: 2px solid var(--pink-border-light);
  border-radius: 16px;
  box-shadow: var(--pink-shadow-md);
}

/* 消息提示 */
html[data-theme="pink"] .el-message {
  background: var(--pink-bg-elevated);
  border: 2px solid var(--pink-border-light);
  color: var(--pink-text-primary);
  border-radius: 16px;
  box-shadow: var(--pink-shadow-lg);
}

html[data-theme="pink"] .el-message--success {
  background: #fff0f6;
  border-color: var(--pink-primary-lighter);
  color: var(--pink-primary-dark);
}

html[data-theme="pink"] .el-message--warning {
  background: #fff3e0;
  border-color: #ffd54f;
  color: #d97706;
}

html[data-theme="pink"] .el-message--error {
  background: #ffe4f0;
  border-color: var(--pink-primary-light);
  color: var(--pink-primary-dark);
}

/* 文本颜色覆盖 */
html[data-theme="pink"] .el-text {
  color: var(--pink-text-primary);
}

html[data-theme="pink"] .el-descriptions__label {
  color: var(--pink-text-secondary);
  font-weight: 600;
}

html[data-theme="pink"] .el-descriptions__content {
  color: var(--pink-text-primary);
}

/* 表单标签 */
html[data-theme="pink"] .el-form-item__label {
  color: var(--pink-text-secondary);
  font-weight: 600;
}

/* Drawer */
html[data-theme="pink"] .el-drawer {
  background: var(--pink-bg-elevated);
  border-left: 2px solid var(--pink-border-light);
}

/* 筛选栏 */
html[data-theme="pink"] .filter-submenu {
  background: var(--pink-bg-elevated);
  border: 2px solid var(--pink-border-light);
  border-radius: 16px;
  box-shadow: var(--pink-shadow-md);
}

/* 表格容器 */
html[data-theme="pink"] .table-scroll {
  background: var(--pink-bg-elevated);
  border-radius: 16px;
  box-shadow: var(--pink-shadow-md);
}

/* 上传组件 */
html[data-theme="pink"] .el-upload {
  border-color: var(--pink-border-medium);
  border-radius: 16px;
  transition: all 0.3s ease;
}

html[data-theme="pink"] .el-upload:hover {
  border-color: var(--pink-primary);
}

/* 工具栏 */
html[data-theme="pink"] .toolbar {
  background: transparent;
}

/* Switch 开关 */
html[data-theme="pink"] .el-switch.is-checked .el-switch__core {
  background-color: var(--pink-primary);
}

/* 加载动画 */
html[data-theme="pink"] .el-loading-mask {
  background-color: rgba(255, 245, 249, 0.9);
}

/* 空状态 */
html[data-theme="pink"] .el-empty__description {
  color: var(--pink-text-secondary);
}

/* Tabs 标签页 */
html[data-theme="pink"] .el-tabs__item {
  color: var(--pink-text-secondary);
  font-weight: 600;
}

html[data-theme="pink"] .el-tabs__item:hover {
  color: var(--pink-primary);
}

html[data-theme="pink"] .el-tabs__item.is-active {
  color: var(--pink-primary);
  font-weight: 700;
}

html[data-theme="pink"] .el-tabs__active-bar {
  background-color: var(--pink-primary);
  height: 3px;
}

/* 状态标签样式优化 */
html[data-theme="pink"] .status-count {
  background: #ffe4f0;
  color: var(--pink-primary);
  border: none;
  font-weight: 600;
}

/* 描述列表 */
html[data-theme="pink"] .el-descriptions {
  background: var(--pink-bg-elevated);
}

html[data-theme="pink"] .el-descriptions__cell {
  border-color: var(--pink-border-light);
}

html[data-theme="pink"] .el-descriptions__header {
  color: var(--pink-primary);
  font-weight: 700;
}
</style>
