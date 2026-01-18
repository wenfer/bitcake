import axios from 'axios'
import type { AxiosInstance } from 'axios'
import type { AIConfig, AgentRequest, AgentResponse, Skill } from '@/types/agent'

/**
 * Agent 调度核心
 * 负责封装用户请求，调用 AI API，并根据响应决定是否调用 skills
 */
export class AgentScheduler {
  private client: AxiosInstance
  private config: AIConfig
  private skills: Map<string, Skill>

  constructor(config: AIConfig) {
    this.config = config
    this.skills = new Map()

    // 创建 axios 实例
    this.client = axios.create({
      baseURL: config.endpoint,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`
      },
      timeout: 60000 // 60秒超时
    })
  }

  /**
   * 注册 skill
   */
  registerSkill(skill: Skill) {
    this.skills.set(skill.name, skill)
  }

  /**
   * 批量注册 skills
   */
  registerSkills(skills: Skill[]) {
    skills.forEach(skill => this.registerSkill(skill))
  }

  /**
   * 获取所有已注册的 skills
   */
  getSkills(): Skill[] {
    return Array.from(this.skills.values())
  }

  /**
   * 将 skills 转换为 OpenAI tools 格式
   */
  private skillsToTools() {
    return Array.from(this.skills.values()).map(skill => ({
      type: 'function' as const,
      function: {
        name: skill.name,
        description: skill.description,
        parameters: {
          type: 'object',
          properties: skill.parameters.reduce((acc, param) => {
            acc[param.name] = {
              type: param.type,
              description: param.description
            }
            return acc
          }, {} as Record<string, any>),
          required: skill.parameters
            .filter(p => p.required)
            .map(p => p.name)
        }
      }
    }))
  }

  /**
   * 发送消息给 AI 并处理响应
   * @param messages 消息历史
   * @param maxIterations 最大迭代次数
   * @param onProgress 进度回调函数
   */
  async chat(
    messages: Array<{ role: string; content: string }>,
    maxIterations = 5,
    onProgress?: (step: string, progress: number) => void
  ): Promise<{
    content: string
    skillCalls: Array<{
      skillName: string
      parameters: Record<string, any>
      result: any
      error?: string
    }>
  }> {
    const skillCalls: Array<{
      skillName: string
      parameters: Record<string, any>
      result: any
      error?: string
    }> = []

    // 上下文管理：限制消息数量，避免超出 token 限制
    let currentMessages = this.manageContext([...messages])
    let iterations = 0

    while (iterations < maxIterations) {
      iterations++

      // 报告进度
      if (onProgress) {
        const progress = (iterations / maxIterations) * 100
        onProgress(`正在思考... (第 ${iterations}/${maxIterations} 轮)`, progress)
      }

      // 构建请求
      const request: AgentRequest = {
        messages: currentMessages,
        model: this.config.model,
        temperature: 0.7,
        max_tokens: 2000
      }

      // 如果有 skills，添加 tools
      if (this.skills.size > 0) {
        request.tools = this.skillsToTools()
      }

      // 调用 AI API
      if (onProgress) {
        onProgress(`正在调用 AI API...`, (iterations / maxIterations) * 100)
      }

      const response = await this.client.post<AgentResponse>('/chat/completions', request)
      const choice = response.data.choices?.[0]

      if (!choice) {
        throw new Error('No response from AI')
      }

      // 检查是否需要调用 tool
      if (choice.message.tool_calls && choice.message.tool_calls.length > 0) {
        // 添加 assistant 消息
        currentMessages.push({
          role: 'assistant',
          content: choice.message.content || ''
        })

        // 执行所有 tool calls
        for (let i = 0; i < choice.message.tool_calls.length; i++) {
          const toolCall = choice.message.tool_calls[i]
          if (!toolCall) continue

          const skillName = toolCall.function.name
          const skill = this.skills.get(skillName)

          if (onProgress) {
            onProgress(
              `正在执行: ${skillName} (${i + 1}/${choice.message.tool_calls.length})`,
              ((iterations + (i + 1) / choice.message.tool_calls.length) / maxIterations) * 100
            )
          }

          if (!skill) {
            const error = `Skill not found: ${skillName}`
            skillCalls.push({
              skillName,
              parameters: {},
              result: null,
              error
            })

            // 添加错误消息
            currentMessages.push({
              role: 'tool',
              content: JSON.stringify({ error })
            })
            continue
          }

          try {
            // 解析参数
            const parameters = JSON.parse(toolCall.function.arguments)

            // 执行 skill
            const result = await skill.execute(parameters)

            skillCalls.push({
              skillName,
              parameters,
              result
            })

            // 添加 tool 响应消息
            currentMessages.push({
              role: 'tool',
              content: JSON.stringify(result)
            })
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error)
            skillCalls.push({
              skillName,
              parameters: {},
              result: null,
              error: errorMessage
            })

            // 添加错误消息
            currentMessages.push({
              role: 'tool',
              content: JSON.stringify({ error: errorMessage })
            })
          }
        }

        // 上下文管理：在继续下一轮前检查并精简上下文
        currentMessages = this.manageContext(currentMessages)

        // 继续下一轮对话
        continue
      }

      // 没有 tool calls，返回最终响应
      if (onProgress) {
        onProgress('完成', 100)
      }

      return {
        content: choice.message.content || '',
        skillCalls
      }
    }

    // 达到最大迭代次数
    throw new Error(`Max iterations (${maxIterations}) reached`)
  }

  /**
   * 管理上下文长度，避免超出 token 限制
   * 策略：保留最近的消息，移除中间的旧消息
   */
  private manageContext(messages: Array<{ role: string; content: string }>): Array<{ role: string; content: string }> {
    const MAX_MESSAGES = 20 // 最多保留 20 条消息
    const KEEP_RECENT = 10 // 保留最近的 10 条消息

    if (messages.length <= MAX_MESSAGES) {
      return messages
    }

    // 保留第一条系统消息（如果有）
    const systemMessages = messages.filter(m => m.role === 'system')
    const otherMessages = messages.filter(m => m.role !== 'system')

    // 只保留最近的消息
    const recentMessages = otherMessages.slice(-KEEP_RECENT)

    return [...systemMessages, ...recentMessages]
  }

  /**
   * 更新配置
   */
  updateConfig(config: AIConfig) {
    this.config = config
    this.client.defaults.baseURL = config.endpoint
    this.client.defaults.headers['Authorization'] = `Bearer ${config.apiKey}`
  }

  /**
   * 测试连接
   * 尝试调用 models API 来验证配置是否正确
   */
  async testConnection(): Promise<{ success: boolean; message: string; error?: string }> {
    try {
      // 尝试获取模型列表来测试连接
      const response = await this.client.get('/models', {
        timeout: 10000 // 10秒超时
      })

      if (response.status === 200) {
        return {
          success: true,
          message: 'Connection successful'
        }
      } else {
        return {
          success: false,
          message: 'Connection failed',
          error: `HTTP ${response.status}`
        }
      }
    } catch (error) {
      let errorMessage = 'Unknown error'
      if (error instanceof Error) {
        errorMessage = error.message
      }
      return {
        success: false,
        message: 'Connection failed',
        error: errorMessage
      }
    }
  }

  /**
   * 获取可用的模型列表
   */
  async getModels(): Promise<Array<{ id: string; name: string }>> {
    try {
      const response = await this.client.get('/models', {
        timeout: 10000
      })

      if (response.data && response.data.data) {
        // OpenAI 格式
        return response.data.data.map((model: any) => ({
          id: model.id,
          name: model.id
        }))
      } else if (response.data && Array.isArray(response.data)) {
        // 其他格式
        return response.data.map((model: any) => ({
          id: model.id || model.name,
          name: model.name || model.id
        }))
      }

      return []
    } catch (error) {
      console.error('Failed to fetch models:', error)
      return []
    }
  }
}
