<template>
  <el-container class="main-layout" :class="{ 'is-mobile': isMobile }">
    <el-header class="header">
      <div class="header-left">
        <el-button
          v-if="isMobile"
          class="menu-toggle"
          :icon="Menu"
          circle
          plain
          aria-label="展开导航菜单"
          @click="isMenuOpen = true"
        />
        <h1 class="title">{{ backendLabel }} {{ versionText }}</h1>
      </div>
      <HeaderTips />
      <div class="header-right">
        <el-dropdown @command="handleThemeChange" trigger="click">
          <el-button :icon="Sunny" circle plain title="切换主题" />
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item
                command="green"
                :disabled="currentTheme === 'green'"
              >
                <span>清新绿</span>
              </el-dropdown-item>
              <el-dropdown-item
                command="blue"
                :disabled="currentTheme === 'blue'"
              >
                <span>简约蓝</span>
              </el-dropdown-item>
              <el-dropdown-item
                command="pink"
                :disabled="currentTheme === 'pink'"
              >
                <span>可爱粉</span>
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        <el-button
          :icon="SwitchButton"
          circle
          plain
          @click="handleLogout"
          title="退出登录"
        />
      </div>
    </el-header>

    <el-container class="content-container">
      <el-aside v-if="!isMobile" width="240px" class="aside">
        <div class="aside-content">
          <el-menu :default-active="activeMenuItem" @select="handleMenuSelect">
            <el-sub-menu index="torrents">
              <template #title>
                <el-icon><List /></el-icon>
                <span>种子列表</span>
              </template>
              <el-menu-item
                v-for="status in statusOptions"
                :key="status.value"
                :index="`status:${status.value}`"
              >
                <span class="status-label-with-count">
                  {{ status.label }}
                  <el-tag class="status-count" size="small" type="info">
                    {{ getTorrentCount(status.value) }}
                  </el-tag>
                </span>
              </el-menu-item>
            </el-sub-menu>
            <el-menu-item
              v-for="item in navigationItems"
              :key="item.index"
              :index="item.index"
            >
              <el-icon><component :is="item.icon" /></el-icon>
              <span>{{ item.label }}</span>
            </el-menu-item>
          </el-menu>
          <SidebarStatus :metrics="statusMetrics" />
        </div>
      </el-aside>

      <el-main class="main">
        <router-view />
      </el-main>
    </el-container>

    <el-drawer
      v-model="isMenuOpen"
      direction="ltr"
      size="70%"
      :with-header="false"
      class="mobile-drawer"
    >
      <div class="mobile-drawer-header">
        <h3>导航菜单</h3>
        <span class="drawer-version">v{{ frontendVersion }}</span>
      </div>
      <div class="drawer-body">
        <el-menu :default-active="activeMenuItem" @select="handleMenuSelect">
          <el-sub-menu index="torrents">
            <template #title>
              <el-icon><List /></el-icon>
              <span>种子列表</span>
            </template>
            <el-menu-item
              v-for="status in statusOptions"
              :key="status.value"
              :index="`status:${status.value}`"
            >
              <span class="status-label-with-count">
                {{ status.label }}
                <el-tag class="status-count" size="small" type="info">
                  {{ getTorrentCount(status.value) }}
                </el-tag>
              </span>
            </el-menu-item>
          </el-sub-menu>
          <el-menu-item
            v-for="item in navigationItems"
            :key="item.index"
            :index="item.index"
          >
            <el-icon><component :is="item.icon" /></el-icon>
            <span>{{ item.label }}</span>
          </el-menu-item>
        </el-menu>
        <SidebarStatus :metrics="statusMetrics" />
      </div>
    </el-drawer>
  </el-container>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted, onBeforeUnmount } from "vue";
import { useRouter, useRoute } from "vue-router";
import { storeToRefs } from "pinia";
import {
  Setting,
  List,
  TrendCharts,
  Menu,
  SwitchButton,
  Sunny,
  Connection,
  Timer,
} from "@element-plus/icons-vue";
import { ElMessageBox } from "element-plus";
import { useSystemStatusStore } from "@/stores/systemStatus";
import { useConnectionStore } from "@/stores/connection";
import { useFilterStore, type StatusFilter } from "@/stores/filter";
import { useThemeStore, type ThemeType } from "@/stores/theme";
import { useMediaQuery } from "@/utils/useMediaQuery";
import SidebarStatus from "./components/SidebarStatus.vue";
import HeaderTips from "./components/HeaderTips.vue";
import { torrentBackendName } from "@/config/torrentClient";
import { TorrentStatusEnum } from "@/types/transmission";

const router = useRouter();
const route = useRoute();
const systemStatusStore = useSystemStatusStore();
const connectionStore = useConnectionStore();
const filterStore = useFilterStore();
const themeStore = useThemeStore();
const { torrentCounts } = storeToRefs(systemStatusStore);
const { currentTheme } = storeToRefs(themeStore);
const backendLabel = torrentBackendName;
const { sessionStats, freeSpaceBytes, sessionConfig, lastUpdated } =
  storeToRefs(systemStatusStore);
const { statusFilter } = storeToRefs(filterStore);
const isMobile = useMediaQuery("(max-width: 768px)");
const isMenuOpen = ref(false);
const activeMenuItem = ref("/");

const statusTextMap = {
  [TorrentStatusEnum.STOPPED]: "已停止",
  [TorrentStatusEnum.CHECK_WAIT]: "等待校验",
  [TorrentStatusEnum.CHECK]: "校验中",
  [TorrentStatusEnum.DOWNLOAD_WAIT]: "等待下载",
  [TorrentStatusEnum.DOWNLOAD]: "下载中",
  [TorrentStatusEnum.SEED_WAIT]: "等待做种",
  [TorrentStatusEnum.SEED]: "做种中",
};

// interface StatusOption {
//   label: string
//   value: StatusFilter
//   showCount?: boolean
// }

const statusOptions = [
  { label: "全部", value: "all" as StatusFilter },
  {
    label: statusTextMap[TorrentStatusEnum.DOWNLOAD],
    value: TorrentStatusEnum.DOWNLOAD as StatusFilter,
  },
  {
    label: statusTextMap[TorrentStatusEnum.STOPPED],
    value: TorrentStatusEnum.STOPPED as StatusFilter,
  },
  { label: "队列中", value: "queued" as StatusFilter },
  {
    label: statusTextMap[TorrentStatusEnum.CHECK],
    value: TorrentStatusEnum.CHECK as StatusFilter,
  },
  { label: "做种中", value: TorrentStatusEnum.SEED as StatusFilter },
  { label: "活动中", value: "active" as StatusFilter },
  { label: "错误", value: "error" as StatusFilter },
];

const getTorrentCount = (statusValue: StatusFilter): number | string => {
  // Direct mapping from status values to count keys
  const countKeyMap: Record<string, string> = {
    all: "all",
    [TorrentStatusEnum.DOWNLOAD]: "downloading",
    [TorrentStatusEnum.STOPPED]: "paused",
    [TorrentStatusEnum.CHECK]: "checking",
    [TorrentStatusEnum.SEED]: "seeding",
    queued: "queued",
    active: "active",
    error: "error",
  };

  // Special case for seeding - show seeding count with active count in parentheses
  if (statusValue === TorrentStatusEnum.SEED) {
    return `${torrentCounts.value["seeding"] || 0}`;
  }

  const countKey = countKeyMap[String(statusValue)];
  return countKey ? torrentCounts.value[countKey] || 0 : 0;
};

const navigationItems = [
  { index: "/reseed", label: "辅种管理", icon: Connection },
  { index: "/speed-strategy", label: "限速策略", icon: Timer },
  { index: "/settings", label: "设置", icon: Setting },
  { index: "/stats", label: "数据统计", icon: TrendCharts },
];

// const themeOptions = Object.entries(themeStore.themes).map(([key, theme]) => ({
//   label: theme.name,
//   value: key
// }))

const uploadSpeedText = computed(() =>
  formatSpeed(sessionStats.value?.uploadSpeed || 0)
);
const downloadSpeedText = computed(() =>
  formatSpeed(sessionStats.value?.downloadSpeed || 0)
);
const freeSpaceText = computed(() =>
  freeSpaceBytes.value !== null ? formatBytes(freeSpaceBytes.value) : "未知"
);
const versionText = computed(() => sessionConfig.value?.version || "");
const lastUpdatedText = computed(() => lastUpdated.value || "—");
const frontendVersion = __APP_VERSION__ || "dev";
const statusMetrics = computed(() => [
  { label: "上传速度", value: uploadSpeedText.value },
  { label: "下载速度", value: downloadSpeedText.value },
  { label: "可用空间", value: freeSpaceText.value },
  { label: "更新时间", value: lastUpdatedText.value },
  { label: "前端版本", value: `v${frontendVersion}` },
]);

// 根据当前路由和过滤器状态计算当前活动的菜单项
const updateActiveMenuItem = () => {
  if (route.path === "/") {
    activeMenuItem.value = `status:${statusFilter.value}`;
  } else {
    activeMenuItem.value = route.path;
  }
};

watch([() => route.path, statusFilter], updateActiveMenuItem);

watch(isMobile, (mobile) => {
  if (!mobile) {
    isMenuOpen.value = false;
  }
});

const handleMenuSelect = (index: string) => {
  // 处理状态过滤
  if (index.startsWith("status:")) {
    const status = index.replace("status:", "") as StatusFilter;
    filterStore.setStatusFilter(status);
    filterStore.setTrackerFilter("");
    if (route.path !== "/") {
      router.push("/");
    }
  }
  // 处理普通路由
  else {
    router.push(index);
  }

  if (isMobile.value) {
    isMenuOpen.value = false;
  }
};

onMounted(() => {
  systemStatusStore.start();
  updateActiveMenuItem();
  themeStore.loadTheme();
});

onBeforeUnmount(() => {
  systemStatusStore.stop();
});

const handleThemeChange = (theme: string) => {
  themeStore.setTheme(theme as ThemeType);
};

const handleLogout = async () => {
  try {
    await ElMessageBox.confirm("确定要退出登录吗？", "提示", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning",
    });

    // 停止定时刷新
    systemStatusStore.stop();

    // 清除连接状态
    connectionStore.setConnected(false);

    // 跳转到登录页
    router.push("/login");
  } catch (error) {
    // 用户取消
  }
};

const formatBytes = (bytes: number): string => {
  if (!bytes) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
};

const formatSpeed = (bytes: number): string => {
  if (!bytes) return "0 B/s";
  return `${formatBytes(bytes)}/s`;
};
</script>

<style scoped>
.main-layout {
  height: 100vh;
  background-color: #f0f2f5;
}

.header {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  background-color: #409eff;
  color: white;
  padding: 12px 20px;
  gap: 16px;
}
 
.header :deep(.header-tips) {
  justify-self: center;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1 1 auto;
  min-width: 0;
  flex-wrap: nowrap;
}

.title {
  margin: 0;
  font-size: 20px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.header-right {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
  justify-self: end;
}

.menu-toggle {
  border: none;
  background: rgba(255, 255, 255, 0.2);
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
  display: flex;
  flex-direction: column;
}

.main {
  background-color: #fff;
  padding: 20px;
}

.aside-content {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.status-label-with-count {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.status-count {
  margin-left: auto;
}

.mobile-drawer :deep(.el-drawer__body) {
  padding: 20px 0;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.mobile-drawer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px 12px;
  border-bottom: 1px solid #ebeef5;
  margin-bottom: 12px;
}

.mobile-drawer-header h3 {
  margin: 0;
  font-size: 16px;
}

.drawer-version {
  font-size: 12px;
  color: #909399;
}

.drawer-body {
  display: flex;
  flex-direction: column;
  height: calc(100% - 72px);
  padding-bottom: 20px;
}

.status-label-with-count {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.status-count {
  margin-left: auto;
}

@media (max-width: 768px) {
  .main-layout {
    height: auto;
    min-height: 100vh;
  }

  .header {
    align-items: center;
    padding: 12px 16px;
    gap: 12px;
  }

  .status-cards {
    width: 100%;
  }

  .content-container {
    height: auto;
    min-height: calc(100vh - 60px);
    flex-direction: column;
  }

  .main {
    padding: 16px 12px 32px;
  }
}
</style>
