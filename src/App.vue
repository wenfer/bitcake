<template>
  <router-view />
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useConnectionStore } from '@/stores/connection'
import { useThemeStore } from '@/stores/theme'
import { configureConnection } from '@/api/torrents'

const connectionStore = useConnectionStore()
const themeStore = useThemeStore()

onMounted(() => {
  // 初始化主题
  themeStore.initTheme()
  
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
</style>
