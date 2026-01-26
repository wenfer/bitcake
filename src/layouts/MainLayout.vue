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
          :aria-label="t('header.expandMenu')"
          @click="isMenuOpen = true"
        />
        <h1 class="title">{{ backendLabel }} {{ versionText }}</h1>
      </div>
      <div class="header-right">
        <el-dropdown @command="handleThemeChange" trigger="click">
          <el-button :icon="Sunny" circle plain :title="t('header.switchTheme')" />
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item
                command="green"
                :disabled="currentTheme === 'green'"
              >
                <span>{{ t('theme.green') }}</span>
              </el-dropdown-item>
              <el-dropdown-item
                command="blue"
                :disabled="currentTheme === 'blue'"
              >
                <span>{{ t('theme.blue') }}</span>
              </el-dropdown-item>
              <el-dropdown-item
                command="pink"
                :disabled="currentTheme === 'pink'"
              >
                <span>{{ t('theme.pink') }}</span>
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        <el-dropdown @command="localeStore.switchLocale" trigger="click">
          <el-button circle plain :title="t('header.switchLanguage')">
            <img src="/icons/earth.svg" style="width: 1em; height: 1em; vertical-align: -0.15em;" />
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item
                v-for="option in localeStore.localeOptions"
                :key="option.value"
                :command="option.value"
                :disabled="localeStore.currentLocale === option.value"
              >
                {{ option.label }}
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        <el-button
          :icon="SwitchButton"
          circle
          plain
          @click="handleLogout"
          :title="t('header.logout')"
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
                <span>{{ t('nav.torrentList') }}</span>
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
        <h3>{{ t('nav.navigationMenu') }}</h3>
        <span class="drawer-version">v{{ frontendVersion }}</span>
      </div>
      <div class="drawer-body">
        <el-menu :default-active="activeMenuItem" @select="handleMenuSelect">
          <el-sub-menu index="torrents">
            <template #title>
              <el-icon><List /></el-icon>
              <span>{{ t('nav.torrentList') }}</span>
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
import { useI18n } from "vue-i18n";
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
import { useFilterStore, type StatusFilter, statusToUrl } from "@/stores/filter";
import { useThemeStore, type ThemeType } from "@/stores/theme";
import { useLocaleStore } from "@/stores/locale";
import { useMediaQuery } from "@/utils/useMediaQuery";
import { formatBytes } from "@/utils/format";
import SidebarStatus from "./components/SidebarStatus.vue";
import { torrentBackendName, isTransmission } from "@/config/torrentClient";
import { TorrentStatusEnum } from "@/types/transmission";

const { t } = useI18n();
const localeStore = useLocaleStore();

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

const statusTextMap = computed(() => ({
  [TorrentStatusEnum.STOPPED]: t('status.stopped'),
  [TorrentStatusEnum.CHECK_WAIT]: t('status.waitCheck'),
  [TorrentStatusEnum.CHECK]: t('status.checking'),
  [TorrentStatusEnum.DOWNLOAD_WAIT]: t('status.waitDownload'),
  [TorrentStatusEnum.DOWNLOAD]: t('status.downloading'),
  [TorrentStatusEnum.SEED_WAIT]: t('status.waitSeed'),
  [TorrentStatusEnum.SEED]: t('status.seeding'),
}));

// interface StatusOption {
//   label: string
//   value: StatusFilter
//   showCount?: boolean
// }

const statusOptions = computed(() => [
  { label: t('status.all'), value: "all" as StatusFilter },
  {
    label: statusTextMap.value[TorrentStatusEnum.DOWNLOAD],
    value: TorrentStatusEnum.DOWNLOAD as StatusFilter,
  },
  {
    label: statusTextMap.value[TorrentStatusEnum.STOPPED],
    value: TorrentStatusEnum.STOPPED as StatusFilter,
  },
  { label: t('status.queued'), value: "queued" as StatusFilter },
  {
    label: statusTextMap.value[TorrentStatusEnum.CHECK],
    value: TorrentStatusEnum.CHECK as StatusFilter,
  },
  { label: t('status.seeding'), value: TorrentStatusEnum.SEED as StatusFilter },
  { label: t('status.active'), value: "active" as StatusFilter },
  { label: t('status.error'), value: "error" as StatusFilter },
]);

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

const navigationItems = computed(() => [
  { index: "/reseed", label: t('nav.reseed'), icon: Connection },
  { index: "/speed-strategy", label: t('nav.speedStrategy'), icon: Timer },
  { index: "/settings", label: t('nav.settings'), icon: Setting },
  { index: "/stats", label: t('nav.stats'), icon: TrendCharts },
]);

// const themeOptions = Object.entries(themeStore.themes).map(([key, theme]) => ({
//   label: theme.name,
//   value: key
// }))

const uploadLimitKBps = computed(() => {
  const c = sessionConfig.value;
  if (!c) return null;
  if (c['alt-speed-enabled']) return c['alt-speed-up'] ?? null;
  if (isTransmission) {
    const enabled = !!c['speed-limit-up-enabled'];
    return enabled ? (c['speed-limit-up'] ?? null) : null;
  } else {
    const up = c['speed-limit-up'] ?? 0;
    return up > 0 ? up : null;
  }
});
const downloadLimitKBps = computed(() => {
  const c = sessionConfig.value;
  if (!c) return null;
  if (c['alt-speed-enabled']) return c['alt-speed-down'] ?? null;
  if (isTransmission) {
    const enabled = !!c['speed-limit-down-enabled'];
    return enabled ? (c['speed-limit-down'] ?? null) : null;
  } else {
    const down = c['speed-limit-down'] ?? 0;
    return down > 0 ? down : null;
  }
});
const formatSpeedCompact = (bytesPerSecond: number): string => {
  if (!bytesPerSecond) return "0B/s";
  return `${formatBytes(bytesPerSecond).replace(" ", "")}/s`;
};
const formatLimitText = (kbps: number | null): string | null => {
  if (kbps == null || kbps === 0) return null;
  const bps = kbps * 1024;
  return `${formatBytes(bps).replace(" ", "")}/s`;
};
const uploadSpeedText = computed(() => {
  const bps = sessionStats.value?.uploadSpeed || 0;
  const limitText = formatLimitText(uploadLimitKBps.value);
  return limitText ? `${formatSpeedCompact(bps)} [${t('sidebar.limit')}${limitText}]` : `${formatSpeedCompact(bps)}`;
});
const downloadSpeedText = computed(() => {
  const bps = sessionStats.value?.downloadSpeed || 0;
  const limitText = formatLimitText(downloadLimitKBps.value);
  return limitText ? `${formatSpeedCompact(bps)} [${t('sidebar.limit')}${limitText}]` : `${formatSpeedCompact(bps)}`;
});
const freeSpaceText = computed(() =>
  freeSpaceBytes.value !== null ? formatBytes(freeSpaceBytes.value) : t('common.unknown')
);
const versionText = computed(() => sessionConfig.value?.version || "");
const lastUpdatedText = computed(() => lastUpdated.value || "—");
const frontendVersion = __APP_VERSION__ || "dev";
const statusMetrics = computed(() => [
  { label: t('sidebar.upload'), value: uploadSpeedText.value },
  { label: t('sidebar.download'), value: downloadSpeedText.value },
  { label: t('sidebar.freeSpace'), value: freeSpaceText.value },
  { label: t('sidebar.lastUpdate'), value: lastUpdatedText.value },
  { label: t('sidebar.version'), value: `v${frontendVersion}` },
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
    const urlParam = statusToUrl(status);
    // 使用 query params 更新 URL，状态会在 HomeView 中从 URL 恢复
    const query: Record<string, string> = {};
    if (urlParam !== 'all') {
      query.status = urlParam;
    }
    // 保留 tracker 过滤参数（如果有的话）
    if (filterStore.trackerFilter) {
      query.tracker = filterStore.trackerFilter;
    }
    router.push({ path: '/', query });
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
    await ElMessageBox.confirm(t('header.logoutConfirm'), t('common.tip'), {
      confirmButtonText: t('common.confirm'),
      cancelButtonText: t('common.cancel'),
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
  min-height: 0;
}

.aside-content :deep(.el-menu) {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  border-right: none;
}

.aside-content :deep(.el-menu-item .el-icon),
.aside-content :deep(.el-sub-menu__title .el-icon) {
  flex: 0 0 auto;
}

.aside-content :deep(.el-icon svg) {
  display: block;
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
  min-height: 0;
}

.drawer-body :deep(.el-menu) {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  border-right: none;
}

.drawer-body :deep(.el-menu-item .el-icon),
.drawer-body :deep(.el-sub-menu__title .el-icon) {
  flex: 0 0 auto;
}

.drawer-body :deep(.el-icon svg) {
  display: block;
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
    height: calc(100vh - 60px);
    min-height: calc(100vh - 60px);
    flex-direction: column;
  }

  .main {
    padding: 16px 12px 32px;
  }
}
</style>
