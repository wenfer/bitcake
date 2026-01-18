<template>
  <div class="agent-view">
    <!-- AI 配置对话框 -->
    <el-dialog
      v-model="showConfigDialog"
      :title="$t('agent.configTitle')"
      width="500px"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      :show-close="aiConfigStore.isConfigured"
    >
      <el-form :model="configForm" label-width="100px">
        <el-form-item :label="$t('agent.endpoint')">
          <el-input
            v-model="configForm.endpoint"
            :placeholder="$t('agent.endpointPlaceholder')"
            @change="handleEndpointChange"
          />
        </el-form-item>
        <el-form-item :label="$t('agent.apiKey')">
          <el-input
            v-model="configForm.apiKey"
            type="password"
            :placeholder="$t('agent.apiKeyPlaceholder')"
            show-password
            @change="handleApiKeyChange"
          />
        </el-form-item>
        <el-form-item :label="$t('agent.model')">
          <div class="model-input-group">
            <el-select
              v-model="configForm.model"
              :placeholder="$t('agent.modelPlaceholder')"
              filterable
              allow-create
              :loading="isLoadingModels"
              style="flex: 1"
            >
              <el-option
                v-for="model in availableModels"
                :key="model.id"
                :label="model.name"
                :value="model.id"
              />
            </el-select>
            <el-button
              @click="fetchModels"
              :loading="isLoadingModels"
              :disabled="!isConfigValid"
              :title="$t('agent.fetchModels')"
            >
              <el-icon><Refresh /></el-icon>
            </el-button>
          </div>
        </el-form-item>
        <el-form-item>
          <el-button
            @click="testConnection"
            :loading="isTesting"
            :disabled="!isConfigValid"
            style="width: 100%"
          >
            <el-icon v-if="!isTesting"><Connection /></el-icon>
            {{ $t('agent.testConnection') }}
          </el-button>
        </el-form-item>
        <el-alert
          v-if="testResult"
          :type="testResult.success ? 'success' : 'error'"
          :title="testResult.message"
          :description="testResult.error"
          :closable="false"
          show-icon
          style="margin-top: 10px"
        />
      </el-form>
      <template #footer>
        <el-button v-if="aiConfigStore.isConfigured" @click="showConfigDialog = false">
          {{ $t('common.cancel') }}
        </el-button>
        <el-button type="primary" @click="saveConfig" :disabled="!isConfigValid">
          {{ $t('common.save') }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 主界面 -->
    <div class="agent-container">
      <!-- 头部工具栏 -->
      <div class="agent-header">
        <h2>{{ $t('agent.title') }}</h2>
        <div class="header-actions">
          <el-button @click="showConfigDialog = true" :icon="Setting">
            {{ $t('agent.settings') }}
          </el-button>
          <el-button @click="clearChat" :icon="Delete">
            {{ $t('agent.clearChat') }}
          </el-button>
        </div>
      </div>

      <!-- 消息列表 -->
      <div class="messages-container" ref="messagesContainer">
        <div v-if="messages.length === 0" class="empty-state">
          <p>{{ $t('agent.welcomeMessage') }}</p>
          <div class="example-prompts">
            <el-tag
              v-for="example in examplePrompts"
              :key="example"
              @click="sendMessage(example)"
              class="example-tag"
            >
              {{ example }}
            </el-tag>
          </div>
        </div>

        <div
          v-for="message in messages"
          :key="message.id"
          :class="['message', `message-${message.role}`]"
        >
          <div class="message-header">
            <span class="message-role">
              {{ message.role === 'user' ? $t('agent.you') : $t('agent.assistant') }}
            </span>
            <span class="message-time">
              {{ formatTime(message.timestamp) }}
            </span>
          </div>
          <div class="message-content">
            {{ message.content }}
          </div>

          <!-- 错误信息和重试按钮 -->
          <div v-if="message.isError" class="message-error">
            <el-alert
              type="error"
              :title="$t('agent.requestFailed')"
              :description="message.error"
              :closable="false"
              show-icon
            />
            <el-button
              type="primary"
              size="small"
              @click="retryMessage(message)"
              :loading="isLoading"
              class="retry-button"
            >
              <el-icon><Refresh /></el-icon>
              {{ $t('agent.retry') }}
            </el-button>
          </div>

          <!-- Skill 调用记录 -->
          <div v-if="message.skillCalls && message.skillCalls.length > 0" class="skill-calls">
            <div v-for="(call, index) in message.skillCalls" :key="index" class="skill-call">
              <el-tag type="info" size="small">
                {{ $t('agent.skillCall') }}: {{ call.skillName }}
              </el-tag>
              <div v-if="call.error" class="skill-error">
                {{ call.error }}
              </div>
            </div>
          </div>
        </div>

        <!-- 思考中的进度显示 -->
        <div v-if="thinkingMessage" class="message message-assistant thinking-message">
          <div class="message-header">
            <span class="message-role">{{ $t('agent.assistant') }}</span>
            <span class="message-time">
              {{ formatTime(thinkingMessage.timestamp) }}
            </span>
          </div>
          <div class="thinking-content">
            <div class="thinking-step">
              <el-icon class="is-loading"><Loading /></el-icon>
              {{ thinkingMessage.thinkingStep }}
            </div>
            <el-progress
              :percentage="thinkingMessage.progress || 0"
              :stroke-width="6"
              :show-text="false"
              class="thinking-progress"
            />
          </div>
        </div>
      </div>

      <!-- 输入框 -->
      <div class="input-container">
        <el-input
          v-model="inputMessage"
          type="textarea"
          :placeholder="$t('agent.inputPlaceholder')"
          :rows="3"
          @keydown.enter.ctrl="handleSend"
          :disabled="isLoading"
        />
        <el-button
          type="primary"
          @click="handleSend"
          :loading="isLoading"
          :disabled="!inputMessage.trim()"
          class="send-button"
        >
          {{ $t('agent.send') }}
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Setting, Delete, Refresh, Connection, Loading } from '@element-plus/icons-vue'
import { useI18n } from 'vue-i18n'
import { useAIConfigStore } from '@/stores/aiConfig'
import { AgentScheduler } from '@/services/agentScheduler'
import { predefinedSkills } from '@/services/skills'
import type { AgentMessage } from '@/types/agent'
import dayjs from 'dayjs'

const { t } = useI18n()
const aiConfigStore = useAIConfigStore()

// 配置对话框
const showConfigDialog = ref(false)
const configForm = ref({
  endpoint: '',
  apiKey: '',
  model: 'gpt-3.5-turbo'
})

// 测试连接
const isTesting = ref(false)
const testResult = ref<{ success: boolean; message: string; error?: string } | null>(null)

// 模型列表
const availableModels = ref<Array<{ id: string; name: string }>>([])
const isLoadingModels = ref(false)

// 消息列表
const messages = ref<AgentMessage[]>([])
const inputMessage = ref('')
const isLoading = ref(false)
const messagesContainer = ref<HTMLElement>()

// 思考中的消息（用于显示进度）
const thinkingMessage = ref<AgentMessage | null>(null)

// Agent 调度器
let scheduler: AgentScheduler | null = null

// 示例提示
const examplePrompts = computed(() => [
  t('agent.example1'),
  t('agent.example2'),
  t('agent.example3')
])

// 配置是否有效
const isConfigValid = computed(() => {
  return configForm.value.endpoint.trim() !== '' && configForm.value.apiKey.trim() !== ''
})

// 初始化
onMounted(() => {
  // 检查是否已配置
  if (!aiConfigStore.isConfigured) {
    showConfigDialog.value = true
  } else {
    // 加载配置
    configForm.value = {
      endpoint: aiConfigStore.endpoint,
      apiKey: aiConfigStore.apiKey,
      model: aiConfigStore.model
    }
    initScheduler()
  }
})

// 初始化调度器
const initScheduler = () => {
  const config = aiConfigStore.getConfig
  scheduler = new AgentScheduler(config)
  scheduler.registerSkills(predefinedSkills)
}

// 测试连接
const testConnection = async () => {
  if (!isConfigValid.value) return

  isTesting.value = true
  testResult.value = null

  try {
    // 创建临时调度器用于测试
    const tempScheduler = new AgentScheduler(configForm.value)
    const result = await tempScheduler.testConnection()

    testResult.value = {
      success: result.success,
      message: result.success ? t('agent.connectionSuccess') : t('agent.connectionFailed'),
      error: result.error
    }

    if (result.success) {
      ElMessage.success(t('agent.connectionSuccess'))
      // 连接成功后自动获取模型列表
      await fetchModels()
    } else {
      ElMessage.error(t('agent.connectionFailed') + (result.error ? `: ${result.error}` : ''))
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    testResult.value = {
      success: false,
      message: t('agent.connectionFailed'),
      error: errorMessage
    }
    ElMessage.error(t('agent.connectionFailed') + `: ${errorMessage}`)
  } finally {
    isTesting.value = false
  }
}

// 获取模型列表
const fetchModels = async () => {
  if (!isConfigValid.value) return

  isLoadingModels.value = true

  try {
    // 创建临时调度器用于获取模型
    const tempScheduler = new AgentScheduler(configForm.value)
    const models = await tempScheduler.getModels()

    if (models.length > 0) {
      availableModels.value = models
      ElMessage.success(t('agent.modelsLoaded', { count: models.length }))
    } else {
      ElMessage.warning(t('agent.noModelsFound'))
    }
  } catch (error) {
    console.error('Failed to fetch models:', error)
    ElMessage.error(t('agent.fetchModelsFailed'))
  } finally {
    isLoadingModels.value = false
  }
}

// 当 endpoint 或 apiKey 改变时，清除测试结果和模型列表
const handleEndpointChange = () => {
  testResult.value = null
  availableModels.value = []
}

const handleApiKeyChange = () => {
  testResult.value = null
  availableModels.value = []
}

// 保存配置
const saveConfig = () => {
  aiConfigStore.saveConfig(configForm.value)
  showConfigDialog.value = false
  initScheduler()
  ElMessage.success(t('agent.configSaved'))
}

// 发送消息
const handleSend = async () => {
  if (!inputMessage.value.trim() || isLoading.value) return
  await sendMessage(inputMessage.value)
}

const sendMessage = async (content: string, isRetry = false) => {
  if (!scheduler) {
    ElMessage.error(t('agent.notConfigured'))
    showConfigDialog.value = true
    return
  }

  // 如果不是重试，添加用户消息
  if (!isRetry) {
    const userMessage: AgentMessage = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: Date.now()
    }
    messages.value.push(userMessage)
    inputMessage.value = ''
  }

  // 滚动到底部
  await nextTick()
  scrollToBottom()

  // 调用 AI
  isLoading.value = true

  // 创建思考消息
  thinkingMessage.value = {
    id: 'thinking-' + Date.now(),
    role: 'assistant',
    content: '',
    timestamp: Date.now(),
    isThinking: true,
    thinkingStep: t('agent.thinking'),
    progress: 0
  }

  try {
    // 构建消息历史（排除错误消息和思考消息）
    let chatMessages = messages.value
      .filter(m => !m.isError && !m.isThinking)
      .map(m => ({
        role: m.role,
        content: m.content
      }))

    // 如果是第一次对话，添加系统提示词
    if (chatMessages.length === 1 && chatMessages[0]?.role === 'user') {
      chatMessages = [
        {
          role: 'system',
          content: t('agent.systemPrompt')
        },
        ...chatMessages
      ]
    }

    // 进度回调函数
    const onProgress = (step: string, progress: number) => {
      if (thinkingMessage.value) {
        thinkingMessage.value.thinkingStep = step
        thinkingMessage.value.progress = Math.min(progress, 100)
        // 自动滚动
        nextTick(() => scrollToBottom())
      }
    }

    // 调用 scheduler，传入进度回调
    const response = await scheduler.chat(chatMessages, 5, onProgress)

    // 清除思考消息
    thinkingMessage.value = null

    // 添加助手消息
    const assistantMessage: AgentMessage = {
      id: Date.now().toString(),
      role: 'assistant',
      content: response.content,
      timestamp: Date.now(),
      skillCalls: response.skillCalls.map(call => ({
        skillName: call.skillName,
        parameters: call.parameters,
        result: call.result,
        error: call.error,
        timestamp: Date.now()
      }))
    }
    messages.value.push(assistantMessage)

    // 滚动到底部
    await nextTick()
    scrollToBottom()
  } catch (error) {
    console.error('Agent error:', error)
    const errorMessage = error instanceof Error ? error.message : String(error)

    // 清除思考消息
    thinkingMessage.value = null

    // 添加错误消息
    const errorMsg: AgentMessage = {
      id: Date.now().toString(),
      role: 'assistant',
      content: t('agent.requestFailed'),
      timestamp: Date.now(),
      isError: true,
      error: errorMessage
    }
    messages.value.push(errorMsg)

    // 滚动到底部显示错误
    await nextTick()
    scrollToBottom()
  } finally {
    isLoading.value = false
  }
}

// 重试消息
const retryMessage = async (errorMessage: AgentMessage) => {
  if (isLoading.value) return

  // 找到错误消息的索引
  const errorIndex = messages.value.findIndex(m => m.id === errorMessage.id)
  if (errorIndex === -1) return

  // 移除错误消息
  messages.value.splice(errorIndex, 1)

  // 找到最后一条用户消息
  const lastUserMessage = [...messages.value]
    .reverse()
    .find(m => m.role === 'user')

  if (lastUserMessage) {
    // 重新发送
    await sendMessage(lastUserMessage.content, true)
  }
}

// 清空聊天
const clearChat = () => {
  messages.value = []
  ElMessage.success(t('agent.chatCleared'))
}

// 格式化时间
const formatTime = (timestamp: number) => {
  return dayjs(timestamp).format('HH:mm:ss')
}

// 滚动到底部
const scrollToBottom = () => {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

// 监听消息变化，自动滚动
watch(() => messages.value.length, () => {
  nextTick(() => scrollToBottom())
})
</script>

<style scoped>
.agent-view {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.model-input-group {
  display: flex;
  gap: 8px;
  width: 100%;
}

.agent-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 20px;
  background: var(--el-bg-color);
}

.agent-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid var(--el-border-color);
}

.agent-header h2 {
  margin: 0;
  font-size: 24px;
  color: var(--el-text-color-primary);
}

.header-actions {
  display: flex;
  gap: 10px;
}

.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  background: var(--el-fill-color-blank);
  border-radius: 8px;
  margin-bottom: 20px;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: var(--el-text-color-secondary);
}

.empty-state p {
  font-size: 16px;
  margin-bottom: 20px;
}

.example-prompts {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: center;
}

.example-tag {
  cursor: pointer;
  transition: all 0.3s;
}

.example-tag:hover {
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.message {
  margin-bottom: 20px;
  padding: 15px;
  border-radius: 8px;
  animation: fadeIn 0.3s;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.message-user {
  background: var(--el-color-primary-light-9);
  margin-left: 20%;
}

.message-assistant {
  background: var(--el-fill-color-light);
  margin-right: 20%;
}

.message-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.message-role {
  font-weight: bold;
}

.message-content {
  color: var(--el-text-color-primary);
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
}

.message-content.loading {
  display: flex;
  gap: 5px;
}

.loading-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--el-color-primary);
  animation: bounce 1.4s infinite ease-in-out both;
}

.loading-dot:nth-child(1) {
  animation-delay: -0.32s;
}

.loading-dot:nth-child(2) {
  animation-delay: -0.16s;
}

@keyframes bounce {
  0%, 80%, 100% {
    transform: scale(0);
  }
  40% {
    transform: scale(1);
  }
}

.skill-calls {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px dashed var(--el-border-color);
}

.skill-call {
  margin-top: 5px;
}

.skill-error {
  color: var(--el-color-danger);
  font-size: 12px;
  margin-top: 5px;
}

.message-error {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px dashed var(--el-border-color);
}

.retry-button {
  margin-top: 10px;
}

.thinking-message {
  border-left: 3px solid var(--el-color-primary);
}

.thinking-content {
  padding: 10px 0;
}

.thinking-step {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
  color: var(--el-text-color-primary);
  font-size: 14px;
}

.thinking-progress {
  margin-top: 8px;
}

.input-container {
  display: flex;
  gap: 10px;
  align-items: flex-end;
}

.input-container :deep(.el-textarea) {
  flex: 1;
}

.send-button {
  height: 40px;
}
</style>
