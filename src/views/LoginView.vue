<template>
  <div class="login-view">
    <div class="login-shell">
      <section class="login-hero" aria-hidden="true">
        <div class="login-hero__content">
          <h1 class="login-hero__title">{{ t('login.title') }}</h1>
          <p class="login-hero__desc">
            {{ backendLabel }} · {{ t('nav.torrentList') }} / {{ t('nav.stats') }}
          </p>
        </div>
      </section>

      <section class="login-panel">
        <header class="login-panel__head">
          <span class="login-panel__logo">
            <img :src="logoSrc" alt="" />
          </span>
          <div>
            <h2>{{ backendLabel }} {{ t('login.title') }}</h2>
            <p>{{ t('login.usernamePlaceholder') }}</p>
          </div>
        </header>

        <el-form
          :model="form"
          :rules="rules"
          ref="formRef"
          label-position="top"
          class="login-form"
          @submit.prevent="handleLogin"
        >
          <el-form-item :label="t('login.username')" prop="username">
            <el-input
              v-model="form.username"
              size="large"
              :placeholder="t('login.usernamePlaceholder')"
              autocomplete="username"
            />
          </el-form-item>
          <el-form-item :label="t('login.password')" prop="password">
            <el-input
              v-model="form.password"
              type="password"
              size="large"
              show-password
              :placeholder="t('login.passwordPlaceholder')"
              autocomplete="current-password"
              @keyup.enter="handleLogin"
            />
          </el-form-item>
          <el-button
            type="primary"
            size="large"
            :loading="loading"
            class="login-button"
            @click="handleLogin"
          >
            {{ t('login.loginButton') }}
          </el-button>
        </el-form>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { useConnectionStore } from '@/stores/connection'
import { configureConnection, testConnection } from '@/api/torrents'
import { torrentBackendName, torrentApiBase, isTransmission } from '@/config/torrentClient'

const { t } = useI18n()
const router = useRouter()
const connectionStore = useConnectionStore()
const loading = ref(false)
const formRef = ref<FormInstance>()
const backendLabel = torrentBackendName
const logoSrc = computed(() => {
  const baseUrl = import.meta.env.BASE_URL || '/'
  const filename = isTransmission ? 'Transmission.png' : 'qbittorrent.svg'
  return `${baseUrl}icons/${filename}`.replace(/\/+/g, '/').replace(':/', '://')
})

const form = ref({
  username: '',
  password: '',
})

// 表单验证规则
const rules = computed<FormRules>(() => ({
  username: [
    { required: true, message: t('login.usernameRequired'), trigger: 'blur' }
  ],
  password: [
    { required: true, message: t('login.passwordRequired'), trigger: 'blur' }
  ]
}))

// 处理登录
const handleLogin = async () => {
  if (!formRef.value) return

  try {
    // 验证表单
    await formRef.value.validate()
  } catch (error) {
    return
  }

  loading.value = true
  try {
    const config = {
      url: torrentApiBase,
      username: form.value.username,
      password: form.value.password,
    }

    configureConnection(config)
    await testConnection(config)

    // 保存配置
    connectionStore.saveConfig(config)
    connectionStore.setConnected(true)

    ElMessage.success(t('login.loginSuccess'))
    router.push('/')
  } catch (error: any) {
    ElMessage.error(`${t('login.loginFailed')}: ${error.message}`)
    connectionStore.setConnected(false)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  // 加载已保存的配置
  connectionStore.loadConfig()
  if (connectionStore.serverConfig && connectionStore.serverConfig.username) {
    form.value.username = connectionStore.serverConfig.username
    // 不自动填充密码，安全考虑
  }
})
</script>

<style scoped>
.login-view {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  min-height: 100dvh;
  padding: 16px;
  background: var(--bc-bg);
}

.login-shell {
  width: min(920px, 100%);
  display: grid;
  grid-template-columns: 1fr;
  gap: 0;
  overflow: hidden;
  border-radius: var(--bc-radius-lg);
  border: 1px solid var(--bc-border);
  background: var(--bc-surface);
  box-shadow: var(--bc-shadow-lg);
}

/* 左侧品牌区：小屏隐藏，中屏以上展示 */
.login-hero {
  display: none;
  position: relative;
  padding: 32px;
  background: var(--bc-header-bg);
  color: var(--bc-header-text);
}

.login-hero__content {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 12px;
  justify-content: center;
  height: 100%;
}

.login-hero__title {
  font-size: 30px;
  font-weight: 700;
  letter-spacing: 0.01em;
}

.login-hero__desc {
  margin: 0;
  font-size: 14px;
  color: var(--bc-header-text-muted);
}

.login-panel {
  padding: 26px 22px 28px;
}

.login-panel__head {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}

.login-panel__logo {
  width: 46px;
  height: 46px;
  flex: 0 0 auto;
  border-radius: 14px;
  display: grid;
  place-items: center;
  background: var(--bc-accent-soft);
}

.login-panel__logo img {
  width: 26px;
  height: 26px;
}

.login-panel__head h2 {
  font-size: 19px;
  margin-bottom: 2px;
}

.login-panel__head p {
  margin: 0;
  font-size: 12px;
  color: var(--bc-text-subtle);
}

.login-form :deep(.el-form-item__label) {
  font-size: 13px;
  color: var(--bc-text-muted);
  padding-bottom: 4px;
}

.login-button {
  width: 100%;
  margin-top: 6px;
  font-weight: 600;
}

@media (min-width: 768px) {
  .login-shell {
    grid-template-columns: 1.05fr 1fr;
  }

  .login-hero {
    display: block;
  }

  .login-panel {
    padding: 36px 34px;
  }
}
</style>
