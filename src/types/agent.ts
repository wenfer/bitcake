/**
 * Agent 相关类型定义
 */

// AI 配置
export interface AIConfig {
  endpoint: string
  apiKey: string
  model?: string
}

// Skill 定义
export interface Skill {
  name: string
  description: string
  parameters: SkillParameter[]
  execute: (params: Record<string, any>) => Promise<any>
}

export interface SkillParameter {
  name: string
  type: 'string' | 'number' | 'boolean' | 'array' | 'object'
  description: string
  required: boolean
  default?: any
}

// Agent 消息
export interface AgentMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: number
  skillCalls?: SkillCall[]
  error?: string  // 错误信息
  isError?: boolean  // 是否是错误消息
  isThinking?: boolean  // 是否是思考中的消息
  thinkingStep?: string  // 当前思考步骤描述
  progress?: number  // 进度百分比 (0-100)
}

// Skill 调用记录
export interface SkillCall {
  skillName: string
  parameters: Record<string, any>
  result?: any
  error?: string
  timestamp: number
}

// Agent 会话
export interface AgentSession {
  id: string
  title: string
  messages: AgentMessage[]
  createdAt: number
  updatedAt: number
}

// API 请求和响应
export interface AgentRequest {
  messages: Array<{
    role: string
    content: string
  }>
  model?: string
  temperature?: number
  max_tokens?: number
  tools?: Array<{
    type: 'function'
    function: {
      name: string
      description: string
      parameters: any
    }
  }>
}

export interface AgentResponse {
  id: string
  object: string
  created: number
  model: string
  choices: Array<{
    index: number
    message: {
      role: string
      content: string | null
      tool_calls?: Array<{
        id: string
        type: 'function'
        function: {
          name: string
          arguments: string
        }
      }>
    }
    finish_reason: string
  }>
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}
