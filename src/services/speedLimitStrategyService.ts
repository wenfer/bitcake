import type { SpeedLimitStrategy, SpeedLimitStrategyStore } from '@/types/speedLimitStrategy'

const STORAGE_KEY = 'speed_limit_strategies'
const STORAGE_VERSION = 1
// 默认过期时间：180天（约6个月）
const DEFAULT_EXPIRATION_DAYS = 180

/**
 * 生成唯一ID
 */
const generateId = (): string => {
  return `strategy_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}

/**
 * 获取过期时间戳
 */
const getExpirationTimestamp = (days: number = DEFAULT_EXPIRATION_DAYS): number => {
  return Date.now() + days * 24 * 60 * 60 * 1000
}

/**
 * 从localStorage加载策略数据
 */
const loadStore = (): SpeedLimitStrategyStore => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) {
      return {
        strategies: [],
        version: STORAGE_VERSION,
        expiresAt: getExpirationTimestamp(),
      }
    }

    const data: SpeedLimitStrategyStore = JSON.parse(stored)

    // 检查是否过期
    if (data.expiresAt && Date.now() > data.expiresAt) {
      localStorage.removeItem(STORAGE_KEY)
      return {
        strategies: [],
        version: STORAGE_VERSION,
        expiresAt: getExpirationTimestamp(),
      }
    }

    // 版本兼容性检查
    if (data.version !== STORAGE_VERSION) {
      console.warn(`数据版本不匹配 (${data.version} vs ${STORAGE_VERSION})，尝试迁移数据`)
      // 这里可以添加版本迁移逻辑
      data.version = STORAGE_VERSION
    }

    return data
  } catch (error) {
    console.error('加载策略数据失败:', error)
    return {
      strategies: [],
      version: STORAGE_VERSION,
      expiresAt: getExpirationTimestamp(),
    }
  }
}

/**
 * 保存策略数据到localStorage
 */
const saveStore = (store: SpeedLimitStrategyStore): void => {
  try {
    // 更新过期时间
    store.expiresAt = getExpirationTimestamp()
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
  } catch (error) {
    console.error('保存策略数据失败:', error)
    throw new Error('保存失败，可能是存储空间不足')
  }
}

/**
 * 获取所有策略
 */
export const getAllStrategies = (): SpeedLimitStrategy[] => {
  const store = loadStore()
  return store.strategies
}

/**
 * 根据ID获取策略
 */
export const getStrategyById = (id: string): SpeedLimitStrategy | null => {
  const store = loadStore()
  return store.strategies.find(s => s.id === id) || null
}

/**
 * 创建新策略
 */
export const createStrategy = (
  strategy: Omit<SpeedLimitStrategy, 'id' | 'createdAt' | 'updatedAt'>
): SpeedLimitStrategy => {
  const store = loadStore()

  const newStrategy: SpeedLimitStrategy = {
    ...strategy,
    id: generateId(),
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }

  store.strategies.push(newStrategy)
  saveStore(store)

  return newStrategy
}

/**
 * 更新策略
 */
export const updateStrategy = (
  id: string,
  updates: Partial<Omit<SpeedLimitStrategy, 'id' | 'createdAt' | 'updatedAt'>>
): SpeedLimitStrategy | null => {
  const store = loadStore()
  const index = store.strategies.findIndex(s => s.id === id)

  if (index === -1) {
    return null
  }

  const existingStrategy = store.strategies[index]!
  const updatedStrategy: SpeedLimitStrategy = {
    ...existingStrategy,
    ...updates,
    updatedAt: Date.now(),
  }

  store.strategies[index] = updatedStrategy

  saveStore(store)
  return updatedStrategy
}

/**
 * 删除策略
 */
export const deleteStrategy = (id: string): boolean => {
  const store = loadStore()
  const index = store.strategies.findIndex(s => s.id === id)

  if (index === -1) {
    return false
  }

  store.strategies.splice(index, 1)
  saveStore(store)

  return true
}

/**
 * 删除所有策略
 */
export const clearAllStrategies = (): void => {
  localStorage.removeItem(STORAGE_KEY)
}

/**
 * 导出策略数据（用于备份）
 */
export const exportStrategies = (): string => {
  const store = loadStore()
  return JSON.stringify(store, null, 2)
}

/**
 * 导入策略数据（用于恢复备份）
 */
export const importStrategies = (jsonData: string): boolean => {
  try {
    const data: SpeedLimitStrategyStore = JSON.parse(jsonData)

    // 验证数据结构
    if (!data.strategies || !Array.isArray(data.strategies)) {
      throw new Error('无效的数据格式')
    }

    saveStore(data)
    return true
  } catch (error) {
    console.error('导入策略数据失败:', error)
    return false
  }
}
