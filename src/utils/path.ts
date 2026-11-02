/**
 * 路径规范化工具函数
 */

/**
 * 规范化目录路径：
 * 1. 统一反斜杠 `\` 为正斜杠 `/`
 * 2. 合并重复的连续斜杠（保留 UNC 路径开头的双斜杠）
 * 3. 移除末尾多余的斜杠（保留系统根目录 `/` 和 Windows 盘符根目录如 `C:/`）
 * 4. 去除首尾空白字符
 */
export const normalizePath = (path?: string | null): string => {
  if (!path) return ''
  const trimmed = path.trim()
  if (!trimmed) return ''

  // 统一反斜杠为斜杠
  let normalized = trimmed.replace(/\\/g, '/')

  // 检查是否为 UNC 路径（如 //server/share），保留开头的双斜杠
  const isUnc = normalized.startsWith('//') && !normalized.startsWith('///')
  normalized = normalized.replace(/\/+/g, '/')
  if (isUnc && !normalized.startsWith('//')) {
    normalized = '/' + normalized
  }

  // 根目录直接返回 "/"
  if (normalized === '/') {
    return '/'
  }

  // Windows 盘符根目录（如 "C:/"、"D:/"）
  if (/^[a-zA-Z]:\/$/.test(normalized)) {
    return normalized
  }

  // Windows 盘符无斜杠（如 "C:"），补齐为 "C:/"
  if (/^[a-zA-Z]:$/.test(normalized)) {
    return normalized + '/'
  }

  // 去除末尾斜杠
  return normalized.replace(/\/+$/, '')
}

/**
 * 比较两个路径在逻辑上是否指向同一目录
 */
export const isSamePath = (pathA?: string | null, pathB?: string | null): boolean => {
  return normalizePath(pathA) === normalizePath(pathB)
}
