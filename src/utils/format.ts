/**
 * 格式化字节大小
 * @param bytes 字节数
 * @returns 格式化后的字符串，如 "1.5 MB"
 */
export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B'

  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']

  let i = Math.floor(Math.log(bytes) / Math.log(k))
  let value = bytes / Math.pow(k, i)

  // 如果值 >= 1000，升级到下一个单位，避免显示 1001 KB 这样的情况
  if (value >= 1000 && i < sizes.length - 1) {
    i++
    value = bytes / Math.pow(k, i)
  }

  // 最多保留一位小数
  return `${value.toFixed(1)} ${sizes[i]}`
}

/**
 * 格式化速度（字节/秒）
 * @param bytesPerSecond 每秒字节数
 * @returns 格式化后的速度字符串，如 "1.5 MB/s"
 */
export const formatSpeed = (bytesPerSecond: number): string => {
  if (bytesPerSecond === 0) return '0 B/s'
  return `${formatBytes(bytesPerSecond)}/s`
}
