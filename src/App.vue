<template>
  <router-view />
  <el-dialog
    v-model="showSecurityWarning"
    width="500px"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    :show-close="false"
    center
    align-center
    class="security-warning-dialog"
  >
    <template #header>
      <div class="security-warning-header">
        <el-icon color="var(--bc-danger)" :size="24"><WarningFilled /></el-icon>
        <span class="warning-title">{{ $t('security.warningTitle') }}</span>
      </div>
    </template>
    <div class="security-warning-content">
      <h3>{{ $t('security.warningSubtitle') }}</h3>
      <p class="danger-text">{{ $t('security.warningDesc1') }}</p>
      <div class="warning-steps">
        <p>{{ $t('security.warningStep1') }}</p>
        <p>{{ $t('security.warningStep2') }}</p>
        <p>{{ $t('security.warningStep3') }}</p>
      </div>
      <p class="info-text">{{ $t('security.warningDesc2') }}</p>
    </div>
    <template #footer>
      <span class="dialog-footer">
        <el-button type="danger" @click="acknowledgeWarning">{{ $t('security.iUnderstand') }}</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import { useConnectionStore } from "@/stores/connection";
import { configureConnection, getPreferences } from "@/api/torrents";
import { isPwaMode } from "@/utils/pwaShortcuts";
import { WarningFilled } from '@element-plus/icons-vue'
import { isTransmission } from "@/config/torrentClient"

const connectionStore = useConnectionStore();

const showSecurityWarning = ref(false);

const checkSecurityRisk = async () => {
  if (isTransmission || !connectionStore.serverConfig.username) return;
  
  try {
    const prefs = await getPreferences();
    const hasRisk = prefs.autorun_enabled === true || prefs.autorun_on_torrent_added_enabled === true;
    
    if (hasRisk) {
      showSecurityWarning.value = true;
    }
  } catch (error) {
    console.error('Failed to check security risk:', error);
  }
};

const acknowledgeWarning = () => {
  showSecurityWarning.value = false;
};

// Check when connection changes (e.g. after login)
watch(() => connectionStore.serverConfig.username, (newVal) => {
  if (newVal) {
    checkSecurityRisk();
  }
});

onMounted(async () => {
  // 加载已保存的配置和连接状态
  connectionStore.loadConfig();

  // 如果有保存的配置，恢复连接配置（但不重新登录）
  if (connectionStore.serverConfig.username) {
    configureConnection(connectionStore.serverConfig);
    checkSecurityRisk();
  }

  // 检测 PWA 模式
  if (isPwaMode()) {
    document.body.classList.add('pwa-mode');
  }

});
</script>

<style>
.security-warning-dialog .el-dialog__header {
  padding-bottom: 0;
}
.security-warning-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}
.warning-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--bc-danger);
}
.security-warning-content {
  text-align: center;
  padding: 0 10px;
}
.security-warning-content h3 {
  color: var(--bc-danger);
  margin-top: 10px;
  margin-bottom: 15px;
  font-size: 16px;
}
.danger-text {
  color: var(--bc-danger);
  font-weight: 600;
  margin-bottom: 15px;
}
.warning-steps {
  text-align: left;
  background: var(--bc-danger-soft);
  padding: 15px;
  border-radius: var(--bc-radius-md);
  margin-bottom: 15px;
  border: 1px solid var(--bc-danger-ring);
}
.warning-steps p {
  margin-bottom: 8px;
  color: var(--bc-text);
  line-height: 1.5;
}
.warning-steps p:last-child {
  margin-bottom: 0;
}
.info-text {
  color: var(--bc-text-subtle);
  font-size: 13px;
  line-height: 1.5;
}
</style>
