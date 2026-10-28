import { createApp, watch } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'

// Import Element Plus
import ElementPlus from 'element-plus'
// Element Plus 基础样式
import 'element-plus/dist/index.css'
// BitCake 2.0 设计系统（必须在 Element Plus 之后加载，用于覆盖语义变量）
import './style.css'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import en from 'element-plus/es/locale/lang/en'

// Import i18n
import i18n, { getLocale } from './i18n'

// Register Service Worker
import { registerSW } from './utils/swRegister'
registerSW()

// 在挂载前应用主题（强调色 + 深浅模式），避免首屏闪烁
import { applyStoredTheme } from './utils/themeBoot'
applyStoredTheme()

// --- Edge 兼容性修复（vue-router 4.6.x 无法最小化） ---
// vue-router 4.6.0+ 内部监听 visibilitychange：页面隐藏（窗口最小化）时调用
// history.replaceState 保存滚动位置；新版 Edge 处理该调用时会触发内部"页面激活"
// 机制，导致最小化后窗口立即弹回。此处仅拦截"页面隐藏时"的 replaceState，
// 页面可见时的正常路由导航（router.replace 等）不受影响。
// 副作用：最小化时不再保存滚动位置记忆。
// 参考：https://blog.csdn.net/u012961419/article/details/157805074
const originalReplaceState = window.history.replaceState.bind(window.history)
window.history.replaceState = (state: unknown, unused: string, url?: string | URL | null) => {
  if (document.visibilityState === 'hidden') return
  originalReplaceState(state, unused, url)
}

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(i18n)

// 根据当前语言设置 Element Plus locale
const getElementLocale = () => {
  return getLocale() === 'zh-CN' ? zhCn : en
}

app.use(ElementPlus, { locale: getElementLocale() })

// 监听语言变化，动态更新 Element Plus locale
watch(
  () => i18n.global.locale.value,
  () => {
    // Element Plus 需要重新配置才能切换语言
    // 由于 Element Plus 不支持动态切换，我们在 useLocale store 中处理刷新
  }
)

app.mount('#app')
