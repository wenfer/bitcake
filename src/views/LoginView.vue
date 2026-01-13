<template>
  <div class="login-view">
    <el-card class="login-card">
      <template #header>
        <h2><img :src="logoSrc" class="login-logo" /> {{ backendLabel }} 登录</h2>
      </template>
      <el-form :model="form" :rules="rules" ref="formRef" label-width="80px" @submit.prevent="handleLogin">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="form.username" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="form.password" type="password" placeholder="请输入密码" @keyup.enter="handleLogin" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="loading" @click="handleLogin" class="login-button">
            登录
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { useConnectionStore } from '@/stores/connection'
import { configureConnection, testConnection } from '@/api/torrents'
import { torrentBackendName, torrentApiBase, isTransmission } from '@/config/torrentClient'

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
const rules: FormRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' }
  ]
}

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

    ElMessage.success('登录成功')
    router.push('/')
  } catch (error: any) {
    ElMessage.error(`登录失败: ${error.message}`)
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
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.login-card {
  width: min(380px, 100%);
}

.login-card h2 {
  margin: 0;
  text-align: center;
  font-size: 22px;
}
.login-card h2 .login-logo {
  width: 28px;
  height: 28px;
  margin-right: 8px;
  vertical-align: -6px;
}

.login-button {
  width: 100%;
}

@media (max-width: 600px) {
  .login-view {
    padding: 12px;
  }

  .login-card h2 {
    font-size: 20px;
  }
}
</style>
